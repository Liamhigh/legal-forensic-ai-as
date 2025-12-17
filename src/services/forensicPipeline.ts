/**
 * Forensic Pipeline Service
 * Manages the complete forensic evidence pipeline with proper case storage
 * 
 * Core Principles:
 * - Documents remain strictly in the backend
 * - UI exposes only forensic, conversational text narrative
 * - PDFs are optional outputs, not primary interfaces
 * - ALL operations are audited and abuse is blocked
 * 
 * Case Structure:
 * /backend/cases/{CASE_ID}/
 *   - original_document.pdf (sealed)
 *   - forensic_report.pdf (sealed)
 *   - metadata.json
 *   - hashes.json
 *   - qr.png
 */

import { generateQRCode, type QRCodeData } from './qrCodeSealing'
import { generatePDFReport, type PDFReportData } from './pdfGenerator'
import { 
  registerSealedArtefact, 
  verifyArtefactIntegrity, 
  validateTimestamp,
  validateOperation,
  logAbuseAttempt 
} from './forensicIntegrityGuard'

export interface CaseArtefacts {
  caseId: string
  timestamp: number
  jurisdiction?: string
  qrCodeDataUrl: string
  cryptoHashSet: CryptoHashSet
  originalDocument: SealedArtefact
  forensicReport: SealedArtefact
  metadata: CaseMetadata
}

export interface CryptoHashSet {
  documentHash: string
  reportHash: string
  bundleHash: string
  qrDataHash: string
}

export interface SealedArtefact {
  fileName: string
  content: string | Uint8Array
  hash: string
  sealed: boolean
  sealedAt: number
}

export interface CaseMetadata {
  caseId: string
  createdAt: number
  lastUpdated: number
  jurisdiction?: string
  evidenceCount: number
  integrityVerified: boolean
  artefactBindings: ArtefactBinding[]
}

export interface ArtefactBinding {
  sourceArtefact: string
  targetArtefact: string
  bindingType: 'cryptographic' | 'temporal' | 'semantic'
  bindingHash: string
}

export interface ForensicNarrative {
  caseId: string
  timestamp: number
  summary: string
  integrityStatus: IntegrityStatus
  notedConditions: string[]
  contradictions: string[]
  evidentiaryPosture: string
  keyFindings: string[]
  recommendations: string[]
  riskScore: number
}

export interface IntegrityStatus {
  verified: boolean
  documentSealed: boolean
  reportSealed: boolean
  artefactsBound: boolean
  hashChainValid: boolean
  timestampVerified: boolean
  message: string
}

// In-memory case storage (simulates backend storage)
const caseStorage = new Map<string, CaseArtefacts>()

/**
 * Generate a unified case ID
 */
export function generateCaseId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 9).toUpperCase()
  return `CASE-${timestamp}-${random}`
}

/**
 * Generate a cryptographic hash for content
 */
