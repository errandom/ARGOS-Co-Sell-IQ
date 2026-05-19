import type { Configuration, RedirectRequest } from '@azure/msal-browser'

const placeholderClientId = '00000000-0000-0000-0000-000000000000'
const tenantId = import.meta.env.VITE_AAD_TENANT_ID || 'organizations'
const clientId = (import.meta.env.VITE_AAD_CLIENT_ID || '').trim()

export const aadConfigIssues: string[] = []

if (!clientId || clientId === placeholderClientId) {
  aadConfigIssues.push('VITE_AAD_CLIENT_ID is missing or still set to the placeholder value.')
}
if (!tenantId.trim()) {
  aadConfigIssues.push('VITE_AAD_TENANT_ID is empty.')
}

export const isAadConfigValid = aadConfigIssues.length === 0

export const msalConfig: Configuration = {
  auth: {
    clientId: clientId || placeholderClientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: import.meta.env.VITE_AAD_REDIRECT_URI || window.location.origin,
    postLogoutRedirectUri:
      import.meta.env.VITE_AAD_POST_LOGOUT_REDIRECT_URI || window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
}

export const apiScope = import.meta.env.VITE_AAD_API_SCOPE || ''
const configuredFabricSqlScope = (import.meta.env.VITE_FABRIC_SQL_SCOPE || '').trim()
const includeFabricSqlScopeInLogin =
  (import.meta.env.VITE_INCLUDE_FABRIC_SQL_SCOPE_IN_LOGIN || '').trim().toLowerCase() === 'true'
const enableFabricSqlDelegatedToken =
  (import.meta.env.VITE_ENABLE_FABRIC_SQL_DELEGATED_TOKEN || 'true').trim().toLowerCase() !== 'false'

// Delegated interactive auth must use user_impersonation (not .default).
export const fabricSqlScope = configuredFabricSqlScope
  ? configuredFabricSqlScope.replace('/.default', '/user_impersonation')
  : enableFabricSqlDelegatedToken
    ? 'https://database.windows.net/user_impersonation'
    : ''

// Default scopes include Graph permissions required for the communication scan.
// Override by setting VITE_AAD_SCOPES as a comma-separated list in your .env.
const defaultScopes = [
  'openid',
  'profile',
  'offline_access',
  'User.Read',
  'Mail.Read',
  'Chat.Read',
  'Calendars.Read',
].join(',')

const configuredScopes = (import.meta.env.VITE_AAD_SCOPES || defaultScopes)
  .split(',')
  .map((scope: string) => scope.trim())
  .filter(Boolean)

export const loginRequest: RedirectRequest = {
  scopes: includeFabricSqlScopeInLogin
    ? Array.from(new Set([...configuredScopes, fabricSqlScope]))
    : configuredScopes,
}

export const fabricSqlTokenRequest: RedirectRequest = {
  scopes: fabricSqlScope ? [fabricSqlScope] : [],
}
