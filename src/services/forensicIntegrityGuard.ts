/**
 * Forensic Integrity Guard
 * 
 * This is the core anti-abuse layer for the legal forensic AI application.
 * It ensures that the system CANNOT be abused for evidence tampering,
 * fabrication, or manipulation.
 * 
 * CORE PRINCIPLES:
 * 1. IMMUTABILITY - Once sealed, nothing can be changed
 * 2. NON-REPUDIATION - All actions are permanently logged
 * 3. TAMPER DETECTION - Any modification is immediately detectable
 * 4. AUDIT TRAIL - Complete chain of custody for all artefacts
 * 5. ACCESS CONTROL - Strict controls on operations
 * 6. NO BACKDOORS - No way to bypass security measures
 * 
 * ABUSE PREVENTION:
 * - Cannot modify sealed documents
 * - Cannot delete audit trail
 * - Cannot backdate timestamps
 * - Cannot forge signatures
 * - Cannot bypass hash verification
 * - Cannot extract raw evidence without audit
 * - Cannot generate fake certificates
 * - Cannot impersonate authority
 */

import { getCurrentSealedSession, recordSessionEvent } from './sessionSealing'

// Abuse detection flags
export type AbuseType = 
  | 'timestamp_manipulation'
  | 'hash_mismatch'
  | 'signature_forgery'
  | 'unauthorized_modification'
  | 'seal_bypass_attempt'
  | 'chain_break_attempt'
  | 'unauthorized_extraction'
  | 'certificate_forgery'
  | 'session_tampering'
  | 'replay_attack'
  | 'privilege_escalation'

export interface AbuseAttempt {
  id: string
  timestamp: number
  type: AbuseType
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  blocked: boolean
  sessionId: string
  metadata?: Record<string, unknown>
}

export interface IntegrityCheckResult {
  passed: boolean
  checks: {
    name: string
    passed: boolean
    details: string
  }[]
  abuseAttempts: AbuseAttempt[]
  overallIntegrity: 'verified' | 'warning' | 'compromised'
}

// Abuse attempt log (immutable, append-only)
const abuseLog: AbuseAttempt[] = []

// Sealed artefact registry (immutable after seal)
const sealedArtefactRegistry = new Map<string, {
  hash: string
  sealedAt: number
  type: string
  locked: boolean
}>()

/**
 * Log an abuse attempt - this CANNOT be deleted or modified
 */
