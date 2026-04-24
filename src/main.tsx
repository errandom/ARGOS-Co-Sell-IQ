import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PublicClientApplication, EventType } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import "@github/spark/spark"

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { msalConfig } from './lib/authConfig.ts'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

const queryClient = new QueryClient()
const msalInstance = new PublicClientApplication(msalConfig)

msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload && 'account' in event.payload) {
    msalInstance.setActiveAccount(event.payload.account)
  }
})

const existingAccounts = msalInstance.getAllAccounts()
if (!msalInstance.getActiveAccount() && existingAccounts.length > 0) {
  msalInstance.setActiveAccount(existingAccounts[0])
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <MsalProvider instance={msalInstance}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </MsalProvider>
   </ErrorBoundary>
)
