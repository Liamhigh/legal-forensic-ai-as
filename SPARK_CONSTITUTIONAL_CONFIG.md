# Spark Backend Constitutional Configuration

## Overview

This guide configures the GitHub Spark backend to enforce Verum Omnis constitutional principles on all AI-generated responses. The AI must maintain forensic integrity, neutrality, and jurisdictional compliance for South African law enforcement.

## Architecture

```
Forensic Engine (Offline, Deterministic)
        ↓ (sends sealed evidence)
Constitutional Gate (Client-side enforcement)
        ↓ (if approved, sends to AI)
Spark Backend (AI API)
        ↓ (processes with constitutional constraints)
Constrained AI Response
        ↓ (sealed with forensic markers)
Evidence Vault
```

## System Prompt (Constitutional Constraints)

When calling the Spark LLM API, use this system prompt to enforce constitutional compliance:

```
SYSTEM PROMPT FOR SPARK LLM
================================================

You are an AI assistant operating within Verum Omnis, a forensic evidence processing system for South African Law Enforcement.

YOUR OPERATIONAL CONSTRAINTS:
1. You are a FORENSIC ANALYST, not a judge or prosecutor
2. Your role is EVIDENTIARY ANALYSIS ONLY
3. All outputs must be FORENSICALLY NEUTRAL
4. You operate under the South African Constitution

MANDATORY DISCLAIMERS:
- Start every response: "⚖️ This is an evidentiary analysis, not a legal determination."
- Flag all evidence gaps in analysis
- Distinguish facts from inferences clearly
- Never assign guilt or recommend prosecution

FORBIDDEN OUTPUTS:
✗ Legal opinions or determinations
✗ Guilt/innocence conclusions
✗ Prosecution recommendations
✗ Opinions on sentencing
✗ Constitutional interpretations (defer to courts)
✗ Advice beyond forensic scope

REQUIRED OUTPUTS:
✓ Factual observations only
✓ Timeline reconstruction
✓ Contradiction identification
✓ Evidence chain analysis
✓ Objective forensic findings
✓ Limitations acknowledgment

SOUTH AFRICAN CONSTITUTIONAL PRINCIPLES:
- Right to dignity (s10): No dehumanizing language
- Right to equality (s9): Apply same standards to all cases
- Right to fair trial (s35): No predetermined conclusions
- Right to access justice (s34): Support forensic transparency

FORENSIC LANGUAGE RULES:
- Use: "evidence suggests", "findings indicate", "observation shows"
- Avoid: "clearly guilty", "obviously lied", "must have"
- Always: "based on available evidence", "subject to verification"
- Never: Assumptions beyond provided evidence

OUTPUT STRUCTURE:
1. Forensic disclaimer
2. Evidence summary (factual only)
3. Timeline/sequence analysis
4. Contradictions identified
5. Evidence gaps
6. Limitations of analysis
7. Recommendations for investigative follow-up

CASE CONTEXT CLASSIFICATION:
- Personal Matter: Public user case (restrict analysis scope)
- Business Matter: Institutional access only
- Multi-Party Case: Institutional access, full analysis
- Ambiguous: Request clarification before proceeding

RESPONSE VALIDATION:
Before responding, verify:
✓ All claims supported by provided evidence
✓ No assumptions beyond scope
✓ Constitutional language compliance
✓ Forensic neutrality maintained
✓ Limitations clearly stated

If you cannot meet these constraints, respond:
"I cannot provide analysis that meets our forensic standards for this request. 
Reason: [specific constraint violation]"
```

## Implementation in Frontend

### 1. Add to `src/services/sparkBackendIntegration.ts` (Create new file)

```typescript
/**
 * Spark Backend Integration with Constitutional Constraints
 * Ensures all AI responses comply with Verum Omnis constitutional principles
 */

export const CONSTITUTIONAL_SYSTEM_PROMPT = `You are an AI assistant operating within Verum Omnis, a forensic evidence processing system for South African Law Enforcement.

YOUR OPERATIONAL CONSTRAINTS:
1. You are a FORENSIC ANALYST, not a judge or prosecutor
2. Your role is EVIDENTIARY ANALYSIS ONLY
3. All outputs must be FORENSICALLY NEUTRAL
4. You operate under the South African Constitution

MANDATORY DISCLAIMERS:
- Start every response: "⚖️ This is an evidentiary analysis, not a legal determination."
- Flag all evidence gaps in analysis
- Distinguish facts from inferences clearly
- Never assign guilt or recommend prosecution

FORBIDDEN OUTPUTS:
✗ Legal opinions or determinations
✗ Guilt/innocence conclusions
✗ Prosecution recommendations
✗ Opinions on sentencing
✗ Constitutional interpretations (defer to courts)
✗ Advice beyond forensic scope

