/**
 * Example Component: FabricDataDisplay
 * 
 * This component demonstrates how to use Fabric data in your app.
 * You can import and use this as a reference or starting point for your own components.
 * 
 * Usage:
 * 1. With the context approach (easiest):
 *    <FabricDataDisplay />
 * 
 * 2. With props (when context isn't available):
 *    <FabricDataDisplay fabricData={data} isLoading={loading} />
 * 
 * 3. With hook approach:
 *    const { data } = useFabricData(userId)
 */

import { useFabricContext, useFabricAccounts, useFabricOpportunities, useFabricPartnerEngagements } from '@/lib/FabricContext'
import type { FabricData } from '@/types'

interface FabricDataDisplayProps {
  fabricData?: FabricData | null
  isLoading?: boolean
  error?: string | null
  compact?: boolean
}

export function FabricDataDisplay({
  fabricData,
  isLoading,
  error,
  compact = false,
}: FabricDataDisplayProps) {
  // Try to get from context if not provided as props
  let contextData, contextLoading, contextError
  let useContext = false

  try {
    const context = useFabricContext()
    useContext = true
    contextData = context.fabricData
    contextLoading = context.isLoading
    contextError = context.error
  } catch {
    // Context not available, will use props
  }

  const data = fabricData ?? contextData
  const loading = isLoading ?? contextLoading
  const err = error ?? contextError

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-4">Loading Fabric data...</span>
      </div>
    )
  }

  if (err) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="font-semibold text-red-800">Error Loading Data</h3>
        <p className="text-red-700 text-sm">{err}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-600">No data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Accounts Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">
            {data.accounts.length}
          </span>
          <span className="ml-3">Your Accounts</span>
        </h2>
        {data.accounts.length === 0 ? (
          <p className="text-gray-500 text-sm">No accounts found</p>
        ) : compact ? (
          <ul className="space-y-2">
            {data.accounts.slice(0, 5).map((account) => (
              <li
                key={account.accountId}
                className="text-sm text-gray-700 py-1.5 px-3 bg-gray-50 rounded"
              >
                <strong>{account.accountName}</strong>
                {account.industry && <span className="text-gray-500 ml-2">• {account.industry}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.accounts.map((account) => (
              <div
                key={account.accountId}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <h3 className="font-semibold text-gray-900">{account.accountName}</h3>
                {account.industry && <p className="text-sm text-gray-600">Industry: {account.industry}</p>}
                {account.revenue && (
                  <p className="text-sm text-gray-600">Revenue: ${(account.revenue / 1000000).toFixed(1)}M</p>
                )}
                {account.employeeCount && (
                  <p className="text-sm text-gray-600">Employees: {account.employeeCount}</p>
                )}
                {account.location && <p className="text-sm text-gray-600">Location: {account.location}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Opportunities Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm">
            {data.opportunities.length + data.dealTeamOpportunities.length}
          </span>
          <span className="ml-3">Opportunities</span>
        </h2>

        {/* Owned Opportunities */}
        {data.opportunities.length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-3 text-sm">Owned by You ({data.opportunities.length})</h3>
            <div className="space-y-2">
              {(compact ? data.opportunities.slice(0, 3) : data.opportunities).map((opp) => (
                <div
                  key={opp.opportunityId}
                  className="flex justify-between items-start p-3 bg-gray-50 rounded border border-gray-100"
                >
                  <div>
                    <p className="font-medium text-gray-900">{opp.opportunityName}</p>
                    <p className="text-xs text-gray-600">
                      {opp.accountName} • {opp.stage}
                    </p>
                  </div>
                  {opp.dealValue && (
                    <p className="font-semibold text-gray-900">${(opp.dealValue / 1000).toFixed(0)}K</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deal Team Opportunities */}
        {data.dealTeamOpportunities.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-700 mb-3 text-sm">
              Deal Team ({data.dealTeamOpportunities.length})
            </h3>
            <div className="space-y-2">
              {(compact ? data.dealTeamOpportunities.slice(0, 3) : data.dealTeamOpportunities).map((opp) => (
                <div
                  key={opp.opportunityId}
                  className="flex justify-between items-start p-3 bg-yellow-50 rounded border border-yellow-100"
                >
                  <div>
                    <p className="font-medium text-gray-900">{opp.opportunityName}</p>
                    <p className="text-xs text-gray-600">
                      {opp.accountName} • {opp.stage}
                    </p>
                  </div>
                  {opp.dealValue && (
                    <p className="font-semibold text-gray-900">${(opp.dealValue / 1000).toFixed(0)}K</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {data.opportunities.length === 0 && data.dealTeamOpportunities.length === 0 && (
          <p className="text-gray-500 text-sm">No opportunities found</p>
        )}
      </div>

      {/* Partner Engagements Section */}
      {data.partnerEngagements.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm">
              {data.partnerEngagements.length}
            </span>
            <span className="ml-3">Partner Engagements</span>
          </h2>
          <div className="space-y-2">
            {(compact ? data.partnerEngagements.slice(0, 5) : data.partnerEngagements).map((engagement) => (
              <div
                key={engagement.engagementId}
                className="flex justify-between items-start p-3 bg-purple-50 rounded border border-purple-100"
              >
                <div>
                  <p className="font-medium text-gray-900">{engagement.engagementName}</p>
                  <p className="text-xs text-gray-600 capitalize">{engagement.engagementType}</p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded bg-white border border-purple-200">
                  {engagement.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {!compact && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-2xl font-bold text-blue-600">{data.accounts.length}</p>
              <p className="text-xs text-gray-600">Accounts</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {data.opportunities.length + data.dealTeamOpportunities.length + data.relatedAccountOpportunities.length}
              </p>
              <p className="text-xs text-gray-600">Opportunities</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{data.partnerEngagements.length}</p>
              <p className="text-xs text-gray-600">Engagements</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-600">
                {data.opportunities.reduce((sum, o) => sum + (o.dealValue ?? 0), 0) / 1000000}
              </p>
              <p className="text-xs text-gray-600">Total Value ($M)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Alternative: Using individual hooks
 */
export function FabricDataDisplayHooks() {
  const accounts = useFabricAccounts()
  const opportunities = useFabricOpportunities()
  const engagements = useFabricPartnerEngagements()
  const { isLoading, error } = useFabricContext()

  return (
    <div>
      <h1>Fabric Data (Using Hooks)</h1>
      <p>Accounts: {accounts.length}</p>
      <p>Opportunities: {opportunities.all.length}</p>
      <p>Engagements: {engagements.length}</p>
      {error && <p className="text-red-600">Error: {error}</p>}
      {isLoading && <p>Loading...</p>}
    </div>
  )
}
