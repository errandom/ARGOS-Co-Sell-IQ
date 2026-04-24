# Fabric SQL Database Integration Setup Guide

## Overview

This setup enables your Spark application to automatically load data from Microsoft Fabric SQL upon successful user authentication. The data includes:

- **Accounts** - All accounts related to the user
- **Opportunities Owned** - All opportunities owned by the user
- **Deal Team Opportunities** - Opportunities where user is part of the deal team
- **Related Account Opportunities** - Opportunities related to accounts the user is connected to
- **Partner Engagements** - Partner referrals and engagements related to user, accounts, or opportunities

## Architecture

The integration uses a **secure backend-frontend architecture**:

```
Frontend (React/TypeScript)
    ↓ (HTTPS API calls)
Backend Service (Node.js/Express)
    ↓ (Secure DB connection)
Fabric SQL Database
    ↓ (Returns data)
Backend ↓ (Filters/authorizes)
Frontend ↓ (Caches with React Query)
```

## Prerequisites

- Node.js 16+ installed
- Azure AD authentication configured
- Access to Fabric SQL Database
- Database credentials

## Backend Setup

### Step 1: Install Backend Dependencies

```bash
npm install express mssql cors dotenv
```

### Step 2: Create Environment File

Create `.env` in the root directory with your Fabric SQL credentials:

```env
# Fabric SQL Database Configuration
FABRIC_DB_SERVER=x6eps4xrq2xudenlfv6naeo3i4-ywxvf76w3u4e5gpdqvtoz57rsa.msit-database.fabric.microsoft.com
FABRIC_DB_PORT=1433
FABRIC_DB_NAME=ARGOS SQL-87da6cf7-5c29-48f5-9b97-b2a3245da352
FABRIC_DB_USER=your_username
FABRIC_DB_PASSWORD=your_password

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Step 3: Create Database

The backend expects the following database schema. Create these tables in your Fabric database:

#### Core Tables

```sql
-- Users table
CREATE TABLE [Users] (
    [UserId] NVARCHAR(MAX) PRIMARY KEY,
    [UserName] NVARCHAR(MAX),
    [Email] NVARCHAR(MAX),
    [CreatedDate] DATETIME DEFAULT GETDATE()
)

-- Accounts table
CREATE TABLE [Accounts] (
    [AccountId] NVARCHAR(MAX) PRIMARY KEY,
    [AccountName] NVARCHAR(MAX),
    [AccountReference] NVARCHAR(MAX),
    [Industry] NVARCHAR(MAX),
    [Revenue] DECIMAL(18,2),
    [EmployeeCount] INT,
    [Location] NVARCHAR(MAX),
    [Website] NVARCHAR(MAX),
    [CreatedDate] DATETIME DEFAULT GETDATE(),
    [LastModifiedDate] DATETIME DEFAULT GETDATE()
)

-- User-Account relationships
CREATE TABLE [UserAccounts] (
    [UserAccountId] NVARCHAR(MAX) PRIMARY KEY,
    [UserId] NVARCHAR(MAX) FOREIGN KEY REFERENCES [Users]([UserId]),
    [AccountId] NVARCHAR(MAX) FOREIGN KEY REFERENCES [Accounts]([AccountId]),
    [Role] NVARCHAR(MAX),
    [CreatedDate] DATETIME DEFAULT GETDATE(),
    INDEX IX_UserAccount (UserId, AccountId)
)

-- Opportunities table
CREATE TABLE [Opportunities] (
    [OpportunityId] NVARCHAR(MAX) PRIMARY KEY,
    [OpportunityName] NVARCHAR(MAX),
    [AccountId] NVARCHAR(MAX) FOREIGN KEY REFERENCES [Accounts]([AccountId]),
    [OwnerId] NVARCHAR(MAX) FOREIGN KEY REFERENCES [Users]([UserId]),
    [DealValue] DECIMAL(18,2),
    [ForecastCategory] NVARCHAR(MAX),
    [Stage] NVARCHAR(MAX),
    [CloseDate] DATETIME,
    [Description] NVARCHAR(MAX),
    [CreatedDate] DATETIME DEFAULT GETDATE(),
    [LastModifiedDate] DATETIME DEFAULT GETDATE(),
    INDEX IX_Owner (OwnerId),
    INDEX IX_Account (AccountId)
)

