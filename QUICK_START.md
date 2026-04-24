# Fabric SQL Integration - Quick Start Guide

## 5-Minute Setup

### 1. **Backend Setup** (Terminal 1)

```bash
# Copy the dependenciesbackend setup
cp server.js ../server.js 2>/dev/null || true
cp server.env.example ../server.env.example 2>/dev/null || true

# Create .env for backend with your Fabric credentials
cat > .env << EOF
FABRIC_DB_SERVER=x6eps4xrq2xudenlfv6naeo3i4-ywxvf76w3u4e5gpdqvtoz57rsa.msit-database.fabric.microsoft.com
FABRIC_DB_PORT=1433
FABRIC_DB_NAME=ARGOS SQL-87da6cf7-5c29-48f5-9b97-b2a3245da352
FABRIC_DB_USER=your_username
FABRIC_DB_PASSWORD=your_password
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
EOF

# Install backend dependencies
npm install express mssql cors dotenv

# Run the backend server
node server.js
```

### 2. **Frontend Setup** (Terminal 2)

```bash
# Install frontend dependencies (if not already done)
npm install

# Create .env.local with API endpoint
cat > .env.local << EOF
VITE_API_URL=http://localhost:3001/api
EOF

# Start the frontend dev server
npm run dev
```

### 3. **Test the Integration**

1. Open browser to `http://localhost:5173`
2. Click "Sign In"
3. Check Network tab in DevTools for `/api/fabric/data` request
4. Should see accounts and opportunities loaded automatically

## What Gets Loaded

On successful authentication, the app loads:

```
✓ Accounts
  - All accounts related to the user
  
✓ Opportunities
  - Owned by the user
  - User is on deal team
  - Related to user's accounts
  
✓ Partner Engagements
  - All referrals/co-sell opportunities related to user/accounts/opportunities
```

## File Structure

```
spark-template/
├── src/
│   ├── lib/
│   │   └── fabricService.ts      ← API calls to backend
│   ├── hooks/
│   │   └── useFabricData.ts       ← React Query hook
│   ├── types.ts                   ← Updated with Fabric types
│   └── App.tsx                    ← Integrated with hook
├── server.js                      ← Backend API server
├── .env.local                     ← Frontend config (create this)
├── .env                           ← Backend config (create this)
└── FABRIC_SETUP.md               ← Detailed setup guide
```

## Key Components

### Frontend (`src/lib/fabricService.ts`)
- API client functions
- Calls backend service
- Error handling

### Frontend (`src/hooks/useFabricData.ts`)
- React Query integration
- Auto-retry logic
- 5-minute caching

### Backend (`server.js`)
- Express API server
- Executes SQL queries
- Returns filtered data

### Authentication Integration
- Hooks into `handleSignIn()` in App.tsx
- Auto-fetches data when user authenticates
- Clears data on sign out

## Troubleshooting

### Backend won't connect

```bash
# Check if port 3001 is available
lsof -i :3001

# Test database connection directly
sqlcmd -S "x6eps4xrq2xudenlfv6naeo3i4-ywxvf76w3u4e5gpdqvtoz57rsa.msit-database.fabric.microsoft.com,1433" -U "your_username" -P "your_password" -d "ARGOS SQL-87da6cf7-5c29-48f5-9b97-b2a3245da352"
```

### Frontend not calling API

1. Check `.env.local` has `VITE_API_URL` set correctly
2. Open DevTools → Network tab
3. Reload page and look for `/api/fabric/data` request
4. Check browser console for errors

### No data returned

1. Verify database tables are populated
2. Check user ID is being passed correctly
3. Test SQL queries directly in Fabric SQL Editor

## Next Steps

- Review [FABRIC_SETUP.md](FABRIC_SETUP.md) for detailed documentation
- Add [authentication middleware](FABRIC_SETUP.md#authentication--security) to backend
- [Deploy backend](FABRIC_SETUP.md#production-deployment) to production
- [Configure real-time updates](https://learn.microsoft.com/en-us/sql/relational-databases/change-tracking/about-change-tracking-sql-server) for live data

## Support Resources

- **React Query**: https://tanstack.com/query/latest
- **MSSQL Driver**: https://github.com/tediousjs/node-mssql
- **Fabric SQL Docs**: https://learn.microsoft.com/en-us/fabric/data-warehouse/sql-query-editor
- **Azure AD Auth**: https://learn.microsoft.com/en-us/entra/identity-platform/

## Architecture Diagram

```
        ┌─────────────────────┐
        │   React Frontend    │
        │  (Spark App)        │
        │                     │
        │ useFabricData hook  │
        │ React Query caching │
        └──────────┬──────────┘
                   │
              HTTPS API
              (Bearer token)
                   │
        ┌──────────▼──────────┐
        │  Express Backend    │
        │  (Port 3001)        │
        │                     │
        │ Auth middleware     │
        │ Error handling      │
        └──────────┬──────────┘
                   │
            SQL Queries
          (5 parallel)
                   │
        ┌──────────▼──────────┐
        │  Fabric SQL DB      │
        │                     │
        │ Accounts table      │
        │ Opportunities table │
        │ DealTeam table      │
        │ PartnerEngagements  │
        └─────────────────────┘
```

## Performance Tips

1. **Caching** - Data cached for 5 minutes, adjust in `useFabricData.ts`
2. **Batch queries** - All 5 queries run in parallel
3. **Lazy loading** - Only fetches when user is authenticated
4. **Auto-retry** - Fails gracefully, retries up to 3 times
