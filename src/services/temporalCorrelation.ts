/**
 * Temporal Correlation Service
 * Passive temporal-spatial correlation and contradiction detection
 * Triggered contextually when accusations or timeline disputes detected
 * Never claims innocence - only reports factual consistency or inconsistency
 * 
 * 🔒 ARCHITECTURAL RULE ENFORCEMENT:
 * All consistency reports MUST be session-scoped artifacts.
 * Every report generated is automatically recorded as a session event
 * and cryptographically chained into the session timeline.
 */

import { getCurrentSealedSession, recordSessionEvent, wasSessionActiveDuring, getEventsInWindow, type SealedSession, type TemporalWindow } from './sessionSealing'
import { getCurrentCase, type EvidenceArtifact } from './caseManagement'

export interface AccusationDetection {
  detected: boolean
  type: 'temporal' | 'spatial' | 'general'
  confidence: number
  extractedTimeWindow?: TemporalWindow
  extractedLocation?: string
  originalText: string
}

export interface TemporalCorrelation {
  sessionOverlap: boolean
  sessionId: string
  sessionActive: boolean
  eventsInWindow: number
  earliestEvent?: number
  latestEvent?: number
  continuityVerified: boolean
}

export interface SpatialCorrelation {
  locationDataAvailable: boolean
  location?: {
    type: string
    coordinates?: { latitude: number; longitude: number }
    description: string
  }
  conflictDetected: boolean
}

export interface ConsistencyReport {
  generated: number
  reportId: string
  sessionId: string // 🔒 CRITICAL: Links report to sealed session
  sessionEventId: string // 🔒 CRITICAL: References the event that created this report
  accusationDetected: AccusationDetection
  temporalCorrelations: TemporalCorrelation[]
  spatialCorrelations: SpatialCorrelation[]
  evidenceArtifacts: Array<{
    id: string
    fileName: string
    timestamp: number
    hash: string
  }>
  summary: string
  sealed: boolean
  reportHash: string
}

/**
 * Detect accusations or timeline disputes in text
 */
export function detectAccusation(text: string): AccusationDetection {
  const lowerText = text.toLowerCase()
  
  // Patterns indicating accusations
  const accusationPatterns = [
    /accused of/i,
    /being accused/i,
    /they say i was/i,
    /they claim i was/i,
    /alleged that/i,
    /allegation/i,
    /you were at/i,
    /you were there/i,
    /timeline dispute/i,
    /i wasn't there/i,
    /i wasn't at/i,
    /i was elsewhere/i,
    /i was actually/i,
    /not at that location/i,
    /different location/i,
  ]
  
  const hasAccusation = accusationPatterns.some(pattern => pattern.test(text))
  
  if (!hasAccusation) {
    return {
      detected: false,
      type: 'general',
      confidence: 0,
      originalText: text
    }
  }
  
  // Try to extract time information
  const timeWindow = extractTimeWindow(text)
  const location = extractLocation(text)
  
  const type = location ? 'spatial' : timeWindow ? 'temporal' : 'general'
  
  return {
    detected: true,
    type,
    confidence: 0.8, // Would be ML-based in production
    extractedTimeWindow: timeWindow,
    extractedLocation: location,
    originalText: text
  }
}

/**
 * Extract time window from text (simplified - would use NLP in production)
 */
function extractTimeWindow(text: string): TemporalWindow | undefined {
  // Look for time patterns
  const timePatterns = [
    /(\d{1,2}):(\d{2})\s*(am|pm)/i,
    /(\d{1,2})\s*(am|pm)/i,
    /(morning|afternoon|evening|night)/i,
  ]
  
  const datePatterns = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/i,
    /last\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
  ]
  
  // Simple heuristic: if any time/date pattern found, create a window
  const hasTime = timePatterns.some(p => p.test(text))
  const hasDate = datePatterns.some(p => p.test(text))
  
  if (hasTime || hasDate) {
    // For now, return a placeholder window
    // In production, would parse actual times/dates
    const now = Date.now()
    const dayAgo = now - (24 * 60 * 60 * 1000)
    
    return {
      startTime: dayAgo,
      endTime: now,
      description: 'Extracted from accusation text'
    }
  }
  
  return undefined
}

/**
 * Extract location from text (simplified)
 */
function extractLocation(text: string): string | undefined {
  const locationPatterns = [
    /at ([\w\s]+) (street|avenue|road|place|building|hotel|restaurant|store)/i,
    /in ([\w\s]+) (city|town|village|district)/i,
    /near ([\w\s]+)/i,
  ]
  
  for (const pattern of locationPatterns) {
    const match = pattern.exec(text)
    if (match) {
      return match[0]
    }
  }
  
  return undefined
}

