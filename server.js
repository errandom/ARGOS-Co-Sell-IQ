/**
 * Backend API Service for Fabric SQL Database Integration
 *
 * SETUP INSTRUCTIONS:
 * 1. Install dependencies: npm install express mssql cors dotenv
 * 2. Create .env file with Fabric SQL location and workspace identity credentials:
 *    FABRIC_DB_SERVER=x6eps4xrq2xudenlfv6naeo3i4-ywxvf76w3u4e5gpdqvtoz57rsa.msit-database.fabric.microsoft.com
 *    FABRIC_DB_PORT=1433
 *    FABRIC_DB_NAME=ARGOS SQL-87da6cf7-5c29-48f5-9b97-b2a3245da352
 *    FABRIC_TENANT_ID=72f988bf-86f1-41af-91ab-2d7cd011db47
 *    FABRIC_CLIENT_ID=df5a4087-2452-4508-9089-c7a0afaa0f5f
 *    FABRIC_CLIENT_SECRET=<workspace-identity-secret-from-entra>
 * 3. Run the server: node server.js
 *
 * This service uses a Fabric workspace identity (service principal) for all
 * Fabric SQL queries. No user tokens are required on the frontend.
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

// Workspace identity (service principal) configuration
const workspaceIdentityConfig = {
  tenantId: process.env.FABRIC_TENANT_ID || '72f988bf-86f1-41af-91ab-2d7cd011db47',
  clientId: process.env.FABRIC_CLIENT_ID || 'df5a4087-2452-4508-9089-c7a0afaa0f5f',
  clientSecret: process.env.FABRIC_CLIENT_SECRET,
  oidcToken: process.env.OIDC_TOKEN,
  federatedTokenFile: process.env.AZURE_FEDERATED_TOKEN_FILE,
  useManagedIdentity: process.env.USE_MANAGED_IDENTITY === 'true',
}

// Token cache for workspace identity (avoid repeated auth calls)
let cachedWorkspaceToken = null
let tokenExpiryTime = null

function getConfiguredAuthMode() {
  if (workspaceIdentityConfig.oidcToken || workspaceIdentityConfig.federatedTokenFile) {
    return 'federated-credential'
  }
  if (workspaceIdentityConfig.useManagedIdentity) {
    return 'managed-identity'
  }
  if (workspaceIdentityConfig.clientSecret) {
    return 'client-secret'
  }
  return 'unconfigured'
}

function toErrorResponse(error, fallbackCode = 'UNEXPECTED_ERROR') {
  const message = error instanceof Error ? error.message : String(error)
  let code = fallbackCode

  if (message.includes('No authentication method configured')) {
    code = 'AUTH_NOT_CONFIGURED'
  } else if (message.includes('Failed to acquire token')) {
    code = 'TOKEN_ACQUISITION_FAILED'
  } else if (message.includes('Login failed for user')) {
    code = 'SQL_LOGIN_FAILED'
  } else if (message.includes('permission') || message.includes('principal')) {
    code = 'SQL_PERMISSION_DENIED'
  }

  return { code, message }
}

//
// Federated credential (OIDC) support for GitHub Actions and other OIDC providers
//
async function getTokenViaClientAssertion() {
  let oidcToken = workspaceIdentityConfig.oidcToken

  // Azure workload identity providers can expose the assertion as a file path.
  if (!oidcToken && workspaceIdentityConfig.federatedTokenFile) {
    oidcToken = fs.readFileSync(workspaceIdentityConfig.federatedTokenFile, 'utf8').trim()
  }

  if (!oidcToken) {
    throw new Error('Federated assertion not found. Set OIDC_TOKEN or AZURE_FEDERATED_TOKEN_FILE for client assertion flow.')
  }

  const tokenUrl = `https://login.microsoftonline.com/${workspaceIdentityConfig.tenantId}/oauth2/v2.0/token`
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: workspaceIdentityConfig.clientId,
    scope: 'https://database.windows.net/.default',
    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    client_assertion: oidcToken,
  })
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to acquire token via client assertion (OIDC): ${response.status} ${errorText}`)
  }
  const tokenData = await response.json()
  return {
    token: tokenData.access_token,
    expiresIn: tokenData.expires_in,
  }
}

/**
 * Get a fresh access token for the workspace identity.
 * Supports three authentication methods:
 * 1. Azure Managed Identity (recommended for Azure App Service) - set USE_MANAGED_IDENTITY=true
 * 2. Client Secret (set FABRIC_CLIENT_SECRET in .env)
 * 3. Can be extended to support federated credentials / client assertion
 */
