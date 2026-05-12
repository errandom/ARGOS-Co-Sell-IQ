/**
 * Backend API Service for Fabric SQL Database Integration
 * 
 * SETUP INSTRUCTIONS:
 * 1. Install dependencies: npm install express mssql cors dotenv
 * 2. Create .env file with credentials:
 *    FABRIC_DB_SERVER=x6eps4xrq2xudenlfv6naeo3i4-ywxvf76w3u4e5gpdqvtoz57rsa.msit-database.fabric.microsoft.com
 *    FABRIC_DB_PORT=1433
 *    FABRIC_DB_NAME=ARGOS SQL-87da6cf7-5c29-48f5-9b97-b2a3245da352
 *    FABRIC_DB_USER={your_username}
 *    FABRIC_DB_PASSWORD={your_password}
 * 3. Run the server: node src/server.js
 * 
 * This service provides secure endpoints that handle database queries
 * and return only authorized data to the frontend.
 */

import express from 'express'
import sql from 'mssql'
import cors from 'cors'
import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distDir = path.join(__dirname, 'dist')
const indexHtmlPath = path.join(distDir, 'index.html')
const hasBuiltFrontend = fs.existsSync(indexHtmlPath)

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Serve built frontend assets when available (web app deployment mode)
if (hasBuiltFrontend) {
  app.use(express.static(distDir))
}

// Database configuration
const dbConfig = {
  server: process.env.FABRIC_DB_SERVER || 'x6eps4xrq2xudenlfv6naeo3i4-ywxvf76w3u4e5gpdqvtoz57rsa.msit-database.fabric.microsoft.com',
  port: parseInt(process.env.FABRIC_DB_PORT || '1433'),
  database: process.env.FABRIC_DB_NAME || 'ARGOS SQL-87da6cf7-5c29-48f5-9b97-b2a3245da352',
  authentication: {
    type: 'default',
    options: {
      userName: process.env.FABRIC_DB_USER,
      password: process.env.FABRIC_DB_PASSWORD,
    },
  },
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
}

// SQL Pool
let pool = null

async function initializePool() {
  try {
    pool = new sql.ConnectionPool(dbConfig)
    await pool.connect()
    console.log('Connected to Fabric SQL Database')
  } catch (err) {
    console.error('Database connection error:', err)
  }
}

// Authentication middleware (implement your auth logic here)
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
  
  // Verify token here - add your authentication logic
  const token = authHeader.substring(7)
  // TODO: Verify token validity
  
  next()
}

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', connected: !!pool, timestamp: new Date().toISOString() })
})

