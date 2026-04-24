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

app.use(authenticate)

/**
 * GET /api/fabric/data
 * Fetch all Fabric data for the authenticated user
 * 
 * Request body:
 * {
 *   userId: string,
 *   userEmail?: string
 * }
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
 * Query: Get all accounts related to the user
 */
async function getAccountsByUser(userId) {
  try {
    const query = `
      SELECT 
        a.[AccountId],
        a.[AccountName],
        a.[AccountReference],
        a.[Industry],
        a.[Revenue],
        a.[EmployeeCount],
        a.[Location],
        a.[Website],
        a.[LastModifiedDate]
      FROM [Accounts] a
      INNER JOIN [UserAccounts] ua ON a.[AccountId] = ua.[AccountId]
      WHERE ua.[UserId] = @userId
      ORDER BY a.[LastModifiedDate] DESC
    `

    const request = pool.request()
    request.input('userId', sql.NVarChar, userId)
    const result = await request.query(query)
    return result.recordset
  } catch (error) {
    console.error('Error in getAccountsByUser:', error)
    return []
  }
}

/**
 * Query: Get all opportunities owned by the user
 */
async function getOwnedOpportunities(userId) {
  try {
    const query = `
      SELECT 
        o.[OpportunityId],
        o.[OpportunityName],
        o.[AccountId],
        a.[AccountName],
        o.[OwnerId],
        u.[UserName] as [OwnerName],
        o.[DealValue],
        o.[ForecastCategory],
        o.[Stage],
        o.[CloseDate],
        o.[Description],
        o.[LastModifiedDate]
      FROM [Opportunities] o
      INNER JOIN [Accounts] a ON o.[AccountId] = a.[AccountId]
      LEFT JOIN [Users] u ON o.[OwnerId] = u.[UserId]
      WHERE o.[OwnerId] = @userId
      ORDER BY o.[CloseDate] ASC
    `

    const request = pool.request()
    request.input('userId', sql.NVarChar, userId)
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
        o.[OpportunityId],
        o.[OpportunityName],
        o.[AccountId],
        a.[AccountName],
        o.[OwnerId],
        u.[UserName] as [OwnerName],
        o.[DealValue],
        o.[ForecastCategory],
        o.[Stage],
        o.[CloseDate],
        o.[Description],
        o.[LastModifiedDate]
      FROM [Opportunities] o
      INNER JOIN [Accounts] a ON o.[AccountId] = a.[AccountId]
      LEFT JOIN [Users] u ON o.[OwnerId] = u.[UserId]
      INNER JOIN [DealTeam] dt ON o.[OpportunityId] = dt.[OpportunityId]
      WHERE dt.[UserId] = @userId AND o.[OwnerId] != @userId
      ORDER BY o.[CloseDate] ASC
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
 * Query: Get opportunities related to accounts the user is related to
 */
async function getRelatedAccountOpportunities(userId) {
  try {
    const query = `
      SELECT 
        o.[OpportunityId],
        o.[OpportunityName],
        o.[AccountId],
        a.[AccountName],
        o.[OwnerId],
        u.[UserName] as [OwnerName],
        o.[DealValue],
        o.[ForecastCategory],
        o.[Stage],
        o.[CloseDate],
        o.[Description],
        o.[LastModifiedDate]
      FROM [Opportunities] o
      INNER JOIN [Accounts] a ON o.[AccountId] = a.[AccountId]
      LEFT JOIN [Users] u ON o.[OwnerId] = u.[UserId]
      WHERE a.[AccountId] IN (
        SELECT [AccountId] FROM [UserAccounts] WHERE [UserId] = @userId
      )
      AND o.[OwnerId] != @userId
      AND o.[OpportunityId] NOT IN (
        SELECT [OpportunityId] FROM [DealTeam] WHERE [UserId] = @userId
      )
      ORDER BY o.[CloseDate] ASC
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
        pe.[EngagementId],
        pe.[EngagementName],
        pe.[EngagementType],
        pe.[RelatedAccountId],
        a.[AccountName] as [RelatedAccountName],
        pe.[RelatedOpportunityId],
        o.[OpportunityName] as [RelatedOpportunityName],
        pe.[RelatedUserId],
        u.[UserName] as [RelatedUserName],
        pe.[Status],
        pe.[CreatedDate],
        pe.[LastModifiedDate]
      FROM [PartnerEngagements] pe
      LEFT JOIN [Accounts] a ON pe.[RelatedAccountId] = a.[AccountId]
      LEFT JOIN [Opportunities] o ON pe.[RelatedOpportunityId] = o.[OpportunityId]
      LEFT JOIN [Users] u ON pe.[RelatedUserId] = u.[UserId]
      WHERE 
        pe.[RelatedUserId] = @userId
        OR pe.[RelatedAccountId] IN (SELECT [AccountId] FROM [UserAccounts] WHERE [UserId] = @userId)
        OR pe.[RelatedOpportunityId] IN (
          SELECT [OpportunityId] FROM [Opportunities] WHERE [OwnerId] = @userId
          UNION
          SELECT [OpportunityId] FROM [DealTeam] WHERE [UserId] = @userId
        )
      ORDER BY pe.[LastModifiedDate] DESC
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ message: 'Internal server error', error: err.message })
})

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
