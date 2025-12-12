/**
 * Document Sealing Service
 * Provides cryptographic sealing for forensic documents
 */

interface SealMetadata {
  documentHash: string
  timestamp: number
  location?: {
    latitude: number
    longitude: number
    accuracy: number
  }
  jurisdiction?: string
  sealed: boolean
  sealedBy: string
  version: string
}

interface SealedDocument {
  originalContent: string | ArrayBuffer
  seal: SealMetadata
  signature: string
  isVerumOmnisSealed: boolean
}

const SEAL_VERSION = '1.0.0'
const SEAL_AUTHORITY = 'Verum Omnis Forensics'
const SEAL_MARKER = 'VERUM_OMNIS_SEAL'

/**
 * Generate SHA-256 hash of document content
 */
async function generateHash(content: string | ArrayBuffer): Promise<string> {
  const encoder = new TextEncoder()
  const data = typeof content === 'string' 
    ? encoder.encode(content)
    : new Uint8Array(content)
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Get current geolocation if available
 */
async function getLocation(): Promise<{ latitude: number; longitude: number; accuracy: number } | undefined> {
  try {
    // Check if running in Capacitor native app
    if ((window as any).Capacitor?.isNativePlatform()) {
      const { Geolocation } = await import('@capacitor/geolocation')
      
      // Check permissions
      const permission = await Geolocation.checkPermissions()
      if (permission.location !== 'granted') {
        const result = await Geolocation.requestPermissions()
        if (result.location !== 'granted') {
          console.warn('Location permission not granted')
          return undefined
        }
      }
      
      const position = await Geolocation.getCurrentPosition()
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      }
    } else if (navigator.geolocation) {
      // Web fallback with timeout
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('Web geolocation timed out')
          resolve(undefined)
        }, 10000) // 10 second timeout

        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeout)
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            })
          },
          () => {
            clearTimeout(timeout)
            console.warn('Web geolocation failed')
            resolve(undefined)
          },
          { timeout: 10000, enableHighAccuracy: true }
        )
      })
    }
  } catch (error) {
    console.error('Failed to get location:', error)
  }
  return undefined
}

// Approximate geographic boundaries for jurisdiction detection
const JURISDICTION_BOUNDS = {
  US: { latMin: 24.5, latMax: 49.4, lonMin: -125, lonMax: -66.9 },
  CANADA: { latMin: 41.9, latMax: 83.1, lonMin: -141, lonMax: -52.6 },
  UK: { latMin: 49.9, latMax: 59.4, lonMin: -8.6, lonMax: 1.8 }
}

/**
 * Determine jurisdiction based on location
 */
function getJurisdiction(latitude: number, longitude: number): string {
  // Simplified jurisdiction detection
  // In production, use a proper reverse geocoding service
  const { US, CANADA, UK } = JURISDICTION_BOUNDS
  
  if (latitude >= US.latMin && latitude <= US.latMax && 
      longitude >= US.lonMin && longitude <= US.lonMax) {
    return 'United States'
  } else if (latitude >= CANADA.latMin && latitude <= CANADA.latMax && 
             longitude >= CANADA.lonMin && longitude <= CANADA.lonMax) {
    return 'Canada'
  } else if (latitude >= UK.latMin && latitude <= UK.latMax && 
             longitude >= UK.lonMin && longitude <= UK.lonMax) {
    return 'United Kingdom'
  }
  return 'International'
}

/**
 * Generate cryptographic signature for seal
 */
async function generateSignature(seal: SealMetadata): Promise<string> {
  const sealString = JSON.stringify(seal)
  const hash = await generateHash(sealString)
  return `${SEAL_MARKER}:${hash}`
}

/**
 * Check if document is already sealed by Verum Omnis
 */
export function isVerumOmnisSealed(content: string): boolean {
  try {
    // Check for seal marker in content
    if (content.includes(SEAL_MARKER)) {
      // More specific regex to match complete JSON structure
      const sealMatch = content.match(/VERUM_OMNIS_SEAL_DATA:(\{(?:[^{}]|\{[^{}]*\})*\})/s)
      if (sealMatch) {
        const sealData = JSON.parse(sealMatch[1])
        return sealData.sealedBy === SEAL_AUTHORITY && sealData.sealed === true
      }
    }
  } catch (error) {
    console.error('Error checking seal:', error)
  }
  return false
}

