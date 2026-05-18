import { useQuery } from '@tanstack/react-query'
import { useMsal, useIsAuthenticated } from '@azure/msal-react'
import { fetchAccounts, fetchFabricData } from '@/lib/fabricService'
import { fabricSqlScope } from '@/lib/authConfig'
import type { Account, FabricData } from '@/types'

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

async function getFabricSqlAccessToken(
  instance: ReturnType<typeof useMsal>['instance'],
  account: ReturnType<typeof useMsal>['accounts'][number] | undefined,
): Promise<string | null> {
  if (!account) return null

  try {
    const tokenResult = await instance.acquireTokenSilent({
      account,
      scopes: [fabricSqlScope],
    })
    return tokenResult.accessToken || null
  } catch (error) {
    console.warn('[Fabric] SQL token acquisition failed, backend may fall back to workspace identity:', error)
    return null
  }
}

/**
 * Load user accounts immediately after authentication.
 * Backend uses workspace identity for Fabric SQL queries (no user token needed).
 */
export function useFabricAccounts() {
  const { instance, accounts } = useMsal()
  const userId = useUserId()
  const userAlias = useUserAlias()

  return useQuery<Account[], Error>({
    queryKey: ['fabric', 'accounts', userId, userAlias],
    queryFn: async () => {
      const activeAccount = instance.getActiveAccount() || accounts[0]
      const accessToken = await getFabricSqlAccessToken(instance, activeAccount)
      return fetchAccounts(userId!, userAlias!, accessToken)
    },
    enabled: !!userId && !!userAlias,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  })
}

/**
 * Load the full Fabric dataset once accounts are available.
 * Backend uses workspace identity for Fabric SQL queries (no user token needed).
 */
export function useFabricFullData(enabled = true) {
  const { instance, accounts } = useMsal()
  const userId = useUserId()
  const userAlias = useUserAlias()
  const userName = useUserDisplayName()

  return useQuery<Omit<FabricData, 'isLoading' | 'error'>, Error>({
    queryKey: ['fabric', 'fullData', userId, userAlias, userName],
    queryFn: async () => {
      const activeAccount = instance.getActiveAccount() || accounts[0]
      const accessToken = await getFabricSqlAccessToken(instance, activeAccount)
      return fetchFabricData(userId!, userAlias!, userName!, accessToken)
    },
    enabled: enabled && !!userId && !!userAlias && !!userName,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  })
}
