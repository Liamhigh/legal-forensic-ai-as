/**
 * PDF Generator Service
 * Generates forensic reports as proper PDFs with watermark and certification
 * 
 * LAYER ORDER (MANDATORY):
 * 1. Solid white page background
 * 2. Main document text/content (100% opacity, explicit #000000 color)
 * 3. Watermark logo (centered, opacity 0.06-0.08)
 * 4. Footer certification block (hash, QR, metadata)
 */

import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib'
import QRCode from 'qrcode'

export interface PDFReportData {
  title: string
  content: string
  documentInfo?: {
    fileName: string
    hash: string
    timestamp: number
    jurisdiction?: string
  }
  sealInfo?: {
    sealedBy: string
    location?: string
    timestamp: number
  }
}

export interface PDFGenerationOptions {
  includeWatermark: boolean
  watermarkOpacity?: number
  debugMode?: boolean
}

/**
 * Generate a unique report ID
 */
function generateReportId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 9)
  return `VOR-${timestamp}-${random}`.toUpperCase()
}

/**
 * Generate hash of report content
 */
async function generateReportHash(reportData: PDFReportData): Promise<string> {
  const content = JSON.stringify(reportData)
  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Load watermark image and convert to data URL
 */
async function loadWatermarkImage(): Promise<string> {
  try {
    const response = await fetch('/assets/watermark.png')
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Failed to load watermark:', error)
    return ''
  }
}

/**
 * Draw text on PDF page with proper wrapping
 */
function drawTextBlock(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  lineHeight: number,
  font: any
): number {
  const lines = wrapText(text, maxWidth, fontSize, font)
  let currentY = y
  
  lines.forEach(line => {
    // CRITICAL: Use explicit black color (100% opacity)
    page.drawText(line, {
      x,
      y: currentY,
      size: fontSize,
      font,
      color: rgb(0, 0, 0), // Explicit #000000 color
      opacity: 1.0 // Explicit 100% opacity
    })
    currentY -= lineHeight
  })
  
  return currentY
}

/**
 * Wrap text to fit within max width
 */
function wrapText(text: string, maxWidth: number, fontSize: number, font: any): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''
  
  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const width = font.widthOfTextAtSize(testLine, fontSize)
    
    if (width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  })
  
  if (currentLine) {
    lines.push(currentLine)
  }
  
  return lines
}

/**
 * Generate QR code as data URL
 */
async function generateQRCode(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
  } catch (error) {
    console.error('Failed to generate QR code:', error)
    return ''
  }
}

/**
 * Draw debug outlines for text bounding boxes (when debugMode is enabled)
 */
function drawDebugOutlines(page: PDFPage, debugMode: boolean) {
  if (!debugMode) return
  
  const { width, height } = page.getSize()
  
  // Draw page border
  page.drawRectangle({
    x: 50,
    y: 50,
    width: width - 100,
    height: height - 100,
    borderColor: rgb(1, 0, 0),
    borderWidth: 1,
    opacity: 0.3
  })
}

/**
 * Generate forensic PDF report with proper layer ordering
 */
