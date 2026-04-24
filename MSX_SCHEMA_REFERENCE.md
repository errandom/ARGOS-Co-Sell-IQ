# MSX Database Schema - Quick Reference

## Overview

This document provides a quick reference for the actual Microsoft Fabric SQL database schema you're using, with all table names and column names.

## Complete Schema Reference

### dbo.MSX_accounts - Customer Accounts

| Column Name | Data Type | Description |
|---|---|---|
| ID_account | nvarchar | Account ID (Primary Key) |
| ID_parentaccount | nvarchar | Parent account ID |
| ID_owner | nvarchar | Owner's user ID |
| ID_owningteam | nvarchar | Owning team ID |
| MSX Account Number | nvarchar | Account number |
| MSX Account | nvarchar | Account name |
| MSX Parent Account | nvarchar | Parent account name |
| MSX Account City | nvarchar | City |
| MSX Account Country | nvarchar | Country |
| MSX Status | nvarchar | Account status |
| MSX Account Management Status | nvarchar | Management status |
| MSX Account ISD Coverage | nvarchar | ISD coverage |
| MSX Account Unified Support Eligibility | nvarchar | Unified support eligibility |
| MSX Account Segment Group | nvarchar | Segment group |
| MSX Account Segment | nvarchar | Segment |
| MSX Account Subsegment | nvarchar | Subsegment |
| MSX Account Industry | nvarchar | Industry |
| MSX Account Industry Vertical | nvarchar | Industry vertical |
| MSX Account Vertical | nvarchar | Vertical classification |
| MSX Account Subvertical | nvarchar | Subvertical |
| MSX Account Vertical Category | nvarchar | Vertical category |
| MSX Account License Agreement | nvarchar | License agreement |
| MSX Account Customer MACC Eligibility | nvarchar | MACC eligibility |
| MSX Account Owner | nvarchar | Owner name |
| MSX Account Owning Business Unit | nvarchar | Owning business unit |

**Sample Query**:
```sql
SELECT TOP 100 * FROM dbo.MSX_accounts 
WHERE ID_owner = 'your-user-id'
ORDER BY [MSX Account]
```

---

### dbo.MSX_opportunities - Sales Opportunities

| Column Name | Data Type | Description |
|---|---|---|
| ID_opportunity | nvarchar | Opportunity ID (Primary Key) |
| ID_parentopportunity | nvarchar | Parent opportunity ID |
| ID_account | nvarchar | Account ID (Foreign Key) |
| ID_parentaccount | nvarchar | Parent account ID |
| ID_customer | nvarchar | Customer ID |
| ID_partneraccount | nvarchar | Partner account ID |
| ID_owning | nvarchar | Owning person ID |
| ID_owner | nvarchar | Owner ID |
| ID_creator | nvarchar | Creator ID |
| ID_modifiedby | nvarchar | Last modified by ID |
| Opportunity Date/Time Creation | datetime2 | Created date/time |
| Opportunity Date/Time Last Modified | datetime2 | Last modified date/time |
| Opportunity Number | nvarchar | Opportunity number |
| Opportunity Title | nvarchar | Opportunity title/name |
| Opportunity Description | nvarchar | Description |
| Opportunity State | nvarchar | Current state |
| Opportunity Status | nvarchar | Status |
| Opportunity Rating | nvarchar | Rating |
| Opportunity Close Pending Status | nvarchar | Close pending status |
| Opportunity Intent | nvarchar | Intent |
| Opportunity Solution Area | nvarchar | Solution area |
| Opportunity Solution Play | nvarchar | Solution play |
| Opportunity Source | nvarchar | Source |
| Opportunity Licensing Program | nvarchar | Licensing program |
| Opportunity Campaign ID | nvarchar | Campaign ID |
| Opportunity Forecast Comment | nvarchar | Forecast comment |
| Opportunity Transaction Currency | nvarchar | Currency |
| Opportunity Est. Deal Value | decimal | Estimated deal value |
| Opportunity Act. Deal Value | decimal | Actual deal value |
| Opportunity Est. Deal Value (USD) | decimal | Estimated value in USD |
| Opportunity Act. Deal Value (USD) | decimal | Actual value in USD |
| Opportunity Tot. Deal Value (USD) | decimal | Total value in USD |
| Opportunity Est. Close Date | datetime2 | Estimated close date |
| Opportunity Act. Close Date | datetime2 | Actual close date |
| Opportunity MCEM Stage | nvarchar | MCEM stage code |
| Opportunity MCEM Stage Name | nvarchar | MCEM stage name |
| Opportunity Account | nvarchar | Account name |
| Opportunity Parent Account | nvarchar | Parent account name |
| Opportunity Customer | nvarchar | Customer name |
| Opportunity Primary Partner | nvarchar | Primary partner |
| Opportunity Partner Co-Sell | nvarchar | Co-sell partner |
| Opportunity User Creation | nvarchar | Created by user name |
| Opportunity User Last Modified | nvarchar | Last modified by user name |
| Opportunity User Owner | nvarchar | Owner user name |

