/**
 * Contradiction Detector
 * Pattern matching logic for detecting contradictions in evidence
 * Based on forensic logic from Verum Omnis Ideal Logic PDF
 */

export type ContradictionType = 
  | 'timeline'           // Temporal inconsistencies
  | 'statement'          // Conflicting statements
  | 'evidence'           // Evidence contradictions
  | 'legal'              // Legal contradictions
  | 'metadata'           // Metadata inconsistencies
  | 'physical'           // Physical impossibilities

export type ContradictionSeverity = 'critical' | 'high' | 'medium' | 'low'

export interface Contradiction {
  type: ContradictionType
  severity: ContradictionSeverity
  description: string
  location?: {
    line?: number
    section?: string
    document1?: string
    document2?: string
  }
  suggestion?: string
  details?: string
}

export interface ContradictionContext {
  documentId: string
  fileName: string
  otherDocuments?: Array<{ id: string; fileName: string; content: string }>
}

/**
 * Detect contradictions in text content
 */
export function detectContradictions(
  content: string,
  _context: ContradictionContext
): Contradiction[] {
  const contradictions: Contradiction[] = []
  
  // Timeline contradictions
  contradictions.push(...detectTimelineContradictions(content))
  
  // Statement contradictions
  contradictions.push(...detectStatementContradictions(content))
  
  // Evidence contradictions
  contradictions.push(...detectEvidenceContradictions(content))
  
  // Legal contradictions
  contradictions.push(...detectLegalContradictions(content))
  
  // Metadata contradictions
  contradictions.push(...detectMetadataContradictions(content))
  
  // Physical impossibilities
  contradictions.push(...detectPhysicalImpossibilities(content))
  
  return contradictions
}

/**
 * Detect timeline contradictions
 * - Event A claimed before Event B, but timestamps show opposite
 * - Multiple people claiming to be in same place at different times
 * - Physical impossibilities (travel time, distance)
 */
function detectTimelineContradictions(content: string): Contradiction[] {
  const contradictions: Contradiction[] = []
  const lines = content.split('\n')
  
  // Extract time references
  const timePattern = /(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)?/g
  
  const timeReferences: Array<{ time: string; line: number; context: string }> = []
  
  lines.forEach((line, index) => {
    const matches = line.match(timePattern)
    if (matches) {
      matches.forEach(time => {
        timeReferences.push({
          time,
          line: index + 1,
          context: line.trim()
        })
      })
    }
  })
  
  // Check for conflicting time claims
  if (timeReferences.length >= 2) {
    // Look for phrases like "before" and "after" with times
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase()
      
      if (line.includes('before') && line.includes('after')) {
        const times = line.match(timePattern)
        if (times && times.length >= 2) {
          contradictions.push({
            type: 'timeline',
            severity: 'high',
            description: 'Conflicting temporal sequence detected',
            location: { line: i + 1 },
            suggestion: 'Verify the chronological order of events',
            details: `Line contains both "before" and "after" with multiple times: ${line.trim()}`
          })
        }
      }
    }
  }
  
  // Check for impossible travel times
  const travelPattern = /(?:drove|traveled|went|arrived).{0,50}(\d+)\s*(miles|km|kilometers)/gi
  const durationPattern = /in\s+(\d+)\s*(minutes?|hours?|mins?|hrs?)/gi
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const travelMatch = line.match(travelPattern)
    const durationMatch = line.match(durationPattern)
    
    if (travelMatch && durationMatch) {
      // Extract distance and duration
      const distanceStr = travelMatch[0].match(/(\d+)\s*(miles|km)/)
      const durationStr = durationMatch[0].match(/(\d+)\s*(minutes?|hours?)/)
      
      if (distanceStr && durationStr) {
        const distance = parseInt(distanceStr[1])
        const duration = parseInt(durationStr[1])
        const unit = durationStr[2].toLowerCase()
        
        // Convert to hours
        const hours = unit.includes('minute') ? duration / 60 : duration
        
        // Calculate required speed (rough check)
        const speed = distance / hours
        
        // Flag if speed is unreasonably high (>100 mph)
        if (speed > 100) {
          contradictions.push({
            type: 'physical',
            severity: 'critical',
            description: 'Physically impossible travel time detected',
            location: { line: i + 1 },
            suggestion: 'Verify distance and time claims',
            details: `Claims ${distance} miles in ${duration} ${unit} (${speed.toFixed(0)} mph average)`
          })
        }
      }
    }
  }
  
  return contradictions
}