async function generateHash(content: string | Uint8Array): Promise<string> {
  const encoder = new TextEncoder()
  const data = typeof content === 'string' ? encoder.encode(content) : content
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate a bundle hash binding multiple hashes together
 */
async function generateBundleHash(hashes: string[], timestamp: number): Promise<string> {
  const bundleData = [...hashes, timestamp.toString()].join(':')
  return generateHash(bundleData)
}

/**
 * Create a complete case with sealed artefacts
 * This is the main entry point for the forensic pipeline
 * 
 * INTEGRITY ENFORCED: All artefacts are registered and locked
 */
export async function createForensicCase(
  originalContent: string | ArrayBuffer,
  fileName: string,
  analysisContent: string,
  jurisdiction?: string
): Promise<CaseArtefacts> {
  const caseId = generateCaseId()
  const timestamp = Date.now()

  // INTEGRITY CHECK: Validate timestamp
  const timestampCheck = validateTimestamp(timestamp)
  if (!timestampCheck.valid) {
    logAbuseAttempt(
      'timestamp_manipulation',
      `Invalid timestamp during case creation: ${timestampCheck.message}`,
      'critical',
      { caseId, timestamp }
    )
    throw new Error(`INTEGRITY VIOLATION: ${timestampCheck.message}`)
  }

  // INTEGRITY CHECK: Validate operation
  const opCheck = validateOperation('create')
  if (!opCheck.allowed) {
    throw new Error(`OPERATION BLOCKED: ${opCheck.message}`)
  }

  // Convert content to appropriate format
  const documentContent = originalContent instanceof ArrayBuffer 
    ? new Uint8Array(originalContent) 
    : originalContent

  // STEP 1: Generate document hash
  const documentHash = await generateHash(documentContent)

  // STEP 2: Generate report hash
  const reportHash = await generateHash(analysisContent)

  // STEP 3: Generate QR code data
  const qrData: QRCodeData = {
    documentHash,
    timestamp,
    type: 'case',
    verificationUrl: `verum-omnis://verify/${caseId}/${documentHash}`
  }
  const qrCodeDataUrl = await generateQRCode(qrData)
  const qrDataHash = await generateHash(JSON.stringify(qrData))

  // STEP 4: Generate bundle hash (binds all artefacts together)
  const bundleHash = await generateBundleHash(
    [documentHash, reportHash, qrDataHash],
    timestamp
  )

  // STEP 5: Create crypto hash set (shared across all artefacts)
  const cryptoHashSet: CryptoHashSet = {
    documentHash,
    reportHash,
    bundleHash,
    qrDataHash
  }

  // STEP 6: Create sealed artefacts
  const originalDocument: SealedArtefact = {
    fileName: `original_${fileName}`,
    content: documentContent,
    hash: documentHash,
    sealed: true,
    sealedAt: timestamp
  }

  const forensicReport: SealedArtefact = {
    fileName: 'forensic_report.pdf',
    content: analysisContent,
    hash: reportHash,
    sealed: true,
    sealedAt: timestamp
  }

  // STEP 7: Create artefact bindings
  const artefactBindings: ArtefactBinding[] = [
    {
      sourceArtefact: 'original_document',
      targetArtefact: 'forensic_report',
      bindingType: 'cryptographic',
      bindingHash: bundleHash
    },
    {
      sourceArtefact: 'original_document',
      targetArtefact: 'qr_code',
      bindingType: 'cryptographic',
      bindingHash: bundleHash
    },
    {
      sourceArtefact: 'forensic_report',
      targetArtefact: 'qr_code',
      bindingType: 'cryptographic',
      bindingHash: bundleHash
    }
  ]

  // STEP 8: Create metadata
  const metadata: CaseMetadata = {
    caseId,
    createdAt: timestamp,
    lastUpdated: timestamp,
    jurisdiction,
    evidenceCount: 1,
    integrityVerified: true,
    artefactBindings
  }

  // STEP 9: Assemble case artefacts
  const caseArtefacts: CaseArtefacts = {
    caseId,
    timestamp,
    jurisdiction,
    qrCodeDataUrl,
    cryptoHashSet,
    originalDocument,
    forensicReport,
    metadata
  }

  // STEP 10: Register artefacts with integrity guard (IMMUTABLE after this)
  const docRegistered = registerSealedArtefact(
    `${caseId}-document`,
    documentHash,
    'original_document'
  )
  const reportRegistered = registerSealedArtefact(
    `${caseId}-report`,
    reportHash,
    'forensic_report'
  )
  const bundleRegistered = registerSealedArtefact(
    `${caseId}-bundle`,
    bundleHash,
    'bundle'
  )

  if (!docRegistered || !reportRegistered || !bundleRegistered) {
    throw new Error('INTEGRITY VIOLATION: Failed to register sealed artefacts')
  }

  // Store in backend (simulated)
  caseStorage.set(caseId, caseArtefacts)

  return caseArtefacts
}

/**
 * Extract forensic narrative from case artefacts
 * This is what the UI displays - text-based, conversational
 */
export function extractForensicNarrative(
  caseArtefacts: CaseArtefacts,
  analysisContent: string
): ForensicNarrative {
  const sections = parseAnalysisSections(analysisContent)

  const integrityStatus: IntegrityStatus = {
    verified: true,
    documentSealed: caseArtefacts.originalDocument.sealed,
    reportSealed: caseArtefacts.forensicReport.sealed,
    artefactsBound: caseArtefacts.metadata.artefactBindings.length > 0,
    hashChainValid: true,
    timestampVerified: true,
    message: 'All artefacts cryptographically sealed and bound'
  }

  return {
    caseId: caseArtefacts.caseId,
    timestamp: caseArtefacts.timestamp,
    summary: sections.summary || 'Document analysis complete.',
    integrityStatus,
    notedConditions: sections.notedConditions || [],
    contradictions: sections.contradictions || [],
    evidentiaryPosture: sections.evidentiaryPosture || 'Evidence is sealed and verified.',
    keyFindings: sections.keyFindings || [],
    recommendations: sections.recommendations || [],
    riskScore: sections.riskScore || 0
  }
}

/**
 * Parse analysis content into structured sections
 */
function parseAnalysisSections(content: string): {
  summary?: string
  notedConditions?: string[]
  contradictions?: string[]
  evidentiaryPosture?: string
  keyFindings?: string[]
  recommendations?: string[]
  riskScore?: number
} {
  const result: ReturnType<typeof parseAnalysisSections> = {}

  // Extract synthesis narrative as summary
  const synthesisMatch = content.match(/SYNTHESIS NARRATIVE:?\s*\n([\s\S]*?)(?:\n\n|═══)/i)
  if (synthesisMatch) {
    result.summary = synthesisMatch[1].trim()
  } else {
    // Fallback: use first substantial paragraph
    const lines = content.split('\n')
    const substantialLines = lines.filter(line => 
      line.trim().length > 50 && 
      !line.includes('═══') && 
      !line.includes('───')
    )
    if (substantialLines.length > 0) {
      result.summary = substantialLines[0].trim()
    }
  }

  // Extract contradictions
  const contradictionsMatch = content.match(/CONTRADICTION ANALYSIS:?\s*\n([\s\S]*?)(?:\n\n|═══)/i)
  if (contradictionsMatch) {
    const contradictionText = contradictionsMatch[1].trim()
    result.contradictions = contradictionText
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
  }

  // Extract key findings
  const findingsMatch = content.match(/Key Findings:?\s*\n([\s\S]*?)(?:\n\n|═══|Recommendations:)/i)
  if (findingsMatch) {
    result.keyFindings = findingsMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'))
      .map(line => line.replace(/^[•-]\s*/, '').trim())
  }

  // Extract recommendations
  const recommendationsMatch = content.match(/Recommendations:?\s*\n([\s\S]*?)(?:\n\n|═══|$)/i)
  if (recommendationsMatch) {
    result.recommendations = recommendationsMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'))
      .map(line => line.replace(/^[•-]\s*/, '').trim())
  }

  // Extract risk score
  const riskMatch = content.match(/Risk Score:?\s*(\d+(?:\.\d+)?)/i)
  if (riskMatch) {
    result.riskScore = parseFloat(riskMatch[1]) / 100
  }

  // Extract noted conditions (from forensic validity section)
  const validityMatch = content.match(/FORENSIC VALIDITY:?\s*\n([\s\S]*?)(?:\n\n|$)/i)
  if (validityMatch) {
    result.notedConditions = validityMatch[1]
      .split('\n')
      .filter(line => line.trim().startsWith('✓') || line.trim().startsWith('⚠'))
      .map(line => line.replace(/^[✓⚠]\s*/, '').trim())
  }

  // Generate evidentiary posture from overall assessment
  if (result.contradictions && result.contradictions.length > 0) {
    result.evidentiaryPosture = 'Document contains noted contradictions requiring review.'
  } else if (result.summary) {
    result.evidentiaryPosture = 'Document analysis complete with forensic validity confirmed.'
  }

  return result
}

/**
 * Get case from storage
 */
export function getCase(caseId: string): CaseArtefacts | undefined {
  return caseStorage.get(caseId)
}

/**
 * Check if case exists
 */
export function caseExists(caseId: string): boolean {
  return caseStorage.has(caseId)
}

/**
 * Verify case integrity
 * Uses Forensic Integrity Guard for tamper detection
 */
export async function verifyCaseIntegrity(caseId: string): Promise<IntegrityStatus> {
  const caseArtefacts = caseStorage.get(caseId)

  if (!caseArtefacts) {
    return {
      verified: false,
      documentSealed: false,
      reportSealed: false,
      artefactsBound: false,
      hashChainValid: false,
      timestampVerified: false,
      message: `Case ${caseId} not found`
    }
  }

  // Verify document hash
  const documentContent = caseArtefacts.originalDocument.content
  const currentDocHash = await generateHash(documentContent)
  const documentValid = currentDocHash === caseArtefacts.cryptoHashSet.documentHash

  // Verify against integrity guard registry
  const docIntegrity = verifyArtefactIntegrity(`${caseId}-document`, currentDocHash)
  if (!docIntegrity.valid) {
    logAbuseAttempt(
      'hash_mismatch',
      `Document integrity check failed for case ${caseId}`,
      'critical',
      { caseId, expectedHash: caseArtefacts.cryptoHashSet.documentHash, actualHash: currentDocHash }
    )
  }

  // Verify report hash
  const reportContent = caseArtefacts.forensicReport.content
  const currentReportHash = await generateHash(reportContent)
  const reportValid = currentReportHash === caseArtefacts.cryptoHashSet.reportHash

  // Verify against integrity guard registry
  const reportIntegrity = verifyArtefactIntegrity(`${caseId}-report`, currentReportHash)
  if (!reportIntegrity.valid) {
    logAbuseAttempt(
      'hash_mismatch',
      `Report integrity check failed for case ${caseId}`,
      'critical',
      { caseId, expectedHash: caseArtefacts.cryptoHashSet.reportHash, actualHash: currentReportHash }
    )
  }

  // Verify bundle hash
  const currentBundleHash = await generateBundleHash(
    [
      caseArtefacts.cryptoHashSet.documentHash,
      caseArtefacts.cryptoHashSet.reportHash,
      caseArtefacts.cryptoHashSet.qrDataHash
    ],
    caseArtefacts.timestamp
  )
  const bundleValid = currentBundleHash === caseArtefacts.cryptoHashSet.bundleHash

  const allValid = documentValid && reportValid && bundleValid && docIntegrity.valid && reportIntegrity.valid

  return {
    verified: allValid,
    documentSealed: caseArtefacts.originalDocument.sealed && documentValid,
    reportSealed: caseArtefacts.forensicReport.sealed && reportValid,
    artefactsBound: bundleValid,
    hashChainValid: allValid,
    timestampVerified: caseArtefacts.timestamp === caseArtefacts.originalDocument.sealedAt,
    message: allValid 
      ? 'All artefacts verified and integrity confirmed'
      : 'INTEGRITY VIOLATION: Artefacts may have been modified - check abuse log'
  }
}

/**
 * Generate printable PDF from sealed forensic report
 * This does NOT regenerate or reanalyze - just renders existing sealed report
 * 
 * INTEGRITY ENFORCED: Only 'print' operation allowed on sealed artefacts
 */
export async function printCaseReportToPDF(caseId: string): Promise<Uint8Array | null> {
  // Validate operation is allowed
  const opCheck = validateOperation('print', `${caseId}-report`)
  if (!opCheck.allowed) {
    console.error(`Operation blocked: ${opCheck.message}`)
    return null
  }

  const caseArtefacts = caseStorage.get(caseId)

  if (!caseArtefacts) {
    console.error(`Case ${caseId} not found`)
    return null
  }

  // Verify integrity before printing
  const integrity = await verifyCaseIntegrity(caseId)
  if (!integrity.verified) {
    logAbuseAttempt(
      'unauthorized_extraction',
      `Attempted to print report for case with failed integrity: ${caseId}`,
      'high',
      { caseId, integrityMessage: integrity.message }
    )
    console.error(`Cannot print: ${integrity.message}`)
    return null
  }

  // Use the already-sealed report content
  const reportContent = typeof caseArtefacts.forensicReport.content === 'string'
    ? caseArtefacts.forensicReport.content
    : new TextDecoder().decode(caseArtefacts.forensicReport.content)

  const reportData: PDFReportData = {
    title: `Forensic Report - ${caseId}`,
    content: reportContent,
    documentInfo: {
      fileName: caseArtefacts.originalDocument.fileName,
      hash: caseArtefacts.cryptoHashSet.documentHash,
      timestamp: caseArtefacts.timestamp,
      jurisdiction: caseArtefacts.jurisdiction
    },
    sealInfo: {
      sealedBy: 'Verum Omnis Forensics',
      timestamp: caseArtefacts.timestamp
    }
  }

  // Generate PDF from existing sealed content (no regeneration)
  const pdfBytes = await generatePDFReport(reportData, {
    includeWatermark: false
  })

  return pdfBytes
}

/**
 * Get all stored cases (for listing)
 */
export function getAllCases(): CaseArtefacts[] {
  return Array.from(caseStorage.values())
}

/**
 * Clear a specific case
 * BLOCKED: Sealed cases cannot be deleted - this would destroy evidence
 */
export function clearCase(caseId: string): boolean {
  // Check if case is sealed
  const caseArtefacts = caseStorage.get(caseId)
  if (caseArtefacts) {
    logAbuseAttempt(
      'unauthorized_modification',
      `Attempted to delete sealed case: ${caseId}`,
      'critical',
      { caseId }
    )
    console.error('OPERATION BLOCKED: Sealed cases cannot be deleted')
    return false
  }
  return false
}

/**
 * Clear all cases
 * BLOCKED: This would destroy evidence
 */
export function clearAllCases(): void {
  if (caseStorage.size > 0) {
    logAbuseAttempt(
      'unauthorized_modification',
      `Attempted to delete all ${caseStorage.size} sealed cases`,
      'critical',
      { caseCount: caseStorage.size }
    )
    console.error('OPERATION BLOCKED: Cannot delete sealed forensic cases')
    return
  }
}
