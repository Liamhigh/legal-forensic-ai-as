/**
 * Chat Message Component
 * Displays user and assistant messages with support for evidence sealing feedback
 */

import { CheckCircle, Lock, FileText } from '@phosphor-icons/react'

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
}

interface ChatMessageProps {
  message: ChatMessage
}

export function ChatMessageComponent({ message }: ChatMessageProps) {
  if (message.role === 'system') {
    // System messages for evidence sealing feedback
    return (
      <div className="flex justify-center my-3">
        <div className="bg-transparent border-none rounded-lg px-4 py-2 max-w-md">
          <div className="flex items-start gap-2">
            {message.evidenceSealed?.certificateGenerated ? (
              <CheckCircle size={16} weight="fill" className="text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <Lock size={16} weight="fill" className="text-primary flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-sm">
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
    <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
      <div
        className={`max-w-full rounded-2xl px-5 py-4 ${
          message.role === 'user'
            ? 'bg-primary text-primary-foreground'
            : 'bg-transparent text-card-foreground'
        }`}
        style={{ maxWidth: 'var(--max-width-chat, 680px)' }}
      >
        {message.sealed && (
          <div className="flex items-center gap-2 mb-3 text-sm opacity-80">
            <Lock size={14} weight="fill" />
            <span>Sealed document</span>
          </div>
        )}
        <p className="whitespace-pre-wrap" style={{ 
          fontSize: 'var(--font-size-chat, 18px)', 
          lineHeight: 'var(--line-height-base, 1.6)' 
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
