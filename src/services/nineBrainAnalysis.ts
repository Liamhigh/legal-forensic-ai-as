/**
 * Nine-Brain Analysis Framework (Offline Capable)
 * Implements multi-perspective forensic analysis based on Verum Omnis Ideal Logic
 * Works completely offline using pattern matching and rule-based logic
 * 
 * Nine Brains:
 * 1. Legal Brain - Constitutional violations, precedent analysis
 * 2. Forensic Brain - Chain of custody, metadata verification, tampering detection
 * 3. Financial Brain - Transaction patterns, money laundering indicators
 * 4. Evidence Brain - Admissibility checks, Brady violations
 * 5. Ethics Core - Professional conduct evaluation
 * 6. Communication Brain - Linguistic analysis, deception detection
 * 7. CitizenEngageAI - Public access compliance
 * 8. Behavioral & Emotional Diagnostics - Psychological patterns
 * 9. R&D Brain - Advanced analytical techniques
 */

import type { ForensicDocument } from './offlineForensics'

export interface NineBrainOfflineAnalysis {
  legalBrain: LegalBrainAnalysis
  forensicBrain: ForensicBrainAnalysis
  financialBrain: FinancialBrainAnalysis
  evidenceBrain: EvidenceBrainAnalysis
  ethicsCore: EthicsCoreAnalysis
  communicationBrain: CommunicationBrainAnalysis
  citizenEngageAI: CitizenEngageAnalysis
  behavioralDiagnostics: BehavioralDiagnosticsAnalysis
  rdBrain: RDBrainAnalysis
  
  // Synthesis
  overallConfidence: number
  synthesisNarrative: string
}

export interface LegalBrainAnalysis {
  constitutionalViolations: string[]
  precedentReferences: string[]
  jurisdictionalIssues: string[]
  legalRiskScore: number
}

export interface ForensicBrainAnalysis {
  chainOfCustody: string
  metadataVerification: string
  tamperingIndicators: string[]
  integrityScore: number
}

export interface FinancialBrainAnalysis {
  transactionPatterns: string[]
  suspiciousActivity: string[]
  moneyLaunderingRisk: number
}

export interface EvidenceBrainAnalysis {
  admissibilityIssues: string[]
  bradyViolations: string[]
  relevanceScore: number
}

export interface EthicsCoreAnalysis {
  professionalConduct: string[]
  ethicalConcerns: string[]
  biasIndicators: string[]
}

export interface CommunicationBrainAnalysis {
  linguisticPatterns: string[]
  deceptionIndicators: string[]
  sentimentAnalysis: string
  communicationClarity: number
}

export interface CitizenEngageAnalysis {
  publicAccessCompliance: string[]
  transparencyScore: number
}

export interface BehavioralDiagnosticsAnalysis {
  psychologicalPatterns: string[]
  stressIndicators: string[]
  behavioralConsistency: number
}

export interface RDBrainAnalysis {
  advancedTechniques: string[]
  novelFindings: string[]
  researchRecommendations: string[]
}

/**
 * Analyze document with all nine brains (offline mode)
 */
export async function analyzeWithNineBrains(
  document: ForensicDocument,
  textContent: string
): Promise<NineBrainOfflineAnalysis> {
  // Run all nine brains in parallel
  const [
    legalBrain,
    forensicBrain,
    financialBrain,
    evidenceBrain,
    ethicsCore,
    communicationBrain,
    citizenEngageAI,
    behavioralDiagnostics,
    rdBrain
  ] = await Promise.all([
    analyzeLegalBrain(textContent),
    analyzeForensicBrain(document, textContent),
    analyzeFinancialBrain(textContent),
    analyzeEvidenceBrain(textContent),
    analyzeEthicsCore(textContent),
    analyzeCommunicationBrain(textContent),
    analyzeCitizenEngage(textContent),
    analyzeBehavioralDiagnostics(textContent),
    analyzeRDBrain(textContent)
  ])
  
  // Calculate overall confidence
  const overallConfidence = calculateOverallConfidence(
    legalBrain,
    forensicBrain,
    financialBrain,
    evidenceBrain,
    ethicsCore,
    communicationBrain,
    citizenEngageAI,
    behavioralDiagnostics,
    rdBrain
  )
  
  // Generate synthesis narrative
  const synthesisNarrative = generateSynthesisNarrative(
    document.fileName,
    legalBrain,
    forensicBrain,
    financialBrain,
    evidenceBrain,
    ethicsCore,
    communicationBrain,
    citizenEngageAI,
    behavioralDiagnostics,
    rdBrain
  )
  
  return {
    legalBrain,
    forensicBrain,
    financialBrain,
    evidenceBrain,
    ethicsCore,
    communicationBrain,
    citizenEngageAI,
    behavioralDiagnostics,
    rdBrain,
    overallConfidence,
    synthesisNarrative
  }
}

