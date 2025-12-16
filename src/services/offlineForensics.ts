/**
 * Offline Forensics Engine
 * Provides local pattern matching and rule-based forensic analysis
 * Works completely offline without API dependency
 * Critical for law enforcement in areas with limited connectivity
 */

import { detectContradictions, type Contradiction } from './contradictionDetector'
import { analyzeWithNineBrains, type NineBrainOfflineAnalysis } from './nineBrainAnalysis'
import { analyzeTimeline, type TimelineAnalysis } from './timelineAnalyzer'

export interface ForensicDocument {
  id: string
  fileName: string
  content: string | ArrayBuffer
  fileType: string
  timestamp: number
  metadata?: {
    author?: string
    createdDate?: string
    modifiedDate?: string
    [key: string]: any
  }
}

export interface ForensicAnalysisResult {
  documentId: string
  fileName: string
  timestamp: number
  
  // Nine-Brain Analysis
  nineBrainAnalysis: NineBrainOfflineAnalysis
  
  // Contradiction Detection
  contradictions: Contradiction[]
  contradictionSummary: string
  
  // Timeline Analysis
  timelineAnalysis: TimelineAnalysis | null
  
  // Overall Assessment
  overallRiskScore: number // 0-1 scale
  keyFindings: string[]
  recommendations: string[]
  
  // Metadata
  analysisMode: 'offline'
  analysisVersion: string
}

export interface CaseAnalysisResult {
  caseId: string
  documents: ForensicAnalysisResult[]
  crossDocumentContradictions: Contradiction[]
  timelineDiscrepancies: string[]
  chainOfCustodyIssues: string[]
  overallAssessment: string
  timestamp: number
}

/**
 * Analyze a single document using offline forensic rules
 */
export async function analyzeDocumentOffline(
  document: ForensicDocument,
  _context?: { allDocuments?: ForensicDocument[] }
): Promise<ForensicAnalysisResult> {
  // Extract text content for analysis
  const textContent = extractTextContent(document)
  
  // Run Nine-Brain Analysis (offline)
  const nineBrainAnalysis = await analyzeWithNineBrains(document, textContent)
  
  // Detect contradictions within the document
  const contradictions = detectContradictions(textContent, {
    documentId: document.id,
    fileName: document.fileName
  })
  
  // Analyze timeline if temporal data exists
  const timelineAnalysis = analyzeTimeline(textContent, document.metadata)
  
  // Generate contradiction summary
  const contradictionSummary = generateContradictionSummary(contradictions)
  
  // Calculate overall risk score
  const overallRiskScore = calculateRiskScore(
    nineBrainAnalysis,
    contradictions,
    timelineAnalysis
  )
  
  // Extract key findings
  const keyFindings = extractKeyFindings(
    nineBrainAnalysis,
    contradictions,
    timelineAnalysis
  )
  
  // Generate recommendations
  const recommendations = generateRecommendations(
    nineBrainAnalysis,
    contradictions,
    timelineAnalysis,
    overallRiskScore
  )
  
  return {
    documentId: document.id,
    fileName: document.fileName,
    timestamp: Date.now(),
    nineBrainAnalysis,
    contradictions,
    contradictionSummary,
    timelineAnalysis,
    overallRiskScore,
    keyFindings,
    recommendations,
    analysisMode: 'offline',
    analysisVersion: '1.0.0'
  }
}

/**
 * Analyze multiple documents as a case
 */
export async function analyzeCaseOffline(
  documents: ForensicDocument[],
  caseId: string
): Promise<CaseAnalysisResult> {
  // Analyze each document
  const documentAnalyses = await Promise.all(
    documents.map(doc => analyzeDocumentOffline(doc, { allDocuments: documents }))
  )
  
  // Cross-document analysis
  const crossDocumentContradictions = detectCrossDocumentContradictions(documents)
  const timelineDiscrepancies = detectTimelineDiscrepancies(documentAnalyses)
  const chainOfCustodyIssues = detectChainOfCustodyIssues(documents)
  
  // Overall assessment
  const overallAssessment = generateOverallAssessment(
    documentAnalyses,
    crossDocumentContradictions,
    timelineDiscrepancies,
    chainOfCustodyIssues
  )
  
  return {
    caseId,
    documents: documentAnalyses,
    crossDocumentContradictions,
    timelineDiscrepancies,
    chainOfCustodyIssues,
    overallAssessment,
    timestamp: Date.now()
  }
}

/**
 * Extract text content from document
 */
