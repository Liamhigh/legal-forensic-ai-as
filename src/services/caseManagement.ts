/**
 * Case Management Service
 * Manages the single active forensic case session
 */

export interface EvidenceArtifact {
  id: string
  fileName: string
  content: string | ArrayBuffer
  evidenceHash: string
  timestamp: number
  jurisdiction?: string
}

export interface ForensicCertificate {
  id: string
  evidenceId: string
  certificateHash: string
  nineBrainAnalysis: string
  timestamp: number
  bundleHash: string
}

export interface CaseContext {
  caseId: string
  startTime: number
  evidence: EvidenceArtifact[]
  certificates: ForensicCertificate[]
  conversationLog: Array<{ role: 'user' | 'assistant', content: string, timestamp: number, sealed: boolean }>
}

const CURRENT_CASE_KEY = 'verum-omnis-current-case'

/**
 * Get or create the current case session
 */
export function getCurrentCase(): CaseContext {
  try {
    const stored = localStorage.getItem(CURRENT_CASE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error loading case:', error)
  }

  // Create new case
  const newCase: CaseContext = {
    caseId: `CASE-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    startTime: Date.now(),
    evidence: [],
    certificates: [],
    conversationLog: []
  }

  saveCase(newCase)
  return newCase
}

/**
 * Save case to storage
 */
export function saveCase(caseContext: CaseContext): void {
  try {
    localStorage.setItem(CURRENT_CASE_KEY, JSON.stringify(caseContext))
  } catch (error) {
    console.error('Error saving case:', error)
  }
}

/**
 * Add evidence to current case
 */
export function addEvidence(evidence: EvidenceArtifact): void {
  const currentCase = getCurrentCase()
  currentCase.evidence.push(evidence)
  saveCase(currentCase)
}

/**
 * Add certificate to current case
 */
export function addCertificate(certificate: ForensicCertificate): void {
  const currentCase = getCurrentCase()
  currentCase.certificates.push(certificate)
  saveCase(currentCase)
}

/**
 * Add conversation entry to current case
 */
export function addConversationEntry(
  role: 'user' | 'assistant',
  content: string,
  sealed: boolean = false
): void {
  const currentCase = getCurrentCase()
  currentCase.conversationLog.push({
    role,
    content,
    timestamp: Date.now(),
    sealed
  })
  saveCase(currentCase)
}

/**
 * Clear current case (start fresh)
 */
export function clearCase(): void {
  localStorage.removeItem(CURRENT_CASE_KEY)
}

/**
 * Generate bundle hash binding evidence and certificate
 */
export async function generateBundleHash(
  evidenceHash: string,
  certificateHash: string,
  metadata: { timestamp: number; jurisdiction?: string }
): Promise<string> {
  const bundleData = `${evidenceHash}:${certificateHash}:${metadata.timestamp}:${metadata.jurisdiction || 'unknown'}`
  const encoder = new TextEncoder()
  const data = encoder.encode(bundleData)
  const hashBuffer = await crypto.subtle.digest('SHA-512', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
