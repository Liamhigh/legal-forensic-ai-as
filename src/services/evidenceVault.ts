import { Encoding } from '@capacitor/filesystem';
/**
 * Evidence Vault Service
 * Manages local storage of sealed evidence files using Capacitor Filesystem
 * Creates organized structure for PDFs, reports, certificates, and emails
 */

import { Filesystem, Directory } from '@capacitor/filesystem'

export interface VaultManifest {
  vaultId: string
  createdAt: number
  lastUpdated: number
  caseId: string
  items: VaultItem[]
}

export interface VaultItem {
  id: string
  type: 'sealed_pdf' | 'certificate' | 'report' | 'email' | 'session'
  fileName: string
  path: string
  hash: string
  qrCode?: string
  timestamp: number
  metadata?: Record<string, any>
}

const VAULT_DIR = 'verum-omnis-evidence'
const MANIFEST_FILE = 'vault-manifest.json'

/**
 * Initialize the evidence vault directory structure
 */
async function ensureVaultStructure(): Promise<void> {
  try {
    // Check if running in Capacitor native app
    if (!(window as any).Capacitor?.isNativePlatform()) {
      console.log('Evidence vault: Not in native environment, skipping filesystem operations')
      return
    }

    // Create main vault directory
    try {
      await Filesystem.mkdir({
        path: VAULT_DIR,
        directory: Directory.Documents,
        recursive: true
      })
    } catch (error: any) {
      // Directory may already exist
      if (error.message && !error.message.includes('already exists')) {
        throw error
      }
    }

    // Create subdirectories
    const subdirs = ['pdfs', 'certificates', 'reports', 'emails', 'sessions']
    for (const subdir of subdirs) {
      try {
        await Filesystem.mkdir({
          path: `${VAULT_DIR}/${subdir}`,
          directory: Directory.Documents,
          recursive: true
        })
      } catch (error: any) {
        if (error.message && !error.message.includes('already exists')) {
          throw error
        }
      }
    }
  } catch (error) {
    console.error('Failed to ensure vault structure:', error)
    throw error
  }
}

/**
 * Load vault manifest
 */
async function loadManifest(caseId: string): Promise<VaultManifest> {
  try {
    if (!(window as any).Capacitor?.isNativePlatform()) {
      // Return in-memory manifest for web
      const stored = localStorage.getItem(`vault-manifest-${caseId}`)
      if (stored) {
        return JSON.parse(stored)
      }
      throw new Error('Manifest not found')
    }

    const result = await Filesystem.readFile({
      path: `${VAULT_DIR}/${MANIFEST_FILE}`,
      directory: Directory.Documents,
      encoding: Encoding.UTF8
    })

    return JSON.parse(result.data as string)
  } catch {
    // Create new manifest if doesn't exist - ignore error
    const manifest: VaultManifest = {
      vaultId: `VAULT-${Date.now()}`,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      caseId,
      items: []
    }
    return manifest
  }
}

/**
 * Save vault manifest
 */
async function saveManifest(manifest: VaultManifest): Promise<void> {
  manifest.lastUpdated = Date.now()
  
  try {
    if (!(window as any).Capacitor?.isNativePlatform()) {
      // Save to localStorage for web
      localStorage.setItem(`vault-manifest-${manifest.caseId}`, JSON.stringify(manifest))
      return
    }

    await Filesystem.writeFile({
      path: `${VAULT_DIR}/${MANIFEST_FILE}`,
      directory: Directory.Documents,
      data: JSON.stringify(manifest, null, 2),
      encoding: Encoding.UTF8
    })
  } catch (error) {
    console.error('Failed to save manifest:', error)
    throw error
  }
}

/**
 * Store sealed evidence in vault
 */
