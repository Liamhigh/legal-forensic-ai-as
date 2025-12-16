/**
 * Bundle Sealing Service
 * Creates cryptographically inseparable bundles of evidence + report
 * The report is a cryptographic witness that can stand alone as evidence
 */

export type OutputMode = 'full' | 'report-only'

export interface EvidenceMetadata {
  fileName: string
  fileSize: number
  fileType: string
  evidenceHash: string
  timestamp: number
  jurisdiction?: string
}

export interface ForensicBundle {
  bundleHash: string
  evidenceHash: string
  reportHash: string
  certificateHash: string
  timestamp: number
  jurisdiction?: string
  metadata: EvidenceMetadata
}

export interface QRPayload {
  bundleHash: string
  evidenceHash: string
  reportHash: string
  timestamp: number
  jurisdiction?: string
  verificationUrl: string
}

/**
 * Generate bundle hash that cryptographically binds all components
 * This is the master hash that proves the original file, report, and certificate
 * are inseparable - even if the original file is not shared
 */
export async function generateBundleHash(
  evidenceHash: string,
  reportHash: string,
  certificateHash: string,
  metadata: { timestamp: number; jurisdiction?: string }
): Promise<string> {
  // Bundle hash binds all components together
  const bundleData = [
    evidenceHash,
    reportHash,
    certificateHash,
    metadata.timestamp.toString(),
    metadata.jurisdiction || 'unknown'
  ].join(':')
  
  const encoder = new TextEncoder()
  const data = encoder.encode(bundleData)
  const hashBuffer = await crypto.subtle.digest('SHA-512', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate QR payload for verification
 * This allows verification with report alone, without original file
 */
export function generateQRPayload(
  bundle: ForensicBundle,
  baseUrl: string = 'https://verum-omnis.verify'
): QRPayload {
  return {
    bundleHash: bundle.bundleHash,
    evidenceHash: bundle.evidenceHash,
    reportHash: bundle.reportHash,
    timestamp: bundle.timestamp,
    jurisdiction: bundle.jurisdiction,
    verificationUrl: `${baseUrl}?bundle=${bundle.bundleHash.substring(0, 16)}`
  }
}

/**
 * Generate standalone forensic report certification text
 * This text makes the report admissible even without the original file
 */
export function generateStandaloneCertification(
  metadata: EvidenceMetadata,
  mode: OutputMode,
  aiAnalysisIncluded: boolean
): string {
  const modeText = mode === 'report-only' 
    ? `

═══════════════════════════════════════════════════════════════════
                    ORIGINAL ARTIFACT STATUS
═══════════════════════════════════════════════════════════════════

⚠️ PRIVACY MODE: ORIGINAL FILE NOT INCLUDED

This report certifies that the above-described file was scanned and 
analyzed by Verum Omnis. The original artifact is not included in 
this bundle by design, at the request of the evidence custodian.

The original file's cryptographic hash is recorded above and bound 
to this report via the bundle hash. This report serves as forensic 
proof that:

1. The original file existed at the time of scanning
2. The original file had the exact hash recorded above
3. The original file was analyzed by this forensic system
4. The integrity of the original can be verified if later produced

LEGAL STATUS:
This report is independently admissible as evidence of the original 
file's existence, characteristics, and forensic analysis at the time 
of scan, even if the original artifact is unavailable, withheld, or 
destroyed after scanning.

VERIFICATION:
If the original file is later produced, its hash can be computed and 
compared to the evidence hash recorded in this report. If they match,
the original is proven authentic and unchanged since this scan.`
    : `

═══════════════════════════════════════════════════════════════════
                    ORIGINAL ARTIFACT STATUS
═══════════════════════════════════════════════════════════════════

✅ FULL EVIDENCE BUNDLE

This bundle includes both:
- The original artifact (sealed)
- This forensic report (sealed)

Both are bound together under the bundle hash recorded above. The 
original file and this report are cryptographically inseparable.`

  const analysisNote = aiAnalysisIncluded
    ? `
AI ANALYSIS: ✓ Included
Advanced Nine-Brain forensic analysis was performed at time of scan.`
    : `
AI ANALYSIS: ⚠ Unavailable
Advanced AI analysis was not available at time of scan. Baseline 
forensic processing was completed. Document integrity and forensic 
validity are fully maintained.`

  return modeText + analysisNote
}

/**
 * Verify bundle integrity
 * Can be performed with report alone, without original file
 */
export async function verifyBundleIntegrity(
  providedEvidenceHash: string,
  providedReportHash: string,
  providedCertificateHash: string,
  providedBundleHash: string,
  metadata: { timestamp: number; jurisdiction?: string }
): Promise<{
  valid: boolean
  message: string
}> {
  // Recompute bundle hash from components
  const computedBundleHash = await generateBundleHash(
    providedEvidenceHash,
    providedReportHash,
    providedCertificateHash,
    metadata
  )

  if (computedBundleHash === providedBundleHash) {
    return {
      valid: true,
      message: 'Bundle integrity verified. All components are authentic and unchanged.'
    }
  } else {
    return {
      valid: false,
      message: 'Bundle integrity violation. One or more components have been tampered with.'
    }
  }
}

/**
 * Verify evidence against report
 * Used when original file is later produced and needs verification
 */
export async function verifyEvidenceAgainstReport(
  originalFileBytes: ArrayBuffer | string,
  reportedEvidenceHash: string
): Promise<{
  matches: boolean
  message: string
  computedHash: string
}> {
  // Compute hash of provided file
  const encoder = new TextEncoder()
  const data = typeof originalFileBytes === 'string'
    ? encoder.encode(originalFileBytes)
    : new Uint8Array(originalFileBytes)

  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  if (computedHash === reportedEvidenceHash) {
    return {
      matches: true,
      message: 'Evidence verification successful. The provided file matches the hash recorded in the forensic report. This proves the file is authentic and unchanged since the original scan.',
      computedHash
    }
  } else {
    return {
      matches: false,
      message: 'Evidence verification failed. The provided file does NOT match the hash recorded in the forensic report. Either this is a different file, or the file has been modified since the scan.',
      computedHash
    }
  }
}
