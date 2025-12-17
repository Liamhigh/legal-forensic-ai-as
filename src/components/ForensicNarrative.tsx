/**
 * Forensic Narrative Component
 * Displays text-based forensic output in a chat-style format
 * 
 * This is the primary UI for forensic findings - NOT downloadable artefacts.
 * The authoritative artefact is the sealed backend report.
 */

import { useState } from 'react'
import { Shield, CheckCircle, Warning, CaretDown, CaretUp, Printer } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { type ForensicNarrative as ForensicNarrativeType, type IntegrityStatus } from '@/services/forensicPipeline'

interface ForensicNarrativeProps {
  narrative: ForensicNarrativeType
  onPrintToPDF?: () => void
  isPrinting?: boolean
}

export function ForensicNarrativeDisplay({ 
  narrative, 
  onPrintToPDF,
  isPrinting = false
}: ForensicNarrativeProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary', 'integrity']))

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  const isSectionExpanded = (section: string) => expandedSections.has(section)

  return (
    <Card className="bg-card border border-border p-4 space-y-4 w-full">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-border">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Shield size={24} weight="duotone" className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground">
              Forensic Analysis
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Case: {narrative.caseId}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(narrative.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
        
        {/* Single Print to PDF action */}
        {onPrintToPDF && (
          <Button
            variant="outline"
            size="sm"
            onClick={onPrintToPDF}
            disabled={isPrinting}
            className="gap-2"
          >
            <Printer size={16} weight="regular" />
            {isPrinting ? 'Printing...' : 'Print to PDF'}
          </Button>
        )}
      </div>

      {/* Integrity Status */}
      <IntegrityStatusDisplay 
        status={narrative.integrityStatus}
        isExpanded={isSectionExpanded('integrity')}
        onToggle={() => toggleSection('integrity')}
      />

      {/* Summary Section */}
      <NarrativeSection
        title="Summary of Findings"
        isExpanded={isSectionExpanded('summary')}
        onToggle={() => toggleSection('summary')}
      >
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {narrative.summary}
        </p>
      </NarrativeSection>

      {/* Key Findings */}
      {narrative.keyFindings.length > 0 && (
        <NarrativeSection
          title="Key Findings"
          isExpanded={isSectionExpanded('findings')}
          onToggle={() => toggleSection('findings')}
          count={narrative.keyFindings.length}
        >
          <ul className="space-y-2">
            {narrative.keyFindings.map((finding, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary font-medium">•</span>
                <span>{finding}</span>
              </li>
            ))}
          </ul>
        </NarrativeSection>
      )}

      {/* Contradictions */}
      {narrative.contradictions.length > 0 && (
        <NarrativeSection
          title="Noted Contradictions"
          isExpanded={isSectionExpanded('contradictions')}
          onToggle={() => toggleSection('contradictions')}
          count={narrative.contradictions.length}
          variant="warning"
        >
          <ul className="space-y-2">
            {narrative.contradictions.map((contradiction, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Warning size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <span>{contradiction}</span>
              </li>
            ))}
          </ul>
        </NarrativeSection>
      )}

      {/* Noted Conditions */}
      {narrative.notedConditions.length > 0 && (
        <NarrativeSection
          title="Forensic Validity"
          isExpanded={isSectionExpanded('conditions')}
          onToggle={() => toggleSection('conditions')}
        >
          <ul className="space-y-1.5">
            {narrative.notedConditions.map((condition, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle size={14} className="text-forensic-sealed flex-shrink-0 mt-0.5" />
                <span>{condition}</span>
              </li>
            ))}
          </ul>
        </NarrativeSection>
      )}

      {/* Evidentiary Posture */}
      <NarrativeSection
        title="Evidentiary Posture"
        isExpanded={isSectionExpanded('posture')}
        onToggle={() => toggleSection('posture')}
      >
        <div className="flex items-start gap-3 bg-muted/30 rounded-lg p-3">
          <Shield size={20} weight="fill" className="text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-foreground font-medium">
              {narrative.evidentiaryPosture}
            </p>
            {narrative.riskScore > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Risk Assessment: {(narrative.riskScore * 100).toFixed(1)}%
              </p>
            )}
          </div>
        </div>
      </NarrativeSection>

      {/* Recommendations */}
      {narrative.recommendations.length > 0 && (
        <NarrativeSection
          title="Recommendations"
          isExpanded={isSectionExpanded('recommendations')}
          onToggle={() => toggleSection('recommendations')}
        >
          <ul className="space-y-2">
            {narrative.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="text-primary font-medium">{index + 1}.</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </NarrativeSection>
      )}

      {/* Footer note */}
      <div className="pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground/70 text-center">
          This narrative is a summary of the sealed forensic report. 
          The authoritative artefact is stored in the backend.
        </p>
      </div>
    </Card>
  )
}

interface IntegrityStatusDisplayProps {
  status: IntegrityStatus
  isExpanded: boolean
  onToggle: () => void
}

function IntegrityStatusDisplay({ status, isExpanded, onToggle }: IntegrityStatusDisplayProps) {
  const allVerified = status.verified && 
    status.documentSealed && 
    status.reportSealed && 
    status.artefactsBound && 
    status.hashChainValid

  return (
    <div className={`rounded-lg p-3 ${
      allVerified 
        ? 'bg-forensic-sealed-bg border border-forensic-sealed-border' 
        : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
    }`}>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-2">
          {allVerified ? (
            <CheckCircle size={18} weight="fill" className="text-forensic-sealed" />
          ) : (
            <Warning size={18} weight="fill" className="text-amber-500" />
          )}
          <span className={`text-sm font-semibold ${
            allVerified ? 'text-forensic-sealed-text' : 'text-amber-700 dark:text-amber-300'
          }`}>
            {allVerified ? 'Integrity Verified' : 'Integrity Warning'}
          </span>
        </div>
        {isExpanded ? (
          <CaretUp size={16} className="text-muted-foreground" />
        ) : (
          <CaretDown size={16} className="text-muted-foreground" />
        )}
      </button>
      
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-current/10 space-y-1.5">
          <StatusItem 
            label="Document sealed" 
            verified={status.documentSealed} 
          />
          <StatusItem 
            label="Report sealed" 
            verified={status.reportSealed} 
          />
          <StatusItem 
            label="Artefacts cryptographically bound" 
            verified={status.artefactsBound} 
          />
          <StatusItem 
            label="Hash chain valid" 
            verified={status.hashChainValid} 
          />
          <StatusItem 
            label="Timestamp verified" 
            verified={status.timestampVerified} 
          />
          <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-current/10">
            {status.message}
          </p>
        </div>
      )}
    </div>
  )
}

function StatusItem({ label, verified }: { label: string; verified: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {verified ? (
        <CheckCircle size={14} weight="fill" className="text-forensic-sealed" />
      ) : (
        <Warning size={14} weight="fill" className="text-amber-500" />
      )}
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

interface NarrativeSectionProps {
  title: string
  children: React.ReactNode
  isExpanded: boolean
  onToggle: () => void
  count?: number
  variant?: 'default' | 'warning'
}

function NarrativeSection({ 
  title, 
  children, 
  isExpanded, 
  onToggle,
  count,
  variant = 'default'
}: NarrativeSectionProps) {
  return (
    <div className="space-y-2">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full py-1"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {title}
          </span>
          {count !== undefined && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              variant === 'warning' 
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                : 'bg-muted text-muted-foreground'
            }`}>
              {count}
            </span>
          )}
        </div>
        {isExpanded ? (
          <CaretUp size={16} className="text-muted-foreground" />
        ) : (
          <CaretDown size={16} className="text-muted-foreground" />
        )}
      </button>
      
      {isExpanded && (
        <ScrollArea className="max-h-48">
          <div className="pr-2">
            {children}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}

export default ForensicNarrativeDisplay
