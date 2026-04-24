import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowUpDown } from 'lucide-react'
import { toast } from 'sonner'
import type { PipelineItem } from '@/types'

interface PipelineViewProps {
  pipelineData: PipelineItem[]
}

export function PipelineView({ pipelineData }: PipelineViewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState(pipelineData)
  const [sortField, setSortField] = useState<keyof PipelineItem>('dealValue')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const totalPipeline = pipelineData.reduce((sum, item) => sum + item.dealValue, 0)
  const activeCount = pipelineData.filter((item) =>
    ['active', 'in-progress'].includes(item.status)
  ).length

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date)
  }

  const getStatusBadge = (status: PipelineItem['status']) => {
    const variants = {
      active: 'bg-green-500/10 text-green-500',
      'in-progress': 'bg-blue-500/10 text-blue-500',
      pending: 'bg-amber-500/10 text-amber-500',
      won: 'bg-emerald-500/10 text-emerald-500',
      lost: 'bg-red-500/10 text-red-500',
    }
    const labels = {
      active: 'Active',
      'in-progress': 'In Progress',
      pending: 'Pending',
      won: 'Won',
      lost: 'Lost',
    }
    return (
      <Badge className={variants[status]} variant="secondary">
        {labels[status]}
      </Badge>
    )
  }

  const handleSort = (field: keyof PipelineItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }

    const sorted = [...data].sort((a, b) => {
      const aVal = a[field]
      const bVal = b[field]
      const direction = sortDirection === 'asc' ? 1 : -1
      return aVal > bVal ? direction : -direction
    })
    setData(sorted)
  }

  const handleRowClick = (name: string) => {
    toast.info(`Would open in MSX: ${name}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1280px] mx-auto px-6 py-8">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-24 bg-card rounded-xl animate-pulse" />
              ))}
            </div>
            <div className="h-96 bg-card rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="max-w-[1280px] mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Pipeline</h1>
          <p className="text-muted-foreground">Track your co-sell referrals and opportunities</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6 bg-card border border-border">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total Pipeline</p>
              <p className="text-4xl font-bold text-green-500">{formatCurrency(totalPipeline)}</p>
            </div>
          </Card>
          <Card className="p-6 bg-card border border-border">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Active Referrals & Opportunities</p>
              <p className="text-4xl font-bold text-primary">{activeCount}</p>
            </div>
          </Card>
        </div>

        <Card className="p-6 bg-card border border-border space-y-4">
          <div className="flex flex-wrap gap-4">
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Partner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Partners</SelectItem>
                <SelectItem value="accenture">Accenture</SelectItem>
                <SelectItem value="infosys">Infosys</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                <SelectItem value="contoso">Contoso Ltd</SelectItem>
                <SelectItem value="fabrikam">Fabrikam Inc</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Solution Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Solutions</SelectItem>
                <SelectItem value="azure">Azure Infrastructure</SelectItem>
                <SelectItem value="modern">Modern Work</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="biz">Business Applications</SelectItem>
                <SelectItem value="data">Data & AI</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    <button
                      onClick={() => handleSort('referralName')}
                      className="flex items-center gap-2 hover:text-white transition-colors"
                    >
                      Referral Name
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Partner
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Account
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Opportunity Name
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Solution Area
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    <button
                      onClick={() => handleSort('dealValue')}
                      className="flex items-center gap-2 hover:text-white transition-colors"
                    >
                      Deal Value
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    <button
                      onClick={() => handleSort('closeDate')}
                      className="flex items-center gap-2 hover:text-white transition-colors"
                    >
                      Close Date
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleRowClick(item.referralName)}
                        className="text-primary hover:underline text-sm"
                      >
                        {item.referralName}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-sm text-white">{item.partner}</td>
                    <td className="py-3 px-4 text-sm text-white">{item.account}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleRowClick(item.opportunityName)}
                        className="text-primary hover:underline text-sm"
                      >
                        {item.opportunityName}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{item.solutionArea}</td>
                    <td className="py-3 px-4 text-sm font-medium text-green-500">
                      {formatCurrency(item.dealValue)}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {formatDate(item.closeDate)}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
