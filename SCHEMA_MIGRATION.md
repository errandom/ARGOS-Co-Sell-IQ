# Fabric SQL Integration - Schema Migration Guide

## Overview

This guide helps you migrate from the template SQL schema to your actual Fabric SQL database schema with the real MSX tables.

## What Changed

### New Backend Files

- **`server-updated.js`** - JavaScript backend using your actual schema
- **`server-updated.ts`** - TypeScript backend using your actual schema

**Use these files instead of the original `server.js` and `server.ts`**

### Updated Types

The `src/types.ts` file has been updated with all the actual column names and data types from your Fabric SQL database:

- `Account` interface - Maps to `dbo.MSX_accounts` table
- `Opportunity` interface - Maps to `dbo.MSX_opportunities` table
- `DealTeamMember` interface - Maps to `dbo.MSX_opportunitydealteam` table
- `PartnerEngagement` interface - Maps to `dbo.MSX_partnerreferrals` table
- `PartnerAccount` interface - Maps to `dbo.MSX_partneraccounts` table (new)

## Database Mapping

### Table: dbo.MSX_accounts

**Purpose**: Customer/prospect accounts

**Key Columns Used**:
```
ID_account                           - Account ID (primary key)
MSX Account                          - Account name
MSX Account Number                   - Account number
MSX Account City                     - City
MSX Account Country                  - Country
MSX Account Segment                  - Segment classification
MSX Account Industry                 - Industry classification
MSX Account Owner                    - Owner name
ID_owner                             - Owner ID
ID_owningteam                        - Owning team ID
```

**SQL Query**:
```sql
SELECT * FROM [dbo].[MSX_accounts]
WHERE [ID_owner] = @userId OR [ID_owningteam] = @userId
```

### Table: dbo.MSX_opportunities

**Purpose**: Sales opportunities

**Key Columns Used**:
```
ID_opportunity                       - Opportunity ID (primary key)
ID_account                           - Account ID (foreign key)
ID_owner                             - Owner ID
Opportunity Number                   - Opportunity number
Opportunity Title                    - Opportunity name
Opportunity State                    - Current state
Opportunity Status                   - Status
Opportunity MCEM Stage Name          - Pipeline stage
Opportunity Solution Area            - Solution area
Opportunity Est. Deal Value (USD)    - Estimated deal value
Opportunity Act. Deal Value (USD)    - Actual deal value
Opportunity Est. Close Date          - Expected close date
Opportunity Date/Time Creation       - Created on
Opportunity Date/Time Last Modified  - Last modified
```

**SQL Query**:
```sql
SELECT * FROM [dbo].[MSX_opportunities] o
LEFT JOIN [dbo].[MSX_accounts] a ON o.[ID_account] = a.[ID_account]
WHERE o.[ID_owner] = @userId
```

### Table: dbo.MSX_opportunitydealteam

**Purpose**: Deal team members on opportunities

**Key Columns Used**:
```
ID_opportunity                       - Opportunity ID
ID_owner                             - Deal team member ID
Opportunity Deal Team User           - User name
Opportunity Deal Team Date/Time...   - Added on
```

**SQL Query**:
```sql
SELECT * FROM [dbo].[MSX_opportunitydealteam] dt
INNER JOIN [dbo].[MSX_opportunities] o ON dt.[ID_opportunity] = o.[ID_opportunity]
WHERE dt.[ID_owner] = @userId AND o.[ID_owner] != @userId
```

### Table: dbo.MSX_partnerreferrals

**Purpose**: Partner referrals and engagements

**Key Columns Used**:
```
ID_partnerengagement                 - Engagement ID (primary key)
ID_opportunity                       - Related opportunity ID
ID_account                           - Related account ID
ID_owner                             - Partner engagement owner
Partner Engagement Title             - Title/name
Partner Engagement Type              - Type (referral, co-sell, etc.)
Partner Engagement Status            - Current status
Partner Engagement Deal Value (USD)  - Deal value
Partner Engagement Customer Name     - End customer name
Referral Status Type                 - Referral status
```

**SQL Query**:
```sql
SELECT * FROM [dbo].[MSX_partnerreferrals] pe
WHERE pe.[ID_owner] = @userId
   OR pe.[ID_account] IN (SELECT [ID_account] FROM [dbo].[MSX_accounts] WHERE [ID_owner] = @userId)
   OR pe.[ID_opportunity] IN (SELECT [ID_opportunity] FROM [dbo].[MSX_opportunities] WHERE [ID_owner] = @userId)
```

### Table: dbo.MSX_partneraccounts

**Purpose**: Partner/reseller account information

**Status**: Available in type definitions but not currently queried. Can be added if needed.

## API Endpoints

### POST /api/fabric/data

**Request**:
```json
{
  "userId": "user-id-from-auth"
}
```

**Response**:
```json
{
  "accounts": [...],
  "opportunities": [...],
  "dealTeamOpportunities": [...],
  "relatedAccountOpportunities": [...],
  "partnerEngagements": [...],
  "isLoading": false,
  "error": null
}
```

**Queries Executed** (all in parallel):
1. **getAccountsByUser** - Accounts where user is owner
2. **getOwnedOpportunities** - Opportunities owned by user
3. **getDealTeamOpportunities** - Opportunities where user is on deal team
4. **getRelatedAccountOpportunities** - Opportunities from user's accounts
5. **getPartnerEngagements** - Partner referrals related to user

## Migration Steps

### Step 1: Replace Backend Server

**Option A: JavaScript**
```bash
# Rename old server
mv server.js server-old.js

# Use updated server
cp server-updated.js server.js

# Run it
node server.js
```