async function getWorkspaceIdentityToken() {
  if (cachedWorkspaceToken && tokenExpiryTime && Date.now() < tokenExpiryTime - 60000) {
    console.log('[getWorkspaceIdentityToken] Using cached token')
    return cachedWorkspaceToken
  }
  console.log('[getWorkspaceIdentityToken] Acquiring new token...')
  let accessToken
  if (workspaceIdentityConfig.oidcToken || workspaceIdentityConfig.federatedTokenFile) {
    console.log('[getWorkspaceIdentityToken] Using federated credential (OIDC)')
    accessToken = await getTokenViaClientAssertion()
  } else if (workspaceIdentityConfig.useManagedIdentity) {
    console.log('[getWorkspaceIdentityToken] Using Azure Managed Identity')
    accessToken = await getTokenViaManagedIdentity()
  } else if (workspaceIdentityConfig.clientSecret) {
    console.log('[getWorkspaceIdentityToken] Using client credentials (secret)')
    accessToken = await getTokenViaClientSecret()
  } else {
    throw new Error(
      'No authentication method configured. Set either:\n' +
      '  - OIDC_TOKEN or AZURE_FEDERATED_TOKEN_FILE (for federated credentials)\n' +
      '  - USE_MANAGED_IDENTITY=true (for Azure App Service)\n' +
      '  - FABRIC_CLIENT_SECRET in .env (for client credentials flow)'
    )
  }
  cachedWorkspaceToken = accessToken.token
  tokenExpiryTime = Date.now() + (accessToken.expiresIn * 1000)
  console.log('[getWorkspaceIdentityToken] Token acquired successfully')
  return cachedWorkspaceToken
}

/**
 * Get token via Azure Managed Identity (for Azure App Service, ACI, etc.)
 */