-- Deal Team members
CREATE TABLE [DealTeam] (
    [DealTeamId] NVARCHAR(MAX) PRIMARY KEY,
    [OpportunityId] NVARCHAR(MAX) FOREIGN KEY REFERENCES [Opportunities]([OpportunityId]),
    [UserId] NVARCHAR(MAX) FOREIGN KEY REFERENCES [Users]([UserId]),
    [Role] NVARCHAR(MAX),
    [JoinedDate] DATETIME DEFAULT GETDATE(),
    INDEX IX_UserOpportunity (UserId, OpportunityId)
)

-- Partner Engagements
CREATE TABLE [PartnerEngagements] (
    [EngagementId] NVARCHAR(MAX) PRIMARY KEY,
    [EngagementName] NVARCHAR(MAX),
    [EngagementType] NVARCHAR(MAX), -- 'referral', 'co-sell', 'partnership', 'other'
    [RelatedAccountId] NVARCHAR(MAX) FOREIGN KEY REFERENCES [Accounts]([AccountId]),
    [RelatedOpportunityId] NVARCHAR(MAX) FOREIGN KEY REFERENCES [Opportunities]([OpportunityId]),
    [RelatedUserId] NVARCHAR(MAX) FOREIGN KEY REFERENCES [Users]([UserId]),
    [Status] NVARCHAR(MAX),
    [CreatedDate] DATETIME DEFAULT GETDATE(),
    [LastModifiedDate] DATETIME DEFAULT GETDATE(),
    INDEX IX_Related (RelatedUserId, RelatedAccountId, RelatedOpportunityId)
)
```

### Step 4: Run the Backend Server

```bash
node server.js
```

You should see: `Fabric API Server running on http://localhost:3001`

## Frontend Setup

### Step 1: Configure Environment Variable

Create `.env.local` in the frontend root with:

```env
VITE_API_URL=http://localhost:3001/api
```

For production:

```env
VITE_API_URL=https://your-backend-api.com/api
```

### Step 2: How It Works

When a user signs in:

1. **Frontend detects authentication** → `handleSignIn()` is called
2. **User ID is set** → Triggers `useFabricData` hook
3. **React Query fetches data** → Calls `/api/fabric/data` endpoint
4. **Backend queries database** → Executes all SQL queries
5. **Data is cached** → React Query stores data for 5 minutes
6. **Auto-population** → Selected accounts are auto-filled from retrieved data

### Step 3: Using Fabric Data in Components

Access Fabric data anywhere using the hook:

```typescript
import { useFabricData } from '@/hooks/useFabricData'

function MyComponent() {
  const { data: fabricData, isLoading, error } = useFabricData(userId)

  if (isLoading) return <div>Loading accounts...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h2>Your Accounts ({fabricData.accounts.length})</h2>
      {fabricData.accounts.map((account) => (
        <div key={account.accountId}>{account.accountName}</div>
      ))}

      <h2>Your Opportunities ({fabricData.opportunities.length})</h2>
      {fabricData.opportunities.map((opp) => (
        <div key={opp.opportunityId}>
          {opp.opportunityName} - ${opp.dealValue}
        </div>
      ))}
    </div>
  )
}
```

## Data Fetching Details

### Query 1: User Accounts

**Retrieves:** All accounts the user is related to

```sql
WHERE user_accounts.user_id = @userId
ORDER BY last_modified_date DESC
```

### Query 2: Owned Opportunities

**Retrieves:** All opportunities where user is the owner

```sql
WHERE opportunities.owner_id = @userId
ORDER BY close_date ASC
```

### Query 3: Deal Team Opportunities

**Retrieves:** Opportunities where user is part of the deal team (but not owner)

```sql
WHERE deal_team.user_id = @userId
AND opportunities.owner_id != @userId
ORDER BY close_date ASC
```

