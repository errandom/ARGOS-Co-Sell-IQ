import { createContext, useContext, ReactNode } from 'react'
import type { FabricData } from '@/types'

interface FabricContextType {
  fabricData: FabricData | null
  isLoading: boolean
  error: string | null
  userId: string | undefined
}

const FabricContext = createContext<FabricContextType | undefined>(undefined)

export interface FabricProviderProps {
  children: ReactNode
  fabricData: FabricData | null
  isLoading: boolean
  error: string | null
  userId: string | undefined
}

export function FabricProvider({
  children,
  fabricData,
  isLoading,
  error,
  userId,
}: FabricProviderProps) {
  const value: FabricContextType = {
    fabricData,
    isLoading,
    error,
    userId,
  }

  return <FabricContext.Provider value={value}>{children}</FabricContext.Provider>
}

/**
 * Hook to access Fabric data from context
 * Use this instead of prop drilling data through multiple components
 * 
 * Example:
 * const { fabricData, isLoading } = useFabricContext()
 */
export function useFabricContext() {
  const context = useContext(FabricContext)
  if (context === undefined) {
    throw new Error('useFabricContext must be used within a FabricProvider')
  }
  return context
}

/**
 * Helper hook to access only accounts
 */
export function useFabricAccounts() {
  const { fabricData } = useFabricContext()
  return fabricData?.accounts ?? []
}

/**
 * Helper hook to access only opportunities
 */
export function useFabricOpportunities() {
  const { fabricData } = useFabricContext()
  return {
    owned: fabricData?.opportunities ?? [],
    dealTeam: fabricData?.dealTeamOpportunities ?? [],
    relatedAccounts: fabricData?.relatedAccountOpportunities ?? [],
    all: [
      ...(fabricData?.opportunities ?? []),
      ...(fabricData?.dealTeamOpportunities ?? []),
      ...(fabricData?.relatedAccountOpportunities ?? []),
    ],
  }
}

/**
 * Helper hook to access only partner engagements
 */
export function useFabricPartnerEngagements() {
  const { fabricData } = useFabricContext()
  return fabricData?.partnerEngagements ?? []
}

/**
 * Helper hook to get loading state
 */
export function useFabricLoading() {
  const { isLoading, error } = useFabricContext()
  return { isLoading, error }
}
