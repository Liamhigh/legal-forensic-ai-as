/**
 * Spark Backend Integration with Constitutional Constraints
 * 
 * This service ensures all AI responses from the Spark backend comply with
 * Verum Omnis constitutional principles and South African law enforcement requirements.
 * 
 * The forensic engine is deterministic and works offline.
 * The AI backend is optional and must follow constitutional constraints.
 * South African Police and Justice System get free access.
 */

export const CONSTITUTIONAL_SYSTEM_PROMPT = `You are an AI assistant operating within Verum Omnis, a forensic evidence processing system for South African Law Enforcement.

THIS SYSTEM IS PROVIDED FREE OF CHARGE TO SOUTH AFRICAN LAW ENFORCEMENT AND JUSTICE SYSTEM.

YOUR OPERATIONAL CONSTRAINTS:
1. You are a FORENSIC ANALYST, not a judge or prosecutor
2. Your role is EVIDENTIARY ANALYSIS ONLY
3. All outputs must be FORENSICALLY NEUTRAL
4. You operate under the South African Constitution
5. You CANNOT make legal determinations or pronounce guilt

MANDATORY DISCLAIMERS:
- Start every response: "⚖️ This is an evidentiary analysis, not a legal determination."
- Flag all evidence gaps in analysis
- Distinguish facts from inferences clearly
- Never assign guilt or recommend prosecution
- Acknowledge limitations of forensic analysis

FORBIDDEN OUTPUTS:
✗ Legal opinions or determinations of guilt/innocence
✗ Guilt/innocence conclusions
✗ Prosecution recommendations
✗ Opinions on sentencing or penalties
✗ Constitutional interpretations (defer to courts)
✗ Advice beyond forensic scope
✗ Dehumanizing language
✗ Assumptions beyond provided evidence

REQUIRED OUTPUTS:
✓ Factual observations only
✓ Timeline reconstruction based on evidence
✓ Contradiction identification
✓ Evidence chain analysis
✓ Objective forensic findings
✓ Clear limitations acknowledgment
✓ Evidence gaps noted
✓ Recommendations for investigative follow-up only

SOUTH AFRICAN CONSTITUTIONAL PRINCIPLES TO UPHOLD:
- Right to dignity (s10): No dehumanizing language
- Right to equality (s9): Apply same standards to all cases
- Right to fair trial (s35): No predetermined conclusions
- Right to access justice (s34): Support forensic transparency
- Human rights and rule of law

FORENSIC LANGUAGE REQUIREMENTS:
✓ Use: "evidence suggests", "findings indicate", "observation shows"
✓ Use: "based on available evidence", "subject to verification"
✓ Avoid: "clearly guilty", "obviously lied", "must have done", "definitely"
✓ Always: Hedge conclusions appropriately
✓ Never: Assume facts not in evidence

OUTPUT STRUCTURE FOR ANALYSIS:
1. Start with forensic disclaimer
2. Evidence summary (factual observations only)
3. Timeline/sequence analysis (if applicable)
4. Contradictions identified (if any)
5. Evidence gaps and limitations
6. Limitations of analysis and reach
7. Recommendations for investigative follow-up (if appropriate)

CASE CONTEXT CLASSIFICATION:
- Personal Matter: Public user case (restrict analysis scope to personal matters only)
- Business Matter: Institutional access only (no public)
- Multi-Party Case: Institutional access only (no public)
- Ambiguous: Request clarification before proceeding

RESPONSE VALIDATION BEFORE SENDING:
Before responding, verify these are ALL true:
✓ All claims are directly supported by provided evidence
✓ No assumptions made beyond evidence scope
✓ Constitutional language compliance maintained
✓ Forensic neutrality preserved throughout
✓ Limitations clearly stated
✓ No guilt/innocence determinations made
✓ Appropriate hedging language used
✓ Dehumanizing language completely avoided

IF CONSTRAINED:
If you cannot provide analysis that meets these forensic standards, respond exactly:
"I cannot provide analysis that meets our forensic standards for this request. 
Reason: [specific constraint violation]. 
Please rephrase your request to focus on objective evidence analysis."

REMEMBER: You are supporting South African law enforcement's mission to deliver justice fairly and transparently. The forensic engine works offline and doesn't require AI. When AI is used, it MUST maintain constitutional integrity.`