**Key Financial Fields**:
- `Opportunity Est. Deal Value (USD)` - Use this for estimated value
- `Opportunity Act. Deal Value (USD)` - Use this for actual value
- `Opportunity Tot. Deal Value (USD)` - Use this for total

**Key Date Fields**:
- `Opportunity Est. Close Date` - Expected close date
- `Opportunity Act. Close Date` - Actual close date

**Sample Query**:
```sql
SELECT TOP 100 
  ID_opportunity,
  [Opportunity Title],
  [Opportunity Account],
  [Opportunity Est. Deal Value (USD)],
  [Opportunity Est. Close Date],
  [Opportunity MCEM Stage Name]
FROM dbo.MSX_opportunities
WHERE ID_owner = 'your-user-id'
ORDER BY [Opportunity Est. Close Date] ASC
```

---

### dbo.MSX_opportunitydealteam - Deal Team Members

| Column Name | Data Type | Description |
|---|---|---|
| ID_opportunity | nvarchar | Opportunity ID (Foreign Key) |
| ID_owner | nvarchar | Deal team member ID |
| Opportunity Deal Team Date/Time Creation | datetime2 | Created on |
| Opportunity Deal Team Date/Time User Addition | datetime2 | Added on |
| Opportunity Deal Team User | nvarchar | Deal team member name |
| Opportunity Deal Team User Owner | uniqueidentifier | Deal team member ID (GUID) |

**Sample Query**:
```sql
SELECT TOP 100 
  o.ID_opportunity,
  o.[Opportunity Title],
  dt.[Opportunity Deal Team User],
  dt.[Opportunity Deal Team Date/Time User Addition]
FROM dbo.MSX_opportunities o
INNER JOIN dbo.MSX_opportunitydealteam dt ON o.ID_opportunity = dt.ID_opportunity
WHERE dt.ID_owner = 'your-user-id'
```

---

### dbo.MSX_partnerreferrals - Partner Referrals & Engagements