/**
 * Detect statement contradictions
 * - Witness A says X, Witness B says opposite of X
 * - Same witness says X at time T1, says opposite at time T2
 * - Statement contradicts physical evidence
 */
function detectStatementContradictions(content: string): Contradiction[] {
  const contradictions: Contradiction[] = []
  const lines = content.split('\n')
  
  // Look for contradictory words in proximity
  const contradictoryPairs = [
    ['yes', 'no'],
    ['true', 'false'],
    ['did', 'did not'],
    ['was', 'was not'],
    ['were', 'were not'],
    ['present', 'absent'],
    ['guilty', 'innocent'],
    ['saw', 'did not see'],
    ['heard', 'did not hear']
  ]
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase()
    
    for (const [word1, word2] of contradictoryPairs) {
      if (line.includes(word1) && line.includes(word2)) {
        contradictions.push({
          type: 'statement',
          severity: 'high',
          description: `Contradictory statements in same context: "${word1}" and "${word2}"`,
          location: { line: i + 1 },
          suggestion: 'Clarify which statement is accurate',
          details: line.trim()
        })
      }
    }
  }
  
  // Check for witness contradictions
  const witnessPattern = /witness\s+(\w+)\s+(?:stated|said|testified|claimed)/gi
  const statements: Array<{ witness: string; line: number; statement: string }> = []
  
  lines.forEach((line, index) => {
    const match = witnessPattern.exec(line)
    if (match) {
      statements.push({
        witness: match[1].toLowerCase(),
        line: index + 1,
        statement: line.trim()
      })
    }
  })
  
  // Compare statements from same witness
  const witnessesByName = new Map<string, typeof statements>()
  statements.forEach(stmt => {
    const existing = witnessesByName.get(stmt.witness) || []
    existing.push(stmt)
    witnessesByName.set(stmt.witness, existing)
  })
  
  witnessesByName.forEach((stmts, witness) => {
    if (stmts.length >= 2) {
      // Check for contradictions between statements
      for (let i = 0; i < stmts.length; i++) {
        for (let j = i + 1; j < stmts.length; j++) {
          const stmt1 = stmts[i].statement.toLowerCase()
          const stmt2 = stmts[j].statement.toLowerCase()
          
          // Simple contradiction check
          if ((stmt1.includes('not') && !stmt2.includes('not')) ||
              (!stmt1.includes('not') && stmt2.includes('not'))) {
            contradictions.push({
              type: 'statement',
              severity: 'critical',
              description: `Witness ${witness} made contradictory statements`,
              location: { 
                line: stmts[i].line,
                section: `Lines ${stmts[i].line} and ${stmts[j].line}`
              },
              suggestion: 'Interview witness to resolve discrepancy'
            })
          }
        }
      }
    }
  })
  
  return contradictions
}

/**
 * Detect evidence contradictions
 * - Metadata timestamp vs. claimed creation time
 * - Document versions with suspicious modifications
 * - Chain of custody gaps or irregularities
 * - File signature mismatches
 */