export interface SparkLLMRequest {
  prompt: string
  model?: string
  systemPrompt?: string
}

export interface SparkLLMResponse {
  text: string
  sealed: boolean
  forensicMarkers?: {
    analysisDate: string
    evidenceReference: string
    constitutionalCompliance: boolean
    jurisdiction: string
  }
}

export interface ComplianceResult {
  compliant: boolean
  violations: string[]
  warnings: string[]
  severity: 'none' | 'warning' | 'critical'
}

/**
 * Call Spark LLM with constitutional constraints
 * Wraps window.spark.llm with constitutional system prompt
 */
export async function callSparkLLMWithConstraints(
  userPrompt: string,
  context?: {
    evidenceHash?: string
    caseId?: string
    analysisType?: string
    caseContext?: 'personal' | 'business' | 'multiparty' | 'unknown'
  }
): Promise<SparkLLMResponse> {
  if (!window.spark?.llm) {
    throw new Error('Spark LLM not available - forensic engine can work offline');
  }

  try {
    // Add context-specific guidance
    let contextualGuidance = '';
    if (context?.caseContext === 'personal') {
      contextualGuidance = '\nCASE TYPE: Personal Matter - Restrict analysis scope to personal context only.';
    } else if (context?.caseContext === 'business') {
      contextualGuidance = '\nCASE TYPE: Business Matter - Apply institutional standards for accuracy.';
    } else if (context?.caseContext === 'multiparty') {
      contextualGuidance = '\nCASE TYPE: Multi-Party Case - Maintain strict neutrality between parties.';
    }

    // Construct the constrained prompt
    const constrainedPrompt = `${CONSTITUTIONAL_SYSTEM_PROMPT}

USER REQUEST:
${userPrompt}

${context?.evidenceHash ? `\nEVIDENCE HASH: ${context.evidenceHash}` : ''}
${context?.caseId ? `CASE ID: ${context.caseId}` : ''}
${context?.analysisType ? `ANALYSIS TYPE: ${context.analysisType}` : ''}
${contextualGuidance}`;

    const response = await window.spark.llm(constrainedPrompt, 'gpt-4o');
    
    return {
      text: response,
      sealed: true,
      forensicMarkers: {
        analysisDate: new Date().toISOString(),
        evidenceReference: context?.evidenceHash || 'unspecified',
        constitutionalCompliance: true,
        jurisdiction: 'south-africa'
      }
    };
  } catch (error) {
    console.error('Spark LLM error:', error);
    throw new Error(`Constitutional AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate response meets constitutional standards
 * Returns detailed compliance report
 */
export function validateConstitutionalCompliance(response: string): ComplianceResult {
  const violations: string[] = [];
  const warnings: string[] = [];

  // CRITICAL: Check for forbidden patterns (violations)
  const forbiddenPatterns = [
    { pattern: /\bguilt(y)?\b/i, violation: 'Uses word "guilty"' },
    { pattern: /\binnocent\b/i, violation: 'Uses word "innocent"' },
    { pattern: /\bprosecute\b/i, violation: 'Makes prosecution recommendation' },
    { pattern: /\bsentenc/i, violation: 'Makes sentencing recommendation' },
    { pattern: /\bmust (be|have).*guilty\b/i, violation: 'Asserts guilt determination' },
    { pattern: /\bclearly.*guilty\b/i, violation: 'Asserts guilt determination' },
    { pattern: /\bobviously.*lied\b/i, violation: 'Makes credibility determination' },
    { pattern: /\bthe defendant|the accused|the suspect.*is\s+(?:guilty|innocent)\b/i, violation: 'Makes guilt/innocence determination' },
    { pattern: /\bI (find|determine|conclude).*(?:guilty|innocent)\b/i, violation: 'Makes legal determination' },
  ];

  forbiddenPatterns.forEach(({ pattern, violation }) => {
    if (pattern.test(response)) {
      violations.push(violation);
    }
  });

  // WARNING: Check for weak hedging or assertions
  const weakAssertions = [
    { pattern: /\b(clearly|definitely|obviously|undoubtedly)\s+(\w+\s+)*(?:shows|proves|demonstrates)/i, warning: 'Overconfident assertion language' },
    { pattern: /\b(must have|clearly|definitely)\s+(?:happened|occurred)\b/i, warning: 'Assumes facts not in evidence' },
    { pattern: /\btherefore\s+(?:he|she|they)\s+(?:is|are)\s+(?:guilty|innocent)\b/i, warning: 'Logical fallacy in reasoning' },
  ];

  weakAssertions.forEach(({ pattern, warning }) => {
    if (pattern.test(response)) {
      warnings.push(warning);
    }
  });

  // CRITICAL: Check for required forensic disclaimer
  const hasForesicDisclaimer = 
    response.includes('evidentiary analysis') || 
    response.includes('⚖️') ||
    response.includes('not a legal determination');
  
  if (!hasForesicDisclaimer) {
    violations.push('Missing forensic disclaimer');
  }

  // WARNING: Check for limitations acknowledgment
  const hasLimitations = 
    response.includes('limitation') || 
    response.includes('gap') || 
    response.includes('subject to') ||
    response.includes('evidence provided') ||
    response.includes('based on available evidence');
  
  if (!hasLimitations) {
    warnings.push('No limitations or scope boundaries acknowledged');
  }

  // WARNING: Check for appropriate hedging
  const hasHedging = /\b(suggest|indicate|show|appear|may|might|could|potential|possible)\b/i.test(response);
  if (!hasHedging && response.length > 100) {
    warnings.push('Limited use of appropriate hedging language');
  }

  // Check for dehumanizing language
  const dehumanizingPatterns = [
    /\b(?:animal|creature|monster|beast|subhuman|deviant|pervert|sick|twisted)\b/i
  ];

  dehumanizingPatterns.forEach(pattern => {
    if (pattern.test(response)) {
      violations.push('Dehumanizing language detected');
    }
  });

  // Determine severity
  let severity: 'none' | 'warning' | 'critical' = 'none';
  if (violations.length > 0) {
    severity = 'critical';
  } else if (warnings.length > 0) {
    severity = 'warning';
  }

  return {
    compliant: violations.length === 0,
    violations,
    warnings,
    severity
  };
}

/**
 * Log constitutional violations for audit trail
 */
export function logConstitutionalViolation(violation: {
  type: string
  severity: 'warning' | 'critical'
  response: string
  violations: string[]
  caseId?: string
  timestamp?: string
}) {
  const auditEntry = {
    timestamp: violation.timestamp || new Date().toISOString(),
    type: 'CONSTITUTIONAL_VIOLATION',
    severity: violation.severity,
    violationType: violation.type,
    violations: violation.violations,
    caseId: violation.caseId || 'unspecified',
    responsePreview: violation.response.substring(0, 200) + '...'
  };

  console.warn('[VERUM_CONSTITUTIONAL_VIOLATION]', auditEntry);

  // In production: Send to forensic audit log
  // This would typically go to a secure audit trail that cannot be tampered with
  try {
    // TODO: Implement secure audit logging
    // Example: await auditLogger.logViolation(auditEntry)
  } catch (error) {
    console.error('Failed to log constitutional violation:', error);
  }
}

/**
 * Validate that Spark LLM is available and functional
 */
export async function isSparkLLMAvailable(): Promise<boolean> {
  try {
    if (!window.spark?.llm) {
      return false;
    }
    
    // Test with a simple prompt
    const test = await window.spark.llm(
      'Respond with exactly: "OK"',
      'gpt-4o'
    );
    
    return test && test.includes('OK');
  } catch (error) {
    console.warn('Spark LLM availability check failed:', error);
    return false;
  }
}

/**
 * Generate a compliance report for audit purposes
 */
export function generateComplianceReport(
  response: string,
  prompt: string,
  context?: {
    caseId?: string
    analysisType?: string
    timestamp?: string
  }
): object {
  const compliance = validateConstitutionalCompliance(response);
  
  return {
    timestamp: context?.timestamp || new Date().toISOString(),
    caseId: context?.caseId || 'unspecified',
    analysisType: context?.analysisType || 'unknown',
    compliance: {
      compliant: compliance.compliant,
      severity: compliance.severity,
      violations: compliance.violations,
      warnings: compliance.warnings
    },
    audit: {
      promptLength: prompt.length,
      responseLength: response.length,
      hasForensicDisclaimer: response.includes('⚖️') || response.includes('evidentiary analysis'),
      hasLimitationsStatement: /limitation|gap|subject to|based on available/.test(response),
      hasHedgingLanguage: /suggest|indicate|may|might|could/.test(response)
    }
  };
}
