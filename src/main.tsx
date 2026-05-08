import './main.css'
import './styles/theme.css'
import './index.css'

import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PublicClientApplication, EventType, type AuthenticationResult } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { msalConfig, aadConfigIssues, isAadConfigValid } from './lib/authConfig.ts'

const queryClient = new QueryClient()
const root = createRoot(document.getElementById('root')!)

if (!isAadConfigValid) {
  root.render(
    <ErrorFallback
      error={new Error(`Azure AD configuration is invalid: ${aadConfigIssues.join(' ')}`)}
      resetErrorBoundary={() => window.location.reload()}
    />
  )
} else {
  const msalInstance = new PublicClientApplication(msalConfig)

  msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
      const payload = event.payload as AuthenticationResult
      if (payload.account) {
        msalInstance.setActiveAccount(payload.account)
      }
    }
  })

  const existingAccounts = msalInstance.getAllAccounts()
  if (!msalInstance.getActiveAccount() && existingAccounts.length > 0) {
    msalInstance.setActiveAccount(existingAccounts[0])
  }

  root.render(
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <MsalProvider instance={msalInstance}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </MsalProvider>
    </ErrorBoundary>
  )
}
