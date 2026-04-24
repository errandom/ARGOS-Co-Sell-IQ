# Action Checklist

Use this short list to validate your environment quickly.

## Must Do

1. Configure Azure AD app registration (SPA redirect URI for localhost)
2. Set `.env.local` frontend auth values
3. Set `.env` backend Fabric SQL values
4. Start backend and frontend
5. Sign in and verify `/api/fabric/data`

## Validate Read-Only Query Model

- Ensure queries only read from existing `dbo.MSX_*` tables
- Ensure no setup step attempts to create tables

For complete details, see `FABRIC_SETUP.md`.