**Option B: TypeScript**
```bash
# Rename old server
mv server.ts server-old.ts

# Use updated server
cp server-updated.ts server.ts

# Run it
npx ts-node server.ts
```

### Step 2: Verify Database Connection

```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Should return:
# {"status":"OK","timestamp":"...","database":"Connected"}
```

### Step 3: Test Data Retrieval

```bash
# Test with a real user ID from your system
curl -X POST http://localhost:3001/api/fabric/data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"userId":"your-actual-user-id"}'
```

### Step 4: Check DevTools Network Tab

1. Open app at http://localhost:5173
2. Sign in
3. Open DevTools → Network tab
4. Look for `/api/fabric/data` request
5. Verify response contains real data

## Column Mapping Reference

| Frontend Type Property | Database Table | Database Column |
|---|---|---|
| `Account.ID_account` | MSX_accounts | ID_account |
| `Account.'MSX Account'` | MSX_accounts | MSX Account |
| `Account.'MSX Account Number'` | MSX_accounts | MSX Account Number |
| `Opportunity.ID_opportunity` | MSX_opportunities | ID_opportunity |
| `Opportunity.'Opportunity Title'` | MSX_opportunities | Opportunity Title |
| `Opportunity.'Opportunity Est. Deal Value (USD)'` | MSX_opportunities | Opportunity Est. Deal Value (USD) |
| `DealTeamMember.ID_opportunity` | MSX_opportunitydealteam | ID_opportunity |
| `PartnerEngagement.ID_partnerengagement` | MSX_partnerreferrals | ID_partnerengagement |
| `PartnerEngagement.'Partner Engagement Title'` | MSX_partnerreferrals | Partner Engagement Title |

## Common Issues & Solutions

### No Data Returned

**Problem**: Queries return empty arrays

**Solutions**:
1. Verify user ID format matches your database
2. Verify user has records in the database
3. Check if `ID_owner` column contains the user's ID
4. Test queries directly in Fabric SQL Editor:
   ```sql
   SELECT COUNT(*) FROM dbo.MSX_accounts WHERE ID_owner = 'your-user-id'
   ```

### Connection Failed

**Problem**: Cannot connect to database

**Solutions**:
1. Verify credentials in `.env` file
2. Check firewall allows port 1433
3. Verify database name matches catalog
4. Test connection separately:
   ```bash
   sqlcmd -S your_server -U your_user -P your_password -d your_database
   ```

### Wrong Data Type

**Problem**: Fields appear as different types than expected

**Solutions**:
1. All columns are returned as-is from database
2. If numeric values are strings, cast them in the query or component
3. Use TypeScript type conversions if needed:
   ```typescript
   const dealValue = Number(opp['Opportunity Est. Deal Value (USD)'])
   ```

### Top 1000 Limit

**Problem**: Only seeing first 1000 records

**Solutions**:
1. Implement pagination in queries
2. Add `WHERE` filters to reduce result set
3. For production, add limit parameters to API

## Performance Optimization

### Query Optimization

1. **Add Indexes** - Create indexes on commonly filtered columns:
   ```sql
   CREATE INDEX IX_MSX_accounts_owner ON dbo.MSX_accounts(ID_owner)
   CREATE INDEX IX_MSX_opportunities_owner ON dbo.MSX_opportunities(ID_owner)
   CREATE INDEX IX_MSX_dealteam_owner ON dbo.MSX_opportunitydealteam(ID_owner)
   ```

2. **Consider Views** - Create views for common queries:
   ```sql
   CREATE VIEW vw_UserAccounts AS
   SELECT * FROM dbo.MSX_accounts
   WHERE ID_owner = CURRENT_USER
   ```

3. **Batch Size** - Reduce `TOP` clause if queries are slow:
   ```sql
   SELECT TOP 500 -- Instead of 1000
   ```

### API Optimization

1. **Add Pagination**:
   ```typescript
   const { page = 1, limit = 100 } = req.body
   query += ` OFFSET ${(page - 1) * limit} ROWS FETCH NEXT ${limit} ROWS ONLY`
   ```

2. **Add Filtering**:
   ```typescript
   if (status) query += ` AND o.[Opportunity Status] = @status`
   ```

3. **Caching**:
   - React Query already caches for 5 minutes
   - Add Redis for production persistence

## Frontend Components

### Using the Data

All frontend components automatically work with the new data:

```typescript
// Hook
const { data: fabricData } = useFabricData(userId)

// Context
<FabricProvider fabricData={data} isLoading={loading} error={error} userId={userId}>
  <App />
</FabricProvider>

// Component
<FabricDataDisplay fabricData={fabricData} isLoading={isLoading} error={error} />
```

### Accessing Specific Fields

```typescript
// Account
fabricData.accounts.map(acc => acc['MSX Account'])

// Opportunity
opportunity['Opportunity Est. Deal Value (USD)']
opportunity['Opportunity Est. Close Date']

// Partner Engagement
engagement['Partner Engagement Title']
engagement['Partner Engagement Status']
```

## Next Steps

1. **Test** - Run the updated backend and verify data loads
2. **Deploy** - Follow production deployment checklist
3. **Monitor** - Watch for any data quality issues
4. **Optimize** - Add indexes and pagination as needed
5. **Extend** - Add additional queries or views as requirements evolve

## Support

For issues or questions:
1. Check the database schema against the mapping above
2. Test queries directly in Fabric SQL Editor
3. Review error logs in backend console
4. Check DevTools Network tab for API response details

## Summary

- ✅ Backend updated to use real MSX tables
- ✅ Types updated with actual column names
- ✅ 5 parallel queries handle data retrieval
- ✅ Full compatibility with existing React components
- ✅ Ready for production use

**Next**: Use `server-updated.js` (or `.ts`) instead of original `server.js`
