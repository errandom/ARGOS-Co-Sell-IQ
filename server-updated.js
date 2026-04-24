/**
 * Backend API Service for Fabric SQL Database Integration
 * Updated for actual MSX schema
 * 
 * SETUP INSTRUCTIONS:
 * 1. Install dependencies: npm install express mssql cors dotenv
 * 2. Create .env file with credentials:
 *    FABRIC_DB_SERVER=x6eps4xrq2xudenlfv6naeo3i4-ywxvf76w3u4e5gpdqvtoz57rsa.msit-database.fabric.microsoft.com
 *    FABRIC_DB_PORT=1433
 *    FABRIC_DB_NAME=ARGOS SQL-87da6cf7-5c29-48f5-9b97-b2a3245da352
 *    FABRIC_DB_USER={your_username}
 *    FABRIC_DB_PASSWORD={your_password}
 * 3. Run the server: node server-updated.js
 */

import express from 'express'
import sql from 'mssql'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

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
    console.log('✓ Connected to Fabric SQL Database')
  } catch (err) {
    console.error('✗ Database connection error:', err)
  }
}

// Authentication middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Missing token' })
  }
  
  const token = authHeader.substring(7)
  // TODO: Verify token with your auth provider
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' })
  }
  
  next()
}

app.use(authenticate)

/**
 * POST /api/fabric/data
 * Fetch all Fabric data for the authenticated user
 * 
 * Request body: { userId: string }
 */