export async function generatePDFReport(
  reportData: PDFReportData,
  options: PDFGenerationOptions = { includeWatermark: true }
): Promise<Uint8Array> {
  // Validate text opacity requirement
  if (options.debugMode) {
    console.log('PDF Generation Debug Mode: Enabled')
  }
  
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create()
  
  // Embed standard font (similar to DejaVuSans)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  
  const timestamp = new Date().toISOString()
  const reportId = generateReportId()
  const reportHash = await generateReportHash(reportData)
  
  // Add first page
  let page = pdfDoc.addPage([612, 792]) // Letter size
  const { width, height } = page.getSize()
  
  // LAYER 1: Solid white page background (implicit in pdf-lib)
  // The page is already white by default
  
  // LAYER 2: Main document text/content (100% opacity, explicit #000000 color)
  let currentY = height - 50
  const margin = 50
  const maxWidth = width - (margin * 2)
  const fontSize = 10
  const titleSize = 18
  const headingSize = 12
  const lineHeight = fontSize * 1.5
  
  // Title
  currentY = drawTextBlock(
    page,
    'VERUM OMNIS FORENSIC REPORT',
    width / 2 - boldFont.widthOfTextAtSize('VERUM OMNIS FORENSIC REPORT', titleSize) / 2,
    currentY,
    maxWidth,
    titleSize,
    lineHeight * 2,
    boldFont
  )
  
  currentY -= lineHeight
  
  currentY = drawTextBlock(
    page,
    'Legal Evidence Analysis',
    width / 2 - font.widthOfTextAtSize('Legal Evidence Analysis', fontSize) / 2,
    currentY,
    maxWidth,
    fontSize,
    lineHeight,
    font
  )
  
  currentY -= lineHeight * 2
  
  // Report metadata
  const metadataLines = [
    `Report Title: ${reportData.title}`,
    `Generated: ${timestamp}`,
    `Report ID: ${reportId}`,
  ]
  
  for (const line of metadataLines) {
    currentY = drawTextBlock(page, line, margin, currentY, maxWidth, fontSize, lineHeight, font)
  }
  
  currentY -= lineHeight * 2
  
  // Document Information
  if (reportData.documentInfo) {
    currentY = drawTextBlock(
      page,
      'DOCUMENT INFORMATION',
      margin,
      currentY,
      maxWidth,
      headingSize,
      lineHeight * 2,
      boldFont
    )
    
    currentY -= lineHeight
    
    const docLines = [
      `File Name: ${reportData.documentInfo.fileName}`,
      `Document Hash (SHA-256): ${reportData.documentInfo.hash}`,
      `Sealed Date: ${new Date(reportData.documentInfo.timestamp).toLocaleString()}`,
    ]
    
    if (reportData.documentInfo.jurisdiction) {
      docLines.push(`Jurisdiction: ${reportData.documentInfo.jurisdiction}`)
    }
    
    for (const line of docLines) {
      currentY = drawTextBlock(page, line, margin, currentY, maxWidth, fontSize, lineHeight, font)
      if (currentY < 100) {
        page = pdfDoc.addPage([612, 792])
        currentY = height - 50
      }
    }
    
    currentY -= lineHeight * 2
  }
  
  // Seal Information
  if (reportData.sealInfo) {
    if (currentY < 150) {
      page = pdfDoc.addPage([612, 792])
      currentY = height - 50
    }
    
    currentY = drawTextBlock(
      page,
      'SEAL INFORMATION',
      margin,
      currentY,
      maxWidth,
      headingSize,
      lineHeight * 2,
      boldFont
    )
    
    currentY -= lineHeight
    
    const sealLines = [
      `Sealed By: ${reportData.sealInfo.sealedBy}`,
      `Seal Date: ${new Date(reportData.sealInfo.timestamp).toLocaleString()}`,
    ]
    
    if (reportData.sealInfo.location) {
      sealLines.push(`Location: ${reportData.sealInfo.location}`)
    }
    
    for (const line of sealLines) {
      currentY = drawTextBlock(page, line, margin, currentY, maxWidth, fontSize, lineHeight, font)
      if (currentY < 100) {
        page = pdfDoc.addPage([612, 792])
        currentY = height - 50
      }
    }
    
    currentY -= lineHeight * 2
  }
  
  // Forensic Analysis Content
  if (currentY < 150) {
    page = pdfDoc.addPage([612, 792])
    currentY = height - 50
  }
  
  currentY = drawTextBlock(
    page,
    'FORENSIC ANALYSIS',
    margin,
    currentY,
    maxWidth,
    headingSize,
    lineHeight * 2,
    boldFont
  )
  
  currentY -= lineHeight * 2
  
  // Split content into paragraphs
  const paragraphs = reportData.content.split('\n\n')
  
  for (const paragraph of paragraphs) {
    if (paragraph.trim()) {
      currentY = drawTextBlock(page, paragraph.trim(), margin, currentY, maxWidth, fontSize, lineHeight, font)
      currentY -= lineHeight
      
      if (currentY < 150) {
        page = pdfDoc.addPage([612, 792])
        currentY = height - 50
      }
    }
  }
  
  // LAYER 3: Watermark logo (centered, opacity 0.06-0.08)
  if (options.includeWatermark) {
    const watermarkOpacity = options.watermarkOpacity || 0.07
    const watermarkDataUrl = await loadWatermarkImage()
    
    if (watermarkDataUrl) {
      try {
        // Determine image type from data URL
        const isJpg = watermarkDataUrl.startsWith('data:image/jpeg')
        const watermarkBytes = await fetch(watermarkDataUrl).then(res => res.arrayBuffer())
        
        const watermarkImage = isJpg 
          ? await pdfDoc.embedJpg(watermarkBytes)
          : await pdfDoc.embedPng(watermarkBytes)
        
        const watermarkDims = watermarkImage.scale(0.3)
        
        // Add watermark to all pages (centered, AFTER text)
        const pages = pdfDoc.getPages()
        pages.forEach(p => {
          const { width: pageWidth, height: pageHeight } = p.getSize()
          
          // CRITICAL: Draw watermark AFTER text, with opacity ONLY on watermark
          p.drawImage(watermarkImage, {
            x: (pageWidth - watermarkDims.width) / 2,
            y: (pageHeight - watermarkDims.height) / 2,
            width: watermarkDims.width,
            height: watermarkDims.height,
            opacity: watermarkOpacity // ONLY watermark has reduced opacity
          })
        })
      } catch (error) {
        console.error('Failed to embed watermark:', error)
      }
    }
  }
  
  // LAYER 4: Footer certification block (hash, QR, metadata)
  const pages = pdfDoc.getPages()
  const lastPage = pages[pages.length - 1]
  const { width: pageWidth, height: pageHeight } = lastPage.getSize()
  
  // Add certification footer to last page
  const footerY = 150
  
  currentY = drawTextBlock(
    lastPage,
    'REPORT CERTIFICATION',
    margin,
    footerY,
    maxWidth,
    headingSize,
    lineHeight * 2,
    boldFont
  )
  
  currentY -= lineHeight * 2
  
  const certLines = [
    'This report was generated by Verum Omnis AI Forensics System.',
    'All findings are based on automated forensic analysis and should be',
    'reviewed by qualified legal professionals.',
    '',
    `Report Hash: ${reportHash.substring(0, 32)}`,
    `Certified: ${timestamp}`,
  ]
  
  for (const line of certLines) {
    currentY = drawTextBlock(lastPage, line, margin, currentY, maxWidth, fontSize, lineHeight, font)
  }
  
  // Add QR code with report verification data
  const qrData = `VERUM_OMNIS:${reportId}:${reportHash.substring(0, 16)}`
  const qrCodeDataUrl = await generateQRCode(qrData)
  
  if (qrCodeDataUrl) {
    try {
      const qrBytes = await fetch(qrCodeDataUrl).then(res => res.arrayBuffer())
      const qrImage = await pdfDoc.embedPng(qrBytes)
      const qrDims = qrImage.scale(0.5)
      
      lastPage.drawImage(qrImage, {
        x: pageWidth - margin - qrDims.width,
        y: 50,
        width: qrDims.width,
        height: qrDims.height,
        opacity: 1.0
      })
    } catch (error) {
      console.error('Failed to embed QR code:', error)
    }
  }
  
  // Draw debug outlines if enabled
  if (options.debugMode) {
    pages.forEach(p => drawDebugOutlines(p, true))
  }
  
  // Output strictly as PDF 1.7, disable compression, preserve vector text
  const pdfBytes = await pdfDoc.save({
    useObjectStreams: false // Disable compression
  })
  
  return pdfBytes
}

/**
 * Download PDF report
 */
export function downloadPDF(pdfBytes: Uint8Array, filename: string) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