async function getTokenViaManagedIdentity() {
  // App Service managed identity endpoint (preferred on Azure Web Apps)
  if (process.env.IDENTITY_ENDPOINT && process.env.IDENTITY_HEADER) {
    const params = new URLSearchParams({
      'api-version': '2019-08-01',
      resource: 'https://database.windows.net/',
    })

    const response = await fetch(`${process.env.IDENTITY_ENDPOINT}?${params.toString()}`, {
      headers: {
        'X-IDENTITY-HEADER': process.env.IDENTITY_HEADER,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to acquire App Service managed identity token: ${response.status} ${errorText}`)
    }

    const tokenData = await response.json()
    return {
      token: tokenData.access_token,
      expiresIn: tokenData.expires_in,
    }
  }

  // IMDS endpoint fallback
  const imdsEndpoint = 'http://169.254.169.254/metadata/identity/oauth2/token'
  const params = new URLSearchParams({
    'api-version': '2018-02-01',
    resource: 'https://database.windows.net/',
  })

  const response = await fetch(`${imdsEndpoint}?${params.toString()}`, {
    headers: { Metadata: 'true' },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to acquire Managed Identity token: ${response.status} ${errorText}`)
  }

  const tokenData = await response.json()
  return {
    token: tokenData.access_token,
    expiresIn: tokenData.expires_in,
  }
}

/**
 * Get token via client credentials flow (requires FABRIC_CLIENT_SECRET)
 */
async function getTokenViaClientSecret() {
  const tokenUrl = `https://login.microsoftonline.com/${workspaceIdentityConfig.tenantId}/oauth2/v2.0/token`

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: workspaceIdentityConfig.clientId,
    client_secret: workspaceIdentityConfig.clientSecret,
    scope: 'https://database.windows.net/.default',
  })

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Failed to acquire token via client credentials: ${response.status} ${errorText}`)
  }

  const tokenData = await response.json()
  return {
    token: tokenData.access_token,
    expiresIn: tokenData.expires_in,
  }
}

// Database configuration shared across all connections.
const baseDbConfig = {
  server: process.env.FABRIC_DB_SERVER || 'x6eps4xrq2xudenlfv6naeo3i4-ywxvf76w3u4e5gpdqvtoz57rsa.msit-database.fabric.microsoft.com',
  port: parseInt(process.env.FABRIC_DB_PORT || '1433'),
  database: process.env.FABRIC_DB_NAME || 'ARGOS SQL-87da6cf7-5c29-48f5-9b97-b2a3245da352',
  pool: {
    max: 5,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    encrypt: true,
    trustServerCertificate: false,
    appName: 'ARGOS Co-Sell IQ',
  },
}

function buildAccessTokenDbConfig(accessToken) {
  return {
    ...baseDbConfig,
    authentication: {
      type: 'azure-active-directory-access-token',
      options: {
        token: accessToken,
      },
    },
  }
}

/**
 * Create a Fabric SQL pool using a provided access token (delegated user or workspace identity).
 * If no token is provided, falls back to workspace identity.
 */
async function createSqlPoolWithToken(accessToken) {
  let token = accessToken
  if (!token) {
    token = await getWorkspaceIdentityToken()
  }
  const pool = new sql.ConnectionPool(buildAccessTokenDbConfig(token))
  await pool.connect()
  return pool
}

function normalizeName(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function getNameVariants(userName) {
  const normalized = normalizeName(userName)
  const parts = normalized.split(' ').filter(Boolean)
  const firstName = parts[0] || ''
  const lastName = parts.length > 1 ? parts[parts.length - 1] : ''
  const firstLast = firstName && lastName ? `${firstName} ${lastName}` : normalized
  const reversedFull = parts.length > 1 ? `${parts.slice(1).join(' ')}, ${firstName}` : normalized
  const reversedFirstLast = firstName && lastName ? `${lastName}, ${firstName}` : normalized

  // Keep only non-empty unique values to avoid duplicate SQL comparisons.
  return Array.from(new Set([normalized, firstLast, reversedFull, reversedFirstLast].filter(Boolean)))
}

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    connected: true,
    authMode: getConfiguredAuthMode(),
    timestamp: new Date().toISOString(),
  })
})

// Diagnostic: validate runtime auth mode, token acquisition, and SQL connectivity.
app.get('/api/diag/auth', async (req, res) => {
  const result = {
    authMode: getConfiguredAuthMode(),
    checks: {
      tokenAcquisition: { ok: false, detail: null },
      sqlConnection: { ok: false, detail: null },
      sqlQuery: { ok: false, detail: null },
    },
    env: {
      useManagedIdentity: workspaceIdentityConfig.useManagedIdentity,
      hasClientSecret: Boolean(workspaceIdentityConfig.clientSecret),
      hasOidcToken: Boolean(workspaceIdentityConfig.oidcToken),
      hasFederatedTokenFile: Boolean(workspaceIdentityConfig.federatedTokenFile),
      hasIdentityEndpoint: Boolean(process.env.IDENTITY_ENDPOINT),
      hasIdentityHeader: Boolean(process.env.IDENTITY_HEADER),
    },
  }

  let pool
  try {
    const token = await getWorkspaceIdentityToken()
    result.checks.tokenAcquisition = { ok: true, detail: `token_length=${token.length}` }

    pool = new sql.ConnectionPool(buildAccessTokenDbConfig(token))
    await pool.connect()
    result.checks.sqlConnection = { ok: true, detail: 'connection_open' }

    const ping = await pool.request().query('SELECT 1 AS ok')
    result.checks.sqlQuery = {
      ok: true,
      detail: `row_ok=${ping.recordset?.[0]?.ok === 1}`,
    }

    res.json({ status: 'OK', ...result })
  } catch (error) {
    const parsed = toErrorResponse(error, 'AUTH_DIAGNOSTIC_FAILED')
    res.status(500).json({ status: 'ERROR', ...result, error: parsed })
  } finally {
    if (pool) {
      await pool.close().catch(() => undefined)
    }
  }
})

// Diagnostic: return column names and a sample row for SPM and MSX account tables.
app.get('/api/diag/schema', async (req, res) => {
  let pool
  try {
    pool = await createWorkspaceIdentityPool()
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
  } finally {
    if (pool) {
      await pool.close().catch(() => undefined)
    }
  }
})

// Diagnostic: inspect MSX opportunities owner values and current matching behavior.
app.post('/api/diag/opportunities', async (req, res) => {
  let pool
  try {
    const { userId, userAlias, userName } = req.body

    if (!userName) {
      return res.status(400).json({ message: 'userName is required' })
    }

    const normalizedUserName = userName.trim().toLowerCase().replace(/\s+/g, ' ')
    const nameParts = normalizedUserName.split(' ').filter(Boolean)
    const firstName = nameParts[0] || ''
    const remainingNames = nameParts.slice(1).join(' ')
    const reversedUserName = remainingNames && firstName
      ? `${remainingNames}, ${firstName}`
      : normalizedUserName
    const firstNamePattern = firstName ? `%${firstName}%` : null
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''
    const lastNamePattern = lastName ? `%${lastName}%` : null

    pool = await createWorkspaceIdentityPool()

    const request = pool.request()
    request.input('ownerName', sql.NVarChar, normalizedUserName)
    request.input('reversedOwnerName', sql.NVarChar, reversedUserName)
    request.input('firstNamePattern', sql.NVarChar, firstNamePattern)
    request.input('lastNamePattern', sql.NVarChar, lastNamePattern)

    const [summaryResult, ownerSamplesResult, matchedOwnersResult, opportunitySamplesResult] = await Promise.all([
      request.query(`
        SELECT
          COUNT(*) AS totalOpportunityCount,
          SUM(CASE WHEN o.[Opportunity User Owner] IS NULL OR LTRIM(RTRIM(o.[Opportunity User Owner])) = '' THEN 1 ELSE 0 END) AS nullOrBlankOwnerCount,
          SUM(CASE WHEN LOWER(LTRIM(RTRIM(o.[Opportunity User Owner]))) = @ownerName THEN 1 ELSE 0 END) AS exactNameMatchCount,
          SUM(CASE WHEN LOWER(LTRIM(RTRIM(o.[Opportunity User Owner]))) = @reversedOwnerName THEN 1 ELSE 0 END) AS reversedNameMatchCount,
          SUM(CASE WHEN @firstNamePattern IS NOT NULL AND LOWER(o.[Opportunity User Owner]) LIKE @firstNamePattern THEN 1 ELSE 0 END) AS firstNameLikeCount,
          SUM(CASE WHEN @lastNamePattern IS NOT NULL AND LOWER(o.[Opportunity User Owner]) LIKE @lastNamePattern THEN 1 ELSE 0 END) AS lastNameLikeCount,
          SUM(CASE WHEN o.[ID_owner] = @ownerName THEN 1 ELSE 0 END) AS ownerIdEqualsUserNameCount
        FROM dbo.MSX_opportunities o
      `),
      request.query(`
        SELECT TOP 20
          LOWER(LTRIM(RTRIM(o.[Opportunity User Owner]))) AS normalizedOwner,
          COUNT(*) AS opportunityCount
        FROM dbo.MSX_opportunities o
        WHERE o.[Opportunity User Owner] IS NOT NULL
          AND LTRIM(RTRIM(o.[Opportunity User Owner])) <> ''
        GROUP BY LOWER(LTRIM(RTRIM(o.[Opportunity User Owner])))
        ORDER BY opportunityCount DESC, normalizedOwner ASC
      `),
      request.query(`
        SELECT TOP 20
          LOWER(LTRIM(RTRIM(o.[Opportunity User Owner]))) AS normalizedOwner,
          COUNT(*) AS opportunityCount
        FROM dbo.MSX_opportunities o
        WHERE o.[Opportunity User Owner] IS NOT NULL
          AND LTRIM(RTRIM(o.[Opportunity User Owner])) <> ''
          AND (
            LOWER(LTRIM(RTRIM(o.[Opportunity User Owner]))) = @ownerName
            OR LOWER(LTRIM(RTRIM(o.[Opportunity User Owner]))) = @reversedOwnerName
            OR (@firstNamePattern IS NOT NULL AND LOWER(o.[Opportunity User Owner]) LIKE @firstNamePattern)
            OR (@lastNamePattern IS NOT NULL AND LOWER(o.[Opportunity User Owner]) LIKE @lastNamePattern)
          )
        GROUP BY LOWER(LTRIM(RTRIM(o.[Opportunity User Owner])))
        ORDER BY opportunityCount DESC, normalizedOwner ASC
      `),
      request.query(`
        SELECT TOP 10
          o.[ID_opportunity],
          o.[ID_owner],
          o.[Opportunity User Owner],
          o.[Opportunity Number],
          o.[Opportunity Title],
          o.[Opportunity Account],
          o.[Opportunity Est. Close Date],
          o.[Opportunity Date/Time Last Modified]
        FROM dbo.MSX_opportunities o
        WHERE
          LOWER(LTRIM(RTRIM(o.[Opportunity User Owner]))) = @ownerName
          OR LOWER(LTRIM(RTRIM(o.[Opportunity User Owner]))) = @reversedOwnerName
          OR (@firstNamePattern IS NOT NULL AND LOWER(o.[Opportunity User Owner]) LIKE @firstNamePattern)
          OR (@lastNamePattern IS NOT NULL AND LOWER(o.[Opportunity User Owner]) LIKE @lastNamePattern)
        ORDER BY o.[Opportunity Date/Time Last Modified] DESC
      `),
    ])

    res.json({
      inputs: {
        userId: userId || null,
        userAlias: userAlias || null,
        userName,
        normalizedUserName,
        reversedUserName,
        firstName,
        lastName,
      },
      summary: summaryResult.recordset[0] || null,
      topOwners: ownerSamplesResult.recordset,
      matchedOwners: matchedOwnersResult.recordset,
      matchedOpportunitySamples: opportunitySamplesResult.recordset,
    })
  } catch (error) {
    console.error('Error in /api/diag/opportunities:', error)
    res.status(500).json({ message: 'Failed to fetch opportunities diagnostics', error: error.message })
  } finally {
    if (pool) {
      await pool.close().catch(() => undefined)
    }
  }
})

/**
 * POST /api/fabric/accounts
 * Load only the accounts for the authenticated user (lightweight, called on login)
 * Uses workspace identity for Fabric SQL access (no user token required).
 */
app.post('/api/fabric/accounts', async (req, res) => {
  let pool
  try {
    const { userAlias } = req.body
    console.log('[POST /api/fabric/accounts] Received request with userAlias:', userAlias)
    if (!userAlias) {
      return res.status(400).json({ message: 'userAlias is required' })
    }
    // Get bearer token from Authorization header if present
    let userToken = null
    const authHeader = req.headers['authorization'] || req.headers['Authorization']
    if (authHeader && authHeader.startsWith('Bearer ')) {
      userToken = authHeader.substring('Bearer '.length)
    }
    pool = await createSqlPoolWithToken(userToken)
    const accounts = await getAccountsByUser(pool, userAlias)
    res.json({ accounts })
  } catch (error) {
    console.error('Error fetching accounts:', error)
    const parsed = toErrorResponse(error, 'ACCOUNTS_QUERY_FAILED')
    res.status(500).json({
      message: 'Failed to fetch accounts',
      error: parsed.message,
      code: parsed.code,
      authMode: getConfiguredAuthMode(),
    })
  } finally {
    if (pool) {
      await pool.close().catch(() => undefined)
    }
  }
})

/**
 * POST /api/fabric/data
 * Fetch all Fabric data for the authenticated user
 * Uses workspace identity for Fabric SQL access (no user token required).
 */
app.post('/api/fabric/data', async (req, res) => {
  let pool
  try {
    const { userId, userAlias, userName } = req.body

    console.log('[POST /api/fabric/data] Received request with userId:', userId, 'userAlias:', userAlias, 'userName:', userName)

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' })
    }
    if (!userAlias) {
      return res.status(400).json({ message: 'userAlias is required' })
    }
    if (!userName) {
      return res.status(400).json({ message: 'userName is required' })
    }

    // Get bearer token from Authorization header if present
    let userToken = null
    const authHeader = req.headers['authorization'] || req.headers['Authorization']
    if (authHeader && authHeader.startsWith('Bearer ')) {
      userToken = authHeader.substring('Bearer '.length)
    }
    pool = await createSqlPoolWithToken(userToken)

    const [accounts, ownedOpportunities, dealTeamOpportunities, relatedAccountOpportunities, partnerEngagements] = await Promise.all([
      getAccountsByUser(pool, userAlias),
      getOwnedOpportunities(pool, userId, userName),
      getDealTeamOpportunities(pool, userName),
      getRelatedAccountOpportunities(pool, userAlias),
      getPartnerEngagements(pool, userId),
    ])

    console.log('[POST /api/fabric/data] Query summary: accounts=', accounts.length, 'owned=', ownedOpportunities.length, 'dealTeam=', dealTeamOpportunities.length, 'relatedAccount=', relatedAccountOpportunities.length, 'partnerEngagements=', partnerEngagements.length)

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
  } finally {
    if (pool) {
      await pool.close().catch(() => undefined)
    }
  }
})

/**
 * Query: Get all accounts related to the user alias.
 * Canonical bridge: MSX_accounts.[MSX Account Number] = SPM_accountassignments.[SPM Account Number].
 */
async function getAccountsByUser(pool, userAlias) {
  try {
    console.log('[getAccountsByUser] Searching with userAlias:', userAlias)

    const query = `
      SELECT DISTINCT
        COALESCE(ma.[ID_account], sa.[ID_account]) AS [ID_account],
        ma.[MSX Account Number],
        ma.[MSX Account],
        aa.[SPM Account],
        ma.[MSX Account Country],
        ma.[MSX Account Owner],
        aa.[SPM Account Assignment User Alias],
        aa.[SPM Account Assignment User Role Summary]
      FROM dbo.SPM_accountassignments aa
      LEFT JOIN dbo.SPM_accounts sa
        ON sa.[ID_account] = aa.[ID_account]
      LEFT JOIN dbo.MSX_accounts ma
        ON ma.[MSX Account Number] = aa.[SPM Account Number]
      WHERE LOWER(LTRIM(RTRIM(aa.[SPM Account Assignment User Alias]))) = @userAlias
      ORDER BY ma.[MSX Account Number], aa.[SPM Account]
    `

    const request = pool.request()
    request.input('userAlias', sql.NVarChar, userAlias.trim().toLowerCase())
    const result = await request.query(query)
    console.log('[getAccountsByUser] Found', result.recordset.length, 'accounts')
    return result.recordset
  } catch (error) {
    console.error('Error in getAccountsByUser:', error)
    throw error
  }
}

/**
 * Query: Get all opportunities owned by the user.
 * Match by Opportunity User Owner using authenticated user name.
 */
async function getOwnedOpportunities(pool, userId, userName) {
  try {
    const nameVariants = getNameVariants(userName)
    const [ownerName = null, ownerName2 = null, ownerName3 = null, ownerName4 = null] = nameVariants

    console.log('[getOwnedOpportunities] Searching with userId:', userId, 'ownerNames:', nameVariants)

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
        OR (@ownerName2 IS NOT NULL AND LOWER(LTRIM(RTRIM(o.[Opportunity User Owner]))) = @ownerName2)
        OR (@ownerName3 IS NOT NULL AND LOWER(LTRIM(RTRIM(o.[Opportunity User Owner]))) = @ownerName3)
        OR (@ownerName4 IS NOT NULL AND LOWER(LTRIM(RTRIM(o.[Opportunity User Owner]))) = @ownerName4)
      ORDER BY o.[Opportunity Est. Close Date] ASC
    `

    const request = pool.request()
    request.input('ownerName', sql.NVarChar, ownerName)
    request.input('ownerName2', sql.NVarChar, ownerName2)
    request.input('ownerName3', sql.NVarChar, ownerName3)
    request.input('ownerName4', sql.NVarChar, ownerName4)
    const result = await request.query(query)
    console.log('[getOwnedOpportunities] Found', result.recordset.length, 'opportunities')
    return result.recordset
  } catch (error) {
    console.error('Error in getOwnedOpportunities:', error)
    throw error
  }
}

