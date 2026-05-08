import type { Detection, PipelineItem } from '../types'

const partners = [
  'Accenture', 'Infosys', 'Wipro', 'HCL Technologies',
  'TCS', 'Capgemini', 'Deloitte', 'KPMG',
]

const accounts = [
  'Contoso Ltd', 'Fabrikam Inc', 'Northwind Traders', 'Adventure Works',
  'Woodgrove Bank', 'Tailspin Toys', 'Litware Inc', 'Proseware Inc',
]

const solutionAreas = [
  'Azure Infrastructure', 'Modern Work', 'Security', 'Business Applications', 'Data & AI',
]

const sources: Detection['source'][] = ['email', 'chat', 'meeting', 'multiple']

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateDetections(): Detection[] {
  return Array.from({ length: 8 }, (_, i) => ({
    id: String(i + 1),
    source: pick(sources),
    confidence: Math.floor(Math.random() * 35) + 60,
    title: `Co-sell discussion with ${pick(partners)} on ${pick(solutionAreas)} for ${pick(accounts)}`,
    date: new Date(Date.now() - Math.random() * 14 * 86400000).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    }),
    account: pick(accounts),
    partner: pick(partners),
    revenue: `$${(Math.floor(Math.random() * 19) + 1) * 100_000}`,
    explanation: 'Communication detected mentioning partner engagement and co-sell opportunity signals.',
    tag: Math.random() > 0.5 ? 'new-opportunity' : 'existing-missing-engagement',
    status: 'active',
  }))
}

export function generateTopOpportunities() {
  return Array.from({ length: 5 }, (_, i) => ({
    id: String(i + 1),
    account: pick(accounts),
    partner: pick(partners),
    solutionArea: pick(solutionAreas),
    dealValue: (Math.floor(Math.random() * 19) + 1) * 100_000,
    confidence: Math.floor(Math.random() * 25) + 70,
  }))
}

export function generatePipelineData(): PipelineItem[] {
  const statuses: PipelineItem['status'][] = ['active', 'in-progress', 'pending', 'won', 'lost']
  return Array.from({ length: 12 }, (_, i) => ({
    id: String(i + 1),
    referralName: `Referral ${i + 1}`,
    partner: pick(partners),
    account: pick(accounts),
    opportunityName: `${pick(solutionAreas)} Deployment`,
    solutionArea: pick(solutionAreas),
    dealValue: (Math.floor(Math.random() * 19) + 1) * 100_000,
    closeDate: new Date(Date.now() + Math.random() * 180 * 86400000).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    }),
    status: pick(statuses),
  }))
}
