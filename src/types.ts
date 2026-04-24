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

// Fabric SQL Data Types
export interface Account {
  accountId: string
  accountName: string
  accountReference?: string
  industry?: string
  revenue?: number
  employeeCount?: number
  location?: string
  website?: string
  lastModifiedDate?: string
  [key: string]: unknown
}

export interface Opportunity {
  opportunityId: string
  opportunityName: string
  accountId: string
  accountName: string
  ownerId: string
  ownerName?: string
  dealValue?: number
  forecastCategory?: string
  stage?: string
  closeDate?: string
  description?: string
  lastModifiedDate?: string
  [key: string]: unknown
}

export interface DealTeamMember {
  dealTeamId: string
  opportunityId: string
  userId: string
  userName?: string
  role?: string
  joinedDate?: string
  [key: string]: unknown
}

export interface PartnerEngagement {
  engagementId: string
  engagementName: string
  engagementType: 'referral' | 'co-sell' | 'partnership' | 'other'
  relatedAccountId?: string
  relatedAccountName?: string
  relatedOpportunityId?: string
  relatedOpportunityName?: string
  relatedUserId?: string
  relatedUserName?: string
  status?: string
  createdDate?: string
  lastModifiedDate?: string
  [key: string]: unknown
}

export interface FabricData {
  accounts: Account[]
  opportunities: Opportunity[]
  dealTeamOpportunities: Opportunity[]
  relatedAccountOpportunities: Opportunity[]
  partnerEngagements: PartnerEngagement[]
  isLoading: boolean
  error: string | null
}
