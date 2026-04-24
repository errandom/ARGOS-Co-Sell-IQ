# ARGOS Co-Sell IQ

ARGOS Co-Sell IQ is a React application that authenticates users with Azure Active Directory and loads co-sell data from Microsoft Fabric SQL through a backend API.

## Authoritative Documentation

Use these files as the single source of truth:

- `FABRIC_SETUP.md`: End-to-end setup (Azure AD, backend API, schema mapping, troubleshooting)
- `QUICK_START.md`: Fast local setup checklist
- `MSX_SCHEMA_REFERENCE.md`: Shared Fabric table and column reference

## Important Notes

- The Fabric tables already exist and are treated as a read-only source.
- The app does not create tables and should not run DDL in Fabric.
- Backend queries should read from the `dbo.MSX_*` tables you shared.

## Local Run

1. Start backend: `node server.js`
2. Start frontend: `npm run dev`
3. Sign in via Azure AD
4. Verify `POST /api/fabric/data` in browser network tools