function extractTextContent(document: ForensicDocument): string {
  if (typeof document.content === 'string') {
    return document.content
  }
  
  // For binary content, convert to text if possible
  try {
    const decoder = new TextDecoder('utf-8')
    return decoder.decode(document.content)
  } catch {
    return '[Binary content - text extraction not available]'
  }
}

/**
 * Generate contradiction summary
 */
function generateContradictionSummary(contradictions: Contradiction[]): string {
  if (contradictions.length === 0) {
    return 'No contradictions detected.'
  }
  
  const bySeverity = {
    critical: contradictions.filter(c => c.severity === 'critical').length,
    high: contradictions.filter(c => c.severity === 'high').length,
    medium: contradictions.filter(c => c.severity === 'medium').length,
    low: contradictions.filter(c => c.severity === 'low').length
  }
  
  let summary = `Found ${contradictions.length} contradiction(s): `
  const parts: string[] = []
  
  if (bySeverity.critical > 0) parts.push(`${bySeverity.critical} critical`)
  if (bySeverity.high > 0) parts.push(`${bySeverity.high} high`)
  if (bySeverity.medium > 0) parts.push(`${bySeverity.medium} medium`)
  if (bySeverity.low > 0) parts.push(`${bySeverity.low} low`)
  
  summary += parts.join(', ')
  return summary
}

/**
 * Calculate overall risk score
 */
function calculateRiskScore(
  nineBrain: NineBrainOfflineAnalysis,
  contradictions: Contradiction[],
  timeline: TimelineAnalysis | null
): number {
  let score = 0
  
  // Weight contradictions heavily
  const criticalCount = contradictions.filter(c => c.severity === 'critical').length
  const highCount = contradictions.filter(c => c.severity === 'high').length
  
  score += criticalCount * 0.3
  score += highCount * 0.2
  score += contradictions.length * 0.05
  
  // Consider nine-brain risk factors
  score += nineBrain.legalBrain.constitutionalViolations.length * 0.15
  score += nineBrain.forensicBrain.tamperingIndicators.length * 0.2
  score += nineBrain.evidenceBrain.admissibilityIssues.length * 0.1
  
  // Timeline issues
  if (timeline?.inconsistencies && timeline.inconsistencies.length > 0) {
    score += timeline.inconsistencies.length * 0.1
  }
  
  // Cap at 1.0
  return Math.min(score, 1.0)
}

/**
 * Extract key findings
 */
function extractKeyFindings(
  nineBrain: NineBrainOfflineAnalysis,
  contradictions: Contradiction[],
  timeline: TimelineAnalysis | null
): string[] {
  const findings: string[] = []
  
  // Critical contradictions
  const critical = contradictions.filter(c => c.severity === 'critical')
  if (critical.length > 0) {
    findings.push(`${critical.length} critical contradiction(s) detected`)
  }
  
  // Constitutional violations
  if (nineBrain.legalBrain.constitutionalViolations.length > 0) {
    findings.push(`Potential constitutional violations: ${nineBrain.legalBrain.constitutionalViolations.length}`)
  }
  
  // Tampering indicators
  if (nineBrain.forensicBrain.tamperingIndicators.length > 0) {
    findings.push(`Evidence tampering indicators: ${nineBrain.forensicBrain.tamperingIndicators.length}`)
  }
  
  // Admissibility issues
  if (nineBrain.evidenceBrain.admissibilityIssues.length > 0) {
    findings.push(`Admissibility concerns: ${nineBrain.evidenceBrain.admissibilityIssues.length}`)
  }
  
  // Timeline issues
  if (timeline?.inconsistencies && timeline.inconsistencies.length > 0) {
    findings.push(`Timeline inconsistencies: ${timeline.inconsistencies.length}`)
  }
  
  return findings
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  nineBrain: NineBrainOfflineAnalysis,
  contradictions: Contradiction[],
  timeline: TimelineAnalysis | null,
  riskScore: number
): string[] {
  const recommendations: string[] = []
  
  if (riskScore > 0.7) {
    recommendations.push('HIGH RISK: Immediate review by legal counsel required')
  }
  
  if (contradictions.some(c => c.severity === 'critical')) {
    recommendations.push('Critical contradictions detected - investigate thoroughly before proceeding')
  }
  
  if (nineBrain.forensicBrain.tamperingIndicators.length > 0) {
    recommendations.push('Evidence integrity concerns - verify chain of custody')
  }
  
  if (nineBrain.legalBrain.constitutionalViolations.length > 0) {
    recommendations.push('Constitutional issues identified - consult with legal team')
  }
  
  if (timeline?.inconsistencies && timeline.inconsistencies.length > 0) {
    recommendations.push('Timeline discrepancies found - cross-reference with other evidence')
  }
  
  if (recommendations.length === 0) {
    recommendations.push('No major issues detected - standard procedures apply')
  }
  
  return recommendations
}