/**
 * Verify existing Verum Omnis seal
 */
export async function verifySeal(sealedContent: string): Promise<{
  isValid: boolean
  seal?: SealMetadata
  message: string
}> {
  try {
    if (!sealedContent.includes(SEAL_MARKER)) {
      return { isValid: false, message: 'No Verum Omnis seal found' }
    }

    // More specific regex to match complete JSON structure
    const sealMatch = sealedContent.match(/VERUM_OMNIS_SEAL_DATA:(\{(?:[^{}]|\{[^{}]*\})*\})/s)
    if (!sealMatch) {
      return { isValid: false, message: 'Seal data corrupted' }
    }

    const seal: SealMetadata = JSON.parse(sealMatch[1])
    
    // Verify seal integrity
    const signatureMatch = sealedContent.match(/VERUM_OMNIS_SIGNATURE:(.*?)$/s)
    if (!signatureMatch) {
      return { isValid: false, message: 'Seal signature missing' }
    }

    const storedSignature = signatureMatch[1].trim()
    const computedSignature = await generateSignature(seal)

    if (storedSignature !== computedSignature) {
      return { isValid: false, seal, message: 'Seal signature invalid - document may have been tampered with' }
    }

    return {
      isValid: true,
      seal,
      message: `Document sealed by ${seal.sealedBy} on ${new Date(seal.timestamp).toLocaleString()}`
    }
  } catch (error) {
    return { isValid: false, message: 'Error verifying seal: ' + (error as Error).message }
  }
}

/**
 * Seal a document with cryptographic signature
 */
export async function sealDocument(
  content: string | ArrayBuffer,
  fileName: string
): Promise<SealedDocument> {
  // Check if already sealed
  const contentStr = typeof content === 'string' ? content : new TextDecoder().decode(content)
  
  if (isVerumOmnisSealed(contentStr)) {
    // Don't re-seal, just verify
    const verification = await verifySeal(contentStr)
    
    // Extract existing seal
    const sealMatch = contentStr.match(/VERUM_OMNIS_SEAL_DATA:(\{(?:[^{}]|\{[^{}]*\})*\})/s)
    const seal: SealMetadata = sealMatch ? JSON.parse(sealMatch[1]) : {
      documentHash: await generateHash(content),
      timestamp: Date.now(),
      sealed: true,
      sealedBy: SEAL_AUTHORITY,
      version: SEAL_VERSION
    }

    return {
      originalContent: content,
      seal,
      signature: verification.message,
      isVerumOmnisSealed: true
    }
  }

  // Generate new seal
  const documentHash = await generateHash(content)
  const location = await getLocation()
  
  const seal: SealMetadata = {
    documentHash,
    timestamp: Date.now(),
    location,
    jurisdiction: location ? getJurisdiction(location.latitude, location.longitude) : undefined,
    sealed: true,
    sealedBy: SEAL_AUTHORITY,
    version: SEAL_VERSION
  }

  const signature = await generateSignature(seal)

  // Create sealed content with embedded seal
  const sealData = `\n\n--- VERUM OMNIS FORENSIC SEAL ---\n` +
    `VERUM_OMNIS_SEAL_DATA:${JSON.stringify(seal, null, 2)}\n` +
    `VERUM_OMNIS_SIGNATURE:${signature}\n` +
    `--- END FORENSIC SEAL ---\n`

  const sealedContent = contentStr + sealData

  return {
    originalContent: sealedContent,
    seal,
    signature,
    isVerumOmnisSealed: false // Newly sealed
  }
}

/**
 * Format seal information for display
 */
export function formatSealInfo(seal: SealMetadata): string {
  const lines = [
    `Sealed by: ${seal.sealedBy}`,
    `Date: ${new Date(seal.timestamp).toLocaleString()}`,
    `Document Hash: ${seal.documentHash.substring(0, 16)}...`,
    `Version: ${seal.version}`
  ]

  if (seal.location) {
    lines.push(`Location: ${seal.location.latitude.toFixed(4)}, ${seal.location.longitude.toFixed(4)}`)
  }

  if (seal.jurisdiction) {
    lines.push(`Jurisdiction: ${seal.jurisdiction}`)
  }

  return lines.join('\n')
}
