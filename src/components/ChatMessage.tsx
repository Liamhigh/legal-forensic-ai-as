/**
 * Chat Message Component
 * Displays user and assistant messages with support for evidence sealing feedback
 */

import { CheckCircle, Lock, FileText } from '@phosphor-icons/react'
import { DocumentScannerIndicator } from '@/components/DocumentScannerIndicator'
import { SealedArtifacts } from '@/components/SealedArtifacts'

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
}

interface ChatMessageProps {
  message: ChatMessage
}

export function ChatMessageComponent({ message }: ChatMessageProps) {
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
      <SealedArtifacts
        fileName={message.sealedArtifacts.fileName}
        evidenceHash={message.sealedArtifacts.evidenceHash}
        certificateId={message.sealedArtifacts.certificateId}
        certificateHash={message.sealedArtifacts.certificateHash}
        bundleHash={message.sealedArtifacts.bundleHash}
        onDownloadDocument={message.sealedArtifacts.documentContent ? downloadDocument : undefined}
        onDownloadCertificate={message.sealedArtifacts.certificateContent ? downloadCertificate : undefined}
      />
    )
  }

  if (message.role === 'system') {
    // System messages for evidence sealing feedback
    return (
      <div className="flex justify-center my-4">
        <div className="bg-muted border border-border rounded-lg px-4 py-3 max-w-md">
          <div className="flex items-start gap-3">
            {message.evidenceSealed?.certificateGenerated ? (
              <CheckCircle size={20} weight="fill" className="text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Lock size={20} weight="fill" className="text-primary flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-sm">
              <p className="text-foreground font-medium mb-1">{message.content}</p>
              {message.evidenceSealed && (
                <div className="text-xs text-muted-foreground space-y-0.5 mt-2">
                  <p className="flex items-center gap-1.5">
                    <FileText size={12} weight="regular" />
                    {message.evidenceSealed.fileName}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Lock size={12} weight="regular" />
                    Hash: {message.evidenceSealed.hash.substring(0, 16)}...
                  </p>
                  {message.evidenceSealed.certificateGenerated && (
                    <p className="flex items-center gap-1.5 text-green-600">
                      <CheckCircle size={12} weight="fill" />
                      Forensic certificate generated
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
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
          message.role === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-card border border-border text-card-foreground'
        }`}
      >
        {message.sealed && (
          <div className="flex items-center gap-1.5 mb-2 text-xs opacity-80">
            <Lock size={12} weight="fill" />
            <span>Sealed document</span>
          </div>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
        <p
          className={`text-xs mt-2 ${
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
