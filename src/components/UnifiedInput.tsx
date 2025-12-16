/**
 * Unified Evidence Input Component
 * Single input bar supporting text, files, images, and documents
 */

import { useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PaperPlaneRight, X } from '@phosphor-icons/react'
import { AttachmentMenu } from '@/components/AttachmentMenu'

interface UnifiedInputProps {
  onSubmit: (message: string, files?: File[]) => void
  disabled?: boolean
  placeholder?: string
  suggestedPrompts?: string[]
}

export function UnifiedInput({ onSubmit, disabled, placeholder, suggestedPrompts = [] }: UnifiedInputProps) {
  const [message, setMessage] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setAttachedFiles(prev => [...prev, ...files])
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if ((!message.trim() && attachedFiles.length === 0) || disabled) return

    onSubmit(message.trim(), attachedFiles.length > 0 ? attachedFiles : undefined)
    
    // Reset
    setMessage('')
    setAttachedFiles([])
  }

  const isProcessingFiles = disabled && attachedFiles.length > 0

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handlePromptSelect = (prompt: string) => {
    onSubmit(prompt)
  }

  return (
    <div className="space-y-2">
      {/* File attachments preview */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {attachedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-muted text-muted-foreground px-3 py-1.5 rounded-lg text-sm"
            >
              <Paperclip size={14} weight="bold" />
              <span className="max-w-[200px] truncate">{file.name}</span>
              <button
                onClick={() => removeFile(index)}
                className="hover:text-foreground transition-colors"
              >
                <X size={14} weight="bold" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="flex gap-2 items-end">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept=".txt,.md,.doc,.docx,.pdf,image/*"
          multiple
        />
        
        <AttachmentMenu
          onFileSelect={() => fileInputRef.current?.click()}
          onPromptSelect={handlePromptSelect}
          disabled={disabled}
          suggestedPrompts={suggestedPrompts}
        />

        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={isProcessingFiles ? "Processing files..." : (placeholder || "Message Verum Omnis...")}
          disabled={disabled}
          className="flex-1 bg-background border-input focus-visible:ring-1 focus-visible:ring-ring rounded-2xl py-3 px-4"
          style={{ fontSize: '16px' }}
        />

        <Button
          onClick={handleSubmit}
          disabled={(!message.trim() && attachedFiles.length === 0) || disabled}
          size="icon"
          className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 rounded-full flex-shrink-0 h-10 w-10"
        >
          <PaperPlaneRight size={18} weight="fill" />
        </Button>
      </div>
    </div>
  )
}
