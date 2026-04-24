import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail, MessageSquare, Video, Layers, CheckCircle, Search } from 'lucide-react'
import { toast } from 'sonner'
import type { Detection } from '@/types'

interface DetectionsViewProps {
  detections: Detection[]
  onUpdateDetection: (id: string, updates: Partial<Detection>) => void
  onNavigate: (view: string) => void
  hasScanRun: boolean
}

export function DetectionsView({
  detections,
  onUpdateDetection,
  onNavigate,
  hasScanRun,
}: DetectionsViewProps) {
  const activeDetections = detections.filter((d) => d.status === 'active')
  const totalValue = activeDetections.reduce((sum, d) => {
    const value = parseInt(d.revenue.replace(/[$,]/g, ''))
    return sum + value
  }, 0)

  const handleIgnore = (detection: Detection) => {
    onUpdateDetection(detection.id, { status: 'ignored' })
    toast.info('Detection ignored', {
      description: 'Will resurface if new evidence appears',
    })
  }

  const handleConfirm = (detection: Detection) => {
    onUpdateDetection(detection.id, { status: 'confirmed' })
    const action =
      detection.tag === 'new-opportunity' ? 'Opportunity created' : 'Association saved'
    toast.success(action, {
      description: `Successfully processed detection for ${detection.account}`,
    })
  }

  const getSourceIcon = (source: Detection['source']) => {
    switch (source) {
      case 'email':
        return <Mail className="w-5 h-5" />
      case 'chat':
        return <MessageSquare className="w-5 h-5" />
      case 'meeting':
        return <Video className="w-5 h-5" />
      case 'multiple':
        return <Layers className="w-5 h-5" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-500 bg-green-500/10'
    if (confidence >= 60) return 'text-amber-500 bg-amber-500/10'
    return 'text-red-500 bg-red-500/10'
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (!hasScanRun) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center animate-fade-in">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <Search className="w-10 h-10 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white">Name it, I find it.</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Run a scan to detect potential co-sell engagements
            </p>
          </div>
          <Button size="lg" onClick={() => onNavigate('scan-settings')}>
            Run Your First Scan
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="max-w-[1280px] mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              <span className="text-primary">{activeDetections.length}</span> detections found
            </h1>
            <p className="text-muted-foreground mt-1">
              {formatCurrency(totalValue)} estimated deal value
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">Review Ignored</Button>
            <Button variant="outline">
              Export Confirmed
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {activeDetections.map((detection) => (
            <Card
              key={detection.id}
              className={`p-6 bg-card border transition-all duration-300 ${
                detection.status === 'confirmed'
                  ? 'border-l-4 border-l-green-500'
                  : 'border-border card-hover'
              }`}
            >
              <div className="flex gap-6">
                <div className="flex flex-col items-center gap-3 min-w-[80px]">
                  <div className="text-muted-foreground">{getSourceIcon(detection.source)}</div>
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${getConfidenceColor(
                      detection.confidence
                    )}`}
                  >
                    {detection.confidence}
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{detection.title}</h3>
                      <p className="text-sm text-muted-foreground">{detection.date}</p>
                    </div>
                    <Badge
                      variant={
                        detection.tag === 'new-opportunity' ? 'default' : 'secondary'
                      }
                      className="ml-4"
                    >
                      {detection.tag === 'new-opportunity'
                        ? 'New Opportunity'
                        : 'Existing – Missing Engagement'}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-background/50">
                      Account: {detection.account}
                    </Badge>
                    <Badge variant="outline" className="bg-background/50">
                      Partner: {detection.partner}
                    </Badge>
                    <Badge variant="outline" className="bg-background/50 text-green-500">
                      Revenue: {detection.revenue}
                    </Badge>
                  </div>

                  {detection.linkedOpportunity && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Linked to: </span>
                      <button className="text-primary hover:underline">
                        {detection.linkedOpportunity}
                      </button>
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {detection.explanation}
                  </p>

                  {detection.status === 'confirmed' ? (
                    <div className="flex items-center gap-2 text-green-500 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      <span>Confirmed</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleIgnore(detection)}
                      >
                        Ignore
                      </Button>
                      <Button size="sm" onClick={() => handleConfirm(detection)}>
                        {detection.tag === 'new-opportunity'
                          ? 'Create Opportunity'
                          : 'Associate to Opportunity'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
