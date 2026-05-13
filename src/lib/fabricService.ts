import type { Account, FabricData } from '@/types'

const configuredApiUrl = (import.meta.env.VITE_API_URL || '').trim()
const API_URL = configuredApiUrl || (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api')

export function getApiBaseUrl() {
  return API_URL
}

export async function checkApiHealth(): Promise<{ status: string; connected: boolean; timestamp?: string }> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!res.ok) {
      throw new Error(`Health endpoint returned ${res.status}`)
    }

    const data = await res.json()
    return data as { status: string; connected: boolean; timestamp?: string }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Health check failed: ${message}`)
  }
}

async function fabricFetch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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
export async function fetchAccounts(userId: string, userAlias: string): Promise<Account[]> {
  const data = await fabricFetch<{ accounts: Account[] }>('/fabric/accounts', {
    userId,
    userAlias,
  })
  return data.accounts
}

/** Load the full Fabric dataset for the user */
export async function fetchFabricData(
  userId: string,
  userAlias: string,
  userName: string,
): Promise<Omit<FabricData, 'isLoading' | 'error'>> {
  return fabricFetch('/fabric/data', { userId, userAlias, userName })
}
