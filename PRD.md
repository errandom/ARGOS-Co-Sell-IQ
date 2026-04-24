# Product Requirements (Current State)

ARGOS Co-Sell IQ helps sellers detect and manage co-sell signals by combining authenticated user context with data from existing Fabric MSX tables.

## Product Goals

- Reduce manual tracking effort for co-sell opportunities.
- Surface partner engagements and opportunity relationships quickly.
- Keep user access secure through Azure Active Directory authentication.

## Current Scope

1. Authentication
- Azure AD sign-in via MSAL redirect flow.
- Authenticated session is required to access application views.

2. Data Loading
- Query backend endpoint `POST /api/fabric/data` after successful sign-in.
- Backend reads from existing Fabric source tables only.
- No database schema creation/migration steps are part of app setup.

3. Views
- Dashboard
- Scan Settings
- Detections
- Pipeline

## Data Source Contract

Primary read-only Fabric tables:
- `dbo.MSX_accounts`
- `dbo.MSX_opportunities`
- `dbo.MSX_opportunitydealteam`
- `dbo.MSX_partnerreferrals`
- `dbo.MSX_partneraccounts` (optional enrichment)

## Non-Goals

- Creating or altering Fabric tables.
- Running DDL from the app setup flow.

## Operational Success Criteria

- User can sign in with Azure AD from localhost.
- Backend can connect to Fabric SQL and return query results for signed-in user context.
- Frontend renders account/opportunity/referral data without schema mismatches.

## Primary Documentation

- `FABRIC_SETUP.md`
- `QUICK_START.md`
- `MSX_SCHEMA_REFERENCE.md`
# Product Requirements (Current State)

ARGOS Co-Sell IQ helps sellers detect and manage co-sell signals by combining authenticated user context with data from existing Fabric MSX tables.

## Product Goals

- Reduce manual tracking effort for co-sell opportunities.
- Surface partner engagements and opportunity relationships quickly.
- Keep user access secure through Azure Active Directory authentication.

## Current Scope

1. Authentication
- Azure AD sign-in via MSAL redirect flow.
- Authenticated session is required to access application views.

2. Data Loading
- Query backend endpoint `POST /api/fabric/data` after successful sign-in.
- Backend reads from existing Fabric source tables only.
- No database schema creation/migration steps are part of app setup.

3. Views
- Dashboard
- Scan Settings
- Detections
- Pipeline

## Data Source Contract

Primary read-only Fabric tables:
- `dbo.MSX_accounts`
- `dbo.MSX_opportunities`
- `dbo.MSX_opportunitydealteam`
- `dbo.MSX_partnerreferrals`
- `dbo.MSX_partneraccounts` (optional enrichment)

## Non-Goals

- Creating or altering Fabric tables.
- Running DDL from the app setup flow.

## Operational Success Criteria

- User can sign in with Azure AD from localhost.
- Backend can connect to Fabric SQL and return query results for signed-in user context.
- Frontend renders account/opportunity/referral data without schema mismatches.

## Primary Documentation

- `FABRIC_SETUP.md`
- `QUICK_START.md`
- `MSX_SCHEMA_REFERENCE.md`
