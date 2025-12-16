/**
 * Attachment Menu Component (ChatGPT-style)
 * Provides a popover menu for file attachments and suggested prompts
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Plus, Paperclip, Lightbulb } from '@phosphor-icons/react'

interface AttachmentMenuProps {
  onFileSelect: () => void
  onPromptSelect: (prompt: string) => void
  disabled?: boolean
  suggestedPrompts?: string[]
}

export function AttachmentMenu({ 
  onFileSelect, 
  onPromptSelect,
  disabled,
  suggestedPrompts = []
}: AttachmentMenuProps) {
  const [open, setOpen] = useState(false)

  const handleFileClick = () => {
    onFileSelect()
    setOpen(false)
  }

  const handlePromptClick = (prompt: string) => {
    onPromptSelect(prompt)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          disabled={disabled}
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground flex-shrink-0"
        >
          <Plus size={20} weight="regular" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-2" 
        align="start"
        side="top"
      >
        <div className="space-y-1">
          {/* File Upload Option */}
          <button
            onClick={handleFileClick}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors text-left"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Paperclip size={20} weight="regular" className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Upload Evidence</p>
              <p className="text-xs text-muted-foreground">Documents, images, or files</p>
            </div>
          </button>

          {/* Suggested Prompts */}
          {suggestedPrompts.length > 0 && (
            <>
              <div className="px-4 py-2 flex items-center gap-2">
                <Lightbulb size={16} weight="duotone" className="text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Suggested Actions
                </span>
              </div>
              
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handlePromptClick(prompt)}
                  className="w-full flex items-start gap-2 px-4 py-2.5 rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <span className="text-sm text-foreground leading-relaxed">
                    {prompt}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
