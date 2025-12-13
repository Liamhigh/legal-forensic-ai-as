import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { FileText, Download, Lock, Image } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { 
  generateForensicReport, 
  exportReportWithWatermark,
  getWatermarkUrl,
  type ReportData 
} from '@/services/pdfReportGenerator'

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
      const reportData: ReportData = {
        title: documentData?.fileName 
          ? `Forensic Analysis: ${documentData.fileName}`
          : 'Forensic Analysis Report',
        content: analysisContent,
        documentInfo: documentData,
        sealInfo: documentData ? {
          sealedBy: 'Verum Omnis Forensics',
          timestamp: documentData.timestamp,
          location: documentData.jurisdiction
        } : undefined
      }

      const report = await generateForensicReport(reportData, {
        password: password.trim() || undefined,
        includeWatermark,
        watermarkOpacity: 0.3
      })

      // Download the report
      const blob = new Blob([report], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `forensic_report_${Date.now()}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Forensic report generated successfully', {
        description: password ? 'Report is password protected' : 'Report is ready for review'
      })

      // Reset form
      setPassword('')
    } catch (error) {
      toast.error('Failed to generate report', {
        description: (error as Error).message
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleViewWatermark = () => {
    window.open(getWatermarkUrl(), '_blank')
  }

  return (
    <Card className="p-6 bg-card border border-border">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <FileText size={32} weight="duotone" className="text-primary" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              Generate Forensic Report
            </h3>
            <p className="text-sm text-muted-foreground">
              Export analysis with watermark and optional password protection
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

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
              <Lock size={16} weight="regular" />
              Password Protection (Optional)
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password to protect report..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background border-input"
            />
            <p className="text-xs text-muted-foreground">
              Leave blank for unprotected report. Protected reports require password to view full content.
            </p>
          </div>

          <Button
            onClick={handleGenerateReport}
            disabled={isGenerating || !analysisContent}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Download size={18} weight="fill" className="mr-2" />
            {isGenerating ? 'Generating...' : 'Generate & Download Report'}
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
