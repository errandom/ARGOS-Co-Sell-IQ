import { useQuery } from '@tanstack/react-query'
import type { FabricData } from '@/types'
import { fetchAllFabricData } from '@/lib/fabricService'

/**
 * Hook to fetch all Fabric data for the authenticated user
 * Uses React Query for caching and background refetching
 */
export function useFabricData(userId: string | undefined) {
  return useQuery({
    queryKey: ['fabricData', userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required')
      }
      return fetchAllFabricData(userId)
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

/**
 * Extended hook that provides both data and loading states in a simplified format
 */
export function useFabricDataSimplified(userId: string | undefined) {
  const { data, isLoading, error, isFetching } = useFabricData(userId)

  return {
    fabricData: data ?? {
      accounts: [],
      opportunities: [],
      dealTeamOpportunities: [],
      relatedAccountOpportunities: [],
      partnerEngagements: [],
      isLoading: false,
      error: null,
    },
    isLoading,
    isFetching,
    error: error?.message ?? null,
  }
}