app.post('/api/fabric/data', async (req, res) => {
  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' })
    }

    // Execute all queries in parallel
    const [accounts, ownedOpportunities, dealTeamOpportunities, relatedAccountOpportunities, partnerEngagements] = await Promise.all([
      getAccountsByUser(userId),
      getOwnedOpportunities(userId),
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
 * Query 1: Get all accounts related to the user
 * Accounts where the user is the owner or owning team
 */
async function getAccountsByUser(userId) {
  try {
    const query = `
      SELECT TOP 1000
        [ID_account],
        [MSX Account Number],
        [MSX Account],
        [MSX Parent Account],
        [MSX Account City],
        [MSX Account Country],
        [MSX Status],
        [MSX Account Management Status],
        [MSX Account Segment],
        [MSX Account Subsegment],
        [MSX Account Industry],
        [MSX Account Segment Group],
        [MSX Account Vertical],
        [MSX Account Owner],
        [ID_owner],
        [ID_owningteam]
      FROM [dbo].[MSX_accounts]
      WHERE [ID_owner] = @userId 
         OR [ID_owningteam] = @userId
      ORDER BY [MSX Account]
    `

    const request = pool.request()
    request.input('userId', sql.NVarChar, userId)
    const result = await request.query(query)
    
    console.log(`✓ Retrieved ${result.recordset.length} accounts for user ${userId}`)
    return result.recordset
  } catch (error) {
    console.error('Error in getAccountsByUser:', error)
    return []
  }
}

/**
 * Query 2: Get all opportunities owned by the user
 */
async function getOwnedOpportunities(userId) {
  try {
    const query = `
      SELECT TOP 1000
        o.[ID_opportunity],
        o.[Opportunity Number],
        o.[Opportunity Title],
        o.[Opportunity Description],
        o.[ID_account],
        a.[MSX Account],
        o.[ID_owner],
        o.[Opportunity User Owner],
        o.[Opportunity State],
        o.[Opportunity Status],
        o.[Opportunity MCEM Stage Name],
        o.[Opportunity Solution Area],
        o.[Opportunity Solution Play],
        o.[Opportunity Est. Deal Value (USD)],
        o.[Opportunity Act. Deal Value (USD)],
        o.[Opportunity Tot. Deal Value (USD)],
        o.[Opportunity Est. Close Date],
        o.[Opportunity Act. Close Date],
        o.[Opportunity Date/Time Creation],
        o.[Opportunity Date/Time Last Modified],
        o.[Opportunity Primary Partner],
        o.[Opportunity Partner Co-Sell],
        o.[Opportunity Intent]
      FROM [dbo].[MSX_opportunities] o
      LEFT JOIN [dbo].[MSX_accounts] a ON o.[ID_account] = a.[ID_account]
      WHERE o.[ID_owner] = @userId
      ORDER BY o.[Opportunity Est. Close Date] ASC
    `

    const request = pool.request()
    request.input('userId', sql.NVarChar, userId)
    const result = await request.query(query)
    
    console.log(`✓ Retrieved ${result.recordset.length} owned opportunities for user ${userId}`)
    return result.recordset
  } catch (error) {
    console.error('Error in getOwnedOpportunities:', error)
    return []
  }
}

/**
 * Query 3: Get opportunities where user is part of the deal team
 */
async function getDealTeamOpportunities(userId) {
  try {
    const query = `
      SELECT TOP 1000
        o.[ID_opportunity],
        o.[Opportunity Number],
        o.[Opportunity Title],
        o.[Opportunity Description],
        o.[ID_account],
        a.[MSX Account],
        o.[ID_owner],
        o.[Opportunity User Owner],
        o.[Opportunity State],
        o.[Opportunity Status],
        o.[Opportunity MCEM Stage Name],
        o.[Opportunity Solution Area],
        o.[Opportunity Solution Play],
        o.[Opportunity Est. Deal Value (USD)],
        o.[Opportunity Act. Deal Value (USD)],
        o.[Opportunity Tot. Deal Value (USD)],
        o.[Opportunity Est. Close Date],
        o.[Opportunity Act. Close Date],
        o.[Opportunity Date/Time Creation],
        o.[Opportunity Date/Time Last Modified],
        o.[Opportunity Intent],
        dt.[Opportunity Deal Team User],
        dt.[Opportunity Deal Team Date/Time User Addition]
      FROM [dbo].[MSX_opportunities] o
      LEFT JOIN [dbo].[MSX_accounts] a ON o.[ID_account] = a.[ID_account]
      INNER JOIN [dbo].[MSX_opportunitydealteam] dt ON o.[ID_opportunity] = dt.[ID_opportunity]
      WHERE dt.[ID_owner] = @userId 
        AND o.[ID_owner] != @userId
      ORDER BY o.[Opportunity Est. Close Date] ASC
    `

    const request = pool.request()
    request.input('userId', sql.NVarChar, userId)
    const result = await request.query(query)
    
    console.log(`✓ Retrieved ${result.recordset.length} deal team opportunities for user ${userId}`)
    return result.recordset
  } catch (error) {
    console.error('Error in getDealTeamOpportunities:', error)
    return []
  }
}

/**
 * Query 4: Get opportunities related to accounts the user is related to
 */
async function getRelatedAccountOpportunities(userId) {
  try {
    const query = `
      SELECT TOP 1000
        o.[ID_opportunity],
        o.[Opportunity Number],
        o.[Opportunity Title],
        o.[Opportunity Description],
        o.[ID_account],
        a.[MSX Account],
        o.[ID_owner],
        o.[Opportunity User Owner],
        o.[Opportunity State],
        o.[Opportunity Status],
        o.[Opportunity MCEM Stage Name],
        o.[Opportunity Solution Area],
        o.[Opportunity Solution Play],
        o.[Opportunity Est. Deal Value (USD)],
        o.[Opportunity Act. Deal Value (USD)],
        o.[Opportunity Tot. Deal Value (USD)],
        o.[Opportunity Est. Close Date],
        o.[Opportunity Act. Close Date],
        o.[Opportunity Date/Time Creation],
        o.[Opportunity Date/Time Last Modified],
        o.[Opportunity Intent]
      FROM [dbo].[MSX_opportunities] o
      LEFT JOIN [dbo].[MSX_accounts] a ON o.[ID_account] = a.[ID_account]
      WHERE o.[ID_account] IN (
        SELECT [ID_account] FROM [dbo].[MSX_accounts] 
        WHERE [ID_owner] = @userId OR [ID_owningteam] = @userId
      )
      AND o.[ID_owner] != @userId
      AND o.[ID_opportunity] NOT IN (
        SELECT [ID_opportunity] FROM [dbo].[MSX_opportunitydealteam] 
        WHERE [ID_owner] = @userId
      )
      ORDER BY o.[Opportunity Est. Close Date] ASC
    `

    const request = pool.request()
    request.input('userId', sql.NVarChar, userId)
    const result = await request.query(query)
    
    console.log(`✓ Retrieved ${result.recordset.length} related account opportunities for user ${userId}`)
    return result.recordset
  } catch (error) {
    console.error('Error in getRelatedAccountOpportunities:', error)
    return []
  }
}

/**
 * Query 5: Get partner engagements/referrals related to user, accounts, or opportunities
 */
async function getPartnerEngagements(userId) {
  try {
    const query = `
      SELECT TOP 1000
        pe.[ID_partnerengagement],
        pe.[Partner Engagement Title],
        pe.[Partner Engagement Type],
        pe.[Partner Engagement Status],
        pe.[Partner Engagement Substatus],
        pe.[Referral Status Type],
        pe.[ID_account],
        a.[MSX Account] AS [Account Name],
        pe.[ID_opportunity],
        o.[Opportunity Title] AS [Opportunity Name],
        pe.[ID_owner],
        pe.[Partner Engagement Partner Name],
        pe.[Partner Engagement Customer Name (per Partner)],
        pe.[Partner Engagement Deal Value (USD)],
        pe.[Partner Engagement Currency],
        pe.[Partner Engagement Closing Date],
        pe.[Partner Engagement Solution Area],
        pe.[Partner Engagement Intent],
        pe.[Partner Engagement Date/Time Creation],
        pe.[Partner Engagement Date/Time Last Modified],
        pe.[Partner Engagement Notes]
      FROM [dbo].[MSX_partnerreferrals] pe
      LEFT JOIN [dbo].[MSX_accounts] a ON pe.[ID_account] = a.[ID_account]
      LEFT JOIN [dbo].[MSX_opportunities] o ON pe.[ID_opportunity] = o.[ID_opportunity]
      WHERE pe.[ID_owner] = @userId
        OR pe.[ID_account] IN (
          SELECT [ID_account] FROM [dbo].[MSX_accounts] 
          WHERE [ID_owner] = @userId OR [ID_owningteam] = @userId
        )
        OR pe.[ID_opportunity] IN (
          SELECT [ID_opportunity] FROM [dbo].[MSX_opportunities] 
          WHERE [ID_owner] = @userId
          UNION
          SELECT [ID_opportunity] FROM [dbo].[MSX_opportunitydealteam] 
          WHERE [ID_owner] = @userId
        )
      ORDER BY pe.[Partner Engagement Date/Time Last Modified] DESC
    `

    const request = pool.request()
    request.input('userId', sql.NVarChar, userId)
    const result = await request.query(query)
    
    console.log(`✓ Retrieved ${result.recordset.length} partner engagements for user ${userId}`)
    return result.recordset
  } catch (error) {
    console.error('Error in getPartnerEngagements:', error)
    return []
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: pool ? 'Connected' : 'Disconnected'
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ message: 'Internal server error', error: err.message })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Not found' })
})

// Start server
async function start() {
  try {
    await initializePool()
    app.listen(PORT, () => {
      console.log(`✓ Fabric API Server running on http://localhost:${PORT}`)
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`)
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