/**
 * Query: Get opportunities where user is part of the deal team.
 * Match by Opportunity Deal Team User using authenticated user name.
 */
async function getDealTeamOpportunities(pool, userName) {
  try {
    const nameVariants = getNameVariants(userName)
    const [userName1 = null, userName2 = null, userName3 = null, userName4 = null] = nameVariants
    console.log('[getDealTeamOpportunities] Searching with userNames:', nameVariants)

    const query = `
      SELECT DISTINCT
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
      WHERE (
          LOWER(LTRIM(RTRIM(dt.[Opportunity Deal Team User]))) = @userName1
          OR (@userName2 IS NOT NULL AND LOWER(LTRIM(RTRIM(dt.[Opportunity Deal Team User]))) = @userName2)
          OR (@userName3 IS NOT NULL AND LOWER(LTRIM(RTRIM(dt.[Opportunity Deal Team User]))) = @userName3)
          OR (@userName4 IS NOT NULL AND LOWER(LTRIM(RTRIM(dt.[Opportunity Deal Team User]))) = @userName4)
        )
        AND LOWER(LTRIM(RTRIM(o.[Opportunity User Owner]))) <> @userName1
      ORDER BY o.[Opportunity Est. Close Date] ASC
    `

    const request = pool.request()
    request.input('userName1', sql.NVarChar, userName1)
    request.input('userName2', sql.NVarChar, userName2)
    request.input('userName3', sql.NVarChar, userName3)
    request.input('userName4', sql.NVarChar, userName4)
    const result = await request.query(query)
    console.log('[getDealTeamOpportunities] Found', result.recordset.length, 'opportunities')
    return result.recordset
  } catch (error) {
    console.error('Error in getDealTeamOpportunities:', error)
    throw error
  }
}

