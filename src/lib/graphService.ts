/**
 * Microsoft Graph API Service
 *
 * Fetches real emails, Teams chats, and calendar events for the authenticated
 * user and analyses them for partner co-sell signals.
 *
 * Required Azure AD app permissions (delegated):
 *   Mail.Read      – user emails
 *   Chat.Read      – Teams chat messages
 *   Calendars.Read – calendar events / meeting details
 */

import type { IPublicClientApplication, AccountInfo } from '@azure/msal-browser'
import type { Detection, ScanSettings } from '@/types'

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0'

// ---------------------------------------------------------------------------
// Partner signal definitions
// ---------------------------------------------------------------------------
const PARTNER_SIGNALS: { name: string; domains: string[]; keywords: string[] }[] = [
  { name: 'Accenture',      domains: ['accenture.com'],            keywords: ['accenture'] },
  { name: 'Infosys',        domains: ['infosys.com'],              keywords: ['infosys'] },
  { name: 'Wipro',          domains: ['wipro.com'],                keywords: ['wipro'] },
  { name: 'HCL Technologies', domains: ['hcltech.com', 'hcl.com'], keywords: ['hcl technologies', 'hcltech'] },
  { name: 'TCS',            domains: ['tcs.com'],                  keywords: ['tata consultancy', ' tcs '] },
  { name: 'Capgemini',      domains: ['capgemini.com'],            keywords: ['capgemini'] },
  { name: 'Deloitte',       domains: ['deloitte.com'],             keywords: ['deloitte'] },
  { name: 'KPMG',           domains: ['kpmg.com'],                 keywords: ['kpmg'] },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function dateFilterStart(dateRange: ScanSettings['dateRange'], customStart?: string): string {
  if (dateRange === 'custom' && customStart) return customStart
  const now = new Date()
  const daysBack: Record<string, number> = {
    last3days: 3, lastweek: 7, last14days: 14, lastmonth: 30,
  }
  now.setDate(now.getDate() - (daysBack[dateRange] ?? 14))
  return now.toISOString()
}

function detectPartner(text: string, senderEmail?: string): string | null {
  const lower = text.toLowerCase()
  for (const p of PARTNER_SIGNALS) {
    if (senderEmail && p.domains.some((d) => senderEmail.toLowerCase().endsWith(`@${d}`)))
      return p.name
    if (p.keywords.some((kw) => lower.includes(kw))) return p.name
  }
  return null
}

function matchesKeywords(text: string, keywords: string[]): number {
  const lower = text.toLowerCase()
  return keywords.filter((kw) => lower.includes(kw.toLowerCase())).length
}

function scoreConfidence(keywordHits: number, hasPartner: boolean): number {
  return Math.min(50 + Math.min(keywordHits * 12, 36) + (hasPartner ? 14 : 0), 99)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function graphGet<T>(token: string, path: string): Promise<T> {
  const resp = await fetch(`${GRAPH_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    throw new Error((err as { error?: { message?: string } })?.error?.message || `Graph ${path} → ${resp.status}`)
  }
  return resp.json() as Promise<T>
}

async function acquireToken(
  msalInstance: IPublicClientApplication,
  account: AccountInfo,
  scopes: string[],
): Promise<string | null> {
  try {
    const result = await msalInstance.acquireTokenSilent({ account, scopes })
    return result.accessToken
  } catch {
    try {
      const result = await msalInstance.acquireTokenPopup({ account, scopes })
      return result.accessToken
    } catch (popupErr) {
      console.warn(`Could not acquire token for [${scopes.join(', ')}]:`, popupErr)
      return null
    }
  }
}

// ---------------------------------------------------------------------------
// Email scan (Mail.Read)
// ---------------------------------------------------------------------------

interface GraphMessage {
  id: string
  subject?: string
  bodyPreview?: string
  body?: { content?: string; contentType?: string }
  receivedDateTime?: string
  from?: { emailAddress?: { address?: string; name?: string } }
}

async function scanEmails(
  token: string,
  settings: ScanSettings,
  since: string,
): Promise<Detection[]> {
  const detections: Detection[] = []
  const select = '$select=id,subject,bodyPreview,body,receivedDateTime,from'
  const filter = `$filter=receivedDateTime ge ${since}`
  const url = `/me/messages?${select}&${filter}&$top=50&$orderby=receivedDateTime desc`

  let data: { value?: GraphMessage[] }
  try {
    data = await graphGet<{ value?: GraphMessage[] }>(token, url)
  } catch (err) {
    console.warn('Email scan failed:', err)
    return []
  }

  for (const msg of data.value ?? []) {
    const bodyText =
      msg.body?.contentType === 'html'
        ? stripHtml(msg.body?.content ?? '')
        : msg.body?.content ?? msg.bodyPreview ?? ''
    const fullText = `${msg.subject ?? ''} ${bodyText}`
    const senderEmail = msg.from?.emailAddress?.address ?? ''
    const partner = detectPartner(fullText, senderEmail)
    const hits = matchesKeywords(fullText, settings.keywords)
    if (hits === 0 && !partner) continue

    const confidence = scoreConfidence(hits, !!partner)
    const date = msg.receivedDateTime ?? new Date().toISOString()
    const lowerText = fullText.toLowerCase()
    const matchedAccount =
      settings.selectedAccounts.find((a) => lowerText.includes(a.toLowerCase())) ?? 'Unknown Account'

    detections.push({
      id: `email-${msg.id}`,
      source: 'email',
      confidence,
      title: msg.subject ?? `Email from ${msg.from?.emailAddress?.name ?? senderEmail}`,
      date: formatDate(date),
      account: matchedAccount,
      partner: partner ?? senderEmail.split('@')[1] ?? 'Unknown Partner',
      revenue: '',
      explanation: msg.bodyPreview?.slice(0, 300) ?? '',
      tag: 'new-opportunity',
      status: 'active',
    })
  }
  return detections
}

// ---------------------------------------------------------------------------
// Teams chat scan (Chat.Read)
// ---------------------------------------------------------------------------

interface GraphChat {
  id: string
  topic?: string
  lastUpdatedDateTime?: string
}

interface GraphChatMessage {
  id: string
  body?: { content?: string; contentType?: string }
  createdDateTime?: string
  from?: { user?: { displayName?: string; userPrincipalName?: string } }
}

async function scanChats(
  token: string,
  settings: ScanSettings,
  since: string,
): Promise<Detection[]> {
  const detections: Detection[] = []
  let chatsData: { value?: GraphChat[] }
  try {
    chatsData = await graphGet<{ value?: GraphChat[] }>(
      token,
      `/me/chats?$filter=lastUpdatedDateTime ge ${since}&$top=20`,
    )
  } catch (err) {
    console.warn('Chat list fetch failed:', err)
    return []
  }

  for (const chat of chatsData.value ?? []) {
    let msgsData: { value?: GraphChatMessage[] }
    try {
      msgsData = await graphGet<{ value?: GraphChatMessage[] }>(
        token,
        `/me/chats/${chat.id}/messages?$top=50&$orderby=createdDateTime desc`,
      )
    } catch {
      continue
    }

    for (const msg of msgsData.value ?? []) {
      const text =
        msg.body?.contentType === 'html'
          ? stripHtml(msg.body?.content ?? '')
          : msg.body?.content ?? ''
      const senderUpn = msg.from?.user?.userPrincipalName ?? ''
      const partner = detectPartner(text, senderUpn)
      const hits = matchesKeywords(text, settings.keywords)
      if (hits === 0 && !partner) continue

      const confidence = scoreConfidence(hits, !!partner)
      const date = msg.createdDateTime ?? new Date().toISOString()
      const lowerText = text.toLowerCase()
      const matchedAccount =
        settings.selectedAccounts.find((a) => lowerText.includes(a.toLowerCase())) ??
        chat.topic ?? 'Teams Chat'

      detections.push({
        id: `chat-${chat.id}-${msg.id}`,
        source: 'chat',
        confidence,
        title: chat.topic ?? `Teams chat with ${msg.from?.user?.displayName ?? senderUpn}`,
        date: formatDate(date),
        account: matchedAccount,
        partner: partner ?? senderUpn.split('@')[1] ?? 'Unknown',
        revenue: '',
        explanation: text.slice(0, 300),
        tag: 'new-opportunity',
        status: 'active',
      })
    }
  }
  return detections
}

// ---------------------------------------------------------------------------
// Calendar / meetings scan (Calendars.Read)
// ---------------------------------------------------------------------------

interface GraphEvent {
  id: string
  subject?: string
  bodyPreview?: string
  body?: { content?: string; contentType?: string }
  start?: { dateTime?: string }
  attendees?: { emailAddress?: { address?: string; name?: string } }[]
}

async function scanCalendar(
  token: string,
  settings: ScanSettings,
  since: string,
): Promise<Detection[]> {
  const detections: Detection[] = []
  const now = new Date().toISOString()

  let eventsData: { value?: GraphEvent[] }
  try {
    eventsData = await graphGet<{ value?: GraphEvent[] }>(
      token,
      `/me/calendarView?startDateTime=${since}&endDateTime=${now}` +
        `&$select=id,subject,bodyPreview,body,start,attendees&$top=50`,
    )
  } catch (err) {
    console.warn('Calendar scan failed:', err)
    return []
  }

  for (const event of eventsData.value ?? []) {
    const bodyText =
      event.body?.contentType === 'html'
        ? stripHtml(event.body?.content ?? '')
        : event.body?.content ?? event.bodyPreview ?? ''
    const attendeeEmails = (event.attendees ?? [])
      .map((a) => a.emailAddress?.address ?? '')
      .filter(Boolean)
    const combinedText = `${event.subject ?? ''} ${bodyText} ${attendeeEmails.join(' ')}`
    const partner =
      attendeeEmails.reduce<string | null>((found, email) => found ?? detectPartner('', email), null) ??
      detectPartner(combinedText)
    const hits = matchesKeywords(combinedText, settings.keywords)
    if (hits === 0 && !partner) continue

    const confidence = scoreConfidence(hits, !!partner)
    const date = event.start?.dateTime ?? new Date().toISOString()
    const lowerText = combinedText.toLowerCase()
    const matchedAccount =
      settings.selectedAccounts.find((a) => lowerText.includes(a.toLowerCase())) ?? 'Calendar Event'

    detections.push({
      id: `meeting-${event.id}`,
      source: 'meeting',
      confidence,
      title: event.subject ?? 'Meeting',
      date: formatDate(date),
      account: matchedAccount,
      partner: partner ?? attendeeEmails[0]?.split('@')[1] ?? 'Unknown',
      revenue: '',
      explanation: event.bodyPreview?.slice(0, 300) ?? '',
      tag: 'new-opportunity',
      status: 'active',
    })
  }
  return detections
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export interface GraphScanResult {
  detections: Detection[]
  errors: string[]
}

export async function runGraphScan(
  msalInstance: IPublicClientApplication,
  account: AccountInfo,
  settings: ScanSettings,
): Promise<GraphScanResult> {
  const since = dateFilterStart(settings.dateRange, settings.customStartDate)
  const detections: Detection[] = []
  const errors: string[] = []

  if (settings.sources.email) {
    const token = await acquireToken(msalInstance, account, ['Mail.Read'])
    if (token) detections.push(...await scanEmails(token, settings, since))
    else errors.push('Email scan skipped: Mail.Read permission not available.')
  }

  if (settings.sources.chat) {
    const token = await acquireToken(msalInstance, account, ['Chat.Read'])
    if (token) detections.push(...await scanChats(token, settings, since))
    else errors.push('Chat scan skipped: Chat.Read permission not available.')
  }

  if (settings.sources.meetings) {
    const token = await acquireToken(msalInstance, account, ['Calendars.Read'])
    if (token) detections.push(...await scanCalendar(token, settings, since))
    else errors.push('Meeting scan skipped: Calendars.Read permission not available.')
  }

  const seen = new Set<string>()
  const unique = detections.filter((d) => {
    if (seen.has(d.id)) return false
    seen.add(d.id)
    return true
  })

  unique.sort((a, b) => b.confidence - a.confidence)
  return { detections: unique, errors }
}