/**
 * Brain 1: Legal Brain
 */
async function analyzeLegalBrain(content: string): Promise<LegalBrainAnalysis> {
  const constitutionalViolations: string[] = []
  const precedentReferences: string[] = []
  const jurisdictionalIssues: string[] = []
  
  // Check for Fourth Amendment issues
  if (/(?:search|seizure).*without.*warrant/i.test(content)) {
    constitutionalViolations.push('Potential Fourth Amendment violation - warrantless search/seizure')
  }
  
  // Check for Fifth Amendment issues
  if (/(?:confession|statement).*without.*miranda/i.test(content)) {
    constitutionalViolations.push('Potential Fifth Amendment violation - Miranda rights')
  }
  
  // Check for Sixth Amendment issues
  if (/without.*(?:counsel|attorney|lawyer)/i.test(content)) {
    constitutionalViolations.push('Potential Sixth Amendment violation - right to counsel')
  }
  
  // Look for case citations
  const casePattern = /\b([A-Z][a-z]+\s+v\.\s+[A-Z][a-z]+(?:\s+\d+)?)\b/g
  let match
  while ((match = casePattern.exec(content)) !== null) {
    precedentReferences.push(match[1])
  }
  
  // Check for jurisdiction mentions
  if (/federal\s+(?:court|jurisdiction)/i.test(content)) {
    jurisdictionalIssues.push('Federal jurisdiction indicated')
  }
  if (/state\s+(?:court|jurisdiction)/i.test(content)) {
    jurisdictionalIssues.push('State jurisdiction indicated')
  }
  
  // Calculate legal risk score
  const legalRiskScore = constitutionalViolations.length * 0.3 + 
                        jurisdictionalIssues.length * 0.1
  
  return {
    constitutionalViolations,
    precedentReferences,
    jurisdictionalIssues,
    legalRiskScore: Math.min(legalRiskScore, 1.0)
  }
}

/**
 * Brain 2: Forensic Brain
 */
async function analyzeForensicBrain(
  document: ForensicDocument,
  content: string
): Promise<ForensicBrainAnalysis> {
  const tamperingIndicators: string[] = []
  
  // Check metadata
  let chainOfCustody = 'Chain of custody: '
  if (document.metadata?.author) {
    chainOfCustody += `Created by ${document.metadata.author}. `
  } else {
    tamperingIndicators.push('Missing author metadata')
  }
  
  if (document.metadata?.createdDate) {
    chainOfCustody += `Created ${document.metadata.createdDate}. `
  } else {
    tamperingIndicators.push('Missing creation date')
  }
  
  // Check for tampering keywords
  if (/(?:altered|modified|tampered|forged|manipulated)/i.test(content)) {
    tamperingIndicators.push('Tampering keywords detected in content')
  }
  
  // Check for suspicious file patterns
  if (document.metadata?.modifiedDate && document.metadata?.createdDate) {
    const created = new Date(document.metadata.createdDate).getTime()
    const modified = new Date(document.metadata.modifiedDate).getTime()
    
    if (modified < created) {
      tamperingIndicators.push('Modified date precedes creation date')
    }
  }
  
  // Metadata verification
  const metadataVerification = tamperingIndicators.length === 0
    ? 'Metadata appears consistent and verified'
    : `Metadata issues detected: ${tamperingIndicators.length} concern(s)`
  
  // Calculate integrity score
  const integrityScore = Math.max(0, 1.0 - (tamperingIndicators.length * 0.2))
  
  return {
    chainOfCustody,
    metadataVerification,
    tamperingIndicators,
    integrityScore
  }
}

