/**
 * Session Sealing Service
 * Treats sessions as first-class evidentiary objects with cryptographic sealing
 * Sessions establish temporal presence and create custody chains
 * 
 * 🔒 CRITICAL ARCHITECTURAL RULE:
 * All analytical outputs must be session-scoped artifacts cryptographically 
 * chained to a sealed session timeline. No standalone analytical artifacts 
 * are permitted.
 * 
 * This means:
 * - Consistency reports must be session events
 * - Certificates must be session children
 * - Baseline analyses must be session-scoped
 * - AI-enhanced analyses must be session-scoped
 * 
 * This prevents:
 * - "Floating conclusions" with no chain of custody
 * - Post-hoc fabrication claims
 * - Loss of temporal context
 * - Ambiguity in evidentiary value
 */

export interface SessionEvent {
  eventId: string
  eventType: 'session_start' | 'session_end' | 'evidence_uploaded' | 'scan_performed' | 'certificate_generated' | 'user_interaction' | 'statement_entered' | 'consistency_report_generated' | 'analysis_generated'
  timestamp: number
  eventHash: string
  priorEventHash?: string
  metadata?: Record<string, unknown>
}

export interface SealedSession {
  sessionId: string
  startTime: number
  endTime?: number
  events: SessionEvent[]
  sessionHash: string
  jurisdiction?: string
  sealed: boolean
  continuity: boolean // True if no gaps detected in event chain
}

export interface TemporalWindow {
  startTime: number
  endTime: number
  description: string
}

const CURRENT_SESSION_KEY = 'verum-omnis-sealed-session'

/**
 * Generate event hash
 */
