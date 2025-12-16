/**
 * QR Code Sealing Service
 * Generates QR codes for sealed documents and integrates them into PDFs
 */

import QRCode from 'qrcode'
import { PDFDocument, rgb } from 'pdf-lib'

export interface QRCodeData {
  documentHash: string
  certificateId?: string
  timestamp: number
  type: 'evidence' | 'certificate' | 'report' | 'email' | 'session'
  verificationUrl?: string
}

/**
 * Generate QR code as data URL
 */
export async function generateQRCode(data: QRCodeData): Promise<string> {
  try {
    const qrData = JSON.stringify(data)
    const dataUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H' // High error correction for forensic use
    })
    return dataUrl
  } catch (error) {
    console.error('Failed to generate QR code:', error)
    throw error
  }
}

/**
 * Generate QR code as PNG buffer
 */
export async function generateQRCodeBuffer(data: QRCodeData): Promise<Uint8Array> {
  try {
    const qrData = JSON.stringify(data)
    const buffer = await QRCode.toBuffer(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    })
    return new Uint8Array(buffer)
  } catch (error) {
    console.error('Failed to generate QR code buffer:', error)
    throw error
  }
}

/**
 * Add QR code seal to existing PDF
 */
export async function addQRCodeToPDF(
  pdfBytes: Uint8Array,
  qrData: QRCodeData,
  position: 'bottom-right' | 'bottom-left' | 'top-right' = 'bottom-right'
): Promise<Uint8Array> {
  try {
    // Load the existing PDF
    const pdfDoc = await PDFDocument.load(pdfBytes)
    
    // Generate QR code
    const qrCodeDataUrl = await generateQRCode(qrData)
    
    // Convert data URL to buffer
    const qrResponse = await fetch(qrCodeDataUrl)
    const qrBuffer = await qrResponse.arrayBuffer()
    
    // Embed QR code image
    const qrImage = await pdfDoc.embedPng(qrBuffer)
    const qrDims = qrImage.scale(0.3) // Scale down to reasonable size
    
    // Add QR code to all pages (typically just last page for forensic seal)
    const pages = pdfDoc.getPages()
    const lastPage = pages[pages.length - 1]
    const { width, height } = lastPage.getSize()
    
    // Calculate position
    let x: number, y: number
    switch (position) {
      case 'bottom-right':
        x = width - qrDims.width - 20
        y = 20
        break
      case 'bottom-left':
        x = 20
        y = 20
        break
      case 'top-right':
        x = width - qrDims.width - 20
        y = height - qrDims.height - 20
        break
      default:
        x = width - qrDims.width - 20
        y = 20
    }
    
    // Draw QR code
    lastPage.drawImage(qrImage, {
      x,
      y,
      width: qrDims.width,
      height: qrDims.height
    })
    
    // Add verification text above QR code
    const font = await pdfDoc.embedFont('Helvetica')
    const fontSize = 8
    const verificationText = `Scan to verify: ${qrData.type.toUpperCase()}`
    const textWidth = font.widthOfTextAtSize(verificationText, fontSize)
    
    lastPage.drawText(verificationText, {
      x: x + (qrDims.width - textWidth) / 2,
      y: y + qrDims.height + 5,
      size: fontSize,
      font,
      color: rgb(0, 0, 0)
    })
    
    // Add seal marker text
    const sealText = '🔒 FORENSICALLY SEALED'
    const sealTextWidth = font.widthOfTextAtSize(sealText, fontSize)
    
    lastPage.drawText(sealText, {
      x: x + (qrDims.width - sealTextWidth) / 2,
      y: y - 15,
      size: fontSize,
      font,
      color: rgb(0.8, 0, 0)
    })
    
    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save()
    return modifiedPdfBytes
  } catch (error) {
    console.error('Failed to add QR code to PDF:', error)
    throw error
  }
}

/**
 * Create a standalone QR code certificate page
 */
