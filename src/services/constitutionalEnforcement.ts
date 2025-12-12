/**
 * Constitutional Enforcement Layer
 * Provides standing detection, honesty enforcement, and shutdown logic
 * Works on top of existing cryptographic sealing - does NOT modify sealing
 */

// Context classifications for uploads
export enum DocumentContext {
  PERSONAL_SELF_MATTER = 'PERSONAL_SELF_MATTER',
  BUSINESS_OR_CORPORATE_MATTER = 'BUSINESS_OR_CORPORATE_MATTER',
  MULTI_PARTY_CASE_FILE = 'MULTI_PARTY_CASE_FILE',
  UNKNOWN_OR_AMBIGUOUS = 'UNKNOWN_OR_AMBIGUOUS'
}

// Authenticity check results
export enum AuthenticityStatus {
  VERIFIED = 'VERIFIED',
  SUSPICIOUS = 'SUSPICIOUS',
  FABRICATED = 'FABRICATED',
  TAMPERED = 'TAMPERED'
}

// Enforcement outcomes
export enum EnforcementOutcome {
  ALLOWED = 'ALLOWED',
  STANDING_VIOLATION = 'STANDING_VIOLATION',
  DISHONESTY_DETECTED = 'DISHONESTY_DETECTED',
  MALICIOUS_REUSE = 'MALICIOUS_REUSE',
  AUTHENTICITY_FAILURE = 'AUTHENTICITY_FAILURE'
}

export interface InputBundle {
  fileName: string
  content: string | ArrayBuffer
  fileType: string
  size: number
}

export interface ContextResult {
  context: DocumentContext
  confidence: number
  indicators: string[]
}

export interface AuthenticityResult {
  status: AuthenticityStatus
  issues: string[]
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical'
}

export interface EnforcementResult {
  outcome: EnforcementOutcome
  allowed: boolean
  reason: string
  sealedReport?: string
}

/**
 * Determine context and standing for uploaded documents
 * This classifies what type of matter the document relates to
 */
