/**
 * Forensic Narrative Component
 * Displays forensic analysis as an on-screen narrative (not downloads)
 * 
 * Design Philosophy:
 * - Show written forensic report on screen
 * - Human-readable, scrollable format
 * - Derived from offline contradiction engine
 * - NO downloads, NO certificate clutter
 * - Files exist but silently in the background
 */

import { Shield, FileText, Clock, MapPin } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

export interface ForensicNarrativeData {
  caseId: string
  fileName: string
  evidenceHash: string
  timestamp: number
  jurisdiction?: string
  
  // Forensic Analysis (shown to user)
  integritySummary: string
  contradictions?: string[]
  riskAssessment?: string
  findings: string
  
  // AI Analysis (optional)
  aiAnalysisIncluded: boolean
  aiAnalysis?: string
  
  // Technical details (hidden by default)
  certificateId: string
  certificateHash: string
  bundleHash: string
}

interface ForensicNarrativeProps {
  data: ForensicNarrativeData
  onExportCase?: () => void
}

export function ForensicNarrative({ data }: ForensicNarrativeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-4xl mx-auto my-6"
    >
      <Card className="border-2 border-green-200 dark:border-green-800 shadow-lg">
        <CardHeader className="border-b border-border bg-green-50 dark:bg-green-950/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <Shield size={20} weight="fill" className="text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">
                  Evidence Sealed Successfully
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Case {data.caseId} — Forensic analysis complete
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
              {data.aiAnalysisIncluded ? 'AI Enhanced' : 'Baseline Analysis'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Document Metadata */}
          <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText size={16} weight="regular" />
              <span>{data.fileName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock size={16} weight="regular" />
              <span>{new Date(data.timestamp).toLocaleString()}</span>
            </div>
            {data.jurisdiction && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin size={16} weight="regular" />
                <span>{data.jurisdiction}</span>
              </div>
            )}
          </div>

          {/* Forensic Narrative - Main Content */}
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-6">
              {/* Integrity Summary */}
              <section>
                <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Shield size={18} weight="duotone" className="text-primary" />
                  Integrity Summary
                </h3>
                <div className="pl-7 space-y-2">
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {data.integritySummary}
                  </p>
                </div>
              </section>

              {/* Contradictions (if any) */}
              {data.contradictions && data.contradictions.length > 0 && (
                <section>
                  <h3 className="text-base font-semibold text-foreground mb-3">
                    Contradictions Detected
                  </h3>
                  <div className="pl-7 space-y-3">
                    {data.contradictions.map((contradiction, index) => (
                      <div 
                        key={index} 
                        className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3"
                      >
                        <p className="text-sm leading-relaxed text-foreground">
                          {contradiction}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Forensic Findings */}
              <section>
                <h3 className="text-base font-semibold text-foreground mb-3">
                  Forensic Analysis
                </h3>
                <div className="pl-7 space-y-2">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                      {data.findings}
                    </p>
                  </div>
                </div>
              </section>

              {/* AI Analysis (if available) */}
              {data.aiAnalysisIncluded && data.aiAnalysis && (
                <section>
                  <h3 className="text-base font-semibold text-foreground mb-3">
                    AI-Powered Insights
                  </h3>
                  <div className="pl-7 space-y-2">
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                        {data.aiAnalysis}
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* Risk Assessment (if available) */}
              {data.riskAssessment && (
                <section>
                  <h3 className="text-base font-semibold text-foreground mb-3">
                    Risk Assessment
                  </h3>
                  <div className="pl-7 space-y-2">
                    <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                      <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                        {data.riskAssessment}
                      </p>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </ScrollArea>

          {/* Footer - Silent Reference */}
          <div className="mt-6 pt-6 border-t border-border">
            <details className="group">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors flex items-center gap-2">
                <span>Evidence stored securely on this device</span>
                <span className="text-[10px] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-1 text-[10px] text-muted-foreground font-mono">
                <p>Document Hash: {data.evidenceHash.substring(0, 32)}...</p>
                <p>Certificate: {data.certificateId}</p>
                <p>Bundle Hash: {data.bundleHash.substring(0, 32)}...</p>
                <p className="text-xs text-muted-foreground mt-2 font-sans">
                  Files available via "Export Case" for court submission
                </p>
              </div>
            </details>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
