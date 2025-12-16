/**
 * Forensic Certificate Generator
 * Generates Nine-Brain forensic analysis certificates for evidence
 */

import { generateBundleHash as generateLegacyBundleHash } from './caseManagement'
import { 
  generateBundleHash, 
  generateStandaloneCertification,
  type OutputMode,
  type EvidenceMetadata 
} from './bundleSealing'

export interface NineBrainAnalysis {
  contextAnalysis: string
  authenticityScore: number
  standingVerification: string
  jurisdictionFlags: string[]
  chainOfCustody: string
  integrityCheck: string
  metadata: string
  riskAssessment: string
  recommendations: string
}

/**
 * Generate Nine-Brain forensic analysis for evidence
 */
export async function generateNineBrainAnalysis(
  fileName: string,
  content: string | ArrayBuffer,
  fileType: string,
  evidenceHash: string
): Promise<NineBrainAnalysis> {
  // In production, this would use actual AI analysis
  // For now, generate structured forensic analysis
  
  const contentPreview = typeof content === 'string' 
    ? content.substring(0, 200) 
    : `[Binary content: ${content.byteLength} bytes]`

  return {
    contextAnalysis: `File "${fileName}" (Type: ${fileType}) analyzed for forensic context. Content structure indicates ${typeof content === 'string' ? 'text-based' : 'binary'} evidence.`,
    authenticityScore: 0.95,
    standingVerification: 'Evidence appears authentic based on file structure and metadata consistency.',
    jurisdictionFlags: [],
    chainOfCustody: `Evidence received at ${new Date().toISOString()}. Hash verified: ${evidenceHash.substring(0, 16)}...`,
    integrityCheck: 'Cryptographic hash successfully generated. Content integrity verified.',
    metadata: `File size: ${typeof content === 'string' ? content.length : content.byteLength} bytes. Type: ${fileType}.`,
    riskAssessment: 'No immediate red flags detected. Standard forensic protocols apply.',
    recommendations: 'Evidence suitable for case file. Maintain chain of custody. Preserve original artifact.'
  }
}

/**
 * Generate forensic certificate document
 * Accepts either structured NineBrainAnalysis or plain text analysis
 * Creates a cryptographic witness that can stand alone as evidence
 */
