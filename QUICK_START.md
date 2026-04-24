# Quick Start

## Goal

Run the app locally with Azure AD sign-in and query existing Fabric MSX tables (read-only).

## 1. Frontend Environment

Create `.env.local`:

```env
VITE_API_URL=http://localhost:3001/api
VITE_AAD_CLIENT_ID=<frontend-app-client-id>
VITE_AAD_TENANT_ID=organizations
VITE_AAD_REDIRECT_URI=http://localhost:5173
VITE_AAD_POST_LOGOUT_REDIRECT_URI=http://localhost:5173
VITE_AAD_SCOPES=openid,profile,offline_access,User.Read
VITE_AAD_API_SCOPE=
```

## 2. Backend Environment

Create `.env`:

```env
FABRIC_DB_SERVER=x6eps4xrq2xudenlfv6naeo3i4-ywxvf76w3u4e5gpdqvtoz57rsa.msit-database.fabric.microsoft.com
FABRIC_DB_PORT=1433
FABRIC_DB_NAME=ARGOS SQL-87da6cf7-5c29-48f5-9b97-b2a3245da352
FABRIC_DB_USER=<username>
FABRIC_DB_PASSWORD=<password>
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

## 3. Install and Run

```bash
npm install
node server.js
npm run dev
```

## 4. Verify

1. Open `http://localhost:5173`
2. Click sign-in and complete Azure AD authentication
3. Confirm `POST /api/fabric/data` succeeds
4. Confirm response includes data from `dbo.MSX_accounts`, `dbo.MSX_opportunities`, `dbo.MSX_opportunitydealteam`, and `dbo.MSX_partnerreferrals`

## Notes

- Fabric is used as an existing source system.
- Do not create or modify Fabric tables from this app.