### Query 4: Related Account Opportunities

**Retrieves:** Opportunities from accounts the user owns that they don't own or are on deal team for

```sql
WHERE account_id IN (SELECT account_id FROM user_accounts WHERE user_id = @userId)
AND owner_id != @userId
AND opportunity_id NOT IN (SELECT opportunity_id FROM deal_team WHERE user_id = @userId)
ORDER BY close_date ASC
```

### Query 5: Partner Engagements

**Retrieves:** All partner referrals/engagements related to user, their accounts, or their opportunities

```sql
WHERE related_user_id = @userId
OR related_account_id IN (SELECT account_id FROM user_accounts WHERE user_id = @userId)
OR related_opportunity_id IN (
  SELECT opportunity_id FROM opportunities WHERE owner_id = @userId
  UNION
  SELECT opportunity_id FROM deal_team WHERE user_id = @userId
)
ORDER BY last_modified_date DESC
```

## Authentication & Security

### Adding Authentication Middleware

Update the backend's `authenticate` middleware in `server.js`:

```typescript
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const token = authHeader.substring(7)

  try {
    // Verify JWT token with your auth provider
    const decoded = await verifyToken(token) // Implement your verification
    req.userId = decoded.sub // User ID from token
    next()
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' })
  }
}
```

### Environment Variable Best Practices

- **Never commit `.env` files** to version control
- **Use environment secrets** in CI/CD pipelines
- **Rotate credentials** regularly
- **Use AD Interactive authentication** - credentials are not stored
- **Restrict database permissions** to read-only queries

## Troubleshooting

### Backend Connection Issues

**Error:** `Failed to connect to Fabric SQL Database`

1. Check connection string in `.env`
2. Verify firewall allows `1433` port
3. Confirm username/password are correct
4. Test connection using Azure Data Studio

### Frontend Loading Issues

**Error:** `Failed to fetch Fabric data`

1. Verify backend is running: `curl http://localhost:3001/api/health`
2. Check `VITE_API_URL` in `.env.local`
3. Verify auth token is being sent
4. Check browser console for CORS errors

### Empty Data Results

1. Verify tables are populated with test data
2. Check user ID is correct
3. Verify SQL queries return results in SQL Server Management Studio
4. Enable debug logging in backend

## Testing

### Test Backend Connectivity

```bash
curl -X POST http://localhost:3001/api/fabric/data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"userId":"user-123"}'
```

### Test Frontend Integration

1. Open browser DevTools → Network tab
2. Sign in to the app
3. Watch for `/api/fabric/data` request
4. Verify response contains accounts and opportunities

## Performance Optimization

The integration includes several optimizations:

- **React Query caching** - Data cached for 5 minutes by default
- **Parallel queries** - All 5 queries run simultaneously
- **Single endpoint** - Batch API call vs. multiple requests
- **Automatic retry** - Failed requests retry up to 3 times
- **Background refetch** - Data updates automatically when stale

To adjust caching:

```typescript
// In useFabricData.ts
staleTime: 5 * 60 * 1000, // Change this value (ms)
gcTime: 10 * 60 * 1000,   // Change this value (ms)
```

## Production Deployment

### Backend Deployment

1. Set environment variables on your hosting platform (Azure App Service, AWS, etc.)
2. Use production database credentials
3. Enable SSL/TLS (HTTPS)
4. Set `NODE_ENV=production`
5. Use connection pooling for multiple requests

### Frontend Deployment

1. Update `VITE_API_URL` to production backend URL
2. Build: `npm run build`
3. Deploy to static hosting (Azure Static Web Apps, Vercel, etc.)

## Support & Next Steps

- Review [React Query documentation](https://tanstack.com/query/latest)
- Check [MSSQL Node.js driver docs](https://github.com/mapbox/node-pre-gyp)
- Explore additional data needed for your use case
- Consider adding [real-time updates](https://learn.microsoft.com/en-us/sql/relational-databases/system-dynamic-management-views/system-dynamic-management-views)
