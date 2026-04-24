/**
 * Fabric SQL Test Data Script
 * 
 * This script populates test data into the Fabric SQL database
 * for development and testing purposes.
 * 
 * IMPORTANT: 
 * 1. Modify the @TestUserId to match your app's user ID
 * 2. Run this script AFTER creating the database tables
 * 3. All IDs use NEWID() to generate unique GUIDs
 */

-- Test User ID - Change this to match your application's user ID
DECLARE @TestUserId NVARCHAR(MAX) = 'user-' + CONVERT(NVARCHAR(MAX), GETDATE(), 21)
DECLARE @TestUserId2 NVARCHAR(MAX) = 'user-other-123'

-- ============================================================================
-- Insert Users
-- ============================================================================

INSERT INTO [Users] ([UserId], [UserName], [Email])
VALUES
  (@TestUserId, 'Kenneth Fischer', 'kenneth.fischer@company.com'),
  (@TestUserId2, 'John Sales', 'john.sales@company.com'),
  ('user-exec-456', 'Sarah Executive', 'sarah.exec@company.com'),
  ('user-support-789', 'Mike Support', 'mike.support@company.com')

-- ============================================================================
-- Insert Test Accounts
-- ============================================================================

DECLARE @AccountId1 NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), NEWID())
DECLARE @AccountId2 NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), NEWID())
DECLARE @AccountId3 NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), NEWID())
DECLARE @AccountId4 NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), NEWID())

INSERT INTO [Accounts] (
  [AccountId], [AccountName], [AccountReference], [Industry], [Revenue], 
  [EmployeeCount], [Location], [Website]
)
VALUES
  (@AccountId1, 'Acme Corporation', 'ACME-001', 'Manufacturing', 500000000.00, 5000, 'New York, NY', 'www.acme.com'),
  (@AccountId2, 'TechStart Inc', 'TECH-001', 'Technology', 150000000.00, 1200, 'San Francisco, CA', 'www.techstart.com'),
  (@AccountId3, 'Global Enterprises Ltd', 'GLOBAL-001', 'Consulting', 750000000.00, 8000, 'London, UK', 'www.globalent.com'),
  (@AccountId4, 'Innovation Labs', 'INNOV-001', 'Software', 75000000.00, 400, 'Austin, TX', 'www.innovlabs.com')

-- ============================================================================
-- Link User to Accounts
-- ============================================================================

INSERT INTO [UserAccounts] ([UserAccountId], [UserId], [AccountId], [Role])
VALUES
  (CONVERT(NVARCHAR(MAX), NEWID()), @TestUserId, @AccountId1, 'Account Executive'),
  (CONVERT(NVARCHAR(MAX), NEWID()), @TestUserId, @AccountId2, 'Sales Development Rep'),
  (CONVERT(NVARCHAR(MAX), NEWID()), @TestUserId2, @AccountId3, 'Account Manager'),
  (CONVERT(NVARCHAR(MAX), NEWID()), @TestUserId2, @AccountId4, 'Sales Representative')

-- ============================================================================
-- Insert Opportunities
-- ============================================================================

DECLARE @OppId1 NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), NEWID())
DECLARE @OppId2 NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), NEWID())
DECLARE @OppId3 NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), NEWID())
DECLARE @OppId4 NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), NEWID())
DECLARE @OppId5 NVARCHAR(MAX) = CONVERT(NVARCHAR(MAX), NEWID())