/**
 * Brain 3: Financial Brain
 */
async function analyzeFinancialBrain(content: string): Promise<FinancialBrainAnalysis> {
  const transactionPatterns: string[] = []
  const suspiciousActivity: string[] = []
  
  // Look for financial amounts
  const amountPattern = /\$[\d,]+(?:\.\d{2})?|\d+\s*(?:dollars?|USD)/gi
  const amounts: number[] = []
  
  let match
  while ((match = amountPattern.exec(content)) !== null) {
    const amountStr = match[0].replace(/[$,\s]/g, '').replace(/dollars?|USD/i, '')
    const amount = parseFloat(amountStr)
    if (!isNaN(amount)) {
      amounts.push(amount)
    }
  }
  
  if (amounts.length > 0) {
    transactionPatterns.push(`${amounts.length} financial transaction(s) referenced`)
    
    // Check for large amounts
    const largeAmounts = amounts.filter(a => a > 10000)
    if (largeAmounts.length > 0) {
      transactionPatterns.push(`${largeAmounts.length} transaction(s) over $10,000`)
    }
  }
  
  // Look for suspicious keywords
  if (/(?:cash|wire\s+transfer|offshore|shell\s+company|launder)/i.test(content)) {
    suspiciousActivity.push('Potentially suspicious financial keywords detected')
  }
  
  // Check for structuring patterns
  const under10kTransactions = amounts.filter(a => a > 9000 && a < 10000)
  if (under10kTransactions.length >= 3) {
    suspiciousActivity.push('Possible structuring pattern - multiple transactions just under $10,000')
  }
  
  // Calculate money laundering risk
  const moneyLaunderingRisk = suspiciousActivity.length * 0.3
  
  return {
    transactionPatterns,
    suspiciousActivity,
    moneyLaunderingRisk: Math.min(moneyLaunderingRisk, 1.0)
  }
}

/**
 * Brain 4: Evidence Brain
 */
async function analyzeEvidenceBrain(content: string): Promise<EvidenceBrainAnalysis> {
  const admissibilityIssues: string[] = []
  const bradyViolations: string[] = []
  
  // Check for hearsay
  if (/(?:he\s+said|she\s+said|they\s+said|told\s+me|heard\s+that)/i.test(content)) {
    admissibilityIssues.push('Possible hearsay evidence')
  }
  
  // Check for chain of custody issues
  if (/(?:chain\s+of\s+custody|custody\s+gap|evidence\s+missing)/i.test(content)) {
    admissibilityIssues.push('Chain of custody concerns')
  }
  
  // Check for Brady material
  if (/(?:exculpatory|brady|favorable\s+to\s+defense)/i.test(content)) {
    bradyViolations.push('Exculpatory evidence mentioned - verify disclosure')
  }
  
  if (/(?:withheld|undisclosed|not\s+disclosed)/i.test(content)) {
    bradyViolations.push('Possible non-disclosure of evidence')
  }
  
  // Calculate relevance score
  const relevanceScore = Math.max(0, 1.0 - (admissibilityIssues.length * 0.2))
  
  return {
    admissibilityIssues,
    bradyViolations,
    relevanceScore
  }
}

/**
 * Brain 5: Ethics Core
 */
async function analyzeEthicsCore(content: string): Promise<EthicsCoreAnalysis> {
  const professionalConduct: string[] = []
  const ethicalConcerns: string[] = []
  const biasIndicators: string[] = []
  
  // Check for ethical keywords
  if (/(?:conflict\s+of\s+interest|bias|prejudice|improper)/i.test(content)) {
    ethicalConcerns.push('Ethical concern keywords detected')
  }
  
  // Check for professional conduct issues
  if (/(?:misconduct|violation|unethical|improper\s+conduct)/i.test(content)) {
    professionalConduct.push('Professional conduct issue mentioned')
  }
  
  // Check for bias indicators
  if (/(?:discriminat|prejudice|bias)/i.test(content)) {
    biasIndicators.push('Potential bias language detected')
  }
  
  return {
    professionalConduct,
    ethicalConcerns,
    biasIndicators
  }
}

/**
 * Brain 6: Communication Brain
 */
