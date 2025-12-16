# Temporal-Spatial Correlation System

## Overview

This system implements **passive temporal-spatial correlation and contradiction detection** that activates contextually when accusations or timeline disputes are detected in user input. The system never claims innocence—it only reports factual consistency or inconsistency based on sealed forensic records.

## Core Principles

1. **Context-Triggered, Not User-Activated**: No buttons, no modes. Detection happens automatically when accusation language is identified.

2. **Sessions as Primary Evidence**: Sealed sessions establish temporal presence through cryptographically-chained events.

3. **Factual Reporting Only**: The system presents correlations without making claims about innocence, guilt, or truthfulness.

4. **Privacy-Preserving**: Nothing shared automatically. User controls all exports.

## Architecture

### Session Sealing (`sessionSealing.ts`)

Treats sessions as first-class evidentiary objects with:
- **Cryptographic event chaining**: Each event references the prior event's hash
- **Temporal presence**: Session boundaries prove device activity
- **Continuity verification**: Detects gaps or tampering in event chain
- **Session hash**: Final SHA-512 hash binds all events together

**Event Types:**
- `session_start` - Session initialization
- `session_end` - Session finalization (when sealed)
- `evidence_uploaded` - File upload
- `scan_performed` - Forensic scan execution
- `certificate_generated` - Certificate creation
- `user_interaction` - User message/input
- `statement_entered` - User statement recording

**Session Hash Formula:**
```
session_hash = SHA-512(sessionId + startTime + endTime + all_events + continuity)
```

### Temporal Correlation (`temporalCorrelation.ts`)

Performs correlation analysis when accusations detected:

**Accusation Detection Patterns:**
- "accused of"
- "being accused"
- "they say I was"
- "timeline dispute"
- "I wasn't there"
- "I was elsewhere"
- And more...

**Correlation Types:**
1. **Temporal**: Session activity during alleged time window
2. **Spatial**: Location data (if available)
3. **Evidentiary**: Sealed artifacts created during window

**Output**: Consistency Report (sealed forensic document)

## What The System Says (And Never Says)

### ✅ Allowed (Factual)
- "Sealed session was active during the relevant period"
- "Session recorded N events within the time window"
- "No interruption recorded in event chain"
- "Sealed artifacts generated at timestamp T"
- "Location data not available in sealed records"

### ❌ Never Allowed
- "This proves innocence"
- "This is an alibi"
- "The accusation is false"
- "You didn't do it"
- Any inference about truthfulness or intent

## Consistency Report Format

```
═══════════════════════════════════════════════════════════════════
               VERUM OMNIS CONSISTENCY REPORT
               Temporal-Spatial Correlation Analysis
═══════════════════════════════════════════════════════════════════

REPORT ID: CR-[timestamp]-[random]
GENERATED: [ISO timestamp]
REPORT HASH: [SHA-256]

───────────────────────────────────────────────────────────────────
ACCUSATION DETECTION
───────────────────────────────────────────────────────────────────
Type: TEMPORAL / SPATIAL / GENERAL
Confidence: [0-100]%
Time Window: [extracted or inferred]
Location: [if detected]

───────────────────────────────────────────────────────────────────
EVALUATION SUMMARY
───────────────────────────────────────────────────────────────────

TEMPORAL FINDINGS:
• Sealed session [ID] was active during the relevant period
• Session recorded [N] discrete events within the time window
• Session continuity verified - no interruption recorded

SEALED ARTIFACTS IN WINDOW:
• [filename] ([timestamp])
  Hash: [hash]...

SPATIAL FINDINGS:
• Location data not available in sealed records
• Spatial correlation cannot be performed

INTERPRETATION:
This report presents factual temporal and spatial correlations based on
sealed forensic records. No inference regarding truthfulness, intent, or
culpability is made. Courts and fact-finders draw conclusions from facts.

═══════════════════════════════════════════════════════════════════
```

## Integration Points

### Scanner Orchestrator
Records session events during evidence processing:
- Evidence upload event
- Scan performed event
- Certificate generated event

### App.tsx
- Records session start on mount
- Records user interaction events
- **Passive detection**: Checks each user message for accusation patterns
- **Automatic report generation**: If accusation detected, generates consistency report
- Shows report in chat as system message

## User Experience

### Completely Invisible Unless Relevant

**Normal Operation:**
```
User: "Review this document for chain of custody issues"
→ No accusation detected
→ Normal processing
→ No consistency report
```

**Accusation Detected:**
```
User: "I'm being accused of being at that location at 3pm, but I wasn't there"
→ Accusation detected (temporal + spatial)
→ Consistency report auto-generated
→ Shows sealed session was active at 3pm
→ Lists sealed events during that window
→ Notes: location data unavailable
→ User can download/export report
```

### No Special UI

No buttons labeled "alibi mode" or "generate defense"
No separate screens or modes
Just appears when contextually relevant

## Use Cases

### 1. Timeline Dispute
**Scenario**: User accused of being somewhere at a specific time
**System Response**:
- Checks if sealed session was active at that time
- Lists all events during that window
- Reports presence/absence factually

### 2. Location Claim
**Scenario**: Accusation involves specific location
**System Response**:
- Checks for location metadata in sealed records
- Reports availability/unavailability of location data
- If available, reports conflict/consistency

### 3. Activity Documentation
**Scenario**: Need to prove device was in use
**System Response**:
- Shows continuous event chain
- Proves device activity through cryptographic continuity
- No gaps means sustained presence

## Legal Value

### Session as Temporal Witness

A sealed session proves:
1. **Device was active**: Events recorded mean device was in use
2. **Temporal continuity**: Unbroken event chain proves no tampering
3. **Specific activities**: Each event type documents what occurred
4. **Timestamps are trustworthy**: Cryptographic chaining prevents backdating

### Independent Admissibility

The consistency report:
- Stands alone as a forensic document
- Doesn't require the original accusation
- Can be verified against session hash
- Makes no subjective claims

### Protection Without Performance

User doesn't need to:
- Remember to activate a mode
- Consciously document their location
- Perform under stress
- Argue or explain

The system already remembered everything.

## Privacy Model

### Nothing Automatic
- Reports generated locally
- Nothing sent to servers
- Nothing shared without user action

### User Control
- Choose whether to export report
- Choose whether to share with others
- Can delete/clear at any time

### No Surveillance
- System doesn't track location by default
- Only uses data explicitly provided (uploads, interactions)
- Location only captured if user uploads geo-tagged files

## Future Enhancements

### Potential Improvements
1. **ML-based accusation detection**: Better pattern recognition
2. **Natural language time parsing**: Extract precise times/dates
3. **Location service integration**: Optional real-time location capture
4. **Multi-session correlation**: Cross-reference multiple sealed sessions
5. **QR code verification**: External verification of consistency reports

### What Stays the Same
- No "alibi mode" button ever
- No claims of innocence ever
- Factual reporting only
- Privacy-first model
- Passive, context-triggered

## Summary

This system transforms Verum Omnis into a **forensic memory engine** that:
- Never forgets what happened
- Never makes subjective claims
- Only reports factual correlations
- Protects through accuracy, not advocacy

**One-Line Summary:**
> The system doesn't prove you didn't do something—it just doesn't forget what you actually did.

That's why it's powerful and defensible.
