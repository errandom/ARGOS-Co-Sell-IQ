import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
import type { User } from '@/types'

interface DashboardProps {
  user: User
  onNavigate: (view: string) => void
}

interface MetricCard {
  title: string
  count: number
  usd?: string
  icon: React.ReactNode
  color: string
  clickable: boolean
  tooltip: string
  action?: () => void
}

export function Dashboard({ user, onNavigate }: DashboardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [opportunities] = useState(generateTopOpportunities())

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

  const metricCards: MetricCard[] = [
    {
      title: 'Opportunities',
      count: 42,
      usd: '$18,450,000',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-blue-500',
      clickable: false,
      tooltip: 'All MSX opportunities you own or are part of the deal team',
    },
    {
      title: 'Inbound Partner Referrals',
      count: 12,
      usd: '$5,200,000',
      icon: <ArrowDownToLine className="w-5 h-5" />,
      color: 'text-green-500',
      clickable: false,
      tooltip: 'Opportunities with at least one inbound referral',
    },
    {
      title: 'Outbound Partner Referrals',
      count: 8,
      usd: '$3,100,000',
      icon: <ArrowUpFromLine className="w-5 h-5" />,
      color: 'text-purple-500',
      clickable: false,
      tooltip: 'Opportunities with at least one outbound referral',
    },
    {
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
      title: 'Accounts (Seller Scope)',
      count: 23,
      icon: <Building2 className="w-5 h-5" />,
      color: 'text-cyan-500',
      clickable: false,
      tooltip: 'Accounts assigned to you in SPM',
    },
    {
      title: 'Distinct Partners',
      count: 17,
      icon: <Users className="w-5 h-5" />,
      color: 'text-indigo-500',
      clickable: false,
      tooltip: 'Unique partners linked to your opportunities',
    },
    {
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
          <h1 className="text-3xl font-bold text-white">Welcome back, {user.name.split(' ')[0]}</h1>
          <p className="text-muted-foreground">Here's your co-sell overview</p>
        </div>

        <TooltipProvider>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {metricCards.map((card, index) => (
              <Tooltip key={index}>
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
                        <div className="text-3xl font-bold text-white">{card.count}</div>
                        {card.usd && (
                          <div className="text-sm font-medium text-green-500 mt-1">{card.usd}</div>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{card.title}</div>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-card border border-border">
            <h2 className="text-xl font-semibold text-white mb-4">Top 5 Partners</h2>
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
                    <span className="text-white font-medium">{partner.name}</span>
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
            <h2 className="text-xl font-semibold text-white mb-4">Top 15 Opportunities</h2>
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {opportunities.map((opp, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between p-3 rounded-lg hover:bg-muted/20 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{opp.name}</div>
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
