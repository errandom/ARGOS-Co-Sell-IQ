import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useFabricAccounts, useFabricFullData } from '@/hooks/useFabricData'
import type { Account, FabricData } from '@/types'

interface FabricContextValue extends FabricData {
  /** True once the initial accounts fetch has completed (success or error) */
  accountsReady: boolean
}

const FabricContext = createContext<FabricContextValue>({
  accounts: [],
  opportunities: [],
  dealTeamOpportunities: [],
  relatedAccountOpportunities: [],
  partnerEngagements: [],
  isLoading: false,
  error: null,
  accountsReady: false,
})

export function FabricProvider({ children }: { children: ReactNode }) {
  // Step 1: Load accounts immediately on auth
  const accountsQuery = useFabricAccounts()

  // Step 2: Load full dataset once accounts are loaded
  const fullDataQuery = useFabricFullData(accountsQuery.isSuccess)

  const value = useMemo<FabricContextValue>(() => {
    const accounts = accountsQuery.data ?? []
    const full = fullDataQuery.data

    return {
      accounts,
      opportunities: full?.opportunities ?? [],
      dealTeamOpportunities: full?.dealTeamOpportunities ?? [],
      relatedAccountOpportunities: full?.relatedAccountOpportunities ?? [],
      partnerEngagements: full?.partnerEngagements ?? [],
      isLoading: accountsQuery.isLoading || fullDataQuery.isLoading,
      error: accountsQuery.error?.message ?? fullDataQuery.error?.message ?? null,
      accountsReady: accountsQuery.isFetched,
    }
  }, [accountsQuery, fullDataQuery])

  return <FabricContext.Provider value={value}>{children}</FabricContext.Provider>
}

export function useFabricContext() {
  return useContext(FabricContext)
}