async function analyzeCommunicationBrain(content: string): Promise<CommunicationBrainAnalysis> {
  const linguisticPatterns: string[] = []
  const deceptionIndicators: string[] = []
  
  // Check for hedging language (potential deception)
  const hedgingWords = ['maybe', 'perhaps', 'possibly', 'might', 'could', 'i think', 'i believe']
  const hedgingCount = hedgingWords.reduce((count, word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    return count + (content.match(regex) || []).length
  }, 0)
  
  if (hedgingCount > 5) {
    deceptionIndicators.push(`High use of hedging language (${hedgingCount} instances)`)
  }
  
  // Check for contradiction indicators
  if (/\b(?:but|however|although|despite)\b/gi.test(content)) {
    linguisticPatterns.push('Contradictory language patterns present')
  }
  
  // Sentiment analysis (simple)
  const positiveWords = /\b(?:good|great|excellent|positive|success|agree)\b/gi
  const negativeWords = /\b(?:bad|poor|negative|fail|disagree|wrong)\b/gi
  
  const positiveCount = (content.match(positiveWords) || []).length
  const negativeCount = (content.match(negativeWords) || []).length
  
  let sentimentAnalysis = 'Neutral'
  if (positiveCount > negativeCount * 1.5) {
    sentimentAnalysis = 'Positive'
  } else if (negativeCount > positiveCount * 1.5) {
    sentimentAnalysis = 'Negative'
  }
  
  // Communication clarity
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length
  const communicationClarity = avgSentenceLength < 20 ? 0.9 : avgSentenceLength < 30 ? 0.7 : 0.5
  
  return {
    linguisticPatterns,
    deceptionIndicators,
    sentimentAnalysis,
    communicationClarity
  }
}

/**
 * Brain 7: CitizenEngageAI
 */
async function analyzeCitizenEngage(content: string): Promise<CitizenEngageAnalysis> {
  const publicAccessCompliance: string[] = []
  
  // Check for public access mentions
  if (/(?:public\s+access|transparency|disclosure)/i.test(content)) {
    publicAccessCompliance.push('Public access considerations mentioned')
  }
  
  // Check for sealed/confidential mentions
  if (/(?:sealed|confidential|restricted|classified)/i.test(content)) {
    publicAccessCompliance.push('Confidentiality restrictions noted')
  }
  
  // Transparency score
  const transparencyScore = publicAccessCompliance.length > 0 ? 0.8 : 0.5
  
  return {
    publicAccessCompliance,
    transparencyScore
  }
}

/**
 * Brain 8: Behavioral & Emotional Diagnostics
 */
async function analyzeBehavioralDiagnostics(content: string): Promise<BehavioralDiagnosticsAnalysis> {
  const psychologicalPatterns: string[] = []
  const stressIndicators: string[] = []
  
  // Check for emotional language
  const emotionalWords = /\b(?:angry|afraid|scared|nervous|anxious|stressed|worried)\b/gi
  const emotionalCount = (content.match(emotionalWords) || []).length
  
  if (emotionalCount > 3) {
    psychologicalPatterns.push(`Elevated emotional language (${emotionalCount} instances)`)
  }
  
  // Check for stress indicators
  if (/(?:pressure|stress|overwhelmed|panic)/i.test(content)) {
    stressIndicators.push('Stress-related language detected')
  }
  
  // Behavioral consistency
  const contradictionPattern = /\b(?:but\s+I\s+(?:said|did)|changed\s+my\s+mind|not\s+sure)\b/gi
  const contradictionCount = (content.match(contradictionPattern) || []).length
  const behavioralConsistency = Math.max(0, 1.0 - (contradictionCount * 0.1))
  
  return {
    psychologicalPatterns,
    stressIndicators,
    behavioralConsistency
  }
}

/**
 * Brain 9: R&D Brain
 */