| Column Name | Data Type | Description |
|---|---|---|
| ID_partnerengagement | nvarchar | Partner engagement ID (Primary Key) |
| ID_pcreferral | nvarchar | Partner Center referral ID |
| ID_pcengagement | nvarchar | Partner Center engagement ID |
| ID_msftreferral | nvarchar | Microsoft referral ID |
| ID_opportunity | nvarchar | Related opportunity ID |
| ID_lead | nvarchar | Related lead ID |
| ID_account | nvarchar | Related account ID |
| ID_partner | nvarchar | Partner ID |
| ID_owner | nvarchar | Engagement owner ID |
| ID_creator | nvarchar | Creator ID |
| Partner Engagement Agentic Creation | nvarchar | Agentic creation flag |
| Partner Engagement Test | nvarchar | Test flag |
| Partner Engagement Date/Time Creation | datetime2 | Created on |
| Partner Engagement Date/Time Last Modified | datetime2 | Last modified on |
| Partner Engagement Date/Time Accepted | datetime2 | Accepted on |
| Partner Engagement Date/Time Expiration | datetime2 | Expiration date |
| Referral Acceptance | nvarchar | Acceptance status |
| Referral Rejection | nvarchar | Rejection status |
| Referral Expiration | nvarchar | Expiration flag |
| Referral Outcome | nvarchar | Outcome |
| Partner Engagement User Creation | nvarchar | Created by user |
| Partner Engagement User Last Modified | nvarchar | Last modified by user |
| Partner Engagement Owner | nvarchar | Owner name |
| Partner Engagement Initiator | nvarchar | Initiator |
| Partner Engagement Direction | nvarchar | Direction (inbound/outbound) |
| Partner Engagement Type | nvarchar | Type (referral, co-sell, etc.) |
| Partner Engagement Type I | nvarchar | Type I classification |
| Partner Engagement Type II | nvarchar | Type II classification |
| Partner Engagement Title | nvarchar | Title/name |
| Partner Engagement Tag (OG) | nvarchar | Original tag |
| Partner Engagement Tag I | nvarchar | Tag I |
| Partner Engagement Tag II | nvarchar | Tag II |
| Partner Engagement Notes | nvarchar | Notes |
| Partner Engagement Notes Partner | nvarchar | Partner notes |
| Partner Engagement Notes Microsoft | nvarchar | Microsoft notes |
| Partner Engagement Call to Action | nvarchar | Call to action |
| Partner Engagement Solution Area | nvarchar | Solution area |
| Partner Engagement Solution Play | nvarchar | Solution play |
| Partner Engagement Product | nvarchar | Product |
| Partner Engagement Intent | nvarchar | Intent |
| Partner Engagement Customer Marketplace Intent | nvarchar | Customer marketplace intent |
| Partner Engagement Campaign ID | nvarchar | Campaign ID |
| Partner Engagement Referral Program | nvarchar | Referral program |
| Partner Engagement Customer Name (per Partner) | nvarchar | Customer name |
| Partner Engagement Customer DUNS ID | nvarchar | Customer DUNS ID |
| Partner Engagement Customer ZIP | nvarchar | Customer ZIP code |
| Partner Engagement Customer City | nvarchar | Customer city |
| Partner Engagement Customer State | nvarchar | Customer state |
| Partner Engagement Customer Country | nvarchar | Customer country |
| Partner Engagement MACC Eligibility | nvarchar | MACC eligibility |
| Partner Engagement Incentivized Solutions | nvarchar | Incentivized solutions |
| Partner Engagement Partner Name | nvarchar | Partner name |
| Partner Engagement Partner Organization | nvarchar | Partner organization |
| Partner Engagement Partner Role | nvarchar | Partner role |
| Partner Engagement Closing Date | datetime2 | Closing date |
| Partner Engagement Closing Date (Microsoft) | datetime2 | Microsoft closing date |
| Partner Engagement Currency | nvarchar | Currency |
| Partner Engagement Deal Value | decimal | Deal value |
| Partner Engagement Deal Value (Microsoft) | decimal | Microsoft deal value |
| Partner Engagement Deal Value (USD) | decimal | Deal value in USD |
| Partner Engagement Deal Value (USD, Microsoft) | decimal | Microsoft USD deal value |
| Referral Status Type | nvarchar | Referral status type |
| Partner Engagement Status | nvarchar | Status |
| Partner Engagement Substatus | nvarchar | Substatus |
| Partner Engagement Status Reason | nvarchar | Status reason |
| Partner Engagement Status Reason (Microsoft) | nvarchar | Microsoft status reason |
| Partner Engagement Status Comments | nvarchar | Status comments |
| Partner Engagement Draft | nvarchar | Draft flag |
| Partner Engagement Service Description | nvarchar | Service description |
| Partner Engagement Partner Referral Contacts | nvarchar | Referral contacts |

**Key Fields**:
- `Partner Engagement Title` - Name of the engagement
- `Partner Engagement Type` - Type (referral, co-sell, partnership)
- `Partner Engagement Status` - Current status
- `Partner Engagement Deal Value (USD)` - Deal value
- `Partner Engagement Partner Name` - Partner account name
- `Partner Engagement Customer Name (per Partner)` - End customer

**Sample Query**:
```sql
SELECT TOP 100 
  pe.ID_partnerengagement,
  pe.[Partner Engagement Title],
  pe.[Partner Engagement Type],
  pe.[Partner Engagement Status],
  pe.[Partner Engagement Deal Value (USD)],
  pe.[Partner Engagement Partner Name],
  o.[Opportunity Title]
FROM dbo.MSX_partnerreferrals pe
LEFT JOIN dbo.MSX_opportunities o ON pe.ID_opportunity = o.ID_opportunity
WHERE pe.ID_owner = 'your-user-id'
ORDER BY pe.[Partner Engagement Date/Time Last Modified] DESC
```

---

### dbo.MSX_partneraccounts - Partner Account Information

| Column Name | Data Type | Description |
|---|---|---|
| id_partneraccount | nvarchar | Partner account ID (Primary Key) |
| Partner Account Name | nvarchar | Partner name |
| Partner Account MPL Name | nvarchar | MPL name |
| Partner Account (Public) URL | nvarchar | Public URL |
| Partner Account MPN HQ ID | nvarchar | MPN HQ ID |
| Partner Account MPN Location ID | nvarchar | MPN location ID |
| Partner Account MPN Organization ID | nvarchar | MPN org ID |
| Partner Account MPN Organization Name | nvarchar | MPN org name |
| Partner Account MPN Organization Type | nvarchar | MPN org type |
| Partner Account MPN Partner Type | nvarchar | MPN partner type |
| Partner Account GPS Management Level | nvarchar | GPS management level |
| Partner Account GPS MPN ID | nvarchar | GPS MPN ID |
| Partner Account GPS Partner Name | nvarchar | GPS partner name |
| Partner Account Engagement Type | nvarchar | Engagement type |
| Partner Account Type | nvarchar | Account type |
| Partner Account Segment | nvarchar | Segment |
| Partner Account Co-Sell Ready | nvarchar | Co-sell ready status |
| Partner Account City | nvarchar | City |
| Partner Account Country | nvarchar | Country |
| Partner Account Status | nvarchar | Status |