export function determineContext(inputBundle: InputBundle): ContextResult {
  const content = typeof inputBundle.content === 'string' 
    ? inputBundle.content 
    : new TextDecoder().decode(inputBundle.content)
  
  const indicators: string[] = []
  let context = DocumentContext.UNKNOWN_OR_AMBIGUOUS
  let confidence = 0.5

  // Use case-insensitive regex directly instead of converting entire content
  const fileNameLower = inputBundle.fileName.toLowerCase()

  // Business/Corporate indicators
  const businessPatterns = [
    /\b(pty|ltd|llc|inc|corp|corporation|company)\b/gi,
    /\b(vat|abn|acn|ein|tax id|registration number)\s*:?\s*\d+/gi,
    /\b(invoice|receipt|ledger|balance sheet|profit and loss)\b/gi,
    /\b(board of directors|shareholders|corporate resolution)\b/gi,
    /\b(articles of incorporation|bylaws|operating agreement)\b/gi,
    /\b(employment contract|non-disclosure agreement|partnership)\b/gi
  ]

  let businessScore = 0
  for (const pattern of businessPatterns) {
    const matches = content.match(pattern)
    if (matches) {
      businessScore += matches.length
      indicators.push(`Business indicator found: ${pattern.source.substring(0, 30)}...`)
    }
  }

  // Multi-party case file indicators
  const multiPartyPatterns = [
    /\b(plaintiff|defendant|respondent|appellant|appellee)\b/gi,
    /\bcase\s*(number|no\.?|#)\s*:?\s*[\w-]+/gi,
    /\b(docket|filing|motion|brief|complaint|petition)\b/gi,
    /\b(versus|v\.|vs\.)\b/gi,
    /\b(discovery|deposition|interrogatories|subpoena)\b/gi,
    /\bmultiple\s+(parties|individuals|entities)/gi
  ]

  let multiPartyScore = 0
  for (const pattern of multiPartyPatterns) {
    const matches = content.match(pattern)
    if (matches) {
      multiPartyScore += matches.length
      indicators.push(`Multi-party indicator found: ${pattern.source.substring(0, 30)}...`)
    }
  }

  // Personal matter indicators
  const personalPatterns = [
    /\b(my |i am|i was|i have|my own)\b/gi,
    /\bpersonal (communication|message|email|letter|document)\b/gi,
    /\b(victim|complainant) statement\b/gi
  ]

  let personalScore = 0
  for (const pattern of personalPatterns) {
    const matches = content.match(pattern)
    if (matches) {
      personalScore += matches.length
      indicators.push(`Personal matter indicator: ${pattern.source.substring(0, 30)}...`)
    }
  }

  // File naming convention checks
  if (fileNameLower.includes('case') || fileNameLower.includes('docket')) {
    multiPartyScore += 2
    indicators.push('Case-file naming convention detected')
  }

  if (fileNameLower.includes('corporate') || fileNameLower.includes('company')) {
    businessScore += 2
    indicators.push('Business naming convention detected')
  }

  // Multiple unrelated individuals detection
  const namePattern = /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g
  const names = new Set<string>()
  let match
  namePattern.lastIndex = 0 // Reset regex state
  while ((match = namePattern.exec(content)) !== null) {
    names.add(match[1])
  }

  if (names.size > 3) {
    multiPartyScore += names.size
    indicators.push(`Multiple individuals detected: ${names.size} unique names`)
  }

  // Determine final context based on scores
  if (businessScore > 5 || (businessScore > 2 && multiPartyScore > 2)) {
    context = DocumentContext.BUSINESS_OR_CORPORATE_MATTER
    confidence = Math.min(0.95, 0.6 + businessScore * 0.05)
  } else if (multiPartyScore > 5 || (multiPartyScore > 3 && names.size > 3)) {
    context = DocumentContext.MULTI_PARTY_CASE_FILE
    confidence = Math.min(0.95, 0.6 + multiPartyScore * 0.05)
  } else if (personalScore > 3 && businessScore < 2 && multiPartyScore < 2) {
    context = DocumentContext.PERSONAL_SELF_MATTER
    confidence = Math.min(0.85, 0.6 + personalScore * 0.05)
  } else {
    context = DocumentContext.UNKNOWN_OR_AMBIGUOUS
    confidence = 0.4
  }

  return {
    context,
    confidence,
    indicators
  }
}

/**
 * Verify authenticity and detect dishonesty
 * Checks for fabrication, manipulation, and contradictions
 */
export function verifyAuthenticity(inputBundle: InputBundle): AuthenticityResult {
  const content = typeof inputBundle.content === 'string' 
    ? inputBundle.content 
    : new TextDecoder().decode(inputBundle.content)
  
  const issues: string[] = []
  let severity: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none'

  // Metadata consistency checks
  const currentYear = new Date().getFullYear()
  const yearPattern = /\b(19|20)\d{2}\b/g
  const years: number[] = []
  let yearMatch
  yearPattern.lastIndex = 0 // Reset regex state
  while ((yearMatch = yearPattern.exec(content)) !== null) {
    years.push(parseInt(yearMatch[0]))
  }

  // Check for future dates
  const futureYears = years.filter(y => y > currentYear)
  if (futureYears.length > 0) {
    issues.push('Document contains future dates')
    severity = 'high'
  }

  // Check for anachronistic dates (dates too far apart)
  if (years.length > 1) {
    const minYear = Math.min(...years)
    const maxYear = Math.max(...years)
    if (maxYear - minYear > 20) {
      issues.push('Timeline spans unusually long period (>20 years)')
      severity = severity === 'none' ? 'low' : severity
    }
  }

  // Structural integrity checks
  const hasInconsistentFormatting = /(\n\s{10,}|\t{5,})/.test(content)
  if (hasInconsistentFormatting) {
    issues.push('Inconsistent formatting detected')
    severity = severity === 'none' ? 'low' : severity
  }

  // Check for obvious contradictions
  const contradictionPatterns = [
    { pattern: /i (did|was) not.*but.*i (did|was)/gi, desc: 'Direct contradiction in statements' },
    { pattern: /never.*always/gi, desc: 'Absolute statement contradiction' },
    { pattern: /impossible.*occurred/gi, desc: 'Logical impossibility claimed as fact' }
  ]

  for (const { pattern, desc } of contradictionPatterns) {
    if (pattern.test(content)) {
      issues.push(desc)
      severity = 'medium'
    }
  }

  // Known forgery indicators
  const forgeryIndicators = [
    { pattern: /\[INSERT.*HERE\]/gi, desc: 'Template markers left in document' },
    { pattern: /\{\{.*\}\}/gi, desc: 'Unprocessed template variables' },
    { pattern: /XXX|TODO|FIXME/gi, desc: 'Placeholder text present' }
  ]

  for (const { pattern, desc } of forgeryIndicators) {
    if (pattern.test(content)) {
      issues.push(desc)
      severity = 'critical'
    }
  }

  // Check for copy-paste artifacts
  const duplicateLinePattern = /^(.{20,})$/gm
  const lines = new Set<string>()
  let duplicates = 0
  let lineMatch
  duplicateLinePattern.lastIndex = 0 // Reset regex state
  while ((lineMatch = duplicateLinePattern.exec(content)) !== null) {
    if (lines.has(lineMatch[1])) {
      duplicates++
    }
    lines.add(lineMatch[1])
  }

  if (duplicates > 5) {
    issues.push('Excessive duplicate content detected')
    severity = severity === 'none' || severity === 'low' ? 'medium' : severity
  }

  // Determine status
  let status = AuthenticityStatus.VERIFIED
  if (severity === 'critical') {
    status = AuthenticityStatus.FABRICATED
  } else if (severity === 'high') {
    status = AuthenticityStatus.TAMPERED
  } else if (severity === 'medium') {
    status = AuthenticityStatus.SUSPICIOUS
  }

  return {
    status,
    issues,
    severity
  }
}

/**
 * Constitutional gate - central enforcement point
 * Returns enforcement decision based on context, authenticity, and user authentication
 */
export function constitutionalGate(
  inputBundle: InputBundle,
  contextResult: ContextResult,
  authenticityResult: AuthenticityResult,
  isAuthenticated: boolean,
  isInstitutional: boolean
): EnforcementResult {
  // Rule 1: Check authenticity first (applies to ALL users)
  if (authenticityResult.severity === 'critical' || 
      authenticityResult.status === AuthenticityStatus.FABRICATED) {
    return {
      outcome: EnforcementOutcome.DISHONESTY_DETECTED,
      allowed: false,
      reason: `Material falsehood or fabrication detected. Issues: ${authenticityResult.issues.join(', ')}. The system cannot assist with dishonest submissions.`
    }
  }

  if (authenticityResult.severity === 'high' || 
      authenticityResult.status === AuthenticityStatus.TAMPERED) {
    return {
      outcome: EnforcementOutcome.AUTHENTICITY_FAILURE,
      allowed: false,
      reason: `Document integrity failure detected. Issues: ${authenticityResult.issues.join(', ')}. Cannot proceed with potentially tampered evidence.`
    }
  }

  // Rule 2: Check standing for business/corporate matters
  if (contextResult.context === DocumentContext.BUSINESS_OR_CORPORATE_MATTER) {
    if (!isAuthenticated || !isInstitutional) {
      return {
        outcome: EnforcementOutcome.STANDING_VIOLATION,
        allowed: false,
        reason: 'Business or corporate matters require authenticated institutional access. Public users may only process their own personal communications and documents where they are the clear originator or victim.'
      }
    }
  }

  // Rule 3: Check standing for multi-party case files
  if (contextResult.context === DocumentContext.MULTI_PARTY_CASE_FILE) {
    if (!isAuthenticated || !isInstitutional) {
      return {
        outcome: EnforcementOutcome.STANDING_VIOLATION,
        allowed: false,
        reason: 'Multi-party case files require authenticated institutional access. Public users may only process matters where they are the clear originator or victim.'
      }
    }
  }

  // Rule 4: Flag suspicious content for review
  if (authenticityResult.severity === 'medium') {
    // Allow but flag for closer scrutiny
    return {
      outcome: EnforcementOutcome.ALLOWED,
      allowed: true,
      reason: `Document accepted with caution flags: ${authenticityResult.issues.join(', ')}. Analysis will proceed with heightened scrutiny.`
    }
  }

  // Rule 5: Unknown/ambiguous context - allow with caution
  if (contextResult.context === DocumentContext.UNKNOWN_OR_AMBIGUOUS) {
    return {
      outcome: EnforcementOutcome.ALLOWED,
      allowed: true,
      reason: 'Document context unclear. Proceeding with standard forensic analysis. Only personal matters will be fully analyzed without institutional authentication.'
    }
  }

  // Default: Allow
  return {
    outcome: EnforcementOutcome.ALLOWED,
    allowed: true,
    reason: 'Document cleared for forensic analysis.'
  }
}

/**
 * Generate a sealed refusal report
 * This report is cryptographically sealed even though processing was denied
 */
export function generateRefusalReport(
  inputBundle: InputBundle,
  enforcementResult: EnforcementResult,
  contextResult: ContextResult,
  authenticityResult: AuthenticityResult
): string {
  const timestamp = new Date().toISOString()
  
  return `
=== VERUM OMNIS FORENSIC ENFORCEMENT REPORT ===
Generated: ${timestamp}

PROCESSING DENIED

File: ${inputBundle.fileName}
Size: ${inputBundle.size} bytes
Type: ${inputBundle.fileType}

ENFORCEMENT OUTCOME: ${enforcementResult.outcome}

REASON:
${enforcementResult.reason}

CONTEXT ANALYSIS:
- Classification: ${contextResult.context}
- Confidence: ${(contextResult.confidence * 100).toFixed(1)}%
- Indicators: ${contextResult.indicators.join('; ')}

AUTHENTICITY ASSESSMENT:
- Status: ${authenticityResult.status}
- Severity: ${authenticityResult.severity}
- Issues: ${authenticityResult.issues.length > 0 ? authenticityResult.issues.join('; ') : 'None detected'}

CONSTITUTIONAL ENFORCEMENT NOTICE:
This system enforces constitutional forensic standards. The document was
denied processing based on standing requirements or authenticity concerns.
This is not an accusation, but a factual enforcement of evidentiary standards.

All submitted materials are cryptographically sealed, including this refusal.

=== END ENFORCEMENT REPORT ===
`
}

/**
 * Forensic language enforcement for AI outputs
 * Returns system prompt additions to ensure proper forensic language
 */
export function getForensicLanguageRules(): string {
  return `
CRITICAL OUTPUT CONSTRAINTS (CONSTITUTIONAL ENFORCEMENT):

You must adhere to these forensic language rules at all times:

1. EVIDENTIARY ANALYSIS ONLY
   - State clearly: "This is an evidentiary analysis, not a legal determination."
   - Never assign guilt or innocence
   - Never recommend prosecution or charges
   - Never speculate beyond the evidence provided

2. NEUTRAL FORENSIC TONE
   - Use factual, objective language only
   - Present findings as observations, not conclusions
   - Avoid accusatory or judgmental language
   - Present contradictions as discrepancies, not lies

3. SCOPE LIMITATIONS
   - Only analyze what is directly presented
   - Flag gaps in evidence rather than filling them with assumptions
   - Distinguish between facts, inferences, and speculation
   - Always note limitations of the analysis

4. PROFESSIONAL STANDARDS
   - Use forensic terminology appropriately
   - Reference applicable standards (e.g., Daubert, chain of custody)
   - Acknowledge when specialized expertise is required
   - Maintain clear distinction between technical analysis and legal judgment

5. REQUIRED DISCLAIMER
   Every substantive response must include:
   "This analysis represents a forensic examination of submitted materials and does not constitute legal advice, legal determination, or judicial finding. The analysis is limited to technical and evidentiary considerations based on the information provided."

Violation of these rules constitutes a system failure. Enforce these constraints rigidly.
`
}