// Diagnostic: return column names and a sample row for SPM and MSX account tables (no auth, remove after investigation)
app.get('/api/diag/schema', async (req, res) => {
  try {
    const tables = ['SPM_accounts', 'SPM_accountassignments', 'MSX_accounts']
    const results = {}
    for (const table of tables) {
      try {
        const sample = await pool.request().query(`SELECT TOP 1 * FROM dbo.[${table}]`)
        results[table] = {
          columns: sample.recordset.columns
            ? Object.keys(sample.recordset.columns)
            : sample.recordset.length > 0
              ? Object.keys(sample.recordset[0])
              : [],
          sampleRow: sample.recordset[0] || null
        }
      } catch (tableErr) {
        results[table] = { error: tableErr.message }
      }
    }
    res.json(results)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// All routes below require authentication
app.use(authenticate)

/**
 * POST /api/fabric/accounts
 * Load only the accounts for the authenticated user (lightweight, called on login)
 */
app.post('/api/fabric/accounts', async (req, res) => {
  try {
    const { userAlias } = req.body
    if (!userAlias) {
      return res.status(400).json({ message: 'userAlias is required' })
    }
    const accounts = await getAccountsByUser(userAlias)
    res.json({ accounts })
  } catch (error) {
    console.error('Error fetching accounts:', error)
    res.status(500).json({ message: 'Failed to fetch accounts', error: error.message })
  }
})

/**
 * POST /api/fabric/data
 * Fetch all Fabric data for the authenticated user
 */
app.post('/api/fabric/data', async (req, res) => {
  try {
    const { userId, userAlias, userName } = req.body

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' })
    }
    if (!userAlias) {
      return res.status(400).json({ message: 'userAlias is required' })
    }
    if (!userName) {
      return res.status(400).json({ message: 'userName is required' })
    }

    // Execute all queries in parallel
    const [accounts, ownedOpportunities, dealTeamOpportunities, relatedAccountOpportunities, partnerEngagements] = await Promise.all([
      getAccountsByUser(userAlias),
      getOwnedOpportunities(userId, userName),
      getDealTeamOpportunities(userId),
      getRelatedAccountOpportunities(userId),
      getPartnerEngagements(userId),
    ])

    res.json({
      accounts,
      opportunities: ownedOpportunities,
      dealTeamOpportunities,
      relatedAccountOpportunities,
      partnerEngagements,
      isLoading: false,
      error: null,
    })
  } catch (error) {
    console.error('Error fetching Fabric data:', error)
    res.status(500).json({ message: 'Failed to fetch Fabric data', error: error.message })
  }
})

/**
 * Query: Get all accounts related to the user alias from SPM account assignments.
 * Note: SPM account IDs currently do not correlate to MSX account IDs.
 */
async function getAccountsByUser(userAlias) {
  try {
    const query = `
      SELECT 
        a.*
      FROM dbo.SPM_accounts a
      WHERE EXISTS (
        SELECT 1
        FROM dbo.SPM_accountassignments aa
        WHERE aa.[ID_account] = a.[ID_account]
          AND LOWER(LTRIM(RTRIM(aa.[SPM Account Assignment User Alias]))) = @userAlias
      )
      ORDER BY a.[ID_account]
    `

    const request = pool.request()
    request.input('userAlias', sql.NVarChar, userAlias.trim().toLowerCase())
    const result = await request.query(query)
    return result.recordset
  } catch (error) {
    console.error('Error in getAccountsByUser:', error)
    return []
  }
}

/**
 * Query: Get all opportunities owned by the user.
 * Primary matching is done by "Opportunity User Owner" using authenticated name
 * in both "First Last" and "Last, First" forms. ID_owner remains as fallback.
 */
async function getOwnedOpportunities(userId, userName) {
  try {
    const ownerName = userName.trim().toLowerCase().replace(/\s+/g, ' ')
    const nameParts = ownerName.split(' ').filter(Boolean)
    const firstName = nameParts[0] || ''
    const remainingNames = nameParts.slice(1).join(' ')
    const reversedName = remainingNames && firstName
      ? `${remainingNames}, ${firstName}`
      : ownerName

    const query = `
      SELECT 
        o.[ID_opportunity],
        o.[ID_account],
        o.[ID_owner],
        o.[Opportunity Number],
        o.[Opportunity Title],
        o.[Opportunity Account],
        o.[Opportunity Customer],
        o.[Opportunity State],
        o.[Opportunity Status],
        o.[Opportunity Rating],
        o.[Opportunity MCEM Stage Name],
        o.[Opportunity Solution Area],
        o.[Opportunity Solution Play],
        o.[Opportunity Est. Deal Value (USD)],
        o.[Opportunity Act. Deal Value (USD)],
        o.[Opportunity Tot. Deal Value (USD)],
        o.[Opportunity Est. Close Date],
        o.[Opportunity Act. Close Date],
        o.[Opportunity Primary Partner],
        o.[Opportunity Partner Co-Sell],
        o.[Opportunity User Owner],
        o.[Opportunity Date/Time Last Modified]
      FROM dbo.MSX_opportunities o
      WHERE
        LOWER(LTRIM(RTRIM(o.[Opportunity User Owner]))) = @ownerName
        OR LOWER(LTRIM(RTRIM(o.[Opportunity User Owner]))) = @reversedOwnerName
        OR o.[ID_owner] = @userId
      ORDER BY o.[Opportunity Est. Close Date] ASC
    `

    const request = pool.request()
    request.input('userId', sql.NVarChar, userId)
    request.input('ownerName', sql.NVarChar, ownerName)
    request.input('reversedOwnerName', sql.NVarChar, reversedName)
    const result = await request.query(query)
    return result.recordset
  } catch (error) {
    console.error('Error in getOwnedOpportunities:', error)
    return []
  }
}

/**
 * Query: Get opportunities where user is part of the deal team
 */
async function getDealTeamOpportunities(userId) {
  try {
    const query = `
      SELECT 
        o.[ID_opportunity],
        o.[ID_account],
        o.[ID_owner],
        o.[Opportunity Number],
        o.[Opportunity Title],
        o.[Opportunity Account],
        o.[Opportunity Customer],
        o.[Opportunity State],
        o.[Opportunity Status],
        o.[Opportunity Rating],
        o.[Opportunity MCEM Stage Name],
        o.[Opportunity Solution Area],
        o.[Opportunity Solution Play],
        o.[Opportunity Est. Deal Value (USD)],
        o.[Opportunity Act. Deal Value (USD)],
        o.[Opportunity Tot. Deal Value (USD)],
        o.[Opportunity Est. Close Date],
        o.[Opportunity Act. Close Date],
        o.[Opportunity Primary Partner],
        o.[Opportunity Partner Co-Sell],
        o.[Opportunity User Owner],
        o.[Opportunity Date/Time Last Modified],
        dt.[Opportunity Deal Team User]
      FROM dbo.MSX_opportunities o
      INNER JOIN dbo.MSX_opportunitydealteam dt ON o.[ID_opportunity] = dt.[ID_opportunity]
      WHERE dt.[ID_owner] = @userId AND o.[ID_owner] != @userId
      ORDER BY o.[Opportunity Est. Close Date] ASC
    `

    const request = pool.request()
    request.input('userId', sql.NVarChar, userId)
    const result = await request.query(query)
    return result.recordset
  } catch (error) {
    console.error('Error in getDealTeamOpportunities:', error)
    return []
  }
}

/**
 * Query: Get opportunities related to accounts the user owns
 */
async function getRelatedAccountOpportunities(userId) {
  try {
    const query = `
      SELECT 
        o.[ID_opportunity],
        o.[ID_account],
        o.[ID_owner],
        o.[Opportunity Number],
        o.[Opportunity Title],
        o.[Opportunity Account],
        o.[Opportunity Customer],
        o.[Opportunity State],
        o.[Opportunity Status],
        o.[Opportunity Rating],
        o.[Opportunity MCEM Stage Name],
        o.[Opportunity Solution Area],
        o.[Opportunity Solution Play],
        o.[Opportunity Est. Deal Value (USD)],
        o.[Opportunity Act. Deal Value (USD)],
        o.[Opportunity Tot. Deal Value (USD)],
        o.[Opportunity Est. Close Date],
        o.[Opportunity Act. Close Date],
        o.[Opportunity Primary Partner],
        o.[Opportunity Partner Co-Sell],
        o.[Opportunity User Owner],
        o.[Opportunity Date/Time Last Modified]
      FROM dbo.MSX_opportunities o
      WHERE o.[ID_account] IN (
        SELECT [ID_account] FROM dbo.MSX_accounts WHERE [ID_owner] = @userId
      )
      AND o.[ID_owner] != @userId
      AND o.[ID_opportunity] NOT IN (
        SELECT [ID_opportunity] FROM dbo.MSX_opportunitydealteam WHERE [ID_owner] = @userId
      )
      ORDER BY o.[Opportunity Est. Close Date] ASC
    `

    const request = pool.request()
    request.input('userId', sql.NVarChar, userId)
    const result = await request.query(query)
    return result.recordset
  } catch (error) {
    console.error('Error in getRelatedAccountOpportunities:', error)
    return []
  }
}

/**
 * Query: Get partner engagements/referrals related to user, accounts, or opportunities
 */
async function getPartnerEngagements(userId) {
  try {
    const query = `
      SELECT 
        pe.[ID_partnerengagement],
        pe.[ID_opportunity],
        pe.[ID_account],
        pe.[ID_partner],
        pe.[ID_owner],
        pe.[Partner Engagement Title],
        pe.[Partner Engagement Type],
        pe.[Partner Engagement Direction],
        pe.[Partner Engagement Status],
        pe.[Partner Engagement Substatus],
        pe.[Partner Engagement Partner Name],
        pe.[Partner Engagement Partner Organization],
        pe.[Partner Engagement Customer Name (per Partner)],
        pe.[Partner Engagement Solution Area],
        pe.[Partner Engagement Solution Play],
        pe.[Partner Engagement Deal Value (USD)],
        pe.[Partner Engagement Closing Date],
        pe.[Partner Engagement Date/Time Creation],
        pe.[Partner Engagement Date/Time Last Modified],
        pe.[Referral Acceptance],
        pe.[Referral Outcome],
        pe.[Partner Engagement Call to Action],
        o.[Opportunity Title] AS [RelatedOpportunityTitle]
      FROM dbo.MSX_partnerreferrals pe
      LEFT JOIN dbo.MSX_opportunities o ON pe.[ID_opportunity] = o.[ID_opportunity]
      WHERE 
        pe.[ID_owner] = @userId
        OR pe.[ID_account] IN (
          SELECT [ID_account] FROM dbo.MSX_accounts WHERE [ID_owner] = @userId
        )
        OR pe.[ID_opportunity] IN (
          SELECT [ID_opportunity] FROM dbo.MSX_opportunities WHERE [ID_owner] = @userId
          UNION
          SELECT [ID_opportunity] FROM dbo.MSX_opportunitydealteam WHERE [ID_owner] = @userId
        )
      ORDER BY pe.[Partner Engagement Date/Time Last Modified] DESC
    `

    const request = pool.request()
    request.input('userId', sql.NVarChar, userId)
    const result = await request.query(query)
    return result.recordset
  } catch (error) {
    console.error('Error in getPartnerEngagements:', error)
    return []
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ message: 'Internal server error', error: err.message })
})

// SPA fallback for non-API routes in deployed web app mode.
if (hasBuiltFrontend) {
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(indexHtmlPath)
  })
}

// Start server
async function start() {
  try {
    await initializePool()
    app.listen(PORT, () => {
      console.log(`Fabric API Server running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

start()

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing connections...')
  if (pool) {
    await pool.close()
  }
  process.exit(0)
})
