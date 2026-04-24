import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Mail, MessageSquare, Video, X, AlertTriangle, Moon, Sun } from 'lucide-react'
import type { ScanSettings } from '@/types'

interface ScanSettingsViewProps {
  settings: ScanSettings
  onUpdateSettings: (settings: ScanSettings) => void
  onStartScan: () => void
}

const availableAccounts = [
  'Contoso Ltd',
  'Fabrikam Inc',
  'Northwind Traders',
  'Adventure Works',
  'Woodgrove Bank',
  'Tailspin Toys',
  'Litware Inc',
  'Proseware Inc',
]

export function ScanSettingsView({
  settings,
  onUpdateSettings,
  onStartScan,
}: ScanSettingsViewProps) {
  const [keywordInput, setKeywordInput] = useState('')
  const [showCustomDate, setShowCustomDate] = useState(settings.dateRange === 'custom')

  const handleDateRangeChange = (range: ScanSettings['dateRange']) => {
    onUpdateSettings({ ...settings, dateRange: range })
    setShowCustomDate(range === 'custom')
  }

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !settings.keywords.includes(keywordInput.trim())) {
      onUpdateSettings({
        ...settings,
        keywords: [...settings.keywords, keywordInput.trim()],
      })
      setKeywordInput('')
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    onUpdateSettings({
      ...settings,
      keywords: settings.keywords.filter((k) => k !== keyword),
    })
  }

  const handleToggleAccount = (account: string) => {
    const newAccounts = settings.selectedAccounts.includes(account)
      ? settings.selectedAccounts.filter((a) => a !== account)
      : [...settings.selectedAccounts, account]
    onUpdateSettings({ ...settings, selectedAccounts: newAccounts })
  }

  const handleReset = () => {
    onUpdateSettings({
      sources: { email: true, chat: true, meetings: true },
      dateRange: 'last14days',
      incrementalScan: false,
      selectedAccounts: [],
      keywords: ['co-sell', 'partner engagement'],
      theme: 'dark',
    })
    setShowCustomDate(false)
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="max-w-[720px] mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Scan Settings</h1>
          <p className="text-muted-foreground">Configure your co-sell detection parameters</p>
        </div>

        <Card className="p-6 bg-card border border-border space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Data Sources</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span className="text-white">Outlook Email</span>
                </div>
                <Switch
                  checked={settings.sources.email}
                  onCheckedChange={(checked) =>
                    onUpdateSettings({
                      ...settings,
                      sources: { ...settings.sources, email: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-muted-foreground" />
                  <span className="text-white">Teams Chat</span>
                </div>
                <Switch
                  checked={settings.sources.chat}
                  onCheckedChange={(checked) =>
                    onUpdateSettings({
                      ...settings,
                      sources: { ...settings.sources, chat: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-muted-foreground" />
                  <span className="text-white">Meeting Transcripts</span>
                </div>
                <Switch
                  checked={settings.sources.meetings}
                  onCheckedChange={(checked) =>
                    onUpdateSettings({
                      ...settings,
                      sources: { ...settings.sources, meetings: checked },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border border-border space-y-4">
          <h2 className="text-lg font-semibold text-white">Date Range</h2>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'last3days', label: 'Last 3 days' },
              { value: 'lastweek', label: 'Last week' },
              { value: 'last14days', label: 'Last 14 days' },
              { value: 'lastmonth', label: 'Last month' },
              { value: 'custom', label: 'Custom' },
            ].map((option) => (
              <Button
                key={option.value}
                variant={settings.dateRange === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleDateRangeChange(option.value as ScanSettings['dateRange'])}
              >
                {option.label}
              </Button>
            ))}
          </div>
          {showCustomDate && (
            <div className="grid grid-cols-2 gap-4 animate-slide-up">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Start Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-white"
                  value={settings.customStartDate || ''}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, customStartDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">End Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-white"
                  value={settings.customEndDate || ''}
                  onChange={(e) =>
                    onUpdateSettings({ ...settings, customEndDate: e.target.value })
                  }
                />
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6 bg-card border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Incremental Scanning</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Speeds up scanning by skipping previously processed data
              </p>
            </div>
            <Switch
              checked={settings.incrementalScan}
              onCheckedChange={(checked) =>
                onUpdateSettings({ ...settings, incrementalScan: checked })
              }
            />
          </div>
        </Card>

        <Card className="p-6 bg-card border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Appearance</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Choose your preferred theme
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={settings.theme === 'dark' || !settings.theme ? 'default' : 'outline'}
                size="sm"
                onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
                className="gap-2"
              >
                <Moon className="w-4 h-4" />
                Dark
              </Button>
              <Button
                variant={settings.theme === 'bright' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onUpdateSettings({ ...settings, theme: 'bright' })}
                className="gap-2"
              >
                <Sun className="w-4 h-4" />
                Bright
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border border-border space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Accounts</h2>
            <p className="text-sm text-muted-foreground mb-4">Scoped to your assigned accounts in SPM</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableAccounts.map((account) => (
              <Badge
                key={account}
                variant={settings.selectedAccounts.includes(account) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => handleToggleAccount(account)}
              >
                {account}
              </Badge>
            ))}
          </div>
        </Card>

        <Card className="p-6 bg-card border border-border space-y-4">
          <h2 className="text-lg font-semibold text-white">Keywords</h2>
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-white"
              placeholder="Add keyword..."
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
            />
            <Button onClick={handleAddKeyword}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {settings.keywords.map((keyword) => (
              <Badge key={keyword} variant="secondary" className="pr-1">
                {keyword}
                <button
                  onClick={() => handleRemoveKeyword(keyword)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          {settings.keywords.length > 5 && (
            <div className="flex items-center gap-2 text-amber-500 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Search may become too specific</span>
            </div>
          )}
        </Card>

        <div className="flex items-center justify-between pt-4 sticky bottom-0 bg-background py-4">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button onClick={onStartScan} size="lg">
            Start Detection
          </Button>
        </div>
      </div>
    </div>
  )
}
