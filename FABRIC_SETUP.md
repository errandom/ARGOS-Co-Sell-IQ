# Fabric + Azure AD Setup Guide

This is the single source of truth for configuring this app.

It covers:
- Azure Active Directory authentication in the frontend
- Backend API configuration for Fabric SQL
- Real MSX schema mapping used by the backend queries
- End-to-end local run and verification steps

## 1. Architecture

Flow:
1. User signs in with Azure AD in the frontend using MSAL.
2. Frontend gets an access token and calls backend API.
3. Backend validates bearer token presence and runs Fabric SQL queries.
4. Backend returns accounts, opportunities, deal team opportunities, related opportunities, and partner engagements.
5. Frontend caches data with React Query.

Core files:
- src/lib/authConfig.ts
- src/main.tsx
- src/App.tsx
- src/lib/fabricService.ts
- src/hooks/useFabricData.ts
- server.js or server-updated.js

## 2. Azure AD App Registration (Not Published Yet)

You can fully configure auth before publishing.

Create app registration in Microsoft Entra admin center:
1. Go to App registrations.
2. Create a new registration.
3. Supported account types:
   - Single tenant for internal-only testing
   - Multitenant for cross-tenant testing
4. Add redirect URI:
   - SPA: http://localhost:5173
5. (Optional) Add post logout redirect URI:
   - http://localhost:5173
6. API permissions:
   - Microsoft Graph User.Read (delegated)
7. If your backend will validate custom API scopes later:
   - Expose an API on backend app registration
   - Add delegated scope like Fabric.Read
   - Add that scope to frontend app registration

Notes for unpublished apps:
- Unpublished status is fine for development.
- User consent behavior depends on tenant policy and who can grant consent.
- You can test with internal users immediately once app registration exists.

## 3. Frontend Environment Variables

Create .env.local in workspace root:

```env
VITE_API_URL=http://localhost:3001/api

VITE_AAD_CLIENT_ID=<frontend-app-client-id>
VITE_AAD_TENANT_ID=organizations
VITE_AAD_REDIRECT_URI=http://localhost:5173
VITE_AAD_POST_LOGOUT_REDIRECT_URI=http://localhost:5173
VITE_AAD_SCOPES=openid,profile,offline_access,User.Read

# Optional. Use when backend API scope is configured.
# Example: api://<backend-app-client-id>/Fabric.Read
VITE_AAD_API_SCOPE=
```

What each variable does:
- VITE_AAD_CLIENT_ID: frontend app registration client ID.
- VITE_AAD_TENANT_ID: tenant GUID, organizations, or common.
- VITE_AAD_SCOPES: scopes requested during login.
- VITE_AAD_API_SCOPE: scope for acquireTokenSilent before calling backend.

## 4. Frontend Auth Integration Details

Implemented behavior:
- App uses MSAL provider in src/main.tsx.
- Sign-in button triggers loginRedirect.
- Sign-out triggers logoutRedirect.
- Authenticated account identity is used as user context.
- Access token is acquired silently and stored as authToken for backend API calls.

Implementation summary:
- src/lib/authConfig.ts defines MSAL config and login request.
- src/main.tsx initializes PublicClientApplication and MsalProvider.
- src/App.tsx:
  - detects authenticated account
  - derives user profile fields
  - acquires token silently
  - triggers Fabric data loading only when authenticated

## 5. Backend Setup (Fabric SQL API)

Install backend dependencies:

```bash
npm install express mssql cors dotenv
```

Create backend .env:

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

Run backend:

```bash
node server.js
```

If you want the MSX-schema query version already prepared in this workspace:

```bash
cp server-updated.js server.js
node server.js
```

## 6. Real Fabric Schema Mapping Used

The implemented query model targets these tables:
- dbo.MSX_accounts
- dbo.MSX_opportunities
- dbo.MSX_opportunitydealteam
- dbo.MSX_partnerreferrals
- dbo.MSX_partneraccounts (available for extension)

Data sets loaded after auth:
1. Accounts related to user
   - from dbo.MSX_accounts using ID_owner or ID_owningteam
2. Opportunities owned by user
   - from dbo.MSX_opportunities using ID_owner
3. Opportunities where user is on deal team
   - join dbo.MSX_opportunitydealteam with dbo.MSX_opportunities
4. Opportunities related to user-linked accounts
   - account-based filter from dbo.MSX_accounts
5. Partner engagements/referrals related to user/account/opportunity
   - from dbo.MSX_partnerreferrals with account and opportunity joins

## 7. End-to-End Startup

Terminal 1 (backend):

```bash
node server.js
```

Terminal 2 (frontend):

```bash
npm run dev
```

Test:
1. Open http://localhost:5173
2. Select sign in with Azure Active Directory
3. Complete login in Microsoft identity prompt
4. Open browser DevTools network tab
5. Verify POST to /api/fabric/data
6. Verify response payload has non-empty arrays if test data exists

## 8. Verification Checklist

Auth:
- Login redirects to Microsoft sign-in
- Returning to app shows authenticated user in nav
- Sign out logs user out and returns to landing page

Fabric:
- Backend health endpoint returns OK
- /api/fabric/data returns 200
- Account auto-selection populates in scan settings

## 9. Troubleshooting

Login fails immediately:
- Check VITE_AAD_CLIENT_ID and VITE_AAD_TENANT_ID
- Confirm SPA redirect URI matches exactly
- Confirm app registration supports intended account type

Token acquisition warning:
- If VITE_AAD_API_SCOPE is empty, app falls back to User.Read
- Add custom API scope once backend app registration exposes it

Backend returns 401:
- Ensure Authorization header is present
- Confirm authToken is set in browser storage

Backend returns empty data:
- Validate user identifier mapping against ID_owner data in Fabric
- Run direct SQL checks against MSX tables for the signed-in user context

## 10. Production Hardening (Next Step)

Recommended before production:
- Validate JWT bearer token in backend middleware
- Enforce issuer, audience, tenant, and signature checks
- Stop relying on token presence only
- Use least-privilege scopes
- Store secrets in secure runtime config, not files
- Add API rate limiting and structured logging

## 11. Commands Reference

Install frontend auth packages:

```bash
npm install @azure/msal-browser @azure/msal-react
```

Build frontend:

```bash
npm run build
```

Run backend:

```bash
node server.js
```