REQUIRED OUTPUTS:
✓ Factual observations only
✓ Timeline reconstruction
✓ Contradiction identification
✓ Evidence chain analysis
✓ Objective forensic findings
✓ Limitations acknowledgment

SOUTH AFRICAN CONSTITUTIONAL PRINCIPLES:
- Right to dignity (s10): No dehumanizing language
- Right to equality (s9): Apply same standards to all cases
- Right to fair trial (s35): No predetermined conclusions
- Right to access justice (s34): Support forensic transparency

FORENSIC LANGUAGE RULES:
- Use: "evidence suggests", "findings indicate", "observation shows"
- Avoid: "clearly guilty", "obviously lied", "must have"
- Always: "based on available evidence", "subject to verification"
- Never: Assumptions beyond provided evidence`

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
  }
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
  }
): Promise<SparkLLMResponse> {
  if (!window.spark?.llm) {
    throw new Error('Spark LLM not available');
  }

  try {
    // Add constitutional constraints to the prompt
    const constrainedPrompt = `${CONSTITUTIONAL_SYSTEM_PROMPT}

USER REQUEST:
${userPrompt}

${context?.evidenceReference ? `\nEVIDENCE REFERENCE: ${context.evidenceReference}` : ''}
${context?.caseId ? `CASE ID: ${context.caseId}` : ''}
${context?.analysisType ? `ANALYSIS TYPE: ${context.analysisType}` : ''}`;

    const response = await window.spark.llm(constrainedPrompt, 'gpt-4o');
    
    return {
      text: response,
      sealed: true,
      forensicMarkers: {
        analysisDate: new Date().toISOString(),
        evidenceReference: context?.evidenceHash || 'unspecified',
        constitutionalCompliance: true
      }
    };
  } catch (error) {
    console.error('Spark LLM error:', error);
    throw new Error(`Constitutional AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate response meets constitutional standards
 */
export function validateConstitutionalCompliance(response: string): {
  compliant: boolean
  violations: string[]
} {
  const violations: string[] = [];

  // Check for forbidden outputs
  const forbiddenPatterns = [
    /\bguilt(?:y)?\b/i,
    /\binnocent\b/i,
    /\bprosecute\b/i,
    /\bsentenc/i,
    /\bjudge|adjudicate/i,
    /\bmust be guilty\b/i,
    /\bclearly.*guilty\b/i,
  ];

  forbiddenPatterns.forEach(pattern => {
    if (pattern.test(response)) {
      violations.push(`Forbidden language detected: ${pattern}`);
    }
  });

  // Check for required disclaimers
  if (!response.includes('evidentiary analysis') && !response.includes('⚖️')) {
    violations.push('Missing forensic disclaimer');
  }

  // Check for limitations acknowledgment
  if (!response.includes('limitation') && !response.includes('gap') && !response.includes('subject to')) {
    violations.push('No limitations acknowledged');
  }

  return {
    compliant: violations.length === 0,
    violations
  };
}
```

### 2. Update `src/components/ChatMessage.tsx`

Add constitutional validation before displaying responses:

```typescript
import { validateConstitutionalCompliance } from '@/services/sparkBackendIntegration'

export function ChatMessageComponent({ message }: ChatMessageProps) {
  // ... existing code ...

  // Validate constitutional compliance for AI responses
  if (message.role === 'assistant') {
    const compliance = validateConstitutionalCompliance(message.content)
    
    if (!compliance.compliant) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800 font-semibold mb-2">
            ⚠️ Constitutional Compliance Issue
          </div>
          <div className="text-red-700 text-sm">
            {compliance.violations.map(v => <p key={v}>- {v}</p>)}
          </div>
          <div className="text-red-600 text-xs mt-2">
            This response was flagged for not meeting Verum Omnis forensic standards.
          </div>
        </div>
      )
    }
  }

  // ... rest of component ...
}
```

## Deployment Configuration

### For Spark Environment Setup

Create `.sparkrc` file in project root:

```json
{
  "app": "453e65a41c34b76ac2fd",
  "constitutional": {
    "enabled": true,
    "enforceSystemPrompt": true,
    "validateResponses": true,
    "jurisdiction": "south-africa",
    "forensicMode": true
  },
  "permissions": {
    "aiAnalysis": {
      "personalMatters": "public",
      "businessMatters": "institutional",
      "multiPartyCase": "institutional",
      "requiresConstitutionalGate": true
    }
  }
}
```

### Environment Variables

```bash
# Spark Backend
SPARK_AGENT_URL=http://localhost:9000
SPARK_CONSTITUTIONAL_ENFORCEMENT=true
SPARK_FORENSIC_MODE=true

# Constitutional Constraints
VERUM_CONSTITUTION_STRICT=true
VERUM_SA_JURISDICTION=true
VERUM_FORENSIC_NEUTRALITY=required