export async function storeEvidenceInVault(
  caseId: string,
  type: VaultItem['type'],
  fileName: string,
  content: string | Uint8Array,
  hash: string,
  qrCode?: string,
  metadata?: Record<string, any>
): Promise<VaultItem> {
  await ensureVaultStructure()
  
  const manifest = await loadManifest(caseId)
  
  // Determine subdirectory based on type
  const subdirMap: Record<VaultItem['type'], string> = {
    sealed_pdf: 'pdfs',
    certificate: 'certificates',
    report: 'reports',
    email: 'emails',
    session: 'sessions'
  }
  
  const subdir = subdirMap[type]
  const timestamp = Date.now()
  const itemId = `${type.toUpperCase()}-${timestamp}`
  const filePath = `${VAULT_DIR}/${subdir}/${fileName}`
  
  try {
    if ((window as any).Capacitor?.isNativePlatform()) {
      // Write file to filesystem
      await Filesystem.writeFile({
        path: filePath,
        directory: Directory.Documents,
        data: typeof content === 'string' ? content : new Blob([content]),
        encoding: typeof content === 'string' ? Encoding.UTF8 : undefined
      })
    } else {
      // For web, store in IndexedDB or localStorage
      const key = `vault-${caseId}-${itemId}`
      if (typeof content === 'string') {
        localStorage.setItem(key, content)
      } else {
        // Convert Uint8Array to base64 for localStorage
        const base64 = btoa(String.fromCharCode(...content))
        localStorage.setItem(key, base64)
      }
    }
  } catch (error) {
    console.error('Failed to write evidence file:', error)
    throw error
  }
  
  // Create vault item
  const item: VaultItem = {
    id: itemId,
    type,
    fileName,
    path: filePath,
    hash,
    qrCode,
    timestamp,
    metadata
  }
  
  // Add to manifest
  manifest.items.push(item)
  await saveManifest(manifest)
  
  return item
}

/**
 * Retrieve evidence from vault
 */
export async function retrieveEvidenceFromVault(
  caseId: string,
  itemId: string
): Promise<{ item: VaultItem; content: string | Uint8Array }> {
  const manifest = await loadManifest(caseId)
  const item = manifest.items.find(i => i.id === itemId)
  
  if (!item) {
    throw new Error(`Item ${itemId} not found in vault`)
  }
  
  try {
    if ((window as any).Capacitor?.isNativePlatform()) {
      const result = await Filesystem.readFile({
        path: item.path,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      })
      return { item, content: result.data as string }
    } else {
      const key = `vault-${caseId}-${itemId}`
      const content = localStorage.getItem(key)
      if (!content) {
        throw new Error('Content not found')
      }
      return { item, content }
    }
  } catch (error) {
    console.error('Failed to retrieve evidence:', error)
    throw error
  }
}

/**
 * List all evidence items in vault for a case
 */
export async function listVaultEvidence(caseId: string): Promise<VaultItem[]> {
  try {
    const manifest = await loadManifest(caseId)
    return manifest.items
  } catch (error) {
    console.error('Failed to list vault evidence:', error)
    return []
  }
}

/**
 * Get vault storage path (for display purposes)
 */
export function getVaultPath(): string {
  if ((window as any).Capacitor?.isNativePlatform()) {
    return `Documents/${VAULT_DIR}/`
  }
  return 'Browser Local Storage'
}

/**
 * Export entire vault as ZIP (for court submission)
 */
export async function exportVault(caseId: string): Promise<Blob> {
  const manifest = await loadManifest(caseId)
  
  // For web implementation, we'll create a simple text export
  // In a native app, this would create a proper ZIP file
  let exportContent = `VERUM OMNIS EVIDENCE VAULT EXPORT\n`
  exportContent += `═══════════════════════════════════════════════════════════════════\n\n`
  exportContent += `Vault ID: ${manifest.vaultId}\n`
  exportContent += `Case ID: ${manifest.caseId}\n`
  exportContent += `Created: ${new Date(manifest.createdAt).toISOString()}\n`
  exportContent += `Last Updated: ${new Date(manifest.lastUpdated).toISOString()}\n`
  exportContent += `Total Items: ${manifest.items.length}\n\n`
  
  exportContent += `EVIDENCE INVENTORY:\n`
  exportContent += `═══════════════════════════════════════════════════════════════════\n\n`
  
  manifest.items.forEach((item, index) => {
    exportContent += `${index + 1}. ${item.type.toUpperCase()}\n`
    exportContent += `   ID: ${item.id}\n`
    exportContent += `   File: ${item.fileName}\n`
    exportContent += `   Hash: ${item.hash}\n`
    exportContent += `   Timestamp: ${new Date(item.timestamp).toISOString()}\n`
    if (item.qrCode) {
      exportContent += `   QR Code: [Embedded]\n`
    }
    exportContent += `\n`
  })
  
  return new Blob([exportContent], { type: 'text/plain' })
}