/**
 * Query: Get opportunities related to accounts assigned to the user's alias.
 * Uses SPM Account Number to MSX Account Number correlation.
 */
async function getRelatedAccountOpportunities(pool, userAlias) {
  try {
    const normalizedAlias = userAlias.trim().toLowerCase()
    console.log('[getRelatedAccountOpportunities] Searching with userAlias:', normalizedAlias)

    const query = `
      SELECT DISTINCT
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
      FROM dbo.SPM_accountassignments aa
      LEFT JOIN dbo.SPM_accounts sa
        ON sa.[ID_account] = aa.[ID_account]
      LEFT JOIN dbo.MSX_accounts ma
        ON ma.[MSX Account Number] = aa.[SPM Account Number]
      LEFT JOIN dbo.MSX_opportunities o
        ON o.[ID_account] = ma.[ID_account]
      WHERE LOWER(LTRIM(RTRIM(aa.[SPM Account Assignment User Alias]))) = @userAlias
        AND o.[ID_opportunity] IS NOT NULL
      ORDER BY o.[Opportunity Est. Close Date] ASC
    `

    const request = pool.request()
    request.input('userAlias', sql.NVarChar, normalizedAlias)
    const result = await request.query(query)
    console.log('[getRelatedAccountOpportunities] Found', result.recordset.length, 'opportunities')
    return result.recordset
  } catch (error) {
    console.error('Error in getRelatedAccountOpportunities:', error)
    throw error
  }
}

/**
 * Query: Get partner engagements/referrals related to user, accounts, or opportunities
 */
async function getPartnerEngagements(pool, userId) {
  try {
    console.log('[getPartnerEngagements] Searching with userId:', userId)

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
    console.log('[getPartnerEngagements] Found', result.recordset.length, 'partner engagements')
    return result.recordset
  } catch (error) {
    console.error('Error in getPartnerEngagements:', error)
    throw error
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
  process.exit(0)
})
