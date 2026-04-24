# Real Schema Update - Action Checklist

## Overview
Your Fabric SQL integration has been updated to use your actual MSX database schema. Here's what to do next.

---

## ✅ What Was Done

- [x] Updated `src/types.ts` with all actual database columns
- [x] Created `server-updated.js` with real MSX table queries
- [x] Created `server-updated.ts` TypeScript version
- [x] Updated 5 SQL queries to use dbo.MSX_* tables
- [x] Created comprehensive documentation:
  - `MSX_SCHEMA_REFERENCE.md` - Full schema details
  - `SCHEMA_MIGRATION.md` - Migration guide
  - `REAL_SCHEMA_UPDATE.md` - Update summary

---

## 🚀 Quick Start (15 Minutes)

### Step 1: Replace Backend Server (2 min)

```bash
# Option A: Using JavaScript backend
cp server-updated.js server.js
node server.js

# Option B: Using TypeScript backend  
cp server-updated.ts server.ts
npx ts-node server.ts
```

**Expected output**:
```
✓ Connected to Fabric SQL Database
✓ Fabric API Server running on http://localhost:3001
```

### Step 2: Verify Database Connection (2 min)

```bash
# Health check
curl http://localhost:3001/api/health

# Should return (not error):
# {"status":"OK","timestamp":"...","database":"Connected"}
```

### Step 3: Start Frontend (2 min)

```bash
# Terminal 2
npm run dev
```

**Expected output**:
```
VITE v7.2.6  ready in 123 ms
➜  Local:   http://localhost:5173/
```

### Step 4: Test in Browser (5 min)

1. Open http://localhost:5173
2. Click "Sign In" button
3. Open DevTools: **F12 → Network tab**
4. Look for request: `/api/fabric/data`
5. Click it and check Response tab
6. Should see your real accounts, opportunities, partner referrals

✅ **If you see real data** - You're done! Everything works.

---

## 📋 Detailed Setup Checklist

### Prerequisites
- [ ] Node.js 16+ installed
- [ ] Fabric SQL database accessible
- [ ] Database credentials available

### Backend Setup
- [ ] Created/updated `.env` file with:
  - [ ] `FABRIC_DB_SERVER` - Your server hostname
  - [ ] `FABRIC_DB_PORT=1433`
  - [ ] `FABRIC_DB_NAME` - Your database name  
  - [ ] `FABRIC_DB_USER` - Your username
  - [ ] `FABRIC_DB_PASSWORD` - Your password
  - [ ] `PORT=3001`
- [ ] Renamed old `server.js` to `server-old.js`
- [ ] Copied `server-updated.js` to `server.js` (OR `server-updated.ts` to `server.ts`)
- [ ] Installed dependencies: `npm install express mssql cors dotenv`
- [ ] Started backend: `node server.js`
- [ ] Verified health check returns `Connected`

### Frontend Setup  
- [ ] Created `.env.local` with `VITE_API_URL=http://localhost:3001/api`
- [ ] Started frontend: `npm run dev`
- [ ] Opened http://localhost:5173

### Testing
- [ ] Clicked "Sign In" button
- [ ] Opened DevTools Network tab
- [ ] Found `/api/fabric/data` request
- [ ] Verified response contains:
  - [ ] Real accounts with `MSX Account` names
  - [ ] Real opportunities with `Opportunity Title`
  - [ ] Real deal value in `Opportunity Est. Deal Value (USD)`
  - [ ] Real close dates
- [ ] App displays accounts in dropdown

### Documentation
- [ ] Read `MSX_SCHEMA_REFERENCE.md` for field reference
- [ ] Read `SCHEMA_MIGRATION.md` if you need migration details
- [ ] Bookmarked these docs for reference

---

## 🔍 Verify It's Working

### Quick Verification

```bash
# 1. Backend running?
curl http://localhost:3001/api/health

# 2. Frontend running?
curl http://localhost:5173

# 3. Database connected?
# Should see ✓ Connected to Fabric SQL Database in backend logs
```

### Full Test

```bash
# 1. Terminal 1 - Backend
node server.js

# 2. Terminal 2 - Frontend
npm run dev

# 3. Browser - Test
# Open http://localhost:5173
# Click Sign In
# Check DevTools Network tab for /api/fabric/data
# Response should have real data
```

---

## ⚠️ Troubleshooting

### Problem: "Cannot connect to database"

**Solution:**
```bash
# 1. Check .env file exists and has credentials
cat .env

# 2. Verify credentials are correct
# Test in Fabric SQL Editor or with:
sqlcmd -S your_server -U your_user -P your_password -d your_database

# 3. Check firewall allows port 1433
# 4. Restart backend after fixing .env
```

### Problem: "No data returned from API"

**Solution:**
1. **Verify user ID exists:**
   ```sql
   SELECT DISTINCT ID_owner FROM dbo.MSX_accounts LIMIT 10
   ```

2. **Use a real user ID:**
   - Check if user ID from step 1 has data
   - Frontend must use matching user ID

3. **Test query directly:**
   ```sql
   SELECT COUNT(*) FROM dbo.MSX_accounts 
   WHERE ID_owner = 'your-user-id'
   ```

### Problem: "API returns 401 Unauthorized"

**Solution:**
- Backend auth middleware might be blocking
- Add Bearer token to requests
- For testing, token can be anything (example: `Bearer test-token`)

