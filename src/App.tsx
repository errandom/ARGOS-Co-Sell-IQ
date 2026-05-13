import { useState, useEffect } from 'react'
import { useIsAuthenticated, useMsal } from '@azure/msal-react'
import { Toaster } from 'sonner'
import { LandingPage } from '@/components/LandingPage'
import { Navigation } from '@/components/Navigation'
import { Dashboard } from '@/components/Dashboard'
import { ScanSettingsView } from '@/components/ScanSettings'
import { DetectionsView } from '@/components/Detections'
import { PipelineView } from '@/components/Pipeline'
import { ScanningOverlay } from '@/components/ScanningOverlay'
import { generatePipelineData } from '@/lib/mockData'
import { runGraphScan } from '@/lib/graphService'
import { loginRequest } from '@/lib/authConfig'
import { FabricProvider, useFabricContext } from '@/lib/FabricContext'
import type { User, ScanSettings, Detection } from '@/types'

function App() {
  const { instance, accounts, inProgress } = useMsal()
  const isAuthenticated = useIsAuthenticated()

  if (!isAuthenticated) {
    return (
      <>
        <LandingPage
          onSignIn={() => instance.loginRedirect(loginRequest)}
          authInProgress={inProgress !== 'none'}
        />
        <Toaster position="bottom-right" theme="dark" />
      </>
    )
  }

  // Wrap authenticated content in FabricProvider so accounts load automatically
  return (
    <FabricProvider>
      <AuthenticatedApp />
    </FabricProvider>
  )
}

/** Inner component rendered only when authenticated; has access to FabricContext */
function AuthenticatedApp() {
  const { instance, accounts: msalAccounts } = useMsal()
  const fabricData = useFabricContext()

  const [currentView, setCurrentView] = useState('dashboard')
  const [hasScanRun, setHasScanRun] = useState(false)
  const [isScanning, setIsScanning] = useState(false)

  const [user, setUser] = useState<User>({
    name: '',
    alias: '',
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

  // Sync user info from MSAL account
  useEffect(() => {
    const activeAccount = instance.getActiveAccount() || msalAccounts[0]
    if (!activeAccount) return
    const accountName = activeAccount.name || activeAccount.username || 'Authenticated User'
    const alias = (activeAccount.username || accountName).split('@')[0] || 'user'
    setUser({ name: accountName, alias, role: 'Enterprise Seller' })
  }, [msalAccounts, instance])

  // Pre-select Fabric accounts in scan settings once loaded
  useEffect(() => {
    if (fabricData.accountsReady && fabricData.accounts.length > 0) {
      const accountNames = fabricData.accounts
        .map((a) => a['MSX Account'] ?? a.ID_account)
        .filter(Boolean) as string[]
      setScanSettings((prev) => ({
        ...prev,
        selectedAccounts: accountNames,
      }))
      console.log(`[Fabric] Loaded ${fabricData.accounts.length} account(s) for user`)
    }
  }, [fabricData.accountsReady, fabricData.accounts])

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement
    if (scanSettings.theme === 'bright') {
      root.classList.add('bright')
      root.classList.remove('dark')
    } else {
      root.classList.remove('bright')
      root.classList.add('dark')
    }
  }, [scanSettings.theme])

  const handleSignOut = async () => {
    setCurrentView('dashboard')
    setHasScanRun(false)
    setDetections([])
    await instance.logoutRedirect()
  }

  const handleStartScan = async () => {
    const activeAccount = instance.getActiveAccount() || msalAccounts[0]
    if (!activeAccount) return

    setIsScanning(true)
    try {
      const { detections: graphDetections, errors } = await runGraphScan(
        instance,
        activeAccount,
        scanSettings,
      )
      errors.forEach((e) => console.warn('[GraphScan]', e))
      setDetections(graphDetections)
    } catch (err) {
      console.error('Graph scan failed:', err)
      setDetections([])
    } finally {
      setIsScanning(false)
      setHasScanRun(true)
      setCurrentView('detections')
    }
  }

  const handleUpdateDetection = (id: string, updates: Partial<Detection>) => {
    setDetections((current) =>
      current.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    )
  }

  return (
    <>
      <div className="min-h-screen bg-background font-sans app-shell-bg">
        <Navigation
          user={user}
          currentView={currentView}
          onNavigate={setCurrentView}
          onSignOut={handleSignOut}
        />

        {currentView === 'dashboard' && (
          <Dashboard user={user} onNavigate={setCurrentView} />
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
            onNavigate={setCurrentView}
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
