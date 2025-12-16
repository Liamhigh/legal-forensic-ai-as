/**
 * Email Sealing Service
 * Handles sealing of AI-drafted emails for forensic integrity
 * Prevents post-hoc tampering claims by cryptographically sealing all email content
 */

import { sealDocument } from './documentSealing'
import { generatePDFReport, type PDFReportData } from './pdfGenerator'
import { generateQRCode, addQRCodeToPDF, type QRCodeData } from './qrCodeSealing'
import { storeEvidenceInVault } from './evidenceVault'
import { recordSessionEvent } from './sessionSealing'

export interface DraftedEmail {
  id: string
  to: string
  subject: string
  body: string
  timestamp: number
  draftedBy: string
}

export interface SealedEmail {
  email: DraftedEmail
  emailHash: string
  sealTimestamp: number
  qrCode: string
  pdfContent: Uint8Array
}

/**
 * Detect if user is requesting email drafting
 */
export function isEmailDraftRequest(message: string): boolean {
  const emailKeywords = [
    'draft email',
    'draft an email',
    'write email',
    'compose email',
    'send email',
    'email to',
    'write to',
    'write a letter to',
    'compose a letter to'
  ]
  
  const lowerMessage = message.toLowerCase()
  return emailKeywords.some(keyword => lowerMessage.includes(keyword))
}

/**
 * Extract email components from message
 */
export function extractEmailComponents(message: string, aiResponse: string): {
  to?: string
  subject?: string
  body: string
} {
  // Try to extract recipient from message
  let to: string | undefined
  const toMatch = message.match(/(?:to|send to|email to)\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
  if (toMatch) {
    to = toMatch[1]
  }
  
  // Try to extract subject from AI response
  let subject: string | undefined
  const subjectMatch = aiResponse.match(/(?:Subject|RE|Re):\s*(.+?)(?:\n|$)/i)
  if (subjectMatch) {
    subject = subjectMatch[1].trim()
  }
  
  // Body is the AI response (or extracted email content)
  let body = aiResponse
  
  // If response contains "To:", "Subject:", "Body:" structure, extract properly
  const emailStructureMatch = aiResponse.match(/To:\s*(.+?)\s*\n\s*Subject:\s*(.+?)\s*\n\s*(?:Body:)?\s*(.+)/is)
  if (emailStructureMatch) {
    to = to || emailStructureMatch[1].trim()
    subject = emailStructureMatch[2].trim()
    body = emailStructureMatch[3].trim()
  }
  
  return { to, subject, body }
}

/**
 * Create a drafted email object
 */
export function createDraftedEmail(
  to: string | undefined,
  subject: string | undefined,
  body: string
): DraftedEmail {
  return {
    id: `EMAIL-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    to: to || '[Recipient not specified]',
    subject: subject || '[No subject]',
    body,
    timestamp: Date.now(),
    draftedBy: 'Verum Omnis AI'
  }
}

/**
 * Seal a drafted email with cryptographic signature and QR code
 */
export async function sealDraftedEmail(
  email: DraftedEmail,
  caseId: string
): Promise<SealedEmail> {
  // Format email as text document
  const emailContent = formatEmailAsDocument(email)
  
  // Seal the email content
  const sealed = await sealDocument(emailContent, `email_${email.id}.txt`)
  
  // Record email drafting event
  await recordSessionEvent('statement_entered', {
    type: 'email_draft',
    emailId: email.id,
    to: email.to,
    subject: email.subject,
    hash: sealed.seal.documentHash
  })
  
  // Generate QR code data
  const qrData: QRCodeData = {
    documentHash: sealed.seal.documentHash,
    timestamp: sealed.seal.timestamp,
    type: 'email',
    verificationUrl: `verum-omnis://verify/${sealed.seal.documentHash}`
  }
  
  const qrCode = await generateQRCode(qrData)
  
  // Create PDF report of the sealed email
  const reportData: PDFReportData = {
    title: `Sealed Email: ${email.subject}`,
    content: emailContent,
    documentInfo: {
      fileName: `email_${email.id}.txt`,
      hash: sealed.seal.documentHash,
      timestamp: sealed.seal.timestamp,
      jurisdiction: sealed.seal.jurisdiction
    },
    sealInfo: {
      sealedBy: 'Verum Omnis AI Forensics',
      timestamp: sealed.seal.timestamp,
      location: sealed.seal.jurisdiction
    }
  }
  
  // Generate PDF
  let pdfBytes = await generatePDFReport(reportData, {
    includeWatermark: true,
    watermarkOpacity: 0.08
  })
  
  // Add QR code to PDF
  pdfBytes = await addQRCodeToPDF(pdfBytes, qrData, 'bottom-right')
  
  // Store in evidence vault
  await storeEvidenceInVault(
    caseId,
    'email',
    `sealed_email_${email.id}.pdf`,
    pdfBytes,
    sealed.seal.documentHash,
    qrCode,
    {
      to: email.to,
      subject: email.subject,
      draftedBy: email.draftedBy,
      timestamp: email.timestamp
    }
  )
  
  return {
    email,
    emailHash: sealed.seal.documentHash,
    sealTimestamp: sealed.seal.timestamp,
    qrCode,
    pdfContent: pdfBytes
  }
}

/**
 * Format email as a formal document for sealing
 */
function formatEmailAsDocument(email: DraftedEmail): string {
  return `═══════════════════════════════════════════════════════════════════
                    SEALED EMAIL DRAFT
                    Verum Omnis AI Forensics
═══════════════════════════════════════════════════════════════════

EMAIL ID: ${email.id}
DRAFTED: ${new Date(email.timestamp).toISOString()}
DRAFTED BY: ${email.draftedBy}

───────────────────────────────────────────────────────────────────
EMAIL CONTENT
───────────────────────────────────────────────────────────────────

To: ${email.to}
Subject: ${email.subject}
Date: ${new Date(email.timestamp).toLocaleString()}

${email.body}

───────────────────────────────────────────────────────────────────
FORENSIC NOTICE
───────────────────────────────────────────────────────────────────

This email was drafted by Verum Omnis AI and has been cryptographically
sealed to prevent tampering. Any claims that this content differs from
what was originally drafted can be forensically verified.

The recipient should retain this sealed version as proof of the original
communication content. This document includes a QR code for verification
and has been added to the case evidence vault.

IMPORTANT: If sending this email, attach this sealed PDF version to 
establish an immutable record of what was communicated.

═══════════════════════════════════════════════════════════════════
                    END OF SEALED EMAIL DRAFT
═══════════════════════════════════════════════════════════════════
`
}

/**
 * Download sealed email PDF
 */
export function downloadSealedEmail(sealedEmail: SealedEmail): void {
  const blob = new Blob([sealedEmail.pdfContent], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sealed_email_${sealedEmail.email.subject.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Get email summary for display
 */
export function getEmailSummary(sealedEmail: SealedEmail): string {
  return `📧 Sealed Email Draft
To: ${sealedEmail.email.to}
Subject: ${sealedEmail.email.subject}
Hash: ${sealedEmail.emailHash.substring(0, 16)}...
Sealed: ${new Date(sealedEmail.sealTimestamp).toLocaleString()}

✓ Cryptographically sealed
✓ QR code generated
✓ Stored in evidence vault
✓ Ready for sending

Download the sealed PDF attachment to send with your email.`
}