### Problem: "Timeout or slow responses"

**Solution:**
- Reduce TOP clause: `SELECT TOP 500` instead of `SELECT TOP 1000`
- Add database index: `CREATE INDEX IX_owner ON dbo.MSX_accounts(ID_owner)`
- Filter results: Add WHERE clause to reduce data

---

## 📚 Key Documentation

| Document | Read If... |
|---|---|
| **REAL_SCHEMA_UPDATE.md** | You want to understand what changed |
| **MSX_SCHEMA_REFERENCE.md** | You need field names and data types |
| **SCHEMA_MIGRATION.md** | You want detailed migration steps |
| **QUICK_START.md** | You want quick reference guide |
| **FABRIC_SETUP.md** | You need comprehensive setup docs |

---

## 🎯 What Each File Does

### Backend
- **server-updated.js** - Express server, Node.js, uses real MSX queries
- **server-updated.ts** - Same as above but TypeScript/ts-node

### Frontend
- **src/types.ts** - Updated with real column names
- **src/App.tsx** - Uses updated types, no changes needed
- **src/lib/fabricService.ts** - API client, works with new types
- **src/hooks/useFabricData.ts** - React Query hook, unchanged

### SQL Queries
Each executes in parallel on sign-in:
1. `getAccountsByUser()` - User's accounts from `dbo.MSX_accounts`
2. `getOwnedOpportunities()` - Opportunities from `dbo.MSX_opportunities`
3. `getDealTeamOpportunities()` - Opportunities from `dbo.MSX_opportunitydealteam`
4. `getRelatedAccountOpportunities()` - Related opportunities
5. `getPartnerEngagements()` - Referrals from `dbo.MSX_partnerreferrals`

---

## 💡 Key Differences

| What | Template | Your Real Schema | Where |
|---|---|---|---|
| Account Name | `accountName` | `[MSX Account]` | MSX_accounts |
| Opportunity | `opportunityName` | `[Opportunity Title]` | MSX_opportunities |
| Deal Value | `dealValue` | `[Opportunity Est. Deal Value (USD)]` | MSX_opportunities |
| Owner | `ownerId` | `ID_owner` | All tables |
| Account Table | `[Accounts]` | `[dbo].[MSX_accounts]` | Database |
| Opp Table | `[Opportunities]` | `[dbo].[MSX_opportunities]` | Database |

---

## 📊 API Response Structure

When you sign in, you get:

```json
{
  "accounts": [
    {
      "ID_account": "...",
      "MSX Account": "Account Name",
      "MSX Account Number": "ACC-001",
      ...
    }
  ],
  "opportunities": [
    {
      "ID_opportunity": "...",
      "Opportunity Title": "Opp Name",
      "Opportunity Est. Deal Value (USD)": 1000000,
      ...
    }
  ],
  "dealTeamOpportunities": [...],
  "relatedAccountOpportunities": [...],
  "partnerEngagements": [...],
  "isLoading": false,
  "error": null
}
```

---

## ✨ Success Checklist

You're successful when:

- [x] Backend starts without DB connection errors
- [x] `/api/health` returns `"database":"Connected"`
- [x] Frontend loads at http://localhost:5173
- [x] Clicking "Sign In" loads without errors
- [x] DevTools shows `/api/fabric/data` API request
- [x] API response contains real account names from your database
- [x] API response contains real opportunity titles from your database
- [x] API response shows real deal values in USD
- [x] App doesn't show "Error loading Fabric data"

---

## 🚀 Next Steps

1. **Short Term**:
   - [ ] Use new `server-updated.js` file
   - [ ] Verify connection works
   - [ ] Test data loads
   - [ ] Delete old `server.js` backup

2. **Medium Term**:
   - [ ] Read schema reference docs
   - [ ] Customize components to use your data
   - [ ] Add any additional queries needed
   - [ ] Optimize slow queries with indexes

3. **Production**:
   - [ ] Deploy backend to production server
   - [ ] Update VITE_API_URL to production API
   - [ ] Set up monitoring/logging
   - [ ] Enable HTTPS/TLS
   - [ ] Test with production database

---

## 📞 If You Get Stuck

1. **Check the docs first:**
   - MSX_SCHEMA_REFERENCE.md - for field names
   - SCHEMA_MIGRATION.md - for detailed steps
   - REAL_SCHEMA_UPDATE.md - for overview

2. **Test database directly:**
   - Open Fabric SQL Editor
   - Query your tables directly
   - Compare with queries in server-updated.js

3. **Check logs:**
   - Backend console - for errors
   - DevTools Network - for API responses
   - Browser console - for frontend errors

4. **Verify credentials:**
   - `.env` file has correct values
   - User ID used matches database
   - Database connection works

---

## 🎉 Summary

✅ **Files Created/Updated**:
- server-updated.js (use this!)
- server-updated.ts (or this if TypeScript)
- src/types.ts (updated)
- MSX_SCHEMA_REFERENCE.md
- SCHEMA_MIGRATION.md
- REAL_SCHEMA_UPDATE.md

✅ **What to Do**:
1. Copy server-updated.js → server.js
2. Start backend
3. Test in browser by signing in
4. Verify `/api/fabric/data` returns real data

✅ **Result**:
- App loads your actual MSX data on sign-in
- Displays in components automatically
- Ready for production when you are

**Status**: Ready to use! Just replace the backend server and test. 🚀
