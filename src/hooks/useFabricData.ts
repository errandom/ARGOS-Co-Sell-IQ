import { useQuery } from '@tanstack/react-query'
import { useMsal, useIsAuthenticated } from '@azure/msal-react'
import { InteractionRequiredAuthError, InteractionStatus } from '@azure/msal-browser'
import { useState, useEffect } from 'react'
import { fetchAccounts, fetchFabricData } from '@/lib/fabricService'
import { fabricSqlScope } from '@/lib/authConfig'
import type { Account, FabricData } from '@/types'

const FABRIC_INTERACTIVE_ATTEMPT_KEY = 'argos.fabric.interactive.attempted'

function deriveUserAlias(username?: string | null): string | null {
  if (!username) return null
  const normalized = username.trim().toLowerCase()
  const atIndex = normalized.indexOf('@')
  if (atIndex <= 0) return null
  return normalized.slice(0, atIndex)
}

function deriveDisplayName(name?: string | null): string | null {
  if (!name) return null
  const normalized = name.trim().replace(/\s+/g, ' ')
  return normalized || null
}

/** Acquire a delegated Fabric SQL access token for the signed-in user. */
function useAuthToken() {
  const { instance, accounts, inProgress } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      setToken(null)
      sessionStorage.removeItem(FABRIC_INTERACTIVE_ATTEMPT_KEY)
      return
    }

    // Never trigger token acquisition while MSAL is already handling an auth interaction.
    if (inProgress !== InteractionStatus.None) {
      return
    }

    const activeAccount = instance.getActiveAccount() || accounts[0]
    if (!activeAccount) return

    const scopes = [fabricSqlScope]
    let cancelled = false

    instance
      .acquireTokenSilent({ scopes, account: activeAccount })
      .then((res) => {
        if (cancelled) return
        setToken(res.accessToken)
        sessionStorage.removeItem(FABRIC_INTERACTIVE_ATTEMPT_KEY)
      })
      .catch((err) => {
        if (cancelled) return

        if (err instanceof InteractionRequiredAuthError) {
          const alreadyAttempted = sessionStorage.getItem(FABRIC_INTERACTIVE_ATTEMPT_KEY) === '1'
          if (alreadyAttempted) {
            console.error('Interactive token request already attempted. Waiting for user to complete consent/sign-in.')
            setToken(null)
            return
          }

          sessionStorage.setItem(FABRIC_INTERACTIVE_ATTEMPT_KEY, '1')

          // Redirect flow is more reliable than popup in enterprise/browser-restricted environments.
          console.warn('acquireTokenSilent requires user consent/interaction. Redirecting for consent:', err)
          instance.acquireTokenRedirect({ scopes, account: activeAccount }).catch((redirectErr) => {
            console.error('Token acquisition redirect failed:', redirectErr)
            setToken(null)
          })
          return
        }

        const errorCode = err instanceof Error ? err.name : 'unknown_error'
        if (errorCode === 'BrowserAuthError' || String(err).includes('interaction_in_progress')) {
          console.warn('Token acquisition already in progress. Waiting for existing interaction to complete.')
          return
        }

        console.error('Token acquisition failed:', err)
        setToken(null)
      })

    return () => {
      cancelled = true
    }
  }, [instance, accounts, isAuthenticated, inProgress])

  return token
}

/** Derive the userId from the MSAL account (Azure AD object ID) */
function useUserId(): string | null {
  const { instance, accounts } = useMsal()
  const isAuthenticated = useIsAuthenticated()

  if (!isAuthenticated) return null
  const acct = instance.getActiveAccount() || accounts[0]
  return acct?.localAccountId ?? null
}

/** Derive the user alias from the MSAL username (value before @microsoft.com). */
function useUserAlias(): string | null {
  const { instance, accounts } = useMsal()
  const isAuthenticated = useIsAuthenticated()

  if (!isAuthenticated) return null
  const acct = instance.getActiveAccount() || accounts[0]
  return deriveUserAlias(acct?.username)
}

function useUserDisplayName(): string | null {
  const { instance, accounts } = useMsal()
  const isAuthenticated = useIsAuthenticated()

  if (!isAuthenticated) return null
  const acct = instance.getActiveAccount() || accounts[0]
  return deriveDisplayName(acct?.name)
}

/**
 * Load user accounts immediately after authentication.
 * Returns accounts and loading/error state.
 */
export function useFabricAccounts() {
  const token = useAuthToken()
  const userId = useUserId()
  const userAlias = useUserAlias()

  return useQuery<Account[], Error>({
    queryKey: ['fabric', 'accounts', userId, userAlias],
    queryFn: () => fetchAccounts(token!, userId!, userAlias!),
    enabled: !!token && !!userId && !!userAlias,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  })
}

/**
 * Load the full Fabric dataset once accounts are available.
 * Only runs when explicitly enabled (e.g. after accounts are loaded).
 */
export function useFabricFullData(enabled = true) {
  const token = useAuthToken()
  const userId = useUserId()
  const userAlias = useUserAlias()
  const userName = useUserDisplayName()

  return useQuery<Omit<FabricData, 'isLoading' | 'error'>, Error>({
    queryKey: ['fabric', 'fullData', userId, userAlias, userName],
    queryFn: () => fetchFabricData(token!, userId!, userAlias!, userName!),
    enabled: enabled && !!token && !!userId && !!userAlias && !!userName,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  })
}
