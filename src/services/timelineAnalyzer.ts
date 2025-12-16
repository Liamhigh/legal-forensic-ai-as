/**
 * Timeline Analyzer
 * Detects temporal inconsistencies and timeline discrepancies
 * Works offline using pattern matching
 */

export interface TimelineEvent {
  timestamp: Date | null
  description: string
  source: string
  lineNumber?: number
  confidence: number
}

export interface TimelineAnalysis {
  events: TimelineEvent[]
  inconsistencies: TimelineInconsistency[]
  summary: string
}

export interface TimelineInconsistency {
  type: 'ordering' | 'impossible_timing' | 'conflicting_claims' | 'gap'
  severity: 'critical' | 'high' | 'medium' | 'low'
  description: string
  involvedEvents: number[] // Indices into events array
  suggestion: string
}

/**
 * Analyze timeline from text content
 */
export function analyzeTimeline(
  content: string,
  metadata?: { [key: string]: any }
): TimelineAnalysis | null {
  const events = extractTimelineEvents(content, metadata)
  
  if (events.length === 0) {
    return null
  }
  
  const inconsistencies = detectTimelineInconsistencies(events)
  const summary = generateTimelineSummary(events, inconsistencies)
  
  return {
    events,
    inconsistencies,
    summary
  }
}

/**
 * Extract timeline events from text
 */
function extractTimelineEvents(
  content: string,
  metadata?: { [key: string]: any }
): TimelineEvent[] {
  const events: TimelineEvent[] = []
  const lines = content.split('\n')
  
  // Add metadata-based events
  if (metadata?.createdDate) {
    try {
      events.push({
        timestamp: new Date(metadata.createdDate),
        description: 'Document created',
        source: 'metadata',
        confidence: 1.0
      })
    } catch (e) {
      // Invalid date
    }
  }
  
  if (metadata?.modifiedDate) {
    try {
      events.push({
        timestamp: new Date(metadata.modifiedDate),
        description: 'Document modified',
        source: 'metadata',
        confidence: 1.0
      })
    } catch (e) {
      // Invalid date
    }
  }
  
  // Extract events from content
  lines.forEach((line, index) => {
    const extractedEvents = extractEventsFromLine(line, index + 1)
    events.push(...extractedEvents)
  })
  
  // Sort events by timestamp (nulls at end)
  events.sort((a, b) => {
    if (a.timestamp === null) return 1
    if (b.timestamp === null) return -1
    return a.timestamp.getTime() - b.timestamp.getTime()
  })
  
  return events
}

/**
 * Extract events from a single line
 */
function extractEventsFromLine(line: string, lineNumber: number): TimelineEvent[] {
  const events: TimelineEvent[] = []
  
  // Pattern 1: Full date with time (e.g., "2024-01-15 at 3:30 PM")
  const fullDateTimePattern = /(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})\s+at\s+(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)/g
  let match
  
  while ((match = fullDateTimePattern.exec(line)) !== null) {
    try {
      const dateStr = match[1]
      const hour = parseInt(match[2])
      const minute = parseInt(match[3])
      const ampm = match[4].toLowerCase()
      
      let hour24 = hour
      if (ampm === 'pm' && hour < 12) hour24 += 12
      if (ampm === 'am' && hour === 12) hour24 = 0
      
      const date = parseDate(dateStr)
      if (date) {
        date.setHours(hour24, minute, 0, 0)
        
        events.push({
          timestamp: date,
          description: extractEventDescription(line, match.index),
          source: 'content',
          lineNumber,
          confidence: 0.9
        })
      }
    } catch (e) {
      // Invalid date/time
    }
  }
  
  // Pattern 2: Time only (e.g., "at 3:30 PM")
  const timeOnlyPattern = /\bat\s+(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)/g
  
  while ((match = timeOnlyPattern.exec(line)) !== null) {
    events.push({
      timestamp: null, // No date, just time
      description: extractEventDescription(line, match.index),
      source: 'content',
      lineNumber,
      confidence: 0.6 // Lower confidence without full date
    })
  }
  
  // Pattern 3: Date only (e.g., "on January 15, 2024")
  const dateOnlyPattern = /\b(?:on|date:|dated:?)\s+(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}|[A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/gi
  
  while ((match = dateOnlyPattern.exec(line)) !== null) {
    try {
      const date = parseDate(match[1])
      if (date) {
        events.push({
          timestamp: date,
          description: extractEventDescription(line, match.index),
          source: 'content',
          lineNumber,
          confidence: 0.7
        })
      }
    } catch (e) {
      // Invalid date
    }
  }
  
  // Pattern 4: Relative time (e.g., "two hours later", "the next day")
  const relativeTimePattern = /\b((?:\d+|one|two|three|four|five)\s+(?:minutes?|hours?|days?|weeks?|months?)\s+(?:later|after|before|earlier))/gi
  
  while ((match = relativeTimePattern.exec(line)) !== null) {
    events.push({
      timestamp: null, // Relative time needs context
      description: `${match[1]}: ${extractEventDescription(line, match.index)}`,
      source: 'content',
      lineNumber,
      confidence: 0.5
    })
  }
  
  return events
}