export async function createQRCodeCertificatePage(
  qrData: QRCodeData,
  additionalInfo?: {
    title?: string
    description?: string
    hash?: string
  }
): Promise<Uint8Array> {
  try {
    // Create new PDF
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([612, 792]) // Letter size
    const { width, height } = page.getSize()
    
    // Embed fonts
    const boldFont = await pdfDoc.embedFont('Helvetica-Bold')
    const regularFont = await pdfDoc.embedFont('Helvetica')
    
    // Generate QR code
    const qrCodeDataUrl = await generateQRCode(qrData)
    const qrResponse = await fetch(qrCodeDataUrl)
    const qrBuffer = await qrResponse.arrayBuffer()
    const qrImage = await pdfDoc.embedPng(qrBuffer)
    
    // Scale QR code larger for standalone certificate
    const qrDims = qrImage.scale(0.5)
    
    // Center QR code
    const qrX = (width - qrDims.width) / 2
    const qrY = height / 2
    
    page.drawImage(qrImage, {
      x: qrX,
      y: qrY,
      width: qrDims.width,
      height: qrDims.height
    })
    
    // Add title
    const title = additionalInfo?.title || 'VERUM OMNIS FORENSIC SEAL'
    const titleSize = 20
    const titleWidth = boldFont.widthOfTextAtSize(title, titleSize)
    
    page.drawText(title, {
      x: (width - titleWidth) / 2,
      y: qrY + qrDims.height + 40,
      size: titleSize,
      font: boldFont,
      color: rgb(0, 0, 0)
    })
    
    // Add description
    if (additionalInfo?.description) {
      const descSize = 12
      const descWidth = regularFont.widthOfTextAtSize(additionalInfo.description, descSize)
      page.drawText(additionalInfo.description, {
        x: (width - descWidth) / 2,
        y: qrY + qrDims.height + 15,
        size: descSize,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3)
      })
    }
    
    // Add verification instructions
    const instructions = [
      'Scan this QR code to verify document authenticity',
      'and view forensic seal information'
    ]
    
    let instructionY = qrY - 40
    instructions.forEach(line => {
      const lineWidth = regularFont.widthOfTextAtSize(line, 10)
      page.drawText(line, {
        x: (width - lineWidth) / 2,
        y: instructionY,
        size: 10,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3)
      })
      instructionY -= 15
    })
    
    // Add hash if provided
    if (additionalInfo?.hash) {
      const hashLabel = 'Document Hash:'
      const hashValue = additionalInfo.hash.substring(0, 32) + '...'
      
      page.drawText(hashLabel, {
        x: 50,
        y: 100,
        size: 9,
        font: boldFont,
        color: rgb(0, 0, 0)
      })
      
      page.drawText(hashValue, {
        x: 50,
        y: 85,
        size: 8,
        font: regularFont,
        color: rgb(0.3, 0.3, 0.3)
      })
    }
    
    // Add timestamp
    const timestampText = `Sealed: ${new Date(qrData.timestamp).toISOString()}`
    const timestampWidth = regularFont.widthOfTextAtSize(timestampText, 9)
    
    page.drawText(timestampText, {
      x: (width - timestampWidth) / 2,
      y: 60,
      size: 9,
      font: regularFont,
      color: rgb(0.3, 0.3, 0.3)
    })
    
    // Add footer
    const footerText = 'This certificate verifies the cryptographic seal of the associated document'
    const footerWidth = regularFont.widthOfTextAtSize(footerText, 8)
    
    page.drawText(footerText, {
      x: (width - footerWidth) / 2,
      y: 30,
      size: 8,
      font: regularFont,
      color: rgb(0.5, 0.5, 0.5)
    })
    
    // Save PDF
    const pdfBytes = await pdfDoc.save()
    return pdfBytes
  } catch (error) {
    console.error('Failed to create QR code certificate page:', error)
    throw error
  }
}

/**
 * Verify QR code data
 */
export function parseQRCodeData(qrCodeContent: string): QRCodeData | null {
  try {
    const data = JSON.parse(qrCodeContent)
    if (data.documentHash && data.timestamp && data.type) {
      return data as QRCodeData
    }
    return null
  } catch (error) {
    console.error('Failed to parse QR code data:', error)
    return null
  }
}