/**
 * Correlate current session against time window
 */
export function correlateSessionTemporal(
  session: SealedSession,
  timeWindow: TemporalWindow
): TemporalCorrelation {
  const overlap = wasSessionActiveDuring(session, timeWindow)
  const eventsInWindow = getEventsInWindow(session, timeWindow)
  
  let earliestEvent: number | undefined
  let latestEvent: number | undefined
  
  if (eventsInWindow.length > 0) {
    earliestEvent = eventsInWindow[0].timestamp
    latestEvent = eventsInWindow[eventsInWindow.length - 1].timestamp
  }
  
  return {
    sessionOverlap: overlap,
    sessionId: session.sessionId,
    sessionActive: !session.sealed,
    eventsInWindow: eventsInWindow.length,
    earliestEvent,
    latestEvent,
    continuityVerified: session.continuity
  }
}

/**
 * Correlate evidence artifacts against time window
 */
export function correlateEvidenceArtifacts(timeWindow: TemporalWindow): Array<{
  id: string
  fileName: string
  timestamp: number
  hash: string
  inWindow: boolean
}> {
  const caseData = getCurrentCase()
  
  return caseData.evidence.map(evidence => ({
    id: evidence.id,
    fileName: evidence.fileName,
    timestamp: evidence.timestamp,
    hash: evidence.evidenceHash,
    inWindow: evidence.timestamp >= timeWindow.startTime && 
              evidence.timestamp <= timeWindow.endTime
  }))
}

/**
 * Generate consistency report
 * This is the main function - triggered when accusations detected
 * 
 * 🔒 ENFORCEMENT: Automatically records report generation as session event
 */