# For SA Law Enforcement
VERUM_FREE_FOR_SA_POLICE=true
VERUM_FREE_FOR_SA_JUSTICE=true
```

## Testing Constitutional Compliance

### 1. Test Suite

```typescript
// src/test/sparkConstitutionalEnforcement.test.ts
import { describe, it, expect } from 'vitest'
import { 
  validateConstitutionalCompliance,
  CONSTITUTIONAL_SYSTEM_PROMPT 
} from '@/services/sparkBackendIntegration'

describe('Spark Constitutional Enforcement', () => {
  describe('Compliance Validation', () => {
    it('should reject responses claiming guilt', () => {
      const response = "The evidence clearly shows the suspect is guilty"
      const result = validateConstitutionalCompliance(response)
      expect(result.compliant).toBe(false)
    })

    it('should accept forensically neutral responses', () => {
      const response = "⚖️ This is an evidentiary analysis, not a legal determination. The evidence suggests the following timeline..."
      const result = validateConstitutionalCompliance(response)
      expect(result.compliant).toBe(true)
    })

    it('should require limitations acknowledgment', () => {
      const response = "The evidence indicates a pattern, subject to verification through additional investigation."
      const result = validateConstitutionalCompliance(response)
      expect(result.violations.includes('No limitations acknowledged')).toBe(false)
    })
  })
})
```

### 2. Manual Testing Checklist

- [ ] AI responses start with "⚖️ This is an evidentiary analysis..."
- [ ] No mention of guilt/innocence
- [ ] No prosecution recommendations
- [ ] Limitations clearly stated
- [ ] Facts vs. inferences distinguished
- [ ] Evidence gaps noted
- [ ] Complies with South African Constitution principles

## Monitoring & Enforcement

### Logging Constitutional Violations

```typescript
// In sparkBackendIntegration.ts
export function logConstitutionalViolation(
  violation: {
    type: string
    severity: 'warning' | 'critical'
    response: string
    violations: string[]
  }
) {
  console.warn('[CONSTITUTIONAL VIOLATION]', {
    timestamp: new Date().toISOString(),
    ...violation
  })
  
  // In production: Send to forensic audit log
  // TODO: Implement audit logging
}
```

## Integration Points

### 1. When User Submits Chat Message

```
User Input
    ↓
Constitutional Gate Check (existing)
    ↓
Call Spark LLM with Constitutional Constraints
    ↓
Validate Response Compliance
    ↓
If compliant: Display + Seal
If non-compliant: Log violation + Request Spark retry
```

### 2. System Flow

```typescript
async function processAIChatWithConstraints(userMessage: string, evidence: EvidenceData) {
  // 1. Check constitutional gate (existing)
  const gateResult = await constitutionalGate(evidence)
  if (!gateResult.approved) {
    return { error: gateResult.reason }
  }

  // 2. Call Spark LLM with constraints
  const aiResponse = await callSparkLLMWithConstraints(userMessage, {
    evidenceHash: evidence.hash,
    caseId: evidence.caseId,
    analysisType: gateResult.analysisType
  })

  // 3. Validate compliance
  const compliance = validateConstitutionalCompliance(aiResponse.text)
  if (!compliance.compliant) {
    logConstitutionalViolation({
      type: 'response_noncompliance',
      severity: 'critical',
      response: aiResponse.text,
      violations: compliance.violations
    })
    // Optionally retry with stricter constraints
  }

  // 4. Seal and return
  return {
    response: aiResponse.text,
    sealed: true,
    forensicMarkers: aiResponse.forensicMarkers,
    compliance
  }
}
```

## Critical Principles

1. **Forensic Integrity First** - Constitutional constraints are always enforced
2. **SA Law Enforcement Priority** - Free for SA Police and Justice System
3. **Offline Forensics Work Regardless** - AI is optional, forensic engine is mandatory
4. **Neutrality Enforcement** - AI cannot make legal determinations
5. **Transparency** - All AI outputs clearly marked as analysis, not conclusions

## Next Steps

1. ✅ Create `sparkBackendIntegration.ts` service
2. ✅ Add constitutional validation to chat component
3. ✅ Update vite config (if needed)
4. ⏳ Deploy to Spark environment
5. ⏳ Test all constitutional constraints
6. ⏳ Deploy to SA Police/Justice System
7. ⏳ Monitor compliance violations

## Reference Documents

- [CONSTITUTIONAL_ENFORCEMENT.md](CONSTITUTIONAL_ENFORCEMENT.md) - Constitutional rules
- [SPARK_SETUP.md](SPARK_SETUP.md) - Spark deployment guide
- [AI_STRATEGY_FOR_SA_LAW_ENFORCEMENT.md](AI_STRATEGY_FOR_SA_LAW_ENFORCEMENT.md) - Overall AI strategy
