import { useQuery } from '@tanstack/react-query'
import { useMsal, useIsAuthenticated } from '@azure/msal-react'
import { useState, useEffect, useCallback } from 'react'
import { fetchAccounts, fetchFabricData } from '@/lib/fabricService'
import { apiScope } from '@/lib/authConfig'
import type { Account, FabricData } from '@/types'

function deriveUserAlias(username?: string | null): string | null {
  if (!username) return null
  const normalized = username.trim().toLowerCase()
  const atIndex = normalized.indexOf('@')
  if (atIndex <= 0) return null
  return normalized.slice(0, atIndex)
}

/** Acquire a token silently for the backend API */
function useAuthToken() {
  const { instance, accounts } = useMsal()
  const isAuthenticated = useIsAuthenticated()
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      setToken(null)
      return
    }
    const activeAccount = instance.getActiveAccount() || accounts[0]
    if (!activeAccount) return

    const scopes = apiScope ? [apiScope] : ['User.Read']

    instance
      .acquireTokenSilent({ scopes, account: activeAccount })
      .then((res) => setToken(res.accessToken))
      .catch((err) => console.warn('Token acquisition failed:', err))
  }, [instance, accounts, isAuthenticated])

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

  return useQuery<Omit<FabricData, 'isLoading' | 'error'>, Error>({
    queryKey: ['fabric', 'fullData', userId, userAlias],
    queryFn: () => fetchFabricData(token!, userId!, userAlias!),
    enabled: enabled && !!token && !!userId && !!userAlias,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  })
}
