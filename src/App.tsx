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
import { generateDetections, generatePipelineData } from '@/lib/mockData'
import { useFabricData } from '@/hooks/useFabricData'
import { apiScope, loginRequest } from '@/lib/authConfig'
import type { User, ScanSettings, Detection } from '@/types'

function App() {
  const { instance, accounts, inProgress } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const [currentView, setCurrentView] = useState('dashboard')
  const [hasScanRun, setHasScanRun] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [userId, setUserId] = useState<string | undefined>(undefined)

  const [user, setUser] = useState<User>({
    name: 'Kenneth Fischer',
    alias: 'kennethf',
    role: 'Enterprise Seller',
  })

  // Fetch Fabric data when user authenticates
  const { data: fabricData, error: fabricError } = useFabricData(userId)

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
    const activeAccount = instance.getActiveAccount() || accounts[0]
    if (!activeAccount || !isAuthenticated) {
      setUserId(undefined)
      return
    }

    const accountName = activeAccount.name || activeAccount.username || 'Authenticated User'
    const alias = (activeAccount.username || accountName).split('@')[0] || 'user'

    setUserId(activeAccount.homeAccountId)
    setUser({
      name: accountName,
      alias,
      role: 'Enterprise Seller',
    })
  }, [accounts, instance, isAuthenticated])

  useEffect(() => {
    const activeAccount = instance.getActiveAccount() || accounts[0]
    if (!activeAccount || !isAuthenticated) return

    const scopes = apiScope ? [apiScope] : ['User.Read']
    instance
      .acquireTokenSilent({
        account: activeAccount,
        scopes,
      })
      .then((result) => {
        localStorage.setItem('authToken', result.accessToken)
      })
      .catch((error) => {
        console.warn('Token acquisition failed. Falling back to account token marker.', error)
        localStorage.setItem('authToken', activeAccount.homeAccountId)
      })
  }, [accounts, instance, isAuthenticated])

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
        selectedAccounts: fabricData.accounts
          .slice(0, 5)
          .map((acc) => (acc['MSX Account'] as string) || (acc.ID_account as string))
          .filter(Boolean),
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

  const handleSignIn = async () => {
    await instance.loginRedirect(loginRequest)
    setCurrentView('dashboard')
  }

  const handleSignOut = async () => {
    localStorage.removeItem('authToken')
    setUserId(undefined)
    setCurrentView('dashboard')
    setHasScanRun(false)
    setDetections([])
    await instance.logoutRedirect()
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
        <LandingPage onSignIn={handleSignIn} authInProgress={inProgress !== 'none'} />
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