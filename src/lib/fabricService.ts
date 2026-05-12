import type { Account, FabricData } from '@/types'

const configuredApiUrl = (import.meta.env.VITE_API_URL || '').trim()
const API_URL = configuredApiUrl || (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api')

export function getApiBaseUrl() {
  return API_URL
}

export async function checkApiHealth(): Promise<{ status: string; connected: boolean; timestamp?: string }> {
  const res = await fetch(`${API_URL}/health`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error(`Health endpoint returned ${res.status}`)
  }

  return res.json() as Promise<{ status: string; connected: boolean; timestamp?: string }>
}

async function fabricFetch<T>(path: string, token: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || `Fabric API error ${res.status}`)
  }

  return res.json() as Promise<T>
}

/** Load only the user's accounts (lightweight, called immediately after auth) */
export async function fetchAccounts(token: string, userId: string, userAlias: string): Promise<Account[]> {
  const data = await fabricFetch<{ accounts: Account[] }>('/fabric/accounts', token, {
    userId,
    userAlias,
  })
  return data.accounts
}

/** Load the full Fabric dataset for the user */
export async function fetchFabricData(
  token: string,
  userId: string,
  userAlias: string,
  userName: string,
): Promise<Omit<FabricData, 'isLoading' | 'error'>> {
  return fabricFetch('/fabric/data', token, { userId, userAlias, userName })
}
