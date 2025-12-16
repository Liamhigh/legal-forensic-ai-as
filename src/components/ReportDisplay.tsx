/**
 * Report Display Component
 * Shows forensic certificate and analysis reports on screen
 * Allows users to ask follow-up questions about the report
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, CaretDown, CaretUp, Download } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'

export interface ReportDisplayProps {
  certificateContent: string
  fileName: string
  evidenceHash: string
  onAskQuestion?: (question: string) => void
}

export function ReportDisplay({ 
  certificateContent, 
  fileName, 
  evidenceHash,
  onAskQuestion 
}: ReportDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  
  // Extract key sections from the certificate
  const sections = extractSections(certificateContent)
  
  const handleDownload = () => {
    const blob = new Blob([certificateContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `certificate_${fileName}_${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  const suggestedQuestions = [
    `What are the key findings in this analysis of ${fileName}?`,
    'Are there any contradictions detected in this document?',
    'What is the overall risk assessment?',
    'What legal issues should I be aware of?'
  ]
  
  return (
    <Card className="bg-card border border-border p-3 sm:p-4 space-y-3 w-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="bg-forensic-sealed/10 p-2 rounded-lg">
            <FileText size={20} weight="duotone" className="text-forensic-sealed" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-foreground">
              Forensic Certificate Report
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {fileName}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1 font-mono">
              Hash: {evidenceHash.substring(0, 16)}...
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            className="h-8 w-8 p-0"
          >
            <Download size={16} weight="regular" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <CaretUp size={16} weight="regular" />
            ) : (
              <CaretDown size={16} weight="regular" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Summary (always visible) */}
      {sections.summary && (
        <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
          <p className="font-medium text-foreground mb-1">Summary</p>
          <p className="text-xs leading-relaxed whitespace-pre-wrap">
            {sections.summary}
          </p>
        </div>
      )}
      
      {/* Expanded content */}
      {isExpanded && (
        <ScrollArea className="max-h-96 w-full rounded-lg border border-border">
          <div className="p-4 text-xs font-mono whitespace-pre-wrap leading-relaxed">
            {certificateContent}
          </div>
        </ScrollArea>
      )}
      
      {/* Suggested questions */}
      {onAskQuestion && (
        <div className="space-y-2 w-full">
          <p className="text-xs text-muted-foreground font-medium">
            Ask about this report:
          </p>
          <div className="flex flex-wrap gap-2 w-full">
            {suggestedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => onAskQuestion(question)}
                className="text-xs h-auto py-1.5 px-2.5 whitespace-normal text-left min-h-7"
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}

/**
 * Extract key sections from certificate content
 */
function extractSections(content: string): {
  summary?: string
  contradictions?: string
  timeline?: string
  recommendations?: string
} {
  const sections: {
    summary?: string
    contradictions?: string
    timeline?: string
    recommendations?: string
  } = {}
  
  // Try to extract the synthesis narrative as summary
  const synthesisMatch = content.match(/SYNTHESIS NARRATIVE:?\s*\n([\s\S]*?)(?:\n\n|═══)/i)
  if (synthesisMatch) {
    sections.summary = synthesisMatch[1].trim().substring(0, 500) + '...'
  } else {
    // Fallback: extract first substantial paragraph
    const lines = content.split('\n')
    const substantialLines = lines.filter(line => 
      line.trim().length > 50 && 
      !line.includes('═══') && 
      !line.includes('───')
    )
    if (substantialLines.length > 0) {
      sections.summary = substantialLines[0].trim().substring(0, 500) + '...'
    }
  }
  
  // Extract contradictions section
  const contradictionsMatch = content.match(/CONTRADICTION ANALYSIS:?\s*\n([\s\S]*?)(?:\n\n|═══)/i)
  if (contradictionsMatch) {
    sections.contradictions = contradictionsMatch[1].trim()
  }
  
  // Extract timeline section
  const timelineMatch = content.match(/TIMELINE ANALYSIS:?\s*\n([\s\S]*?)(?:\n\n|═══)/i)
  if (timelineMatch) {
    sections.timeline = timelineMatch[1].trim()
  }
  
  // Extract recommendations
  const recommendationsMatch = content.match(/Recommendations:?\s*\n([\s\S]*?)(?:\n\n|═══)/i)
  if (recommendationsMatch) {
    sections.recommendations = recommendationsMatch[1].trim()
  }
  
  return sections
}
