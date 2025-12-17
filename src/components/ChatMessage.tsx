/**
 * Chat Message Component
 * Displays user and assistant messages with support for evidence sealing feedback
 * 
 * Conceptual Rule:
 * Chat speaks. Scanner acts. They are never visually identical.
 */

import { CheckCircle, Lock, FileText } from '@phosphor-icons/react'
import { DocumentScannerIndicator } from '@/components/DocumentScannerIndicator'
import { SealedArtifacts } from '@/components/SealedArtifacts'
import { ReportDisplay } from '@/components/ReportDisplay'
import { ScannerTaskInitiated } from '@/components/ScannerTaskInitiated'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  evidenceSealed?: {
    fileName: string
    hash: string
    certificateGenerated: boolean
  }
  sealed?: boolean
  sealedArtifacts?: {
    fileName: string
    evidenceHash: string
    certificateId: string
    certificateHash: string
    bundleHash: string
    documentContent?: string | ArrayBuffer
    certificateContent?: string
  }
  scanningState?: {
    fileName: string
    phase: 'received' | 'verifying' | 'analyzing' | 'generating-cert' | 'sealing'
  }
  onAskQuestion?: (question: string) => void
  /** Indicates this message triggered a scanner action (not conversational chat) */
  isScannerCommand?: boolean
  /** File name associated with scanner command */
  scannerFileName?: string
}

interface ChatMessageProps {
  message: ChatMessage
}

export function ChatMessageComponent({ message }: ChatMessageProps) {
  // Scanner command - show distinct non-chat visual
  // "Chat speaks. Scanner acts. They are never visually identical."
  if (message.role === 'user' && message.isScannerCommand) {
    return (
      <ScannerTaskInitiated
        timestamp={message.timestamp}
        fileName={message.scannerFileName}
      />
    )
  }

  // Scanner state indicator
  if (message.role === 'system' && message.scanningState) {
    return (
      <DocumentScannerIndicator
        fileName={message.scanningState.fileName}
        phase={message.scanningState.phase}
      />
    )
  }

  // Sealed artifacts display
  if (message.role === 'system' && message.sealedArtifacts) {
    const downloadDocument = () => {
      if (!message.sealedArtifacts?.documentContent) return
      const blob = new Blob([message.sealedArtifacts.documentContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sealed_${message.sealedArtifacts.fileName}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    const downloadCertificate = () => {
      if (!message.sealedArtifacts?.certificateContent) return
      const blob = new Blob([message.sealedArtifacts.certificateContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificate_${message.sealedArtifacts.certificateId}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    return (
      <div className="space-y-3">
        <SealedArtifacts
          fileName={message.sealedArtifacts.fileName}
          evidenceHash={message.sealedArtifacts.evidenceHash}
          certificateId={message.sealedArtifacts.certificateId}
          certificateHash={message.sealedArtifacts.certificateHash}
          bundleHash={message.sealedArtifacts.bundleHash}
          onDownloadDocument={message.sealedArtifacts.documentContent ? downloadDocument : undefined}
          onDownloadCertificate={message.sealedArtifacts.certificateContent ? downloadCertificate : undefined}
        />
        
        {/* Display the certificate report for user to ask questions */}
        {message.sealedArtifacts.certificateContent && (
          <ReportDisplay
            certificateContent={message.sealedArtifacts.certificateContent}
            fileName={message.sealedArtifacts.fileName}
            evidenceHash={message.sealedArtifacts.evidenceHash}
            onAskQuestion={message.onAskQuestion}
          />
        )}
      </div>
    )
  }

  if (message.role === 'system') {
    // System messages for evidence sealing feedback
    return (
      <div className="flex justify-center my-3">
        <div className="bg-transparent border-none rounded-lg px-4 py-2 max-w-md">
          <div className="flex items-start gap-2">
            {message.evidenceSealed?.certificateGenerated ? (
              <CheckCircle size={16} weight="fill" className="text-forensic-sealed flex-shrink-0 mt-0.5" />
            ) : (
              <Lock size={16} weight="fill" className="text-primary flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-sm" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
              <p className="text-muted-foreground font-medium">{message.content}</p>
              {message.evidenceSealed && (
                <div className="text-xs text-muted-foreground/70 space-y-0.5 mt-2">
                  <p className="flex items-center gap-1.5">
                    <FileText size={12} weight="regular" />
                    {message.evidenceSealed.fileName}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Lock size={12} weight="regular" />
                    Hash: {message.evidenceSealed.hash.substring(0, 16)}...
                  </p>
                  {message.evidenceSealed.certificateGenerated && (
                    <p className="flex items-center gap-1.5 text-forensic-sealed">
                      <CheckCircle size={12} weight="fill" />
                      Forensic certificate generated — Sealed
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
      <div
        className={`max-w-full rounded-2xl px-4 sm:px-5 py-3 sm:py-4 ${
          message.role === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-transparent text-card-foreground'
        }`}
        style={{ maxWidth: 'var(--max-width-chat, 680px)', width: '100%' }}
      >
        {message.sealed && (
          <div className="flex items-center gap-2 mb-3 text-sm opacity-80">
            <Lock size={14} weight="fill" />
            <span>Sealed document</span>
          </div>
        )}
        <p className="whitespace-pre-wrap" style={{ 
          fontSize: 'var(--font-size-chat, 18px)', 
          lineHeight: 'var(--line-height-base, 1.75)',
          wordBreak: 'break-word',
          overflowWrap: 'break-word'
        }}>
          {message.content}
        </p>
        <p
          className={`text-xs mt-3 ${
            message.role === 'user'
              ? 'text-primary-foreground/70'
              : 'text-muted-foreground'
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}
