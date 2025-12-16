# Architectural Rule: Session-Scoped Artifacts Only

## 🔒 CRITICAL RULE

**All analytical outputs must be session-scoped artifacts cryptographically chained to a sealed session timeline. No standalone analytical artifacts are permitted.**

## What This Means

### Must Be Session-Scoped
- Consistency reports
- Forensic certificates
- Baseline analyses
- AI-enhanced analyses
- Any derived analytical output

### Must Be Cryptographically Chained
- Every analytical output must be recorded as a session event
- Each session event must reference the prior event's hash
- The session hash must bind all events together
- The artifact must reference its session ID and event ID

### Must Have Temporal Context
- Timestamp when created
- Position in event chain
- Session boundaries (start/end)
- Continuity verification

## Why This Rule Exists

### Prevents "Floating Conclusions"
Without session linkage, analytical outputs become unanchored claims that can be:
- Taken out of context
- Claimed to be fabricated post-hoc
- Divorced from temporal reality
- Used selectively without full picture

### Guarantees Chain of Custody
Session-scoping ensures:
- Every output has a creation timestamp
- Creation timestamp is cryptographically verifiable
- Output cannot be backdated or modified
- Absence of data is as meaningful as presence

### Maintains Legal Defensibility
Courts need to know:
- When was this analysis performed?
- What was the state of the system at that time?
- What other activities were happening?
- Has the chain been broken?

Session-scoping answers all of these automatically.

### Stops Ambiguity
Without this rule:
- Analysis could appear to be "always true"
- Temporal relationship to evidence unclear
- Selective disclosure becomes easier
- Truth becomes harder to establish

## Implementation

### Session Event Types
```typescript
'session_start'
'session_end'
'evidence_uploaded'
'scan_performed'
'certificate_generated'
'user_interaction'
'statement_entered'
'consistency_report_generated'  // 🔒 For temporal correlation
'analysis_generated'             // 🔒 For any analytical output
```

### Consistency Report Structure
```typescript
interface ConsistencyReport {
  reportId: string
  sessionId: string          // 🔒 CRITICAL: Links to session
  sessionEventId: string     // 🔒 CRITICAL: Links to creation event
  // ... rest of report data
}
```

### Certificate Structure
Similarly, certificates must reference:
- Session ID where they were generated
- Session event that triggered generation
- Prior event hash in the chain

## Enforcement

### Code Level
1. All analytical functions must call `recordSessionEvent()` first
2. All analytical outputs must include `sessionId` and `sessionEventId` fields
3. Formatted outputs must display session linkage information

### Documentation Level
1. Comments must reference this rule with 🔒 marker
2. Function documentation must state session-scoping requirement
3. README must explain the rule to external developers

### Review Level
Any PR that creates analytical outputs must:
- Prove session linkage
- Show event recording
- Display chain of custody in output

## Examples

### ✅ CORRECT: Session-Scoped Consistency Report
```typescript
async function generateConsistencyReport(text: string) {
  const session = getCurrentSealedSession()
  
  // 🔒 Record event BEFORE creating report
  const event = await recordSessionEvent('consistency_report_generated', {
    reportId: reportId,
    accusationType: type
  })
  
  return {
    reportId,
    sessionId: session.sessionId,        // 🔒 Linked
    sessionEventId: event.eventId,       // 🔒 Linked
    // ... analysis data
  }
}
```

### ❌ WRONG: Floating Analysis
```typescript
async function generateAnalysis(text: string) {
  // No session event recorded
  // No session linkage
  
  return {
    reportId: 'RPT-123',
    analysis: 'Some conclusion'  // ❌ Floating - no chain of custody
  }
}
```

## Verification

### How to Verify Session-Scoping
1. Check that analytical function calls `recordSessionEvent()`
2. Verify output includes `sessionId` and `sessionEventId`
3. Confirm formatted output displays session linkage
4. Test that session event chain includes the analytical output

### What Should Appear in Session Events
```typescript
{
  eventId: "EVT-1234567890-ABC123",
  eventType: "consistency_report_generated",
  timestamp: 1234567890000,
  eventHash: "abc123...",
  priorEventHash: "def456...",  // Links to prior event
  metadata: {
    reportId: "CR-1234567890-XYZ",
    accusationType: "temporal"
  }
}
```

## Benefits

### For Honest Users
- Automatic temporal documentation
- No manual record-keeping needed
- Everything has a timestamp
- Full chain of custody maintained

### For Legal Proceedings
- Clear creation timeline
- Verifiable event sequence
- Tamper-evident chain
- Comprehensive audit trail

### For System Integrity
- No orphaned analyses
- No post-hoc fabrication possible
- Gaps are visible and meaningful
- Truth emerges from structure, not claims

## Summary

**This rule is not optional.**

It's the structural guarantee that Verum Omnis remains a **forensic memory engine** and doesn't degrade into a **claim generator**.

Every analytical output must live inside a sealed session timeline. No exceptions.

The absence of this rule would allow:
- Floating conclusions
- Lost context
- Fabrication claims
- Ambiguity about timing

The presence of this rule guarantees:
- Temporal grounding
- Chain of custody
- Verifiable creation time
- Structural integrity

**Rule in One Line:**
> If it analyzes, correlates, or concludes—it must be a session event.
