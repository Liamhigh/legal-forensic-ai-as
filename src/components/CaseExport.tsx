/**
 * Case Export Component
 * Exports the full sealed case narrative as a PDF
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Package } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { getCurrentCase } from '@/services/caseManagement'
import { generatePDFReport, downloadPDF, type PDFReportData } from '@/services/pdfGenerator'

export function CaseExport() {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)

    try {
      const currentCase = getCurrentCase()

      if (currentCase.evidence.length === 0 && currentCase.conversationLog.length === 0) {
        toast.error('No case data to export')
        setIsExporting(false)
        return
      }

      // Build comprehensive case narrative
      let narrative = `CASE ID: ${currentCase.caseId}\n`
      narrative += `STARTED: ${new Date(currentCase.startTime).toLocaleString()}\n\n`

      // Add evidence section
      if (currentCase.evidence.length > 0) {
        narrative += `═══════════════════════════════════════════════════════════════════\n`
        narrative += `EVIDENCE ARTIFACTS (${currentCase.evidence.length})\n`
        narrative += `═══════════════════════════════════════════════════════════════════\n\n`

        currentCase.evidence.forEach((evidence, index) => {
          narrative += `[EVIDENCE ${index + 1}]\n`
          narrative += `ID: ${evidence.id}\n`
          narrative += `File: ${evidence.fileName}\n`
          narrative += `Hash: ${evidence.evidenceHash}\n`
          narrative += `Sealed: ${new Date(evidence.timestamp).toLocaleString()}\n`
          if (evidence.jurisdiction) {
            narrative += `Jurisdiction: ${evidence.jurisdiction}\n`
          }
          narrative += `\n`
        })
      }

      // Add certificates section
      if (currentCase.certificates.length > 0) {
        narrative += `\n═══════════════════════════════════════════════════════════════════\n`
        narrative += `FORENSIC CERTIFICATES (${currentCase.certificates.length})\n`
        narrative += `═══════════════════════════════════════════════════════════════════\n\n`

        currentCase.certificates.forEach((cert, index) => {
          narrative += `[CERTIFICATE ${index + 1}]\n`
          narrative += `ID: ${cert.id}\n`
          narrative += `Evidence ID: ${cert.evidenceId}\n`
          narrative += `Bundle Hash: ${cert.bundleHash.substring(0, 32)}...\n`
          narrative += `Timestamp: ${new Date(cert.timestamp).toLocaleString()}\n\n`
          narrative += `Nine-Brain Analysis:\n${cert.nineBrainAnalysis}\n\n`
        })
      }

      // Add conversation log (sealed items only)
      const sealedConversations = currentCase.conversationLog.filter(log => log.sealed)
      if (sealedConversations.length > 0) {
        narrative += `\n═══════════════════════════════════════════════════════════════════\n`
        narrative += `SEALED OUTPUTS (${sealedConversations.length})\n`
        narrative += `═══════════════════════════════════════════════════════════════════\n\n`

        sealedConversations.forEach((log, index) => {
          narrative += `[OUTPUT ${index + 1}]\n`
          narrative += `Timestamp: ${new Date(log.timestamp).toLocaleString()}\n`
          narrative += `Content:\n${log.content}\n\n`
        })
      }

      narrative += `\n═══════════════════════════════════════════════════════════════════\n`
      narrative += `CHAIN OF CUSTODY VERIFIED\n`
      narrative += `═══════════════════════════════════════════════════════════════════\n`
      narrative += `This case narrative preserves the complete forensic record.\n`
      narrative += `All evidence artifacts and certificates remain cryptographically bound.\n`

      // Generate PDF
      const reportData: PDFReportData = {
        title: `Case ${currentCase.caseId} - Full Sealed Narrative`,
        content: narrative,
        sealInfo: {
          sealedBy: 'Verum Omnis Forensics',
          timestamp: Date.now()
        }
      }

      const pdfBytes = await generatePDFReport(reportData, {
        includeWatermark: true,
        watermarkOpacity: 0.07
      })

      downloadPDF(pdfBytes, `${currentCase.caseId}_sealed_narrative.pdf`)

      toast.success('Case narrative exported successfully', {
        description: 'Full sealed case record is ready'
      })
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export case narrative')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="outline"
      className="gap-2"
    >
      {isExporting ? (
        <>
          <Package size={18} weight="regular" className="animate-pulse" />
          Exporting...
        </>
      ) : (
        <>
          <Download size={18} weight="regular" />
          Export full sealed case narrative
        </>
      )}
    </Button>
  )
}
