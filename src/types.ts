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
