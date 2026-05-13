import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  TrendingUp,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  Building2,
  Users,
  AlertCircle,
  FileWarning,
} from 'lucide-react'
import { toast } from 'sonner'
import { generateTopOpportunities } from '@/lib/mockData'
import { useFabricContext } from '@/lib/FabricContext'
import { checkApiHealth, getApiBaseUrl } from '@/lib/fabricService'
import type { Opportunity, PartnerEngagement, User } from '@/types'

interface DashboardProps {
  user: User
  onNavigate: (view: string) => void
}

interface MetricCard {
  id: string
  title: string
  count: number
  usd?: string
  icon: React.ReactNode
  color: string
  clickable: boolean
  tooltip: string
  breakdown?: Array<{ label: string; count: number }>
  action?: () => void
}

type DashboardListView =
  | 'opportunities-total'
  | 'accounts-associated'
  | null

export function Dashboard({ user, onNavigate }: DashboardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [selectedListView, setSelectedListView] = useState<DashboardListView>(null)
  const [healthStatus, setHealthStatus] = useState<'checking' | 'ok' | 'down'>('checking')
  const [healthMessage, setHealthMessage] = useState('Checking /api/health...')
  const [healthTimestamp, setHealthTimestamp] = useState<string | null>(null)
  const [opportunities] = useState(generateTopOpportunities())
  const fabricData = useFabricContext()
  const apiBaseUrl = getApiBaseUrl()
  const resolvedApiBaseUrl = apiBaseUrl.startsWith('http') ? apiBaseUrl : `${window.location.origin}${apiBaseUrl}`

  const ownedOpportunities = fabricData.opportunities
  const dealTeamOpportunities = fabricData.dealTeamOpportunities
  const accountAssociatedOpportunities = fabricData.relatedAccountOpportunities
  const associatedAccounts = fabricData.accounts
  const associatedAccountIds = new Set(
    associatedAccounts
      .map((account) => String(account.ID_account || '').trim())
      .filter(Boolean),
  )

  const totalOpportunityCount =
    ownedOpportunities.length +
    dealTeamOpportunities.length +
    accountAssociatedOpportunities.length

  const parseDealValue = (value: unknown): number => {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^\d.-]/g, '')
      const parsed = Number(cleaned)
      return Number.isFinite(parsed) ? parsed : 0
    }
    return 0
  }

  const getOpportunityDealValue = (opportunity: Opportunity): number => {
    return (
      parseDealValue(opportunity['Opportunity Tot. Deal Value (USD)']) ||
      parseDealValue(opportunity['Opportunity Est. Deal Value (USD)']) ||
      parseDealValue(opportunity['Opportunity Act. Deal Value (USD)'])
    )
  }

  const totalOpportunityDealValue = [
    ...ownedOpportunities,
    ...dealTeamOpportunities,
    ...accountAssociatedOpportunities,
  ].reduce((sum, item) => sum + getOpportunityDealValue(item), 0)

  const partnerEngagements = fabricData.partnerEngagements

  const hasOpportunityId = (engagement: PartnerEngagement): boolean => {
    const rawId = engagement.ID_opportunity
    return typeof rawId === 'string' ? rawId.trim().length > 0 : Boolean(rawId)
  }

  const isInboundReferral = (engagement: PartnerEngagement): boolean => {
    const direction = String(engagement['Partner Engagement Direction'] || '').toLowerCase()
    return direction.includes('inbound')
  }

  const isOutboundReferral = (engagement: PartnerEngagement): boolean => {
    const direction = String(engagement['Partner Engagement Direction'] || '').toLowerCase()
    return direction.includes('outbound')
  }

  const inboundPartnerReferrals = partnerEngagements.filter(
    (engagement) => isInboundReferral(engagement) && !hasOpportunityId(engagement),
  )

  const getReferralAcceptanceState = (engagement: PartnerEngagement): 'accepted' | 'declined' | 'other' => {
    const acceptance = String(engagement['Referral Acceptance'] || '').toLowerCase()
    const rejection = String(engagement['Referral Rejection'] || '').toLowerCase()
    const outcome = String(engagement['Referral Outcome'] || '').toLowerCase()
    const status = String(engagement['Partner Engagement Status'] || '').toLowerCase()
    const substatus = String(engagement['Partner Engagement Substatus'] || '').toLowerCase()

    const combined = [acceptance, rejection, outcome, status, substatus].join(' ')

    if (combined.includes('accept')) return 'accepted'
    if (combined.includes('declin') || combined.includes('reject')) return 'declined'
    return 'other'
  }

  const inboundAcceptedCount = inboundPartnerReferrals.filter(
    (engagement) => getReferralAcceptanceState(engagement) === 'accepted',
  ).length

  const inboundDeclinedCount = inboundPartnerReferrals.filter(
    (engagement) => getReferralAcceptanceState(engagement) === 'declined',
  ).length

  const inboundRelatedToMyAccountsCount = inboundPartnerReferrals.filter((engagement) => {
    const accountId = String(engagement.ID_account || '').trim()
    return accountId.length > 0 && associatedAccountIds.has(accountId)
  }).length

  // Outbound includes all outbound referrals, regardless of opportunity linkage.
  const outboundPartnerReferrals = partnerEngagements.filter((engagement) =>
    isOutboundReferral(engagement),
  )

  const getEngagementDealValue = (engagement: PartnerEngagement): number => {
    return parseDealValue(engagement['Partner Engagement Deal Value (USD)'])
  }

  const totalInboundReferralDealValue = inboundPartnerReferrals.reduce(
    (sum, item) => sum + getEngagementDealValue(item),
    0,
  )

  const totalOutboundReferralDealValue = outboundPartnerReferrals.reduce(
    (sum, item) => sum + getEngagementDealValue(item),
    0,
  )

  const topPartners = [
    { name: 'Accenture', opps: 8, value: 4200000 },
    { name: 'Infosys', opps: 6, value: 3100000 },
    { name: 'Wipro', opps: 5, value: 2800000 },
    { name: 'HCL Technologies', opps: 4, value: 1900000 },
    { name: 'TCS', opps: 3, value: 1500000 },
  ]

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    let cancelled = false

    const runHealthCheck = async () => {
      setHealthStatus('checking')
      setHealthMessage('Checking /api/health...')
      try {
        const result = await checkApiHealth()
        if (cancelled) return
        const isHealthy = result.status === 'OK' && result.connected
        setHealthStatus(isHealthy ? 'ok' : 'down')
        setHealthMessage(
          isHealthy
            ? 'Backend API reachable and database connection is active.'
            : 'Backend API reachable, but database connection is not active.',
        )
        setHealthTimestamp(result.timestamp || new Date().toISOString())
      } catch (error) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : 'Unknown health check error'
        setHealthStatus('down')
        setHealthMessage(message)
        setHealthTimestamp(new Date().toISOString())
      }
    }

    // Run health check with a small delay to avoid blocking initial render
    const timeoutId = setTimeout(() => {
      runHealthCheck().catch((err) => {
        console.error('Health check error:', err)
      })
    }, 500)

    const intervalId = window.setInterval(() => {
      runHealthCheck().catch((err) => {
        console.error('Health check error:', err)
      })
    }, 60000)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
      window.clearInterval(intervalId)
    }
  }, [])

  const metricCards: MetricCard[] = [
    {
      id: 'opportunities-total',
      title: 'Opportunities (Total)',
      count: totalOpportunityCount,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-blue-500',
      clickable: true,
      tooltip: 'Sum of opportunities you own, where you are deal team, and on your associated accounts',
      breakdown: [
        { label: 'Owned', count: ownedOpportunities.length },
        { label: 'Part of Deal Team', count: dealTeamOpportunities.length },
        { label: 'Related to My Accounts', count: accountAssociatedOpportunities.length },
      ],
      action: () => setSelectedListView('opportunities-total'),
    },
    {
      id: 'referrals-inbound',
      title: 'Inbound Partner Referrals',
      count: inboundPartnerReferrals.length,
      icon: <ArrowDownToLine className="w-5 h-5" />,
      color: 'text-green-500',
      clickable: false,
      tooltip: 'Inbound referrals not yet associated to an opportunity ID, with acceptance and account-scope breakdown.',
      breakdown: [
        { label: 'Accepted', count: inboundAcceptedCount },
        { label: 'Declined', count: inboundDeclinedCount },
        { label: 'Related to My Accounts', count: inboundRelatedToMyAccountsCount },
      ],
    },
    {
      id: 'referrals-outbound',
      title: 'Outbound Partner Referrals',
      count: outboundPartnerReferrals.length,
      icon: <ArrowUpFromLine className="w-5 h-5" />,
      color: 'text-purple-500',
      clickable: false,
      tooltip: 'All outbound referrals, including those linked to opportunities.',
    },
    {
      id: 'primary-partner-mismatch',
      title: 'Primary Partner Mismatch',
      count: 5,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'text-orange-500',
      clickable: true,
      tooltip: 'Primary partner exists on the opportunity but no referral is linked',
      action: () => {
        toast.info('Redirect to MSX', {
          description: 'Would open MSX to review primary partner mismatches',
        })
      },
    },
    {
      id: 'accounts-associated',
      title: 'Accounts (Seller Scope)',
      count: associatedAccounts.length,
      icon: <Building2 className="w-5 h-5" />,
      color: 'text-cyan-500',
      clickable: true,
      tooltip: 'Accounts assigned to you in SPM',
      action: () => setSelectedListView('accounts-associated'),
    },
    {
      id: 'partners-distinct',
      title: 'Distinct Partners',
      count: 17,
      icon: <Users className="w-5 h-5" />,
      color: 'text-indigo-500',
      clickable: false,
      tooltip: 'Unique partners linked to your opportunities',
    },
    {
      id: 'engagements-potential-undocumented',
      title: 'Potential Undocumented Engagements',
      count: 9,
      usd: '$4,800,000',
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'text-red-500',
      clickable: true,
      tooltip: 'Co-sell signals detected in your communications that may not be documented',
      action: () => onNavigate('detections'),
    },
    {
      id: 'engagements-sync',
      title: 'Undocumented Engagements to Sync',
      count: 3,
      usd: '$1,200,000',
      icon: <FileWarning className="w-5 h-5" />,
      color: 'text-amber-500',
      clickable: true,
      tooltip: 'Confirmed detections not yet reflected in MSX',
      action: () => {
        toast.success('Generating Excel...', {
          description: 'Export will be available for download shortly',
        })
      },
    },
  ]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getOpportunityTitle = (opportunity: Opportunity) => {
    return (
      opportunity['Opportunity Title'] ||
      opportunity['Opportunity Number'] ||
      opportunity.ID_opportunity
    )
  }

  const getOpportunityAccount = (opportunity: Opportunity) => {
    return opportunity['Opportunity Account'] || opportunity['Opportunity Customer'] || '-'
  }

  const getOpportunityOwner = (opportunity: Opportunity) => {
    return opportunity['Opportunity User Owner'] || opportunity.ID_owner || '-'
  }

  const renderOpportunityList = (items: Opportunity[], emptyMessage: string) => {
    if (items.length === 0) {
      return <p className="text-sm text-muted-foreground">{emptyMessage}</p>
    }

    return (
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">Opportunity</th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">Account</th>
              <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">Owner</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.ID_opportunity} className="border-t border-border/60">
                <td className="px-4 py-3 text-sm text-foreground">{getOpportunityTitle(item)}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{getOpportunityAccount(item)}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{getOpportunityOwner(item)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderSelectedDialogView = () => {
    if (!selectedListView) return null

    if (selectedListView === 'accounts-associated') {
      return (
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-[oklch(0.33_0.09_252)]">Associated Accounts</DialogTitle>
            <DialogDescription>Accounts identified as associated with your user profile.</DialogDescription>
          </DialogHeader>
          {associatedAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No associated accounts found for your user profile.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">Account</th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">Account ID</th>
                  </tr>
                </thead>
                <tbody>
                  {associatedAccounts.map((account) => (
                    <tr key={account.ID_account} className="border-t border-border/60">
                      <td className="px-4 py-3 text-sm text-foreground">{String(account['MSX Account'] || account['SPM Account Name'] || account.ID_account)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{account.ID_account}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <DialogHeader>
          <DialogTitle className="text-[oklch(0.33_0.09_252)]">Opportunities Breakdown</DialogTitle>
          <DialogDescription>
            Total opportunities associated with you, split by ownership and association type.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">1. Opportunities You Own ({ownedOpportunities.length})</h3>
          {renderOpportunityList(ownedOpportunities, 'No owned opportunities found.')}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">2. Deal Team Opportunities ({dealTeamOpportunities.length})</h3>
          {renderOpportunityList(dealTeamOpportunities, 'No deal team opportunities found.')}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">3. Associated Account Opportunities ({accountAssociatedOpportunities.length})</h3>
          {renderOpportunityList(accountAssociatedOpportunities, 'No account-associated opportunities found.')}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1280px] mx-auto px-6 py-8">
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-card rounded animate-pulse" />
              <div className="h-4 w-48 bg-card rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-32 bg-card rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="max-w-[1280px] mx-auto px-6 py-8 space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-[oklch(0.33_0.09_252)]">Welcome back, {user.name.split(' ')[0]}</h1>
          <p className="text-muted-foreground">Here's your co-sell overview</p>
          {fabricData.isLoading && (
            <p className="text-xs text-muted-foreground">Loading account and opportunity breakdown...</p>
          )}
        </div>

        <Card className="p-4 bg-card border border-border">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-sm font-semibold text-[oklch(0.33_0.09_252)]">Diagnostics</h2>
            <button
              type="button"
              className="text-xs px-2 py-1 rounded border border-border hover:bg-muted/40"
              onClick={async () => {
                setHealthStatus('checking')
                setHealthMessage('Checking /api/health...')
                try {
                  const result = await checkApiHealth()
                  const isHealthy = result.status === 'OK' && result.connected
                  setHealthStatus(isHealthy ? 'ok' : 'down')
                  setHealthMessage(
                    isHealthy
                      ? 'Backend API reachable and database connection is active.'
                      : 'Backend API reachable, but database connection is not active.',
                  )
                  setHealthTimestamp(result.timestamp || new Date().toISOString())
                } catch (error) {
                  const message = error instanceof Error ? error.message : 'Unknown health check error'
                  setHealthStatus('down')
                  setHealthMessage(message)
                  setHealthTimestamp(new Date().toISOString())
                }
              }}
            >
              Re-check now
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs">
            <div className="rounded border border-border p-3 bg-muted/10">
              <div className="text-muted-foreground mb-1">API base URL</div>
              <div className="text-foreground break-all">{resolvedApiBaseUrl}</div>
            </div>

            <div className="rounded border border-border p-3 bg-muted/10">
              <div className="text-muted-foreground mb-1">/api/health status</div>
              <div
                className={`font-medium ${
                  healthStatus === 'ok'
                    ? 'text-green-600'
                    : healthStatus === 'checking'
                      ? 'text-amber-600'
                      : 'text-red-600'
                }`}
              >
                {healthStatus === 'ok' ? 'Reachable' : healthStatus === 'checking' ? 'Checking...' : 'Unavailable'}
              </div>
              <div className="text-muted-foreground mt-1">{healthMessage}</div>
              {healthTimestamp && <div className="text-muted-foreground mt-1">Last check: {healthTimestamp}</div>}
            </div>

            <div className="rounded border border-border p-3 bg-muted/10">
              <div className="text-muted-foreground mb-1">Last Fabric API error</div>
              <div className={fabricData.error ? 'text-red-600' : 'text-green-600'}>
                {fabricData.error || 'None'}
              </div>
            </div>
          </div>
        </Card>

        <TooltipProvider>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {metricCards.map((card) => (
              <Tooltip key={card.id}>
                <TooltipTrigger asChild>
                  <Card
                    className={`p-4 bg-card border border-border card-hover ${
                      card.clickable ? 'cursor-pointer' : ''
                    }`}
                    onClick={card.action}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className={card.color}>{card.icon}</div>
                      </div>
                      <div>
                        {card.id === 'opportunities-total' || card.id === 'referrals-inbound' || card.id === 'referrals-outbound' ? (
                          <div className="flex items-end justify-between gap-4">
                            <div>
                              <div className="text-xs text-muted-foreground">Total Deal Value</div>
                              <div className="text-xl font-semibold text-green-600">
                                {card.id === 'opportunities-total'
                                  ? formatCurrency(totalOpportunityDealValue)
                                  : card.id === 'referrals-inbound'
                                    ? formatCurrency(totalInboundReferralDealValue)
                                    : formatCurrency(totalOutboundReferralDealValue)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">Count</div>
                              <div className="text-3xl font-bold text-[oklch(0.33_0.09_252)]">{card.count}</div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="text-3xl font-bold text-[oklch(0.33_0.09_252)]">{card.count}</div>
                            {card.usd && (
                              <div className="text-sm font-medium text-green-500 mt-1">{card.usd}</div>
                            )}
                          </>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{card.title}</div>
                      {card.breakdown && (
                        <div className="pt-1 space-y-1">
                          {card.breakdown.map((item) => (
                            <div key={item.label} className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{item.label}</span>
                              <span className="font-medium text-foreground">{item.count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{card.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>

        <Dialog open={selectedListView !== null} onOpenChange={(open) => !open && setSelectedListView(null)}>
          <DialogContent className="sm:max-w-5xl max-h-[80vh] overflow-y-auto">
            {renderSelectedDialogView()}
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-card border border-border">
            <h2 className="text-xl font-semibold text-[oklch(0.33_0.09_252)] mb-4">Top 5 Partners</h2>
            <div className="space-y-3">
              {topPartners.map((partner, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                    <span className="text-foreground font-medium">{partner.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">{partner.opps} opps</div>
                    <div className="text-sm font-medium text-green-500">
                      {formatCurrency(partner.value)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-card border border-border">
            <h2 className="text-xl font-semibold text-[oklch(0.33_0.09_252)] mb-4">Top 15 Opportunities</h2>
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {opportunities.map((opp, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 rounded-lg hover:bg-muted/20 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{opp.name}</div>
                    <div className="text-xs text-muted-foreground">{opp.account}</div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-medium text-green-500">
                      {formatCurrency(opp.dealValue)}
                    </div>
                    <div className="text-xs text-muted-foreground">{opp.closeDate}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