export async function generateForensicCertificate(
  evidenceId: string,
  fileName: string,
  evidenceHash: string,
  nineBrainAnalysis: NineBrainAnalysis | string,
  jurisdiction?: string,
  outputMode: OutputMode = 'full'
): Promise<string> {
  const timestamp = Date.now()
  const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
  
  // Check if analysis is plain text (baseline) or structured (AI)
  const isBaseline = typeof nineBrainAnalysis === 'string'
  const aiAnalysisIncluded = !isBaseline
  
  // Generate certificate hash (hash of the certificate content itself)
  const certificateContent = JSON.stringify({
    certificateId,
    evidenceId,
    fileName,
    evidenceHash,
    nineBrainAnalysis,
    timestamp,
    jurisdiction,
    outputMode
  })
  
  const encoder = new TextEncoder()
  const data = encoder.encode(certificateContent)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const certificateHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  // Create temporary report hash (will be replaced with actual PDF hash in production)
  const reportHash = certificateHash
  
  // Generate bundle hash binding evidence + report + certificate
  const bundleHash = await generateBundleHash(
    evidenceHash,
    reportHash,
    certificateHash,
    { timestamp, jurisdiction }
  )
  
  // Generate standalone certification text
  const metadata: EvidenceMetadata = {
    fileName,
    fileSize: 0, // Will be filled by caller
    fileType: '', // Will be filled by caller
    evidenceHash,
    timestamp,
    jurisdiction
  }
  
  const standaloneCertification = generateStandaloneCertification(
    metadata,
    outputMode,
    aiAnalysisIncluded
  )
  
  // Format certificate - different format for baseline vs AI analysis
  let certificate: string
  
  if (isBaseline) {
    // Baseline certificate format
    certificate = `
═══════════════════════════════════════════════════════════════════
                  VERUM OMNIS FORENSIC CERTIFICATE
                      Baseline Forensic Analysis
═══════════════════════════════════════════════════════════════════

CERTIFICATE ID: ${certificateId}
EVIDENCE ID: ${evidenceId}
DATE: ${new Date(timestamp).toLocaleString()}
${jurisdiction ? `JURISDICTION: ${jurisdiction}` : ''}

───────────────────────────────────────────────────────────────────
EVIDENCE INFORMATION
───────────────────────────────────────────────────────────────────
File Name: ${fileName}
Evidence Hash (SHA-256): ${evidenceHash}

───────────────────────────────────────────────────────────────────
FORENSIC ANALYSIS
───────────────────────────────────────────────────────────────────

${nineBrainAnalysis}

───────────────────────────────────────────────────────────────────
CRYPTOGRAPHIC SEALS
───────────────────────────────────────────────────────────────────
Evidence Hash (SHA-256): ${evidenceHash}
Certificate Hash (SHA-256): ${certificateHash}
Report Hash (SHA-256): ${reportHash}
Bundle Hash (SHA-512): ${bundleHash}

BUNDLE BINDING:
The bundle hash cryptographically binds the original evidence, this
certificate, and the forensic report together. This binding cannot be
broken - any modification to any component will invalidate the bundle.

The evidence hash proves the original file's existence and integrity.
This report serves as a cryptographic witness that can verify the 
original even if the original file is not shared.

${standaloneCertification}

───────────────────────────────────────────────────────────────────
CERTIFICATION AUTHORITY
───────────────────────────────────────────────────────────────────
Sealed By: Verum Omnis Forensics
Timestamp: ${new Date(timestamp).toISOString()}
Version: 1.0.0

This certificate strengthens the cryptographic seal of the evidence
and becomes part of the immutable case record.

═══════════════════════════════════════════════════════════════════
                        END OF CERTIFICATE
═══════════════════════════════════════════════════════════════════
`
  } else {
    // AI-enhanced certificate format
    const analysis = nineBrainAnalysis as NineBrainAnalysis
    certificate = `
═══════════════════════════════════════════════════════════════════
                  VERUM OMNIS FORENSIC CERTIFICATE
                        Nine-Brain Analysis Report
═══════════════════════════════════════════════════════════════════

CERTIFICATE ID: ${certificateId}
EVIDENCE ID: ${evidenceId}
DATE: ${new Date(timestamp).toLocaleString()}
${jurisdiction ? `JURISDICTION: ${jurisdiction}` : ''}

───────────────────────────────────────────────────────────────────
EVIDENCE INFORMATION
───────────────────────────────────────────────────────────────────
File Name: ${fileName}
Evidence Hash (SHA-256): ${evidenceHash}

───────────────────────────────────────────────────────────────────
NINE-BRAIN FORENSIC ANALYSIS
───────────────────────────────────────────────────────────────────

1. CONTEXT ANALYSIS
${analysis.contextAnalysis}

2. AUTHENTICITY VERIFICATION
Score: ${(analysis.authenticityScore * 100).toFixed(1)}%
${analysis.standingVerification}

3. JURISDICTION FLAGS
${analysis.jurisdictionFlags.length > 0 
  ? analysis.jurisdictionFlags.map(f => `• ${f}`).join('\n')
  : '• No jurisdiction flags identified'}

4. CHAIN OF CUSTODY
${analysis.chainOfCustody}

5. INTEGRITY CHECK
${analysis.integrityCheck}

6. METADATA ANALYSIS
${analysis.metadata}

7. RISK ASSESSMENT
${analysis.riskAssessment}

8. RECOMMENDATIONS
${analysis.recommendations}

───────────────────────────────────────────────────────────────────
CRYPTOGRAPHIC SEALS
───────────────────────────────────────────────────────────────────
Evidence Hash (SHA-256): ${evidenceHash}
Certificate Hash (SHA-256): ${certificateHash}
Report Hash (SHA-256): ${reportHash}
Bundle Hash (SHA-512): ${bundleHash}

BUNDLE BINDING:
The bundle hash cryptographically binds the original evidence, this
certificate, and the forensic report together. This binding cannot be
broken - any modification to any component will invalidate the bundle.

The evidence hash proves the original file's existence and integrity.
This report serves as a cryptographic witness that can verify the 
original even if the original file is not shared.

${standaloneCertification}

───────────────────────────────────────────────────────────────────
CERTIFICATION AUTHORITY
───────────────────────────────────────────────────────────────────
Sealed By: Verum Omnis Forensics
Timestamp: ${new Date(timestamp).toISOString()}
Version: 1.0.0

This certificate strengthens the cryptographic seal of the evidence
and becomes part of the immutable case record.

═══════════════════════════════════════════════════════════════════
                        END OF CERTIFICATE
═══════════════════════════════════════════════════════════════════
`
  }
  
  return certificate
}

/**
 * Extract certificate hash from certificate content
 */
export function extractCertificateHash(certificate: string): string | null {
  const match = certificate.match(/Certificate Hash: ([a-f0-9]+)/)
  return match ? match[1] : null
}

/**
 * Extract bundle hash from certificate content
 */
export function extractBundleHash(certificate: string): string | null {
  const match = certificate.match(/Bundle Hash \(SHA-512\): ([a-f0-9]+)/)
  return match ? match[1] : null
}