/**
 * Parse date from various formats
 */
function parseDate(dateStr: string): Date | null {
  try {
    // Try ISO format
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return new Date(dateStr + 'T00:00:00')
    }
    
    // Try MM/DD/YYYY or M/D/YY
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(dateStr)) {
      const parts = dateStr.split('/')
      let year = parseInt(parts[2])
      if (year < 100) year += 2000 // Assume 2000s for 2-digit years
      const month = parseInt(parts[0]) - 1 // Month is 0-indexed
      const day = parseInt(parts[1])
      return new Date(year, month, day)
    }
    
    // Try natural language (e.g., "January 15, 2024")
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      return date
    }
  } catch (e) {
    // Invalid date
  }
  
  return null
}

/**
 * Extract event description from line
 */
function extractEventDescription(line: string, matchIndex: number): string {
  // Get surrounding context
  const beforeMatch = line.substring(Math.max(0, matchIndex - 50), matchIndex).trim()
  const afterMatch = line.substring(matchIndex, Math.min(line.length, matchIndex + 100)).trim()
  
  // Look for verb phrases
  const verbPattern = /\b(?:happened|occurred|took\s+place|was|were|did|went|came|arrived|left|departed|met|spoke|called|sent|received)\b/i
  
  let description = afterMatch
  
  // Try to find a meaningful verb in the context
  if (verbPattern.test(beforeMatch)) {
    const words = beforeMatch.split(/\s+/)
    const relevantWords = words.slice(-10) // Last 10 words before time
    description = relevantWords.join(' ') + ' ' + afterMatch.split(/\s+/).slice(0, 10).join(' ')
  }
  
  // Clean up
  description = description.substring(0, 150).trim()
  if (description.length === 150) description += '...'
  
  return description || 'Event occurred'
}

/**
 * Detect inconsistencies in timeline
 */
function detectTimelineInconsistencies(events: TimelineEvent[]): TimelineInconsistency[] {
  const inconsistencies: TimelineInconsistency[] = []
  
  // Check for ordering issues
  for (let i = 0; i < events.length - 1; i++) {
    const event1 = events[i]
    const event2 = events[i + 1]
    
    if (event1.timestamp && event2.timestamp) {
      const timeDiff = event2.timestamp.getTime() - event1.timestamp.getTime()
      
      // Check if events are in wrong order based on description
      if (timeDiff < 0) {
        inconsistencies.push({
          type: 'ordering',
          severity: 'high',
          description: 'Events appear in chronologically incorrect order',
          involvedEvents: [i, i + 1],
          suggestion: 'Verify the correct sequence of events'
        })
      }
      
      // Check for impossible timing (e.g., event claims to happen "before" something that's timestamped later)
      const desc1 = event1.description.toLowerCase()
      const desc2 = event2.description.toLowerCase()
      
      if (desc2.includes('before') && timeDiff > 0) {
        inconsistencies.push({
          type: 'conflicting_claims',
          severity: 'medium',
          description: 'Event claims to occur "before" but timestamp suggests otherwise',
          involvedEvents: [i, i + 1],
          suggestion: 'Reconcile temporal claims with timestamps'
        })
      }
      
      // Check for impossibly short time gaps
      const minutesDiff = timeDiff / (1000 * 60)
      if (minutesDiff < 1 && minutesDiff > 0) {
        if (desc1.includes('drove') || desc2.includes('drove') ||
            desc1.includes('traveled') || desc2.includes('traveled')) {
          inconsistencies.push({
            type: 'impossible_timing',
            severity: 'critical',
            description: `Only ${minutesDiff.toFixed(0)} minute(s) between events involving travel`,
            involvedEvents: [i, i + 1],
            suggestion: 'Verify if travel time is physically possible'
          })
        }
      }
      
      // Check for large gaps (>7 days)
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24)
      if (daysDiff > 7 && i < events.length - 2) {
        inconsistencies.push({
          type: 'gap',
          severity: 'low',
          description: `Large time gap: ${Math.floor(daysDiff)} day(s) between events`,
          involvedEvents: [i, i + 1],
          suggestion: 'Consider if any relevant events occurred during this gap'
        })
      }
    }
  }
  
  // Check for duplicate timestamps
  for (let i = 0; i < events.length - 1; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const event1 = events[i]
      const event2 = events[j]
      
      if (event1.timestamp && event2.timestamp &&
          event1.timestamp.getTime() === event2.timestamp.getTime() &&
          event1.description !== event2.description) {
        
        // Check if they claim different locations or activities
        const hasLocationConflict = 
          (event1.description.toLowerCase().includes(' in ') || event1.description.toLowerCase().includes(' at ')) &&
          (event2.description.toLowerCase().includes(' in ') || event2.description.toLowerCase().includes(' at '))
        
        if (hasLocationConflict) {
          inconsistencies.push({
            type: 'conflicting_claims',
            severity: 'high',
            description: 'Multiple different events claimed at same timestamp',
            involvedEvents: [i, j],
            suggestion: 'Verify which event actually occurred or if both are accurate'
          })
        }
      }
    }
  }
  
  return inconsistencies
}

