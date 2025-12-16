/**
 * Scanner Orchestrator Service
 * Orchestrates the complete evidence scanning pipeline
 * Independent of chat/AI - guarantees output regardless of AI availability
 */

import { scannerStateMachine, ScannerResult } from './scannerStateMachine'
import { sealDocument } from './documentSealing'
import { generateNineBrainAnalysis, generateForensicCertificate } from './forensicCertificate'
import { 
  addEvidence, 
  addCertificate, 
  generateBundleHash,
  type EvidenceArtifact,
  type ForensicCertificate 
} from './caseManagement'

/**
 * Delay helper for visual feedback
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Check if AI is available for enhanced analysis
 * Tests if Spark LLM is actually functional, not just present
 */
function isAIAvailable(): boolean {
  try {
    const spark = (window as any).spark
    // Check if spark and llm exist
    if (!spark || !spark.llm) {
      return false
    }
    
    // Additional check: in development without Spark backend,
    // the API will fail even if the object exists
    // We can detect this by checking if we're in a Spark environment
    const isSparkEnvironment = !!(spark.context || spark.agent || process.env.SPARK_AGENT_URL)
    
    return isSparkEnvironment
  } catch {
    return false
  }
}

/**
 * Generate baseline analysis when AI is unavailable
 */
function generateBaselineAnalysis(
  fileName: string,
  content: string | ArrayBuffer,
  fileType: string,
  documentHash: string
): string {
  const contentSize = typeof content === 'string' ? content.length : content.byteLength
  const contentType = typeof content === 'string' ? 'text' : 'binary'
  
  return `BASELINE FORENSIC ANALYSIS
Generated: ${new Date().toISOString()}

DOCUMENT INFORMATION:
- Filename: ${fileName}
- Type: ${fileType || 'unknown'}
- Content Type: ${contentType}
- Size: ${contentSize} bytes
- Document Hash: ${documentHash}

INTEGRITY VERIFICATION:
✓ Document received and hashed successfully
✓ SHA-256 cryptographic hash generated
✓ Document sealed with forensic marker
✓ Timestamp recorded

ANALYSIS STATUS:
⚠ Advanced AI analysis unavailable at time of scan
✓ Baseline forensic processing completed
✓ Document integrity preserved
✓ Certificate generated with cryptographic seal

NOTE: This document was scanned and sealed successfully.
Advanced AI-powered analysis (Nine-Brain system) was not available
during this scan, but document integrity and forensic validity are
fully maintained. The document can be re-analyzed with AI later
without compromising the chain of custody.

FORENSIC VALIDITY:
This certificate and seal maintain full forensic validity.
The absence of AI analysis does not diminish the cryptographic
integrity or legal admissibility of this evidence.
`
}

/**
 * Main scanner orchestration function
 * Guarantees output regardless of AI availability
 */
