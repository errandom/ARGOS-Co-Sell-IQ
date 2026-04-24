export interface User {
  name: string
  alias: string
  role: string
}

export interface ScanSettings {
  sources: {
    email: boolean
    chat: boolean
    meetings: boolean
  }
  dateRange: 'last3days' | 'lastweek' | 'last14days' | 'lastmonth' | 'custom'
  customStartDate?: string
  customEndDate?: string
  incrementalScan: boolean
  selectedAccounts: string[]
  keywords: string[]
  theme?: 'dark' | 'bright'
}

export interface Detection {
  id: string
  source: 'email' | 'chat' | 'meeting' | 'multiple'
  confidence: number
  title: string
  date: string
  account: string
  partner: string
  revenue: string
  explanation: string
  tag: 'new-opportunity' | 'existing-missing-engagement'
  linkedOpportunity?: string
  status: 'active' | 'ignored' | 'confirmed'
}

export interface PipelineItem {
  id: string
  referralName: string
  partner: string
  account: string
  opportunityName: string
  solutionArea: string
  dealValue: number
  closeDate: string
  status: 'active' | 'in-progress' | 'pending' | 'won' | 'lost'
}

// Fabric SQL Data Types (from dbo schema)
export interface Account {
  // Primary Keys
  ID_account: string
  
  // Account Information
  'MSX Account'?: string
  'MSX Account Number'?: string
  'MSX Parent Account'?: string
  ID_parentaccount?: string
  
  // Geographic & Organizational
  'MSX Account City'?: string
  'MSX Account Country'?: string
  
  // Status & Management
  'MSX Status'?: string
  'MSX Account Management Status'?: string
  'MSX Account ISD Coverage'?: string
  
  // Segmentation
  'MSX Account Segment Group'?: string
  'MSX Account Segment'?: string
  'MSX Account Subsegment'?: string
  
  // Industry Classification
  'MSX Account Industry'?: string
  'MSX Account Industry Vertical'?: string
  'MSX Account Vertical'?: string
  'MSX Account Subvertical'?: string
  'MSX Account Vertical Category'?: string
  
  // Other Attributes
  'MSX Account License Agreement'?: string
  'MSX Account Unified Support Eligibility'?: string
  'MSX Account Customer MACC Eligibility'?: string
  'MSX Account Owner'?: string
  'MSX Account Owning Business Unit'?: string
  
  // Ownership
  ID_owner?: string
  ID_owningteam?: string
  
  // Additional
  [key: string]: unknown
}

export interface Opportunity {
  // Primary Keys
  ID_opportunity: string
  ID_account: string
  ID_parentaccount?: string
  
  // Relationships
  ID_parentopportunity?: string
  ID_customer?: string
  ID_partneraccount?: string
  ID_owning?: string
  ID_owner?: string
  ID_creator?: string
  ID_modifiedby?: string
  
  // Opportunity Information
  'Opportunity Number'?: string
  'Opportunity Title'?: string
  'Opportunity Description'?: string
  'Opportunity Account'?: string
  'Opportunity Customer'?: string
  
  // Status & State
  'Opportunity State'?: string
  'Opportunity Status'?: string
  'Opportunity Rating'?: string
  'Opportunity Close Pending Status'?: string
  'Opportunity MCEM Stage'?: string
  'Opportunity MCEM Stage Name'?: string
  
  // Classification
  'Opportunity Intent'?: string
  'Opportunity Solution Area'?: string
  'Opportunity Solution Play'?: string
  'Opportunity Source'?: string
  'Opportunity Licensing Program'?: string
  
  // Financial
  'Opportunity Est. Deal Value'?: number
  'Opportunity Act. Deal Value'?: number
  'Opportunity Est. Deal Value (USD)'?: number
  'Opportunity Act. Deal Value (USD)'?: number
  'Opportunity Tot. Deal Value (USD)'?: number
  'Opportunity Transaction Currency'?: string
  
  // Dates
  'Opportunity Date/Time Creation'?: string
  'Opportunity Date/Time Last Modified'?: string
  'Opportunity Est. Close Date'?: string
  'Opportunity Act. Close Date'?: string
  
  // Partner & Campaign
  'Opportunity Primary Partner'?: string
  'Opportunity Partner Co-Sell'?: string
  'Opportunity Campaign ID'?: string
  
  // User Information
  'Opportunity User Creation'?: string
  'Opportunity User Last Modified'?: string
  'Opportunity User Owner'?: string
  
  // Other
  'Opportunity Forecast Comment'?: string
  
  // Additional
  [key: string]: unknown
}

export interface DealTeamMember {
  // Keys
  ID_opportunity: string
  ID_owner: string
  
  // User Information
  'Opportunity Deal Team User'?: string
  'Opportunity Deal Team User Owner'?: string
  