/**
 * Generate timeline summary
 */
function generateTimelineSummary(
  events: TimelineEvent[],
  inconsistencies: TimelineInconsistency[]
): string {
  let summary = `Timeline Analysis: ${events.length} event(s) identified.\n\n`
  
  if (events.length === 0) {
    return 'No timeline events detected in document.'
  }
  
  // Count events with timestamps
  const eventsWithTimestamps = events.filter(e => e.timestamp !== null).length
  summary += `- ${eventsWithTimestamps} event(s) with specific timestamps\n`
  summary += `- ${events.length - eventsWithTimestamps} event(s) with relative or unclear timing\n`
  
  if (inconsistencies.length > 0) {
    summary += `\n⚠️ ${inconsistencies.length} timeline inconsistenc${inconsistencies.length === 1 ? 'y' : 'ies'} detected:\n`
    
    const critical = inconsistencies.filter(i => i.severity === 'critical').length
    const high = inconsistencies.filter(i => i.severity === 'high').length
    const medium = inconsistencies.filter(i => i.severity === 'medium').length
    const low = inconsistencies.filter(i => i.severity === 'low').length
    
    if (critical > 0) summary += `  - ${critical} critical\n`
    if (high > 0) summary += `  - ${high} high\n`
    if (medium > 0) summary += `  - ${medium} medium\n`
    if (low > 0) summary += `  - ${low} low\n`
  } else {
    summary += `\n✓ No timeline inconsistencies detected.`
  }
  
  return summary
}

/**
 * Compare timelines from multiple documents
 */
export function compareTimelines(
  timelines: Array<{ documentId: string; analysis: TimelineAnalysis }>
): TimelineInconsistency[] {
  const inconsistencies: TimelineInconsistency[] = []
  
  if (timelines.length < 2) {
    return inconsistencies
  }
  
  // Compare events across documents
  for (let i = 0; i < timelines.length; i++) {
    for (let j = i + 1; j < timelines.length; j++) {
      const timeline1 = timelines[i].analysis
      const timeline2 = timelines[j].analysis
      
      // Look for conflicting events at same time
      timeline1.events.forEach((event1, idx1) => {
        timeline2.events.forEach((event2, idx2) => {
          if (event1.timestamp && event2.timestamp) {
            const timeDiff = Math.abs(event1.timestamp.getTime() - event2.timestamp.getTime())
            
            // Same time (within 1 minute)
            if (timeDiff < 60000) {
              const desc1 = event1.description.toLowerCase()
              const desc2 = event2.description.toLowerCase()
              
              // Check if descriptions are significantly different
              if (!desc1.includes(desc2.substring(0, 20)) && !desc2.includes(desc1.substring(0, 20))) {
                inconsistencies.push({
                  type: 'conflicting_claims',
                  severity: 'high',
                  description: `Documents report different events at ${event1.timestamp.toLocaleString()}`,
                  involvedEvents: [idx1, idx2],
                  suggestion: 'Cross-reference and verify which account is accurate'
                })
              }
            }
          }
        })
      })
    }
  }
  
  return inconsistencies
}
