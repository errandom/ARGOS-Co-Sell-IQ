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
import { useAuthTokenError } from '@/hooks/useFabricData'
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
  const tokenError = useAuthTokenError()

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

  if (tokenError === 'consent_required') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="max-w-lg w-full rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-8 text-center space-y-4">
          <div className="text-4xl">🔐</div>
          <h2 className="text-xl font-semibold text-yellow-300">Additional Permission Required</h2>
          <p className="text-sm text-muted-foreground">
            ARGOS Co-Sell IQ needs access to Microsoft Fabric SQL data, but your tenant admin hasn't
            granted consent for this permission yet.
          </p>
          <div className="rounded-lg bg-background/60 p-4 text-left text-xs text-muted-foreground space-y-1 font-mono">
            <p><span className="text-yellow-400">App ID:</span> 784390d5-9b74-4cf2-bef8-20cc4e3cd0f7</p>
            <p><span className="text-yellow-400">Scope:</span> https://database.windows.net//.default</p>
            <p><span className="text-yellow-400">Tenant:</span> 72f988bf-86f1-41af-91ab-2d7cd011db47</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Ask your Azure AD admin to go to{' '}
            <strong className="text-foreground">Entra admin center → App registrations → ARGOS Co-Sell IQ → API permissions</strong>
            {' '}and grant admin consent for <strong className="text-foreground">Azure SQL Database → user_impersonation</strong>.
          </p>
          <div className="pt-2">
            <a
              href={`https://login.microsoftonline.com/72f988bf-86f1-41af-91ab-2d7cd011db47/adminconsent?client_id=784390d5-9b74-4cf2-bef8-20cc4e3cd0f7`}
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-black hover:bg-yellow-400 transition-colors"
            >
              Grant Admin Consent →
            </a>
          </div>
          <p className="text-xs text-muted-foreground">
            After consent is granted,{' '}
            <button
              className="underline hover:text-foreground"
              onClick={() => {
                sessionStorage.removeItem('argos.fabric.interactive.attempted')
                window.location.reload()
              }}
            >
              click here to retry
            </button>
            .
          </p>
        </div>
      </div>
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
