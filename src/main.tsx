import './main.css'
import './styles/theme.css'
import './index.css'

import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { msalConfig } from '@/lib/authConfig'

const queryClient = new QueryClient()
const msalInstance = new PublicClientApplication(msalConfig)

// Apply dark theme by default — App.tsx will update this when settings change
document.documentElement.classList.add('dark')

const root = createRoot(document.getElementById('root')!)

root.render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <MsalProvider instance={msalInstance}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </MsalProvider>
  </ErrorBoundary>
)
