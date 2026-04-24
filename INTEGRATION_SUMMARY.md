# Integration Summary

## Current Integration State

The app is configured to:

1. Authenticate users with Azure Active Directory (MSAL)
2. Acquire token and call backend API
3. Query existing Fabric MSX tables through backend
4. Return account, opportunity, deal-team, and partner-referral data

## Source of Data

Fabric is treated as a read-only source. Existing tables are queried; no DDL/table creation is required.

## Canonical Docs

- Setup and operations: `FABRIC_SETUP.md`
- Quick run steps: `QUICK_START.md`
- Table/column reference: `MSX_SCHEMA_REFERENCE.md`