INSERT INTO [Opportunities] (
  [OpportunityId], [OpportunityName], [AccountId], [OwnerId], [DealValue], 
  [ForecastCategory], [Stage], [CloseDate], [Description]
)
VALUES
  -- Opportunities owned by test user
  (@OppId1, 'Acme Digital Transformation', @AccountId1, @TestUserId, 2500000, 'Best Case', 'Qualification', DATEADD(MONTH, 3, GETDATE()), 'Large enterprise digital transformation project'),
  (@OppId2, 'TechStart Migration Project', @AccountId2, @TestUserId, 850000, 'Commit', 'Proposal', DATEADD(MONTH, 2, GETDATE()), 'Cloud migration for mid-market tech company'),
  
  -- Opportunities owned by other user
  (@OppId3, 'Global IT Infrastructure', @AccountId3, @TestUserId2, 5000000, 'Pipeline', 'Discovery', DATEADD(MONTH, 6, GETDATE()), 'Enterprise-wide infrastructure upgrade'),
  (@OppId4, 'Innovation Labs Cloud Suite', @AccountId4, @TestUserId2, 420000, 'Commit', 'Negotiation', DATEADD(MONTH, 1, GETDATE()), 'SaaS platform implementation'),
  
  -- Related account opportunity
  (@OppId5, 'Acme Security Compliance', @AccountId1, 'user-exec-456', 1800000, 'Best Case', 'Proposal', DATEADD(MONTH, 4, GETDATE()), 'Security and compliance implementation')

-- ============================================================================
-- Insert Deal Team Members (Test user is on some deal teams)
-- ============================================================================

INSERT INTO [DealTeam] ([DealTeamId], [OpportunityId], [UserId], [Role])
VALUES
  -- Add test user to deal teams for some opportunities they don't own
  (CONVERT(NVARCHAR(MAX), NEWID()), @OppId3, @TestUserId, 'Sales Consultant'),
  (CONVERT(NVARCHAR(MAX), NEWID()), @OppId4, @TestUserId, 'Technical Advisor'),
  (CONVERT(NVARCHAR(MAX), NEWID()), @OppId5, @TestUserId, 'Pre-Sales Engineer'),
  
  -- Add other users to owned opportunities
  (CONVERT(NVARCHAR(MAX), NEWID()), @OppId1, @TestUserId2, 'Sales Engineer'),
  (CONVERT(NVARCHAR(MAX), NEWID()), @OppId2, 'user-support-789', 'Support Lead')

-- ============================================================================
-- Insert Partner Engagements / Referrals
-- ============================================================================

INSERT INTO [PartnerEngagements] (
  [EngagementId], [EngagementName], [EngagementType], [RelatedAccountId], 
  [RelatedOpportunityId], [RelatedUserId], [Status]
)
VALUES
  -- Related to user directly
  (CONVERT(NVARCHAR(MAX), NEWID()), 'Acme Partner Co-sell', 'co-sell', @AccountId1, @OppId1, @TestUserId, 'Active'),
  
  -- Related to user's account
  (CONVERT(NVARCHAR(MAX), NEWID()), 'TechStart Integration Partner', 'partnership', @AccountId2, NULL, NULL, 'Active'),
  (CONVERT(NVARCHAR(MAX), NEWID()), 'Acme Channel Referral', 'referral', @AccountId1, NULL, NULL, 'Pending'),
  
  -- Related to user's opportunity
  (CONVERT(NVARCHAR(MAX), NEWID()), 'Global Services Partner Engagement', 'co-sell', @AccountId3, @OppId3, NULL, 'Active'),
  (CONVERT(NVARCHAR(MAX), NEWID()), 'Innovation ResellersPartner', 'partnership', @AccountId4, @OppId4, NULL, 'Inactive'),
  
  -- Related to user's deal team opportunity
  (CONVERT(NVARCHAR(MAX), NEWID()), 'Security Compliance Partner', 'co-sell', @AccountId1, @OppId5, @TestUserId, 'Pending')

-- ============================================================================
-- Print Summary
-- ============================================================================

PRINT 'Test data loaded successfully!'
PRINT ''
PRINT 'Test User ID: ' + @TestUserId
PRINT ''
PRINT 'Summary:'
PRINT '- Users: 4'
PRINT '- Accounts: 4 (2 linked to test user)'
PRINT '- Opportunities: 5'
PRINT '- Deal Team Links: 5'
PRINT '- Partner Engagements: 6'
PRINT ''
PRINT 'Next steps:'
PRINT '1. Update this script with your actual user ID'
PRINT '2. Use the test user ID when signing in'
PRINT '3. Verify backend queries return all test data'
PRINT ''
SELECT @TestUserId AS 'Use this User ID for testing'
