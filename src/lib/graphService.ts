/**
 *
 *
 * Fetches real emails, Teams chats/messages, and calendar events
 * Required Azure AD app permissions (delegated):
 *
 *
 * If a scope hasn't been consented 
 *   Chat.Read         – Teams chat messages
 *   Calendars.Read    – calendar events / meeting details
 *
 * The MSAL instance silently acquires tokens with these scopes at scan time.
 * If a scope hasn't been consented the source is skipped and a warning logged.
 */

import type { IPublicClientApplication, AccountInfo } from '@azure/msal-browser'
// ---------------------------------------------------

    domains: ['accenture.com'],

    name: 'Infosys',
    keywords: ['infosys'],
  {
    domains: ['wipro.com'],
  }
    name: 'HCL Technol
    keywords: ['hcl technologie
  {
    
  }
    name: 'Capgemini
    keywords: ['capgemini'],
  {
    
  }
    name: 'KPMG',
    keywords: ['kpmg'],
]
// -
// 
function dateFilterStart(date
  const now = new Date()
    last3days: 3,
    
  }
  now.setDate(no
}
function detectPartner(text: string, senderE
  fo
   
    if (p.keywords.som
  return null

  co
}
function scoreConfide
  base += Math.min(keywordHits
  return Math.min(base, 99)

  r
    month: 'long'
  })

  re


  })
    const 
  }

// ---------------------------------------------------------------------------
// ------------------------------------------------------------
async function acquireTo
  account: AccountInfo,
): Promise<string
    const result
  } catch {
      const result
   
      return null
  }

/

  id: string
  bodyPreview?: string
  receivedDateTime?: string
  from?: { emailAddress?: { address?: string; name?: string } }
  ccRecipients?: { 

  token: string,
  s
  const detec
 



  try {
 


    const textC
      ' ' +
        ? stripHtml(msg.body

 


    const date = msg.receivedDateTime ?? msg.sentDat
    // Try to match 
    const matchedA

    
 

      date: formatDate(date),
      partner: partner ?? senderEmail.split('@')[1] ?? 'Unknown Pa
 

  }
  return detections

// T

  id: string
  chatType?: string
}
interface GraphChatMessage {
 


  token: string,
  since: string,

  let chatsData: { value?: G
    chatsData = await graphGet<{ value?: 
      `/me/chats?$filte
  } catch (err) {
    return []

    let msgsData: { value?: GraphChatMessage[] }
      msgsData = await graphG
        `/m
    } cat
    }
    for (const msg of msgsData.
        msg.body?.conten
          : msg.body?.content ?? ''
      const sende
     
   
 

        settings.selectedAccounts.find((a) => lowerText.includes(a.toLowerCase
        'Teams Chat'
      detections.push({

        title:
          `T
        account: m
        revenue: '',
        tag: 'new-opportunity',
      })
  }
  return detections

// Calendar / meetings scan  (Calendars.Read)


  bodyPreview?: string
  start?: { date
  attendees?: { emailAddr
  onlineMeetingP

  const detections: Detection[] = []
  const keywordFilter = settings.keywords.map((k) => `"${k}"`).join(' OR ')
  const search = keywordFilter ? `&$search=${encodeURIComponent(keywordFilter)}` : ''
  const filter = `&$filter=receivedDateTime ge ${since}`
  const select =
    '$select=id,subject,bodyPreview,body,receivedDateTime,from,toRecipients,ccRecipients'

  const url = `/me/messages?${select}${filter}${search}&$top=50&$orderby=receivedDateTime desc`

  let data: { value?: GraphMessage[] }
  try {
    data = await graphGet<{ value?: GraphMessage[] }>(token, url)
  } catch (err) {
    console.warn('Email scan failed:', err)
    return []
  }

  for (const msg of data.value ?? []) {
    const textContent =
      msg.subject +
      ' ' +
      (msg.body?.contentType === 'html'
        ? stripHtml(msg.body?.content ?? '')
        : msg.body?.content ?? msg.bodyPreview ?? '')

    const senderEmail = msg.from?.emailAddress?.address ?? ''
    const partner = detectPartner(textContent, senderEmail)
    const hits = matchesKeywords(textContent, settings.keywords)

    if (hits === 0 && !partner) continue

    const confidence = scoreConfidence(hits, !!partner)
    const date = msg.receivedDateTime ?? msg.sentDateTime ?? new Date().toISOString()

    // Try to match an account name from settings
    const lowerText = textContent.toLowerCase()
    const matchedAccount =
      settings.selectedAccounts.find((a) => lowerText.includes(a.toLowerCase())) ?? 'Unknown Account'

    detections.push({
      id: `email-${msg.id}`,
      source: 'email',
      confidence,
      title:
        msg.subject ??
        `Email from ${msg.from?.emailAddress?.name ?? senderEmail}`,
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
// Teams chat scan  (Chat.Read)
// ---------------------------------------------------------------------------

interface GraphChat {
  id: string
  topic?: string
  chatType?: string
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
        chat.topic ??
        'Teams Chat'

      detections.push({
        id: `chat-${chat.id}-${msg.id}`,
        source: 'chat',
        confidence,
        title:
          chat.topic ??
          `Teams chat with ${msg.from?.user?.displayName ?? senderUpn}`,
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
// Calendar / meetings scan  (Calendars.Read)
// ---------------------------------------------------------------------------

interface GraphEvent {
  id: string
  subject?: string
  bodyPreview?: string
  body?: { content?: string; contentType?: string }
  start?: { dateTime?: string }
  end?: { dateTime?: string }
  attendees?: { emailAddress?: { address?: string; name?: string } }[]
  isOnlineMeeting?: boolean
  onlineMeetingProvider?: string
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
        `&$select=id,subject,bodyPreview,body,start,end,attendees,isOnlineMeeting,onlineMeetingProvider` +
        `&$top=50`,
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
    const partnerFromAttendee = attendeeEmails.reduce<string | null>(
      (found, email) => found ?? detectPartner('', email),
      null,
    )
    const partnerFromBody = detectPartner(combinedText)
    const partner = partnerFromAttendee ?? partnerFromBody

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

  // ---- Emails ----
  if (settings.sources.email) {
    const token = await acquireToken(msalInstance, account, ['Mail.Read'])
    if (token) {
      const results = await scanEmails(token, settings, since)
      detections.push(...results)
    } else {
      errors.push('Email scan skipped: Mail.Read permission not available.')
    }
  }




































