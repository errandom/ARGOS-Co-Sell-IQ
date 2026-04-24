/**
 * Backend API Service for Fabric SQL Database Integration (TypeScript)
 * Updated for actual MSX schema
 * 
 * Usage: npx ts-node server-updated.ts
 */

import express, { Express, Request, Response, NextFunction } from 'express'
import sql from 'mssql'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app: Express = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*'
}))
app.use(express.json())

// Type definitions for query results
interface Account {
  ID_account: string
  'MSX Account Number'?: string
  'MSX Account'?: string
  [key: string]: unknown
}

interface Opportunity {
  ID_opportunity: string
  'Opportunity Title'?: string
  [key: string]: unknown
}

interface PartnerEngagement {
  ID_partnerengagement: string
  'Partner Engagement Title'?: string
  [key: string]: unknown
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
    res.status(401).json({ message: 'Unauthorized: Missing token' })
    return
  }

  const token = authHeader.substring(7)

  if (!token) {
    res.status(401).json({ message: 'Unauthorized: Invalid token' })
    return
  }

  next()
}

app.use(authenticate)

/**
 * POST /api/fabric/data
 */
app.post('/api/fabric/data', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body

    if (!userId) {
      res.status(400).json({ message: 'userId is required' })
      return
    }

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
    res.status(500).json({
      message: 'Failed to fetch Fabric data',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

async function getAccountsByUser(userId: string): Promise<Account[]> {
  try {
    if (!pool) throw new Error('Database pool not initialized')

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
    return result.recordset as PartnerEngagement[]
  } catch (error) {
    console.error('Error in getPartnerEngagements:', error)
    return []
  }
}

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: pool ? 'Connected' : 'Disconnected'
  })
})

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    message: 'Internal server error',
    error: err.message
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Not found' })
})

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

export { app }