function detectEvidenceContradictions(content: string): Contradiction[] {
  const contradictions: Contradiction[] = []
  
  // Check for metadata mentions
  const metadataPattern = /(?:created|modified|timestamp|dated):\s*(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/gi
  const dates: Array<{ type: string; date: string; line: number }> = []
  
  content.split('\n').forEach((line, index) => {
    let match
    while ((match = metadataPattern.exec(line)) !== null) {
      const type = match[0].split(':')[0].toLowerCase()
      dates.push({
        type,
        date: match[1],
        line: index + 1
      })
    }
  })
  
  // Check for modified date before created date
  const created = dates.find(d => d.type.includes('created'))
  const modified = dates.find(d => d.type.includes('modified'))
  
  if (created && modified) {
    try {
      const createdDate = new Date(created.date)
      const modifiedDate = new Date(modified.date)
      
      if (modifiedDate < createdDate) {
        contradictions.push({
          type: 'metadata',
          severity: 'critical',
          description: 'Document modified before it was created',
          suggestion: 'Investigate metadata tampering',
          details: `Created: ${created.date}, Modified: ${modified.date}`
        })
      }
    } catch {
      // Invalid date format - ignore
    }
  }
  
  // Check for chain of custody mentions
  const custodyPattern = /chain\s+of\s+custody|custody\s+(?:gap|break|issue)|evidence\s+(?:missing|lost|misplaced)/gi
  
  content.split('\n').forEach((line, index) => {
    if (custodyPattern.test(line)) {
      contradictions.push({
        type: 'evidence',
        severity: 'critical',
        description: 'Chain of custody issue mentioned',
        location: { line: index + 1 },
        suggestion: 'Document and investigate custody breach',
        details: line.trim()
      })
    }
  })
  
  // Check for tampering indicators
  const tamperingPattern = /(?:tampered|altered|modified|forged|fabricated|manipulated)/gi
  
  content.split('\n').forEach((line, index) => {
    if (tamperingPattern.test(line)) {
      contradictions.push({
        type: 'evidence',
        severity: 'critical',
        description: 'Evidence tampering indicator detected',
        location: { line: index + 1 },
        suggestion: 'Conduct forensic integrity verification',
        details: line.trim()
      })
    }
  })
  
  return contradictions
}

/**
 * Detect legal contradictions
 * - Actions violating constitutional rights
 * - Brady material not disclosed
 * - Evidence obtained through illegal means
 * - Procedural violations
 */
function detectLegalContradictions(content: string): Contradiction[] {
  const contradictions: Contradiction[] = []
  
  // Constitutional violations
  const constitutionalPattern = /(?:without|no)\s+(?:warrant|probable\s+cause|miranda|counsel|attorney)/gi
  
  content.split('\n').forEach((line, index) => {
    if (constitutionalPattern.test(line)) {
      contradictions.push({
        type: 'legal',
        severity: 'critical',
        description: 'Potential constitutional violation detected',
        location: { line: index + 1 },
        suggestion: 'Review for Fourth, Fifth, or Sixth Amendment issues',
        details: line.trim()
      })
    }
  })
  
  // Brady violations
  const bradyPattern = /(?:brady|exculpatory|withheld|undisclosed)\s+(?:evidence|material|information)/gi
  
  content.split('\n').forEach((line, index) => {
    if (bradyPattern.test(line)) {
      contradictions.push({
        type: 'legal',
        severity: 'critical',
        description: 'Potential Brady violation detected',
        location: { line: index + 1 },
        suggestion: 'Ensure all exculpatory evidence is disclosed',
        details: line.trim()
      })
    }
  })
  
  // Illegal search/seizure
  const searchPattern = /(?:illegal|unlawful|warrantless)\s+(?:search|seizure)/gi
  
  content.split('\n').forEach((line, index) => {
    if (searchPattern.test(line)) {
      contradictions.push({
        type: 'legal',
        severity: 'critical',
        description: 'Potential illegal search/seizure detected',
        location: { line: index + 1 },
        suggestion: 'Review for Fourth Amendment compliance',
        details: line.trim()
      })
    }
  })
  
  return contradictions
}

/**
 * Detect metadata contradictions
 */
function detectMetadataContradictions(content: string): Contradiction[] {
  const contradictions: Contradiction[] = []
  
  // Look for file size discrepancies
  const sizePattern = /(?:file\s+)?size:\s*(\d+)\s*(bytes?|kb|mb|gb)/gi
  const sizes: number[] = []
  
  let match
  while ((match = sizePattern.exec(content)) !== null) {
    const size = parseInt(match[1])
    const unit = match[2].toLowerCase()
    
    // Convert to bytes
    let bytes = size
    if (unit.includes('kb')) bytes *= 1024
    if (unit.includes('mb')) bytes *= 1024 * 1024
    if (unit.includes('gb')) bytes *= 1024 * 1024 * 1024
    
    sizes.push(bytes)
  }
  
  // Check if multiple different sizes are mentioned
  if (sizes.length > 1) {
    const uniqueSizes = [...new Set(sizes)]
    if (uniqueSizes.length > 1) {
      contradictions.push({
        type: 'metadata',
        severity: 'medium',
        description: 'Multiple different file sizes mentioned',
        suggestion: 'Verify correct file size',
        details: `Found sizes: ${uniqueSizes.join(', ')} bytes`
      })
    }
  }
  
  return contradictions
}

/**
 * Detect physical impossibilities
 */
function detectPhysicalImpossibilities(content: string): Contradiction[] {
  const contradictions: Contradiction[] = []
  
  // Check for impossible locations
  const locationPattern = /(?:in|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:and|while)\s+(?:in|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g
  
  content.split('\n').forEach((line, index) => {
    const match = locationPattern.exec(line)
    if (match && match[1] !== match[2]) {
      contradictions.push({
        type: 'physical',
        severity: 'high',
        description: 'Person claimed to be in two places simultaneously',
        location: { line: index + 1 },
        suggestion: 'Verify location and timing',
        details: `Claimed locations: ${match[1]} and ${match[2]}`
      })
    }
  })
  
  return contradictions
}

/**
 * Compare two documents for contradictions
 */
export function compareDocuments(
  doc1: { id: string; fileName: string; content: string },
  doc2: { id: string; fileName: string; content: string }
): Contradiction[] {
  const contradictions: Contradiction[] = []
  
  // Extract key facts from each document
  const facts1 = extractKeyFacts(doc1.content)
  const facts2 = extractKeyFacts(doc2.content)
  
  // Compare facts
  facts1.forEach(fact1 => {
    facts2.forEach(fact2 => {
      if (areContradictory(fact1, fact2)) {
        contradictions.push({
          type: 'statement',
          severity: 'high',
          description: `Contradictory facts between documents`,
          location: {
            document1: doc1.fileName,
            document2: doc2.fileName
          },
          suggestion: 'Reconcile conflicting information',
          details: `${doc1.fileName}: "${fact1}"\n${doc2.fileName}: "${fact2}"`
        })
      }
    })
  })
  
  return contradictions
}

/**
 * Extract key facts from text
 */
function extractKeyFacts(content: string): string[] {
  const facts: string[] = []
  const lines = content.split('\n')
  
  // Look for declarative statements
  lines.forEach(line => {
    const trimmed = line.trim()
    if (trimmed.length > 20 && trimmed.length < 200) {
      // Simple heuristic: sentences with key verbs
      if (/\b(?:is|was|are|were|has|have|had|did|does)\b/i.test(trimmed)) {
        facts.push(trimmed)
      }
    }
  })
  
  return facts
}

/**
 * Check if two facts are contradictory
 */
function areContradictory(fact1: string, fact2: string): boolean {
  const f1 = fact1.toLowerCase()
  const f2 = fact2.toLowerCase()
  
  // Check for opposite statements
  if (f1.includes('not') && !f2.includes('not')) {
    // Remove "not" from f1 and compare
    const f1WithoutNot = f1.replace(/\bnot\b/g, '').replace(/\s+/g, ' ')
    const similarity = calculateSimilarity(f1WithoutNot, f2)
    return similarity > 0.7
  }
  
  if (!f1.includes('not') && f2.includes('not')) {
    const f2WithoutNot = f2.replace(/\bnot\b/g, '').replace(/\s+/g, ' ')
    const similarity = calculateSimilarity(f1, f2WithoutNot)
    return similarity > 0.7
  }
  
  return false
}

/**
 * Calculate text similarity (simple implementation)
 */
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.split(/\s+/))
  const words2 = new Set(text2.split(/\s+/))
  
  const intersection = new Set([...words1].filter(w => words2.has(w)))
  const union = new Set([...words1, ...words2])
  
  return intersection.size / union.size
}
