import './main.css'
import './styles/theme.css'
import './index.css'

import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from 'react-error-boundary'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

const queryClient = new QueryClient()

// Apply dark theme by default — App.tsx will update this when settings change
document.documentElement.classList.add('dark')

const root = createRoot(document.getElementById('root')!)

root.render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </ErrorBoundary>
)