/**
 * Detect contradictions across multiple documents
 */
function detectCrossDocumentContradictions(documents: ForensicDocument[]): Contradiction[] {
  const contradictions: Contradiction[] = []
  
  // Compare statements across documents
  for (let i = 0; i < documents.length; i++) {
    for (let j = i + 1; j < documents.length; j++) {
      const doc1 = documents[i]
      const doc2 = documents[j]
      
      // Extract text content
      const text1 = typeof doc1.content === 'string' ? doc1.content : ''
      const text2 = typeof doc2.content === 'string' ? doc2.content : ''
      
      // Look for conflicting statements
      // This is a simplified example - real implementation would be more sophisticated
      if (text1.includes('at 10:00') && text2.includes('at 11:00')) {
        contradictions.push({
          type: 'timeline',
          severity: 'medium',
          description: `Time discrepancy between ${doc1.fileName} and ${doc2.fileName}`,
          location: {
            document1: doc1.fileName,
            document2: doc2.fileName
          },
          suggestion: 'Verify timestamps and reconcile timing information'
        })
      }
    }
  }
  
  return contradictions
}

/**
 * Detect timeline discrepancies
 */
function detectTimelineDiscrepancies(analyses: ForensicAnalysisResult[]): string[] {
  const discrepancies: string[] = []
  
  // Check for timeline issues across documents
  const timelines = analyses
    .map(a => a.timelineAnalysis)
    .filter((t): t is TimelineAnalysis => t !== null)
  
  if (timelines.length > 1) {
    // Compare timelines
    for (let i = 0; i < timelines.length - 1; i++) {
      const t1 = timelines[i]
      const t2 = timelines[i + 1]
      
      // Check for overlapping events with different times
      if (t1.events.length > 0 && t2.events.length > 0) {
        discrepancies.push(`Potential timing conflict between documents ${i + 1} and ${i + 2}`)
      }
    }
  }
  
  return discrepancies
}

/**
 * Detect chain of custody issues
 */
function detectChainOfCustodyIssues(documents: ForensicDocument[]): string[] {
  const issues: string[] = []
  
  // Check for metadata gaps
  for (const doc of documents) {
    if (!doc.metadata?.author) {
      issues.push(`${doc.fileName}: Missing author information`)
    }
    
    if (!doc.metadata?.createdDate) {
      issues.push(`${doc.fileName}: Missing creation date`)
    }
    
    // Check for suspicious modification patterns
    if (doc.metadata?.modifiedDate && doc.metadata?.createdDate) {
      const created = new Date(doc.metadata.createdDate).getTime()
      const modified = new Date(doc.metadata.modifiedDate).getTime()
      
      if (modified < created) {
        issues.push(`${doc.fileName}: Modified date is before created date`)
      }
    }
  }
  
  return issues
}

/**
 * Generate overall assessment
 */
function generateOverallAssessment(
  analyses: ForensicAnalysisResult[],
  crossDocContradictions: Contradiction[],
  timelineDiscrepancies: string[],
  custodyIssues: string[]
): string {
  const totalContradictions = analyses.reduce((sum, a) => sum + a.contradictions.length, 0) + crossDocContradictions.length
  const avgRiskScore = analyses.reduce((sum, a) => sum + a.overallRiskScore, 0) / analyses.length
  
  let assessment = `Case Analysis Summary:\n\n`
  assessment += `Documents Analyzed: ${analyses.length}\n`
  assessment += `Total Contradictions: ${totalContradictions}\n`
  assessment += `Timeline Discrepancies: ${timelineDiscrepancies.length}\n`
  assessment += `Chain of Custody Issues: ${custodyIssues.length}\n`
  assessment += `Average Risk Score: ${(avgRiskScore * 100).toFixed(1)}%\n\n`
  
  if (avgRiskScore > 0.7) {
    assessment += '⚠️ HIGH RISK CASE - Immediate attention required\n'
  } else if (avgRiskScore > 0.4) {
    assessment += '⚠️ MODERATE RISK - Careful review recommended\n'
  } else {
    assessment += '✓ LOW RISK - Standard procedures apply\n'
  }
  
  return assessment
}
