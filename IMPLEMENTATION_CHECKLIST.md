# Implementation Checklist

This checklist is aligned with the current implementation and schema.

## Authentication

- [x] Azure AD auth configured with MSAL in frontend
- [x] Sign-in uses redirect flow
- [x] Sign-out uses redirect flow
- [x] Access token is attached to backend requests

## Data Access Model

- [x] Backend reads existing Fabric tables only
- [x] No table creation required
- [x] Core query targets use `dbo.MSX_*` schema
- [x] Frontend fetches data from `POST /api/fabric/data`

## Fabric Tables Queried

- [x] `dbo.MSX_accounts`
- [x] `dbo.MSX_opportunities`
- [x] `dbo.MSX_opportunitydealteam`
- [x] `dbo.MSX_partnerreferrals`
- [ ] `dbo.MSX_partneraccounts` (optional extension)

## Operational Checks

- [ ] Confirm app registration redirect URI is correct
- [ ] Confirm backend `.env` connectivity values are valid
- [ ] Confirm data returns for a real signed-in user context
- [ ] Implement full JWT validation in backend before production

For full setup, use `FABRIC_SETUP.md`.
