import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { LandingPage } from '@/components/LandingPage'
import { Navigation } from '@/components/Navigation'
import { Dashboard } from '@/components/Dashboard'
import { ScanSettingsView } from '@/components/ScanSettings'
import { DetectionsView } from '@/components/Detections'
import { PipelineView } from '@/components/Pipeline'
import { ScanningOverlay } from '@/components/ScanningOverlay'
import { generateDetections, generatePipelineData } from '@/lib/mockData'
import { useFabricData } from '@/hooks/useFabricData'
import type { User, ScanSettings, Detection, FabricData } from '@/types'

const queryClient = new QueryClient()

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const [currentView, setCurrentView] = useState('dashboard')
  const [hasScanRun, setHasScanRun] = useState(false)
  const [isScanning, setIsScanning] = useState(false)

  const [user] = useState<User>({
    name: 'Kenneth Fischer',
    alias: 'kennethf',
    role: 'Enterprise Seller',
  })

  // Fetch Fabric data when user authenticates
  const { data: fabricData, isLoading: fabricDataLoading, error: fabricError } = useFabricData(userId)

  const [scanSettings, setScanSettings] = useState<ScanSettings>({
    sources: { email: true, chat: true, meetings: true },
    dateRange: 'last14days',
    incrementalScan: false,
    selectedAccounts: [],
    keywords: ['co-sell', 'partner engagement'],
    theme: 'dark',
  })

  const [detections, setDetections] = useState<Detection[]>([])
  const [pipelineData] = useState(generatePipelineData())

  // Handle Fabric data loading errors
  useEffect(() => {
    if (fabricError) {
      console.error('Error loading Fabric data:', fabricError)
      // You can show a toast notification here if needed
    }
  }, [fabricError])

  // Auto-populate selected accounts from Fabric data
  useEffect(() => {
    if (fabricData?.accounts && fabricData.accounts.length > 0) {
      setScanSettings((prev) => ({
        ...prev,
        selectedAccounts: fabricData.accounts.slice(0, 5).map((acc) => acc.accountName),
      }))
    }
  }, [fabricData?.accounts])

  useEffect(() => {
    const root = document.documentElement
    if (scanSettings.theme === 'bright') {
      root.classList.add('bright')
    } else {
      root.classList.remove('bright')
    }
  }, [scanSettings.theme])

  const handleSignIn = () => {
    // In a real app, this would be the authenticated user's ID from your auth provider
    const authenticatedUserId = 'user-' + Date.now() // Generate a unique ID for demo
    setUserId(authenticatedUserId)
    setIsAuthenticated(true)
    setCurrentView('dashboard')
  }

  const handleSignOut = () => {
    setIsAuthenticated(false)
    setUserId(undefined)
    setCurrentView('dashboard')
    setHasScanRun(false)
    setDetections([])
  }

  const handleNavigate = (view: string) => {
    setCurrentView(view)
  }

  const handleStartScan = () => {
    setIsScanning(true)
    setTimeout(() => {
      setIsScanning(false)
      setHasScanRun(true)
      setDetections(generateDetections())
      setCurrentView('detections')
    }, 3000)
  }

  const handleUpdateDetection = (id: string, updates: Partial<Detection>) => {
    setDetections((current) =>
      current.map((d) => (d.id === id ? { ...d, ...updates } : d))
    )
  }

  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <LandingPage onSignIn={handleSignIn} />
        <Toaster position="bottom-right" theme="dark" />
      </QueryClientProvider>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background font-sans">
        <Navigation
          user={user}
          currentView={currentView}
          onNavigate={handleNavigate}
          onSignOut={handleSignOut}
        />

        {currentView === 'dashboard' && (
          <Dashboard user={user} onNavigate={handleNavigate} />
        )}

        {currentView === 'scan-settings' && (
          <ScanSettingsView
            settings={scanSettings}
            onUpdateSettings={setScanSettings}
            onStartScan={handleStartScan}
          />
        )}

        {currentView === 'detections' && (
          <DetectionsView
            detections={detections}
            onUpdateDetection={handleUpdateDetection}
            onNavigate={handleNavigate}
            hasScanRun={hasScanRun}
          />
        )}

        {currentView === 'pipeline' && <PipelineView pipelineData={pipelineData} />}
      </div>

      {isScanning && <ScanningOverlay />}
      <Toaster position="bottom-right" theme="dark" />
    </QueryClientProvider>
  )
}

export default App