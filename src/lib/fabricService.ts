import type { Account, FabricData } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

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
): Promise<Omit<FabricData, 'isLoading' | 'error'>> {
  return fabricFetch('/fabric/data', token, { userId, userAlias })
}