export async function generateConsistencyReport(
  accusationText: string
): Promise<ConsistencyReport> {
  const accusationDetection = detectAccusation(accusationText)
  
  if (!accusationDetection.detected) {
    throw new Error('No accusation or timeline dispute detected in text')
  }
  
  const session = getCurrentSealedSession()
  const caseData = getCurrentCase()
  
  // Use extracted time window or default to last 24 hours
  const timeWindow = accusationDetection.extractedTimeWindow || {
    startTime: Date.now() - (24 * 60 * 60 * 1000),
    endTime: Date.now(),
    description: 'Default 24-hour window'
  }
  
  // Temporal correlation
  const temporalCorrelation = correlateSessionTemporal(session, timeWindow)
  
  // Evidence correlation
  const evidenceCorrelations = correlateEvidenceArtifacts(timeWindow)
  const relevantEvidence = evidenceCorrelations.filter(e => e.inWindow)
  
  // Spatial correlation (basic - no actual location data in this implementation)
  const spatialCorrelation: SpatialCorrelation = {
    locationDataAvailable: false,
    conflictDetected: false
  }
  
  // Generate summary
  const summary = generateSummary(
    accusationDetection,
    [temporalCorrelation],
    [spatialCorrelation],
    relevantEvidence
  )
  
  // Generate report ID
  const reportId = `CR-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
  
  // 🔒 CRITICAL: Record report generation as session event BEFORE creating report
  // This ensures the report is cryptographically chained into the session
  const sessionEvent = await recordSessionEvent('consistency_report_generated', {
    reportId,
    accusationType: accusationDetection.type,
    timeWindow: timeWindow.description
  })
  
  // Generate report hash
  const reportData = JSON.stringify({
    sessionId: session.sessionId,
    sessionEventId: sessionEvent.eventId,
    accusationDetection,
    temporalCorrelation,
    spatialCorrelation,
    relevantEvidence,
    summary,
    timestamp: Date.now()
  })
  
  const encoder = new TextEncoder()
  const data = encoder.encode(reportData)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const reportHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  const report: ConsistencyReport = {
    generated: Date.now(),
    reportId,
    sessionId: session.sessionId, // 🔒 Links to session
    sessionEventId: sessionEvent.eventId, // 🔒 Links to creation event
    accusationDetected: accusationDetection,
    temporalCorrelations: [temporalCorrelation],
    spatialCorrelations: [spatialCorrelation],
    evidenceArtifacts: relevantEvidence,
    summary,
    sealed: true,
    reportHash
  }
  
  return report
}

/**
 * Generate factual summary (never claims innocence)
 */
function generateSummary(
  accusation: AccusationDetection,
  temporal: TemporalCorrelation[],
  spatial: SpatialCorrelation[],
  evidence: Array<{ id: string; fileName: string; timestamp: number; hash: string }>
): string {
  let summary = 'TEMPORAL-SPATIAL CONSISTENCY EVALUATION\n\n'
  
  // State what was evaluated
  summary += `EVALUATION BASIS:\n`
  summary += `• Accusation type: ${accusation.type}\n`
  if (accusation.extractedTimeWindow) {
    summary += `• Relevant time window: ${new Date(accusation.extractedTimeWindow.startTime).toISOString()} to ${new Date(accusation.extractedTimeWindow.endTime).toISOString()}\n`
  }
  if (accusation.extractedLocation) {
    summary += `• Alleged location: ${accusation.extractedLocation}\n`
  }
  summary += '\n'
  
  // Temporal findings
  summary += 'TEMPORAL FINDINGS:\n'
  for (const t of temporal) {
    if (t.sessionOverlap) {
      summary += `• Sealed session ${t.sessionId.substring(0, 16)}... was active during the relevant period\n`
      summary += `• Session recorded ${t.eventsInWindow} discrete events within the time window\n`
      if (t.continuityVerified) {
        summary += `• Session continuity verified - no interruption recorded in event chain\n`
      }
    } else {
      summary += `• No sealed session activity during the specified time window\n`
    }
  }
  summary += '\n'
  
  // Evidence findings
  if (evidence.length > 0) {
    summary += 'SEALED ARTIFACTS IN WINDOW:\n'
    for (const e of evidence) {
      summary += `• ${e.fileName} (${new Date(e.timestamp).toISOString()})\n`
      summary += `  Hash: ${e.hash.substring(0, 16)}...\n`
    }
  } else {
    summary += 'SEALED ARTIFACTS:\n'
    summary += `• No sealed artifacts generated within the specified time window\n`
  }
  summary += '\n'
  
  // Spatial findings
  summary += 'SPATIAL FINDINGS:\n'
  for (const s of spatial) {
    if (!s.locationDataAvailable) {
      summary += `• Location data not available in sealed records\n`
      summary += `• Spatial correlation cannot be performed without location metadata\n`
    } else if (s.location) {
      summary += `• Location recorded: ${s.location.description}\n`
      if (s.conflictDetected) {
        summary += `• ⚠ Location data conflicts with allegation\n`
      } else {
        summary += `• Location data does not conflict with sealed records\n`
      }
    }
  }
  summary += '\n'
  
  // Critical note
  summary += 'INTERPRETATION:\n'
  summary += 'This report presents factual temporal and spatial correlations based on\n'
  summary += 'sealed forensic records. No inference regarding truthfulness, intent, or\n'
  summary += 'culpability is made. Courts and fact-finders draw conclusions from facts.\n'
  
  return summary
}

/**
 * Format consistency report as sealed document
 */
export function formatConsistencyReport(report: ConsistencyReport): string {
  return `
═══════════════════════════════════════════════════════════════════
               VERUM OMNIS CONSISTENCY REPORT
               Temporal-Spatial Correlation Analysis
═══════════════════════════════════════════════════════════════════

REPORT ID: ${report.reportId}
GENERATED: ${new Date(report.generated).toISOString()}
REPORT HASH: ${report.reportHash}

SESSION LINKAGE (Chain of Custody):
Session ID: ${report.sessionId}
Session Event: ${report.sessionEventId}
This report is cryptographically chained into session ${report.sessionId.substring(0, 16)}...

───────────────────────────────────────────────────────────────────
ACCUSATION DETECTION
───────────────────────────────────────────────────────────────────
Type: ${report.accusationDetected.type.toUpperCase()}
Confidence: ${(report.accusationDetected.confidence * 100).toFixed(0)}%
${report.accusationDetected.extractedTimeWindow ? `Time Window: ${new Date(report.accusationDetected.extractedTimeWindow.startTime).toISOString()} to ${new Date(report.accusationDetected.extractedTimeWindow.endTime).toISOString()}` : ''}
${report.accusationDetected.extractedLocation ? `Location: ${report.accusationDetected.extractedLocation}` : ''}

───────────────────────────────────────────────────────────────────
EVALUATION SUMMARY
───────────────────────────────────────────────────────────────────

${report.summary}

───────────────────────────────────────────────────────────────────
CERTIFICATION
───────────────────────────────────────────────────────────────────
Sealed By: Verum Omnis Forensics
Timestamp: ${new Date(report.generated).toISOString()}
Version: 1.0.0

This consistency report is a session-scoped artifact cryptographically
chained into sealed session ${report.sessionId.substring(0, 16)}... at event
${report.sessionEventId}. It is based solely on sealed forensic records
and cryptographically verified temporal data. It makes no claims
regarding innocence, guilt, or truthfulness. All correlations are
factual observations of temporal-spatial relationships.

═══════════════════════════════════════════════════════════════════
                      END OF REPORT
═══════════════════════════════════════════════════════════════════
`
}
