import type { Configuration, RedirectRequest } from '@azure/msal-browser'

const tenantId = import.meta.env.VITE_AAD_TENANT_ID || 'organizations'
const clientId = import.meta.env.VITE_AAD_CLIENT_ID || '00000000-0000-0000-0000-000000000000'

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: import.meta.env.VITE_AAD_REDIRECT_URI || window.location.origin,
    postLogoutRedirectUri: import.meta.env.VITE_AAD_POST_LOGOUT_REDIRECT_URI || window.location.origin,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
}

const configuredScopes = (import.meta.env.VITE_AAD_SCOPES || 'openid,profile,offline_access,User.Read')
  .split(',')
  .map((scope: string) => scope.trim())
  .filter(Boolean)

export const loginRequest: RedirectRequest = {
  scopes: configuredScopes,
}

export const apiScope = import.meta.env.VITE_AAD_API_SCOPE || ''