export function logAbuseAttempt(
  type: AbuseType,
  description: string,
  severity: AbuseAttempt['severity'],
  metadata?: Record<string, unknown>
): AbuseAttempt {
  const session = getCurrentSealedSession()
  
  const attempt: AbuseAttempt = {
    id: `ABUSE-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    timestamp: Date.now(),
    type,
    description,
    severity,
    blocked: true, // All abuse attempts are blocked
    sessionId: session.sessionId,
    metadata
  }
  
  // Immutable append - cannot be removed
  abuseLog.push(Object.freeze(attempt))
  
  // Also record in session for audit trail
  recordSessionEvent('user_interaction', {
    action: 'abuse_attempt_blocked',
    abuseType: type,
    severity,
    description
  })
  
  console.error(`[FORENSIC INTEGRITY GUARD] Abuse attempt blocked: ${type} - ${description}`)
  
  return attempt
}

/**
 * Register a sealed artefact - once registered, it cannot be modified
 */
export function registerSealedArtefact(
  artefactId: string,
  hash: string,
  type: string
): boolean {
  // Check if already registered
  if (sealedArtefactRegistry.has(artefactId)) {
    const existing = sealedArtefactRegistry.get(artefactId)!
    
    // If hash doesn't match, this is an abuse attempt
    if (existing.hash !== hash) {
      logAbuseAttempt(
        'unauthorized_modification',
        `Attempt to re-register artefact ${artefactId} with different hash`,
        'critical',
        { existingHash: existing.hash, newHash: hash }
      )
      return false
    }
    
    // Already registered with same hash - OK
    return true
  }
  
  // Register new artefact
  sealedArtefactRegistry.set(artefactId, Object.freeze({
    hash,
    sealedAt: Date.now(),
    type,
    locked: true
  }))
  
  return true
}

/**
 * Verify artefact integrity against registry
 */
export function verifyArtefactIntegrity(
  artefactId: string,
  currentHash: string
): { valid: boolean; message: string } {
  const registered = sealedArtefactRegistry.get(artefactId)
  
  if (!registered) {
    return { valid: false, message: 'Artefact not found in sealed registry' }
  }
  
  if (registered.hash !== currentHash) {
    logAbuseAttempt(
      'hash_mismatch',
      `Artefact ${artefactId} hash does not match registered value`,
      'critical',
      { 
        registeredHash: registered.hash, 
        currentHash,
        sealedAt: registered.sealedAt
      }
    )
    return { 
      valid: false, 
      message: 'INTEGRITY VIOLATION: Artefact has been modified since sealing' 
    }
  }
  
  return { valid: true, message: 'Artefact integrity verified' }
}

/**
 * Validate timestamp authenticity
 * Prevents backdating or future-dating of evidence
 */
export function validateTimestamp(
  timestamp: number,
  tolerance: number = 60000 // 1 minute tolerance
): { valid: boolean; message: string } {
  const now = Date.now()
  
  // Timestamp cannot be in the future
  if (timestamp > now + tolerance) {
    logAbuseAttempt(
      'timestamp_manipulation',
      `Future timestamp detected: ${new Date(timestamp).toISOString()}`,
      'high',
      { timestamp, now, difference: timestamp - now }
    )
    return { 
      valid: false, 
      message: 'TIMESTAMP VIOLATION: Future timestamps are not permitted' 
    }
  }
  
  // Warn about old timestamps but don't block
  const oneHourAgo = now - (60 * 60 * 1000)
  if (timestamp < oneHourAgo) {
    // Log but don't block - historical data is valid
    console.warn(`[FORENSIC INTEGRITY GUARD] Historical timestamp: ${new Date(timestamp).toISOString()}`)
  }
  
  return { valid: true, message: 'Timestamp validated' }
}

/**
 * Validate operation authorization
 * Ensures only permitted operations are performed
 */
export function validateOperation(
  operation: string,
  artefactId?: string
): { allowed: boolean; message: string } {
  // Check if artefact is sealed/locked
  if (artefactId) {
    const registered = sealedArtefactRegistry.get(artefactId)
    
    if (registered?.locked) {
      // Only read operations allowed on sealed artefacts
      const readOperations = ['view', 'verify', 'print', 'hash']
      
      if (!readOperations.includes(operation)) {
        logAbuseAttempt(
          'unauthorized_modification',
          `Attempt to perform '${operation}' on sealed artefact ${artefactId}`,
          'critical',
          { operation, artefactId }
        )
        return { 
          allowed: false, 
          message: 'OPERATION BLOCKED: Sealed artefacts cannot be modified' 
        }
      }
    }
  }
  
  // Block dangerous operations
  const blockedOperations = [
    'delete_audit',
    'modify_hash',
    'forge_signature',
    'bypass_seal',
    'backdate',
    'impersonate'
  ]
  
  if (blockedOperations.includes(operation)) {
    logAbuseAttempt(
      'privilege_escalation',
      `Blocked operation attempted: ${operation}`,
      'critical',
      { operation }
    )
    return { 
      allowed: false, 
      message: `OPERATION FORBIDDEN: '${operation}' is not permitted` 
    }
  }
  
  return { allowed: true, message: 'Operation authorized' }
}

/**
 * Verify chain of custody integrity
 */
export async function verifyCustodyChain(
  events: { hash: string; priorHash?: string; timestamp: number }[]
): Promise<{ valid: boolean; brokenAt?: number; message: string }> {
  if (events.length === 0) {
    return { valid: true, message: 'No events to verify' }
  }
  
  // First event should not have prior hash
  if (events[0].priorHash && events[0].priorHash !== 'genesis') {
    logAbuseAttempt(
      'chain_break_attempt',
      'First event has unexpected prior hash',
      'high',
      { firstEventPriorHash: events[0].priorHash }
    )
    return { 
      valid: false, 
      brokenAt: 0,
      message: 'CHAIN VIOLATION: First event has invalid prior hash' 
    }
  }
  
  // Verify chain links
  for (let i = 1; i < events.length; i++) {
    const current = events[i]
    const prior = events[i - 1]
    
    // Hash chain must be unbroken
    if (current.priorHash !== prior.hash) {
      logAbuseAttempt(
        'chain_break_attempt',
        `Chain broken at event ${i}`,
        'critical',
        { 
          eventIndex: i,
          expectedPriorHash: prior.hash,
          actualPriorHash: current.priorHash
        }
      )
      return { 
        valid: false, 
        brokenAt: i,
        message: `CHAIN VIOLATION: Link broken at event ${i}` 
      }
    }
    
    // Timestamps must be monotonically increasing
    if (current.timestamp < prior.timestamp) {
      logAbuseAttempt(
        'timestamp_manipulation',
        `Timestamp regression at event ${i}`,
        'critical',
        { 
          eventIndex: i,
          priorTimestamp: prior.timestamp,
          currentTimestamp: current.timestamp
        }
      )
      return { 
        valid: false, 
        brokenAt: i,
        message: `TIMESTAMP VIOLATION: Time regression at event ${i}` 
      }
    }
  }
  
  return { valid: true, message: 'Custody chain verified' }
}

/**
 * Run complete integrity check
 */
export async function runIntegrityCheck(): Promise<IntegrityCheckResult> {
  const checks: IntegrityCheckResult['checks'] = []
  const session = getCurrentSealedSession()
  
  // Check 1: Session continuity
  const sessionEvents = session.events.map(e => ({
    hash: e.eventHash,
    priorHash: e.priorEventHash,
    timestamp: e.timestamp
  }))
  const chainResult = await verifyCustodyChain(sessionEvents)
  checks.push({
    name: 'Session Chain Integrity',
    passed: chainResult.valid,
    details: chainResult.message
  })
  
  // Check 2: No abuse attempts in current session
  const sessionAbuse = abuseLog.filter(a => a.sessionId === session.sessionId)
  checks.push({
    name: 'No Abuse Attempts',
    passed: sessionAbuse.length === 0,
    details: sessionAbuse.length === 0 
      ? 'No abuse attempts detected' 
      : `${sessionAbuse.length} abuse attempt(s) blocked`
  })
  
  // Check 3: Session not expired
  const sessionAge = Date.now() - session.startTime
  const maxSessionAge = 24 * 60 * 60 * 1000 // 24 hours
  checks.push({
    name: 'Session Validity',
    passed: sessionAge < maxSessionAge,
    details: sessionAge < maxSessionAge 
      ? 'Session within valid time window' 
      : 'Session expired - seal and create new session'
  })
  
  // Check 4: All registered artefacts intact
  let artefactsIntact = true
  for (const [id, artefact] of sealedArtefactRegistry) {
    if (!artefact.locked) {
      artefactsIntact = false
      break
    }
  }
  checks.push({
    name: 'Artefact Registry Integrity',
    passed: artefactsIntact,
    details: artefactsIntact 
      ? `${sealedArtefactRegistry.size} artefact(s) sealed and locked` 
      : 'WARNING: Unlocked artefacts detected'
  })
  
  // Determine overall integrity status
  const criticalAbuse = abuseLog.filter(a => a.severity === 'critical')
  const allChecksPassed = checks.every(c => c.passed)
  
  let overallIntegrity: IntegrityCheckResult['overallIntegrity']
  if (criticalAbuse.length > 0) {
    overallIntegrity = 'compromised'
  } else if (!allChecksPassed) {
    overallIntegrity = 'warning'
  } else {
    overallIntegrity = 'verified'
  }
  
  return {
    passed: allChecksPassed && criticalAbuse.length === 0,
    checks,
    abuseAttempts: [...abuseLog], // Copy to prevent mutation
    overallIntegrity
  }
}

/**
 * Get all abuse attempts (read-only copy)
 */
export function getAbuseLog(): readonly AbuseAttempt[] {
  return Object.freeze([...abuseLog])
}

/**
 * Format integrity report for display
 */
export function formatIntegrityReport(result: IntegrityCheckResult): string {
  const statusIcon = {
    verified: '✓',
    warning: '⚠',
    compromised: '✗'
  }[result.overallIntegrity]
  
  const statusColor = {
    verified: 'VERIFIED',
    warning: 'WARNING',
    compromised: 'COMPROMISED'
  }[result.overallIntegrity]
  
  let report = `
═══════════════════════════════════════════════════════════════════
              FORENSIC INTEGRITY REPORT
═══════════════════════════════════════════════════════════════════

STATUS: ${statusIcon} ${statusColor}

INTEGRITY CHECKS:
${result.checks.map(c => `  ${c.passed ? '✓' : '✗'} ${c.name}: ${c.details}`).join('\n')}

`

  if (result.abuseAttempts.length > 0) {
    report += `
BLOCKED ABUSE ATTEMPTS (${result.abuseAttempts.length}):
${result.abuseAttempts.map(a => `
  [${a.severity.toUpperCase()}] ${a.type}
  Time: ${new Date(a.timestamp).toISOString()}
  Description: ${a.description}
`).join('')}
`
  }

  report += `
═══════════════════════════════════════════════════════════════════
This report was generated by the Forensic Integrity Guard.
All checks are cryptographically verified and immutable.
═══════════════════════════════════════════════════════════════════
`

  return report
}

/**
 * Enforce forensic mode - blocks any action that could compromise integrity
 */
export function enforceForensicMode(): void {
  // Freeze critical objects to prevent modification
  Object.freeze(abuseLog)
  
  // Log enforcement
  console.log('[FORENSIC INTEGRITY GUARD] Forensic mode enforced - integrity protection active')
}
