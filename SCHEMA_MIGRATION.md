# Schema Alignment Notes

This project is already aligned with your shared MSX Fabric schema.

## Scope

- Query existing tables in `dbo` schema
- Use IDs and relationships already present
- Do not create or alter Fabric tables from app setup

## Primary Tables

- `dbo.MSX_accounts`
- `dbo.MSX_opportunities`
- `dbo.MSX_opportunitydealteam`
- `dbo.MSX_partnerreferrals`
- `dbo.MSX_partneraccounts` (optional enrichment)

For detailed columns and examples, see `MSX_SCHEMA_REFERENCE.md`.
