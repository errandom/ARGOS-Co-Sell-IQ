import type { Account, Opportunity, PartnerEngagement, FabricData } from '@/types'

/**
 * Fabric Data Service
 * 
 * This service handles fetching data from the Fabric SQL database.
 * 
 * SECURITY NOTE: For production, this should always go through a backend API
 * rather than querying the database directly from the frontend.
 * The backend should:
 * - Store database credentials securely in environment variables
 * - Handle authentication and authorization
 * - Return only data the user is authorized to see
 * 
 * Example backend endpoint: POST /api/fabric/data
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export interface FabricQueryParams {
  userId: string
  userEmail?: string
  [key: string]: unknown
}

/**
 * Fetch all Fabric data for the authenticated user
 * Calls backend API which queries the SQL database securely
 */
export async function fetchFabricData(params: FabricQueryParams): Promise<FabricData> {
  try {
    const response = await fetch(`${API_BASE_URL}/fabric/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add authorization header (e.g., Bearer token)
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        error.message || `Failed to fetch Fabric data: ${response.statusText}`
      )
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching Fabric data:', error)
    throw error
  }
}

/**
 * Fetch accounts related to the user
 */
export async function fetchUserAccounts(userId: string): Promise<Account[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/fabric/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
      },
      body: JSON.stringify({ userId }),
    })

    if (!response.ok) throw new Error(`Failed to fetch accounts: ${response.statusText}`)
    return await response.json()
  } catch (error) {
    console.error('Error fetching user accounts:', error)
    throw error
  }
}

/**
 * Fetch opportunities owned by the user
 */
export async function fetchOwnedOpportunities(userId: string): Promise<Opportunity[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/fabric/opportunities/owned`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
      },
      body: JSON.stringify({ userId }),
    })

    if (!response.ok) throw new Error(`Failed to fetch owned opportunities: ${response.statusText}`)
    return await response.json()
  } catch (error) {
    console.error('Error fetching owned opportunities:', error)
    throw error
  }
}

/**
 * Fetch opportunities where user is part of the deal team
 */
export async function fetchDealTeamOpportunities(userId: string): Promise<Opportunity[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/fabric/opportunities/deal-team`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
      },
      body: JSON.stringify({ userId }),
    })

    if (!response.ok) throw new Error(`Failed to fetch deal team opportunities: ${response.statusText}`)
    return await response.json()
  } catch (error) {
    console.error('Error fetching deal team opportunities:', error)
    throw error
  }
}

/**
 * Fetch opportunities related to accounts the user is related to
 */
export async function fetchRelatedAccountOpportunities(userId: string): Promise<Opportunity[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/fabric/opportunities/related-accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
      },
      body: JSON.stringify({ userId }),
    })

    if (!response.ok) throw new Error(`Failed to fetch related account opportunities: ${response.statusText}`)
    return await response.json()
  } catch (error) {
    console.error('Error fetching related account opportunities:', error)
    throw error
  }
}

/**
 * Fetch partner engagements/referrals related to user, accounts, or opportunities
 */
export async function fetchPartnerEngagements(userId: string): Promise<PartnerEngagement[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/fabric/partner-engagements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
      },
      body: JSON.stringify({ userId }),
    })

    if (!response.ok) throw new Error(`Failed to fetch partner engagements: ${response.statusText}`)
    return await response.json()
  } catch (error) {
    console.error('Error fetching partner engagements:', error)
    throw error
  }
}

/**
 * Batch fetch all data for a user (recommended approach)
 * Combines all queries into a single API call for better performance
 */
export async function fetchAllFabricData(userId: string): Promise<FabricData> {
  try {
    const response = await fetch(`${API_BASE_URL}/fabric/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
      },
      body: JSON.stringify({ userId }),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch Fabric data: ${response.statusText}`)
    }

    const data: FabricData = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching all Fabric data:', error)
    return {
      accounts: [],
      opportunities: [],
      dealTeamOpportunities: [],
      relatedAccountOpportunities: [],
      partnerEngagements: [],
      isLoading: false,
      error: error instanceof Error ? error.message : 'Failed to fetch Fabric data',
    }
  }
}
