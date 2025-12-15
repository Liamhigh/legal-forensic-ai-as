import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { FileText, Download, Lock, Image } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { 
  generatePDFReport,
  downloadPDF,
  type PDFReportData
} from '@/services/pdfGenerator'

interface ReportGeneratorProps {
  documentData?: {
    fileName: string
    hash: string
    timestamp: number
    jurisdiction?: string
  }
  analysisContent: string
}

export function ReportGenerator({ documentData, analysisContent }: ReportGeneratorProps) {
  const [password, setPassword] = useState('')
  const [includeWatermark, setIncludeWatermark] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateReport = async () => {
    if (!analysisContent || analysisContent.trim().length === 0) {
      toast.error('No content to generate report from')
      return
    }

    setIsGenerating(true)
    
    try {
      // Sanitize filename to prevent injection attacks
      const sanitizedFileName = documentData?.fileName.replace(/[<>:"/\\|?*]/g, '_') || 'Unknown'
      
      const reportData: PDFReportData = {
        title: documentData?.fileName 
          ? `Forensic Analysis: ${sanitizedFileName}`
          : 'Forensic Analysis Report',
        content: analysisContent,
        documentInfo: documentData,
        sealInfo: documentData ? {
          sealedBy: 'Verum Omnis Forensics',
          timestamp: documentData.timestamp,
          location: documentData.jurisdiction
        } : undefined
      }

      // Generate PDF with proper layer ordering
      const pdfBytes = await generatePDFReport(reportData, {
        includeWatermark,
        watermarkOpacity: 0.07, // 0.06-0.08 as per spec
      })

      // Download the PDF
      downloadPDF(pdfBytes, `forensic_report_${Date.now()}.pdf`)

      toast.success('Forensic report generated successfully', {
        description: 'PDF report is ready for review'
      })

      // Reset form
      setPassword('')
    } catch (error) {
      // Log detailed error for debugging
      console.error('Report generation error:', error)
      
      // Show generic error to user to avoid leaking system information
      toast.error('Failed to generate report', {
        description: 'An error occurred while generating the report. Please try again.'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleViewWatermark = () => {
    window.open('/assets/watermark.png', '_blank')
  }

  return (
    <Card className="p-6 bg-card border border-border">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <FileText size={32} weight="duotone" className="text-primary" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              Create a verified report
            </h3>
            <p className="text-sm text-muted-foreground">
              Export analysis as PDF with watermark certification
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="watermark"
              checked={includeWatermark}
              onChange={(e) => setIncludeWatermark(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <Label htmlFor="watermark" className="text-sm font-medium cursor-pointer">
              Include watermark indicator
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewWatermark}
              className="ml-auto text-xs"
            >
              <Image size={16} weight="regular" className="mr-1" />
              View Watermark
            </Button>
          </div>



          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating || !analysisContent}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl shadow-sm"
          >
            <Download size={18} weight="fill" className="mr-2" />
            {isGenerating ? 'Generating...' : 'Create verified report'}
          </Button>
        </div>

        {documentData && (
          <div className="mt-4 p-3 bg-muted rounded-lg text-xs">
            <p className="font-semibold mb-1">Document Information</p>
            <p className="text-muted-foreground">File: {documentData.fileName}</p>
            <p className="text-muted-foreground">Hash: {documentData.hash.substring(0, 16)}...</p>
            {documentData.jurisdiction && (
              <p className="text-muted-foreground">Jurisdiction: {documentData.jurisdiction}</p>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
