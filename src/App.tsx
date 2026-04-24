import { useState, useEffect } from 'react'
import { Toaster } from 'sonner'
import { LandingPage } from '@/components/LandingPage'
import { Navigation } from '@/components/Navigation'
import { Dashboard } from '@/components/Dashboard'
import { ScanSettingsView } from '@/components/ScanSettings'
import { DetectionsView } from '@/components/Detections'
import { PipelineView } from '@/components/Pipeline'
import { ScanningOverlay } from '@/components/ScanningOverlay'
import { generateDetections, generatePipelineData } from '@/lib/mockData'
import type { User, ScanSettings, Detection } from '@/types'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentView, setCurrentView] = useState('dashboard')
  const [hasScanRun, setHasScanRun] = useState(false)
  const [isScanning, setIsScanning] = useState(false)

  const [user] = useState<User>({
    name: 'Kenneth Fischer',
    alias: 'kennethf',
    role: 'Enterprise Seller',
  })

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

  useEffect(() => {
    const root = document.documentElement
    if (scanSettings.theme === 'bright') {
      root.classList.add('bright')
    } else {
      root.classList.remove('bright')
    }
  }, [scanSettings.theme])

  const handleSignIn = () => {
    setIsAuthenticated(true)
    setCurrentView('dashboard')
  }

  const handleSignOut = () => {
    setIsAuthenticated(false)
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
      <>
        <LandingPage onSignIn={handleSignIn} />
        <Toaster position="bottom-right" theme="dark" />
      </>
    )
  }

  return (
    <>
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
    </>
  )
}

export default App