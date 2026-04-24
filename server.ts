/**
 * Fabric SQL Backend API Server (TypeScript Version)
 * 
 * For TypeScript users, use this instead of server.js
 * Requires: npm install express mssql cors dotenv typescript ts-node @types/express @types/node
 * 
 * Usage: npx ts-node server.ts
 * Or build: tsc && node dist/server.js
 */

import express, { Express, Request, Response, NextFunction } from 'express'
import sql from 'mssql'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app: Express = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}))
app.use(express.json())

// Types for database operations
interface User {
  userId: string
  userName?: string
  email?: string
  createdDate?: Date
}

interface Account {
  accountId: string
  accountName: string
  accountReference?: string
  industry?: string
  revenue?: number
  employeeCount?: number
  location?: string
  website?: string
  lastModifiedDate?: Date
}

interface Opportunity {
  opportunityId: string
  opportunityName: string
  accountId: string
  accountName: string
  ownerId: string
  ownerName?: string
  dealValue?: number
  forecastCategory?: string
  stage?: string
  closeDate?: Date
  description?: string
  lastModifiedDate?: Date
}

interface PartnerEngagement {
  engagementId: string
  engagementName: string
  engagementType: 'referral' | 'co-sell' | 'partnership' | 'other'
  relatedAccountId?: string
  relatedAccountName?: string
  relatedOpportunityId?: string
  relatedOpportunityName?: string
  relatedUserId?: string
  relatedUserName?: string
  status?: string
  createdDate?: Date
  lastModifiedDate?: Date
}

interface FabricData {
  accounts: Account[]
  opportunities: Opportunity[]
  dealTeamOpportunities: Opportunity[]
  relatedAccountOpportunities: Opportunity[]
  partnerEngagements: PartnerEngagement[]
  isLoading: boolean
  error: null
}

// Database configuration
const dbConfig: sql.config = {
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

let pool: sql.ConnectionPool | null = null

// Database initialization
async function initializePool(): Promise<void> {
  try {
    pool = new sql.ConnectionPool(dbConfig)
    await pool.connect()
    console.log('✓ Connected to Fabric SQL Database')
  } catch (err) {
    console.error('✗ Database connection error:', err)
    process.exit(1)
  }
}

// Authentication middleware
function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized: Missing or invalid token' })
    return
  }

  const token = authHeader.substring(7)

  // TODO: Implement token verification
  // For now, any non-empty token is accepted
  if (!token) {
    res.status(401).json({ message: 'Unauthorized: Invalid token' })
    return
  }

  next()
}

app.use(authenticate)

/**
 * GET /api/health - Health check endpoint
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: pool ? 'Connected' : 'Disconnected'
  })
})

/**
 * POST /api/fabric/data - Fetch all Fabric data for the user
 */
app.post('/api/fabric/data', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body

    if (!userId) {
      res.status(400).json({ message: 'userId is required' })
      return
    }

    // Execute all queries in parallel
    const [
      accounts,
      opportunities,
      dealTeamOpportunities,
      relatedAccountOpportunities,
      partnerEngagements,
    ] = await Promise.all([
      getAccountsByUser(userId),
      getOwnedOpportunities(userId),
      getDealTeamOpportunities(userId),
      getRelatedAccountOpportunities(userId),
      getPartnerEngagements(userId),
    ])

    const data: FabricData = {
      accounts,
      opportunities,
      dealTeamOpportunities,
      relatedAccountOpportunities,
      partnerEngagements,
      isLoading: false,
      error: null,
    }

    res.json(data)
  } catch (error) {
    console.error('Error fetching Fabric data:', error)
    res.status(500).json({
      message: 'Failed to fetch Fabric data',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

/**
 * Query functions
 */

async function getAccountsByUser(userId: string): Promise<Account[]> {
  try {
    if (!pool) throw new Error('Database pool not initialized')

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
    
    return result.recordset as Account[]
  } catch (error) {
    console.error('Error in getAccountsByUser:', error)
    return []
  }
}

async function getOwnedOpportunities(userId: string): Promise<Opportunity[]> {
  try {
    if (!pool) throw new Error('Database pool not initialized')

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
    
    return result.recordset as Opportunity[]
  } catch (error) {
    console.error('Error in getOwnedOpportunities:', error)
    return []
  }
}

async function getDealTeamOpportunities(userId: string): Promise<Opportunity[]> {
  try {
    if (!pool) throw new Error('Database pool not initialized')

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
    
    return result.recordset as Opportunity[]
  } catch (error) {
    console.error('Error in getDealTeamOpportunities:', error)
    return []
  }
}

async function getRelatedAccountOpportunities(userId: string): Promise<Opportunity[]> {
  try {
    if (!pool) throw new Error('Database pool not initialized')

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
    
    return result.recordset as Opportunity[]
  } catch (error) {
    console.error('Error in getRelatedAccountOpportunities:', error)
    return []
  }
}

async function getPartnerEngagements(userId: string): Promise<PartnerEngagement[]> {
  try {
    if (!pool) throw new Error('Database pool not initialized')

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
    
    return result.recordset as PartnerEngagement[]
  } catch (error) {
    console.error('Error in getPartnerEngagements:', error)
    return []
  }
}

/**
 * Error handling middleware
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    message: 'Internal server error',
    error: err.message
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Not found' })
})

/**
 * Start server
 */
async function start(): Promise<void> {
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

/**
 * Graceful shutdown
 */
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing connections...')
  
  if (pool) {
    try {
      await pool.close()
      console.log('✓ Database connection closed')
    } catch (error) {
      console.error('Error closing database:', error)
    }
  }

  process.exit(0)
})

// Export for testing
export { app }
