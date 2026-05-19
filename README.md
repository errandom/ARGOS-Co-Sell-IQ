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

## Delegated User Access (Interactive)

Use this mode when Graph delegated permissions work but service-principal approval is blocked.

Backend environment:

- Set `FABRIC_AUTH_MODE=delegated` to require a user bearer token for Fabric SQL.
- Leave workspace identity secrets unset if you want strict delegated-only behavior.

Frontend environment:

- Keep Graph scopes in `VITE_AAD_SCOPES` (User.Read, Mail.Read, Chat.Read, Calendars.Read).
- Set `VITE_FABRIC_SQL_SCOPE=https://database.windows.net/user_impersonation`.
- Keep `VITE_INCLUDE_FABRIC_SQL_SCOPE_IN_LOGIN=false` (default) so initial sign-in is Graph-only.

User experience:

1. User lands on the site and signs in.
2. Initial login requests Graph scopes only.
3. When Fabric data loads, app requests SQL delegated scope with a popup if needed.
4. Backend uses the user token for Fabric SQL and does not fall back to service-principal auth in delegated mode.