async function analyzeRDBrain(content: string): Promise<RDBrainAnalysis> {
  const advancedTechniques: string[] = []
  const novelFindings: string[] = []
  const researchRecommendations: string[] = []
  
  // Identify advanced analytical opportunities
  if (content.length > 5000) {
    advancedTechniques.push('Document suitable for advanced NLP analysis')
  }
  
  // Check for novel patterns
  const uniqueWords = new Set(content.toLowerCase().split(/\s+/))
  if (uniqueWords.size > 500) {
    novelFindings.push('High vocabulary diversity - potential for semantic analysis')
  }
  
  // Research recommendations
  if (/(?:pattern|trend|correlation)/i.test(content)) {
    researchRecommendations.push('Consider statistical pattern analysis')
  }
  
  return {
    advancedTechniques,
    novelFindings,
    researchRecommendations
  }
}

/**
 * Calculate overall confidence from all brains
 */
function calculateOverallConfidence(
  legal: LegalBrainAnalysis,
  forensic: ForensicBrainAnalysis,
  financial: FinancialBrainAnalysis,
  evidence: EvidenceBrainAnalysis,
  ethics: EthicsCoreAnalysis,
  communication: CommunicationBrainAnalysis,
  citizen: CitizenEngageAnalysis,
  behavioral: BehavioralDiagnosticsAnalysis,
  rd: RDBrainAnalysis
): number {
  // Weight each brain's contribution
  const weights = {
    forensic: 0.25,
    evidence: 0.20,
    legal: 0.15,
    communication: 0.15,
    behavioral: 0.10,
    ethics: 0.05,
    financial: 0.05,
    citizen: 0.03,
    rd: 0.02
  }
  
  const score = 
    (1 - legal.legalRiskScore) * weights.legal +
    forensic.integrityScore * weights.forensic +
    (1 - financial.moneyLaunderingRisk) * weights.financial +
    evidence.relevanceScore * weights.evidence +
    (ethics.ethicalConcerns.length === 0 ? 1 : 0.5) * weights.ethics +
    communication.communicationClarity * weights.communication +
    citizen.transparencyScore * weights.citizen +
    behavioral.behavioralConsistency * weights.behavioral +
    (rd.novelFindings.length > 0 ? 0.8 : 0.5) * weights.rd
  
  return Math.max(0, Math.min(1, score))
}

/**
 * Generate synthesis narrative
 */
function generateSynthesisNarrative(
  fileName: string,
  legal: LegalBrainAnalysis,
  forensic: ForensicBrainAnalysis,
  financial: FinancialBrainAnalysis,
  evidence: EvidenceBrainAnalysis,
  ethics: EthicsCoreAnalysis,
  communication: CommunicationBrainAnalysis,
  citizen: CitizenEngageAnalysis,
  behavioral: BehavioralDiagnosticsAnalysis,
  rd: RDBrainAnalysis
): string {
  let narrative = `Nine-Brain Analysis of "${fileName}":\n\n`
  
  // Legal Brain summary
  if (legal.constitutionalViolations.length > 0) {
    narrative += `⚖️ LEGAL: ${legal.constitutionalViolations.length} constitutional concern(s) identified.\n`
  }
  
  // Forensic Brain summary
  narrative += `🔬 FORENSIC: Integrity score ${(forensic.integrityScore * 100).toFixed(0)}%. `
  if (forensic.tamperingIndicators.length > 0) {
    narrative += `${forensic.tamperingIndicators.length} tampering indicator(s).\n`
  } else {
    narrative += `No tampering indicators.\n`
  }
  
  // Financial Brain summary
  if (financial.suspiciousActivity.length > 0) {
    narrative += `💰 FINANCIAL: ${financial.suspiciousActivity.length} suspicious activity flag(s).\n`
  }
  
  // Evidence Brain summary
  if (evidence.admissibilityIssues.length > 0 || evidence.bradyViolations.length > 0) {
    narrative += `📋 EVIDENCE: ${evidence.admissibilityIssues.length} admissibility issue(s), ${evidence.bradyViolations.length} Brady concern(s).\n`
  }
  
  // Communication Brain summary
  narrative += `💬 COMMUNICATION: ${communication.sentimentAnalysis} sentiment, clarity ${(communication.communicationClarity * 100).toFixed(0)}%.\n`
  
  // Behavioral Brain summary
  if (behavioral.stressIndicators.length > 0) {
    narrative += `🧠 BEHAVIORAL: Stress indicators detected, consistency ${(behavioral.behavioralConsistency * 100).toFixed(0)}%.\n`
  }
  
  return narrative
}