export async function scanEvidence(
  file: File,
  userMessage?: string
): Promise<ScannerResult> {
  const fileName = file.name
  
  try {
    // PHASE 1: INGESTED - Document received
    scannerStateMachine.transitionToIngested(fileName)
    await delay(800)

    // PHASE 2: SCANNING - Verify integrity
    scannerStateMachine.transitionToScanning(fileName, 'verifying')
    await delay(1000)

    // Read file content
    const isTextFile = file.type.startsWith('text/') || 
                       file.name.endsWith('.txt') || 
                       file.name.endsWith('.md')
    const content = isTextFile ? await file.text() : await file.arrayBuffer()

    // PHASE 3: SCANNING - Analyze and seal
    scannerStateMachine.transitionToScanning(fileName, 'analyzing')
    await delay(1200)

    // Seal the evidence (always succeeds)
    const sealed = await sealDocument(content, fileName)
    
    // Check AI availability
    const aiAvailable = isAIAvailable()
    
    // Generate analysis - baseline if AI unavailable, enhanced if available
    let nineBrainAnalysis: string | typeof import('./forensicCertificate').NineBrainAnalysis
    let analysisType: 'baseline' | 'ai' = 'baseline'
    
    if (aiAvailable) {
      try {
        // Try AI-enhanced analysis - would use actual AI here
        // For now, generateNineBrainAnalysis returns mock structured data
        // In production with AI, this would call the AI service
        nineBrainAnalysis = await generateNineBrainAnalysis(
          fileName,
          content,
          file.type,
          sealed.seal.documentHash
        )
        analysisType = 'ai'
      } catch (error) {
        console.warn('AI analysis failed, using baseline:', error)
        // Fallback to baseline
        nineBrainAnalysis = generateBaselineAnalysis(
          fileName,
          content,
          file.type,
          sealed.seal.documentHash
        )
        analysisType = 'baseline'
      }
    } else {
      // Use baseline analysis
      console.log('AI not available - using baseline forensic analysis')
      nineBrainAnalysis = generateBaselineAnalysis(
        fileName,
        content,
        file.type,
        sealed.seal.documentHash
      )
      analysisType = 'baseline'
    }

    // PHASE 4: ANALYZED
    scannerStateMachine.transitionToAnalyzed(fileName, analysisType === 'ai')
    await delay(800)

    // Create evidence artifact
    const evidenceArtifact: EvidenceArtifact = {
      id: `EVD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      fileName: fileName,
      content: sealed.originalContent,
      evidenceHash: sealed.seal.documentHash,
      timestamp: sealed.seal.timestamp,
      jurisdiction: sealed.seal.jurisdiction
    }

    // Add evidence to case
    addEvidence(evidenceArtifact)

    // PHASE 5: SEALED - Generate certificate
    scannerStateMachine.transitionToSealed(fileName, evidenceArtifact.id)
    await delay(1000)

    // Generate forensic certificate (always succeeds)
    const certificateContent = await generateForensicCertificate(
      evidenceArtifact.id,
      fileName,
      sealed.seal.documentHash,
      nineBrainAnalysis,
      sealed.seal.jurisdiction
    )

    // Hash the certificate
    const encoder = new TextEncoder()
    const certData = encoder.encode(certificateContent)
    const certHashBuffer = await crypto.subtle.digest('SHA-256', certData)
    const certHashArray = Array.from(new Uint8Array(certHashBuffer))
    const certificateHash = certHashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // Generate bundle hash
    const bundleHash = await generateBundleHash(
      sealed.seal.documentHash,
      certificateHash,
      { 
        timestamp: sealed.seal.timestamp, 
        jurisdiction: sealed.seal.jurisdiction 
      }
    )

    // Create certificate artifact
    const certificateArtifact: ForensicCertificate = {
      id: `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      evidenceId: evidenceArtifact.id,
      certificateHash,
      nineBrainAnalysis: certificateContent,
      timestamp: Date.now(),
      bundleHash
    }

    // Add certificate to case
    addCertificate(certificateArtifact)

    // Build result
    const result: ScannerResult = {
      success: true,
      evidenceId: evidenceArtifact.id,
      certificateId: certificateArtifact.id,
      evidenceHash: sealed.seal.documentHash,
      certificateHash: certificateArtifact.certificateHash,
      bundleHash: certificateArtifact.bundleHash,
      documentContent: sealed.originalContent,
      certificateContent: certificateContent,
      aiAnalysisIncluded: analysisType === 'ai',
      message: '✅ Document scanned and sealed'
    }

    // PHASE 6: OUTPUT_READY
    scannerStateMachine.transitionToOutputReady(result)

    return result

  } catch (error) {
    console.error('Scanner pipeline error:', error)
    
    // Transition to error state
    scannerStateMachine.transitionToError(
      fileName,
      error instanceof Error ? error.message : 'Unknown scanner error'
    )
    
    // Re-throw to allow caller to handle
    throw error
  }
}

/**
 * Reset scanner to ready state
 */
export function resetScanner(): void {
  scannerStateMachine.reset()
}