**Sample Query**:
```sql
SELECT TOP 100 
  [id_partneraccount],
  [Partner Account Name],
  [Partner Account Type],
  [Partner Account Segment],
  [Partner Account Co-Sell Ready],
  [Partner Account Country]
FROM dbo.MSX_partneraccounts
ORDER BY [Partner Account Name]
```

---

## Testing Your Connection

### Find Your User ID

```sql
-- Find users in the system
SELECT TOP 10 [ID_owner]
FROM (
  SELECT DISTINCT [ID_owner]
  FROM dbo.MSX_accounts
  WHERE [ID_owner] IS NOT NULL
  UNION
  SELECT DISTINCT [ID_owner]
  FROM dbo.MSX_opportunities
  WHERE [ID_owner] IS NOT NULL
) u
ORDER BY [ID_owner]
```

### Test Each Query

```sql
-- Replace 'your-user-id' with an actual ID from above

-- Test 1: Accounts
SELECT COUNT(*) FROM dbo.MSX_accounts WHERE ID_owner = 'your-user-id'

-- Test 2: Owned Opportunities
SELECT COUNT(*) FROM dbo.MSX_opportunities WHERE ID_owner = 'your-user-id'

-- Test 3: Deal Team Opportunities
SELECT COUNT(*) FROM dbo.MSX_opportunities o
INNER JOIN dbo.MSX_opportunitydealteam dt ON o.ID_opportunity = dt.ID_opportunity
WHERE dt.ID_owner = 'your-user-id'

-- Test 4: Related Account Opportunities
SELECT COUNT(*) FROM dbo.MSX_opportunities o
WHERE o.ID_account IN (
  SELECT ID_account FROM dbo.MSX_accounts WHERE ID_owner = 'your-user-id'
)

-- Test 5: Partner Referrals
SELECT COUNT(*) FROM dbo.MSX_partnerreferrals WHERE ID_owner = 'your-user-id'
```

---

## Field Values by Type

### Status Values

**Opportunity Status** (typical values):
- Active
- Closed
- Inactive
- Won
- Lost
- Pipeline

**Partner Engagement Status** (typical values):
- Accepted
- Active
- Closed
- Created
- Declined
- Expired
- On Hold
- Pending

**Account Status** (typical values):
- Active
- Inactive

### Type Classifications

**Partner Engagement Type**:
- referral
- co-sell
- partnership
- other

**Account Segment**:
- Enterprise
- Mid-Market
- SMB
- Startup

---

## Common Filtering Patterns

### By Date Range

```sql
SELECT * FROM dbo.MSX_opportunities
WHERE [Opportunity Est. Close Date] BETWEEN '2024-01-01' AND '2024-12-31'
```

### By Deal Value

```sql
SELECT * FROM dbo.MSX_opportunities
WHERE [Opportunity Est. Deal Value (USD)] >= 100000
```

### By Status

```sql
SELECT * FROM dbo.MSX_opportunities
WHERE [Opportunity MCEM Stage Name] IN ('Evaluate', 'Develop', 'Negotiate')
```

### By Date Created

```sql
SELECT * FROM dbo.MSX_opportunities
WHERE [Opportunity Date/Time Creation] >= DATEADD(MONTH, -3, GETDATE())
```

---

## Important Notes

1. **NULL Values** - Many fields are NULLable, check for NULL before using
2. **Names with Spaces** - Column names with spaces require `[brackets]`
3. **IDs vs Names** - Always use ID columns for joins, display name columns to users
4. **Dates** - datetime2 format, convert as needed for display
5. **Decimals** - Deal values are decimal type, careful with floating point operations
6. **Unicode** - All nvarchar columns support Unicode characters

---

## Schema Version

**Last Updated**: Your actual database schema  
**Tables**: 8 main tables under dbo schema  
**Total Columns**: 200+  

For the most current schema, query:
```sql
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'dbo'
ORDER BY TABLE_NAME
```