  // Dates
  'Opportunity Deal Team Date/Time Creation'?: string
  'Opportunity Deal Team Date/Time User Addition'?: string
  
  // Additional
  [key: string]: unknown
}

export interface PartnerEngagement {
  // Primary Keys
  ID_partnerengagement: string
  
  // Related IDs
  ID_pcreferral?: string
  ID_pcengagement?: string
  ID_msftreferral?: string
  ID_opportunity?: string
  ID_lead?: string
  ID_account?: string
  ID_partner?: string
  ID_owner?: string
  ID_creator?: string
  
  // Basic Information
  'Partner Engagement Title'?: string
  'Partner Engagement Type'?: string
  'Partner Engagement Type I'?: string
  'Partner Engagement Type II'?: string
  'Partner Engagement Direction'?: string
  
  // Status & State
  'Partner Engagement Status'?: string
  'Partner Engagement Substatus'?: string
  'Referral Status Type'?: string
  'Referral Acceptance'?: string
  'Referral Rejection'?: string
  'Referral Outcome'?: string
  
  // Classification & Tags
  'Partner Engagement Tag (OG)'?: string
  'Partner Engagement Tag I'?: string
  'Partner Engagement Tag II'?: string
  'Partner Engagement Intent'?: string
  'Partner Engagement Solution Area'?: string
  'Partner Engagement Solution Play'?: string
  
  // Partner Information
  'Partner Engagement Partner Name'?: string
  'Partner Engagement Partner Organization'?: string
  'Partner Engagement Partner Role'?: string
  
  // Customer Information
  'Partner Engagement Customer Name (per Partner)'?: string
  'Partner Engagement Customer DUNS ID'?: string
  'Partner Engagement Customer City'?: string
  'Partner Engagement Customer Country'?: string
  
  // Financial
  'Partner Engagement Deal Value'?: number
  'Partner Engagement Deal Value (USD)'?: number
  'Partner Engagement Currency'?: string
  
  // Dates
  'Partner Engagement Date/Time Creation'?: string
  'Partner Engagement Date/Time Last Modified'?: string
  'Partner Engagement Date/Time Accepted'?: string
  'Partner Engagement Closing Date'?: string
  
  // Notes & Comments
  'Partner Engagement Notes'?: string
  'Partner Engagement Status Comments'?: string
  
  // Other Attributes
  'Partner Engagement Agentic Creation'?: string
  'Partner Engagement Draft'?: string
  'Partner Engagement Call to Action'?: string
  'Partner Engagement Referral Program'?: string
  'Partner Engagement MACC Eligibility'?: string
  
  // Additional
  [key: string]: unknown
}

export interface PartnerAccount {
  // Primary Key
  id_partneraccount: string
  
  // Basic Information
  'Partner Account Name'?: string
  'Partner Account MPL Name'?: string
  'Partner Account (Public) URL'?: string
  'Partner Account Status'?: string
  'Partner Account Type'?: string
  
  // MPN Information
  'Partner Account MPN HQ ID'?: string
  'Partner Account MPN Location ID'?: string
  'Partner Account MPN Organization ID'?: string
  'Partner Account MPN Organization Name'?: string
  'Partner Account MPN Organization Type'?: string
  'Partner Account MPN Subsidiary'?: string
  'Partner Account MPN Partner Type'?: string
  
  // GPS Information
  'Partner Account GPS Management Level'?: string
  'Partner Account GPS MPN ID'?: string
  'Partner Account GPS Partner Name'?: string
  'Partner Account GPS Partner One Name'?: string
  'Partner Account GPS Partner Subsegment'?: string
  'Partner Account GPS Managed List'?: string
  'Partner Account GPS Sub-List'?: string
  'Partner Account GPS Primary PDM'?: string
  
  // Engagement & Segment
  'Partner Account Engagement Type'?: string
  'Partner Account Segment'?: string
  'Partner Account Co-Sell Ready'?: string
  
  // Location
  'Partner Account City'?: string
  'Partner Account Country'?: string
  'Partner Account State'?: string
  
  // IDs & References
  'Partner Account MS Sales ID'?: string
  'Partner Account Partner Number'?: string
  'Partner Account Partner OCP ID'?: string
  'Partner Account Partner One ID'?: string
  'Partner Account Partner Center Enabled'?: string
  
  // Additional
  [key: string]: unknown
}

export interface FabricData {
  accounts: Account[]
  opportunities: Opportunity[]
  dealTeamOpportunities: Opportunity[]
  relatedAccountOpportunities: Opportunity[]
  partnerEngagements: PartnerEngagement[]
  partnerAccounts?: PartnerAccount[]
  isLoading: boolean
  error: string | null
}
