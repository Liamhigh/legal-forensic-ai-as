import { useState, useEffect, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Scales, PaperPlaneRight, Trash } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { PDFViewer } from '@/components/PDFViewer'
import { DocumentUpload } from '@/components/DocumentUpload'
import { ReportGenerator } from '@/components/ReportGenerator'
import { SessionStatus } from '@/components/SessionStatus'
import { getForensicLanguageRules } from '@/services/constitutionalEnforcement'
import { isSessionLocked } from '@/services/authContext'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const SUGGESTED_PROMPTS = [
  "Analyze the admissibility of digital evidence in this case",
  "Review chain of custody documentation for forensic evidence",
  "Identify potential Brady violations in the prosecution's disclosure",
  "Examine witness testimony for inconsistencies",
]

function App() {
  const [messages, setMessages] = useKV<Message[]>('chat-messages', [])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const messageList = messages || []

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (content?: string) => {
    const messageContent = content || input.trim()
    if (!messageContent || isLoading) return

    // Check if session is locked
    if (isSessionLocked()) {
      toast.error('Session locked due to constitutional violation', {
        description: 'Please refresh to start a new session'
      })
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: Date.now(),
    }

    setMessages((current) => [...(current || []), userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Get forensic language enforcement rules
      const forensicRules = getForensicLanguageRules()
      
      const prompt = (window as any).spark.llmPrompt`You are Verum Omnis, the world's first AI-powered legal forensics assistant. You help legal professionals analyze evidence, research case law, and construct compelling arguments.

${forensicRules}

User query: ${messageContent}

Provide a thorough forensic analysis with specific legal considerations, adhering strictly to the constitutional enforcement constraints above.`

      const response = await (window as any).spark.llm(prompt, 'gpt-4o')

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      }

      setMessages((current) => [...(current || []), assistantMessage])
    } catch (error) {
      toast.error('Failed to get response. Please try again.')
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleClear = () => {
    setMessages([])
    toast.success('Conversation cleared')
  }

  const handlePromptClick = (prompt: string) => {
    handleSend(prompt)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/assets/company-logo-1.jpg" 
              alt="Company Logo 1" 
              className="h-10 w-10 rounded object-cover"
            />
            <Scales size={32} weight="duotone" className="text-primary" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                VERUM OMNIS
              </h1>
              <p className="text-sm text-muted-foreground tracking-wide">
                AI Forensics for Truth
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <img 
              src="/assets/company-logo-2.jpg" 
              alt="Company Logo 2" 
              className="h-10 w-10 rounded object-cover"
            />
            <SessionStatus />
            {messageList.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-muted-foreground hover:text-foreground"
              >
                <Trash size={18} weight="regular" />
                <span className="ml-2">Clear</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div ref={scrollRef} className="max-w-4xl mx-auto px-6 py-6">
            {messageList.length === 0 && (
              <div className="space-y-6 mb-6">
                <PDFViewer />
                <DocumentUpload />
                <ReportGenerator 
                  analysisContent="Sample forensic analysis. Upload a document or start a conversation to generate a real report."
                />
              </div>
            )}
            {messageList.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center min-h-[60vh] text-center"
              >
                <Scales size={64} weight="duotone" className="text-primary mb-6" />
                <h2 className="text-3xl font-bold text-foreground mb-3">
                  Welcome to Verum Omnis
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
                  Your AI-powered legal forensics assistant. Ask questions about evidence analysis, 
                  case law research, or forensic procedures.
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-3xl">
                  {SUGGESTED_PROMPTS.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => handlePromptClick(prompt)}
                      disabled={isLoading}
                      className="text-sm hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {messageList.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`flex ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border border-border text-card-foreground'
                        }`}
                      >
                        <p className="text-base leading-relaxed whitespace-pre-wrap">
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
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-card border border-border rounded-lg px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-75" />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-150" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Show report generator after conversation */}
                {!isLoading && messageList.length > 0 && (
                  <div className="mt-6">
                    <ReportGenerator 
                      analysisContent={messageList
                        .filter(m => m.role === 'assistant')
                        .map(m => m.content)
                        .join('\n\n---\n\n')}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="border-t border-border bg-card px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about evidence analysis, case law, forensic procedures..."
              disabled={isLoading}
              className="flex-1 bg-background border-input focus-visible:ring-accent"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="bg-accent text-accent-foreground hover:bg-accent/90 transition-all active:scale-95"
            >
              <PaperPlaneRight size={20} weight="fill" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App