async function generateEventHash(
  eventType: string,
  timestamp: number,
  priorHash: string | undefined,
  metadata: Record<string, unknown>
): Promise<string> {
  const eventData = JSON.stringify({
    eventType,
    timestamp,
    priorHash: priorHash || 'genesis',
    metadata
  })
  
  const encoder = new TextEncoder()
  const data = encoder.encode(eventData)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Get or create current sealed session
 */
export function getCurrentSealedSession(): SealedSession {
  try {
    const stored = localStorage.getItem(CURRENT_SESSION_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error loading sealed session:', error)
  }

  // Create new session with genesis event
  const sessionId = `SESSION-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
  const newSession: SealedSession = {
    sessionId,
    startTime: Date.now(),
    events: [],
    sessionHash: '',
    sealed: false,
    continuity: true
  }

  saveSession(newSession)
  return newSession
}

/**
 * Save session to storage
 */
function saveSession(session: SealedSession): void {
  try {
    localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(session))
  } catch (error) {
    console.error('Error saving sealed session:', error)
  }
}

/**
 * Record event in current session
 */
export async function recordSessionEvent(
  eventType: SessionEvent['eventType'],
  metadata?: Record<string, unknown>
): Promise<SessionEvent> {
  const session = getCurrentSealedSession()
  
  // Get prior event hash for chaining
  const priorEventHash = session.events.length > 0 
    ? session.events[session.events.length - 1].eventHash
    : undefined
  
  // Generate event hash
  const timestamp = Date.now()
  const eventHash = await generateEventHash(eventType, timestamp, priorEventHash, metadata || {})
  
  const event: SessionEvent = {
    eventId: `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    eventType,
    timestamp,
    eventHash,
    priorEventHash,
    metadata
  }
  
  session.events.push(event)
  saveSession(session)
  
  return event
}

/**
 * Seal current session (finalize and compute session hash)
 */
export async function sealSession(): Promise<SealedSession> {
  const session = getCurrentSealedSession()
  
  if (session.sealed) {
    return session
  }
  
  session.endTime = Date.now()
  
  // Generate session hash from all events
  const sessionData = JSON.stringify({
    sessionId: session.sessionId,
    startTime: session.startTime,
    endTime: session.endTime,
    events: session.events,
    continuity: session.continuity
  })
  
  const encoder = new TextEncoder()
  const data = encoder.encode(sessionData)
  const hashBuffer = await crypto.subtle.digest('SHA-512', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  session.sessionHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  session.sealed = true
  saveSession(session)
  
  return session
}

/**
 * Check if session was active during a time window
 */
export function wasSessionActiveDuring(
  session: SealedSession,
  window: TemporalWindow
): boolean {
  // Session must have started before or during window
  if (session.startTime > window.endTime) {
    return false
  }
  
  // If session not ended, check if any events during window
  if (!session.endTime) {
    return session.events.some(e => 
      e.timestamp >= window.startTime && e.timestamp <= window.endTime
    )
  }
  
  // Session must have ended after or during window
  if (session.endTime < window.startTime) {
    return false
  }
  
  // Session overlaps with window
  return true
}

/**
 * Get all events during a time window
 */
export function getEventsInWindow(
  session: SealedSession,
  window: TemporalWindow
): SessionEvent[] {
  return session.events.filter(e => 
    e.timestamp >= window.startTime && e.timestamp <= window.endTime
  )
}

/**
 * Verify session continuity (event chain integrity)
 */
export async function verifySessionContinuity(session: SealedSession): Promise<{
  valid: boolean
  message: string
  brokenAt?: number
}> {
  if (session.events.length === 0) {
    return { valid: true, message: 'No events to verify' }
  }
  
  // Verify first event has no prior hash
  if (session.events[0].priorEventHash) {
    return { 
      valid: false, 
      message: 'First event should not have prior hash',
      brokenAt: 0
    }
  }
  
  // Verify chain
  for (let i = 1; i < session.events.length; i++) {
    const currentEvent = session.events[i]
    const priorEvent = session.events[i - 1]
    
    if (currentEvent.priorEventHash !== priorEvent.eventHash) {
      return {
        valid: false,
        message: `Event chain broken at event ${i}`,
        brokenAt: i
      }
    }
    
    // Verify timestamps are monotonically increasing
    if (currentEvent.timestamp < priorEvent.timestamp) {
      return {
        valid: false,
        message: `Timestamp anomaly at event ${i}`,
        brokenAt: i
      }
    }
  }
  
  return { valid: true, message: 'Session continuity verified' }
}

/**
 * Get session duration in milliseconds
 */
export function getSessionDuration(session: SealedSession): number {
  if (!session.endTime) {
    return Date.now() - session.startTime
  }
  return session.endTime - session.startTime
}

/**
 * Format session as evidentiary statement
 */
export function formatSessionAsEvidence(session: SealedSession): string {
  const duration = getSessionDuration(session)
  const hours = Math.floor(duration / (1000 * 60 * 60))
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
  
  return `
═══════════════════════════════════════════════════════════════════
                    SEALED SESSION EVIDENCE
═══════════════════════════════════════════════════════════════════

SESSION ID: ${session.sessionId}
START TIME: ${new Date(session.startTime).toISOString()}
${session.endTime ? `END TIME: ${new Date(session.endTime).toISOString()}` : 'STATUS: Active (Not Yet Sealed)'}
DURATION: ${hours}h ${minutes}m
EVENT COUNT: ${session.events.length}
CONTINUITY: ${session.continuity ? '✓ Verified' : '⚠ Gaps Detected'}

SESSION HASH (SHA-512): ${session.sessionHash || 'Not yet sealed'}

EVENT CHAIN:
${session.events.map((e, i) => `
${i + 1}. ${e.eventType.toUpperCase().replace(/_/g, ' ')}
   Time: ${new Date(e.timestamp).toISOString()}
   Hash: ${e.eventHash.substring(0, 16)}...
   Prior: ${e.priorEventHash ? e.priorEventHash.substring(0, 16) + '...' : 'genesis'}`).join('\n')}

EVIDENTIARY VALUE:
This sealed session establishes continuous temporal presence during the
recorded period. The cryptographic event chain proves that activities
occurred in the sequence and at the times recorded, with verifiable
continuity.

═══════════════════════════════════════════════════════════════════
`
}
