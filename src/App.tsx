import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Scales, Trash } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { UnifiedInput } from '@/components/UnifiedInput'
import { ChatMessageComponent, type ChatMessage } from '@/components/ChatMessage'
import { CaseExport } from '@/components/CaseExport'
import { SessionStatus } from '@/components/SessionStatus'
import { getForensicLanguageRules } from '@/services/constitutionalEnforcement'
import { isSessionLocked } from '@/services/authContext'
import { detectIntent, IntentType, shouldSealContent } from '@/services/intentDetection'
import { sealDocument } from '@/services/documentSealing'
import { 
  generateNineBrainAnalysis, 
  generateForensicCertificate 
} from '@/services/forensicCertificate'
import {
  getCurrentCase,
  addEvidence,
  addCertificate,
  addConversationEntry,
  clearCase,
  generateBundleHash,
  type EvidenceArtifact,
  type ForensicCertificate
} from '@/services/caseManagement'

const SUGGESTED_PROMPTS = [
  "Analyze the admissibility of digital evidence in this case",
  "Review chain of custody documentation for forensic evidence",
  "Identify potential Brady violations in the prosecution's disclosure",
  "Examine witness testimony for inconsistencies",
]

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentCase, setCurrentCase] = useState(() => getCurrentCase())
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Initialize case on mount
  useEffect(() => {
    const caseData = getCurrentCase()
    setCurrentCase(caseData)
    
    // Show welcome message
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'system',
        content: '✅ Case session started. Evidence will be automatically sealed and added to your case.',
        timestamp: Date.now()
      }
      setMessages([welcomeMessage])
    }
  }, [])

  const handleSubmit = async (message: string, files?: File[]) => {
    if ((!message && !files) || isLoading) return

    // Check if session is locked
    if (isSessionLocked()) {
      toast.error('Session locked due to constitutional violation', {
        description: 'Please refresh to start a new session'
      })
      return
    }

    // Detect intent
    const intent = detectIntent(message, !!files && files.length > 0)
    const shouldSeal = shouldSealContent(intent)

    // Handle file uploads (evidence)
    if (files && files.length > 0) {
      for (const file of files) {
        await handleEvidenceUpload(file, message)
      }
      
      // If there's no message, just return after processing files
      if (!message) return
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: Date.now(),
      sealed: shouldSeal
    }

    setMessages((current) => [...current, userMessage])
    
    // Add to conversation log
    addConversationEntry('user', message, shouldSeal)
    
    setIsLoading(true)

    try {
      // Check if Spark API is available
      if (!window.spark?.llm) {
        throw new Error('Spark API not available. Please ensure the application is running in a GitHub Spark environment.')
      }

      // Get forensic language enforcement rules
      const forensicRules = getForensicLanguageRules()
      
      // Adjust system prompt based on intent
      let systemPrompt = ''
      if (intent === IntentType.FORENSIC_OUTPUT) {
        systemPrompt = `You are Verum Omnis, a forensic legal assistant. The user is requesting you to draft or generate a legal document.

${forensicRules}

CRITICAL: Your response should contain ONLY the requested document content. Do NOT add:
- Follow-up questions
- Suggestions
- Commentary
- "Would you like me to..."
- Any additional text outside the document itself

Generate a clean, professional document that can be immediately sealed and used.

User request: ${message}`
      } else {
        systemPrompt = `You are Verum Omnis, the world's first AI-powered legal forensics assistant. You help legal professionals analyze evidence, research case law, and construct compelling arguments.

${forensicRules}

This is a conversational discussion. Provide helpful analysis and guidance.

User query: ${message}

Provide a thorough forensic analysis with specific legal considerations.`
      }

      const prompt = (window as any).spark.llmPrompt`${systemPrompt}`
      const response = await (window as any).spark.llm(prompt, 'gpt-4o')

      // For forensic output, seal the response
      if (shouldSeal) {
        await handleForensicOutput(response, message)
      } else {
        // Normal conversation - just add assistant message
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response,
          timestamp: Date.now(),
          sealed: false
        }

        setMessages((current) => [...current, assistantMessage])
        addConversationEntry('assistant', response, false)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      const errorString = String(error)
      
      // Check for specific Spark API errors
      if (errorMessage.includes('Spark API not available')) {
        toast.error('AI API not configured', {
          description: 'This application requires GitHub Spark runtime. Please deploy to GitHub Spark or configure an API endpoint.'
        })
        
        // Add system message explaining the issue
        const systemMessage: ChatMessage = {
          id: `sys-api-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          role: 'system',
          content: '⚠️ AI API Not Available\n\nThis application requires the GitHub Spark runtime to function. The chat functionality will not work in local development without proper Spark configuration.\n\nTo use this feature:\n1. Deploy to GitHub Spark\n2. Configure SPARK_AGENT_URL environment variable\n3. Ensure Spark backend is running',
          timestamp: Date.now()
        }
        setMessages((current) => [...current, systemMessage])
      } else if (errorString.includes('LLM request failed') || errorMessage.includes('500') || errorMessage.includes('403')) {
        toast.error('AI Service Unavailable', {
          description: 'The GitHub Spark AI service is not accessible. This app requires deployment to GitHub Spark to function.'
        })
        
        // Add helpful system message
        const systemMessage: ChatMessage = {
          id: `sys-llm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          role: 'system',
          content: '⚠️ AI Service Connection Failed\n\nThe chat AI is not available in this environment. This application is designed to run on GitHub Spark.\n\n**Why this happened:**\n- The Spark LLM backend is not running\n- Missing SPARK_AGENT_URL configuration\n- Not deployed to GitHub Spark environment\n\n**Note:** Other features like document sealing and PDF generation still work!',
          timestamp: Date.now()
        }
        setMessages((current) => [...current, systemMessage])
      } else {
        toast.error('Failed to get response', {
          description: 'Please try again or contact support if the issue persists.'
        })
      }
      
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEvidenceUpload = async (file: File, userMessage?: string) => {
    // PHASE 1: DOCUMENT RECEIVED - Immediate acknowledgment
    const receivedMessageId = `scan-received-${Date.now()}`
    const receivedMessage: ChatMessage = {
      id: receivedMessageId,
      role: 'system',
      content: '📄 Document received\n🔒 Preparing forensic scan…',
      timestamp: Date.now(),
      scanningState: {
        fileName: file.name,
        phase: 'received'
      }
    }
    setMessages((current) => [...current, receivedMessage])

    // Small delay to show receipt
    await new Promise(resolve => setTimeout(resolve, 800))

    try {
      // PHASE 2: VERIFYING INTEGRITY
      setMessages((current) => 
        current.map(msg => 
          msg.id === receivedMessageId 
            ? { ...msg, scanningState: { fileName: file.name, phase: 'verifying' } }
            : msg
        )
      )
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Read file content
      const isTextFile = file.type.startsWith('text/') || 
                         file.name.endsWith('.txt') || 
                         file.name.endsWith('.md')
      const content = isTextFile ? await file.text() : await file.arrayBuffer()

      // PHASE 3: RUNNING FORENSIC ANALYSIS
      setMessages((current) => 
        current.map(msg => 
          msg.id === receivedMessageId 
            ? { ...msg, scanningState: { fileName: file.name, phase: 'analyzing' } }
            : msg
        )
      )
      await new Promise(resolve => setTimeout(resolve, 1200))

      // Seal the evidence
      const sealed = await sealDocument(content, file.name)
      
      // Generate Nine-Brain analysis
      const nineBrainAnalysis = await generateNineBrainAnalysis(
        file.name,
        content,
        file.type,
        sealed.seal.documentHash
      )

      // Create evidence artifact
      const evidenceArtifact: EvidenceArtifact = {
        id: `EVD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        fileName: file.name,
        content: sealed.originalContent,
        evidenceHash: sealed.seal.documentHash,
        timestamp: sealed.seal.timestamp,
        jurisdiction: sealed.seal.jurisdiction
      }

      // Add evidence to case
      addEvidence(evidenceArtifact)

      // PHASE 4: GENERATING CERTIFICATE
      setMessages((current) => 
        current.map(msg => 
          msg.id === receivedMessageId 
            ? { ...msg, scanningState: { fileName: file.name, phase: 'generating-cert' } }
            : msg
        )
      )
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Generate forensic certificate
      const certificateContent = await generateForensicCertificate(
        evidenceArtifact.id,
        file.name,
        sealed.seal.documentHash,
        nineBrainAnalysis,
        sealed.seal.jurisdiction
      )

      // Hash the certificate
      const encoder = new TextEncoder()
      const certData = encoder.encode(certificateContent)
      const certHashBuffer = await crypto.subtle.digest('SHA-256', certData)
      const certHashArray = Array.from(new Uint8Array(certHashBuffer))
      const certificateHash = certHashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      // Generate bundle hash
      const bundleHash = await generateBundleHash(
        sealed.seal.documentHash,
        certificateHash,
        { 
          timestamp: sealed.seal.timestamp, 
          jurisdiction: sealed.seal.jurisdiction 
        }
      )

      // Create certificate artifact
      const certificateArtifact: ForensicCertificate = {
        id: `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        evidenceId: evidenceArtifact.id,
        certificateHash,
        nineBrainAnalysis: certificateContent,
        timestamp: Date.now(),
        bundleHash
      }

      // Add certificate to case
      addCertificate(certificateArtifact)

      // Update current case state
      setCurrentCase(getCurrentCase())

      // PHASE 5: SEALING
      setMessages((current) => 
        current.map(msg => 
          msg.id === receivedMessageId 
            ? { ...msg, scanningState: { fileName: file.name, phase: 'sealing' } }
            : msg
        )
      )
      await new Promise(resolve => setTimeout(resolve, 800))

      // Remove scanning indicator and show final result
      setMessages((current) => 
        current.filter(msg => msg.id !== receivedMessageId)
      )

      // PHASE 6: OUTPUT - Show sealed artifacts
      const sealedMessage: ChatMessage = {
        id: `sealed-${Date.now()}`,
        role: 'system',
        content: '✅ Document scanned and sealed\n🔒 Certificate generated and bound\n📁 Added to current case',
        timestamp: Date.now(),
        sealedArtifacts: {
          fileName: file.name,
          evidenceHash: sealed.seal.documentHash,
          certificateId: certificateArtifact.id,
          certificateHash: certificateArtifact.certificateHash,
          bundleHash: certificateArtifact.bundleHash,
          documentContent: sealed.originalContent,
          certificateContent: certificateContent
        }
      }

      setMessages((current) => [...current, sealedMessage])

    } catch (error) {
      console.error('Error processing evidence:', error)
      
      // Remove scanning indicator
      setMessages((current) => 
        current.filter(msg => msg.id !== receivedMessageId)
      )
      
      toast.error('Failed to seal evidence', {
        description: (error as Error).message
      })
    }
  }

  const handleForensicOutput = async (content: string, originalRequest: string) => {
    try {
      // This is a drafted document - seal it
      const sealed = await sealDocument(content, `draft_${Date.now()}.txt`)

      // Add sealed document to case as conversation entry
      addConversationEntry('assistant', content, true)

      // Show assistant message with seal indicator
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: content,
        timestamp: Date.now(),
        sealed: true
      }

      setMessages((current) => [...current, assistantMessage])

      // Add system confirmation
      const systemMessage: ChatMessage = {
        id: `sys-${Date.now()}`,
        role: 'system',
        content: '✅ Sealed document generated and added to case',
        timestamp: Date.now()
      }

      setMessages((current) => [...current, systemMessage])

    } catch (error) {
      console.error('Error sealing output:', error)
      
      // Still show the content but without sealing
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: content,
        timestamp: Date.now(),
        sealed: false
      }

      setMessages((current) => [...current, assistantMessage])
      addConversationEntry('assistant', content, false)

      toast.error('Document generated but sealing failed')
    }
  }

  const handleClear = () => {
    if (confirm('Are you sure you want to clear this case? This will start a new case session.')) {
      clearCase()
      setMessages([])
      setCurrentCase(getCurrentCase())
      toast.success('Case cleared - new session started')
    }
  }

  const handlePromptClick = (prompt: string) => {
    handleSubmit(prompt)
  }

  return (
    <div className="flex flex-col h-screen bg-background" style={{ maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Minimal Header */}
      <header className="border-b border-border bg-card px-4 py-3 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scales size={24} weight="duotone" className="text-primary" />
            <div>
              <h1 className="text-base font-semibold tracking-tight text-foreground">
                Verum Omnis
              </h1>
              <p className="text-xs text-muted-foreground">
                Case {currentCase.caseId.substring(5, 13)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SessionStatus />
            <CaseExport />
            {messages.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-muted-foreground hover:text-foreground"
              >
                <Trash size={16} weight="regular" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Chat Area - Full Height */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div ref={scrollRef} className="max-w-3xl mx-auto px-4 py-6" style={{ width: '100%' }}>
            {messages.length === 0 || (messages.length === 1 && messages[0].id === 'welcome') ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
              >
                <Scales size={48} weight="duotone" className="text-primary mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Welcome to Verum Omnis
                </h2>
                <p className="text-base text-muted-foreground mb-6 max-w-2xl" style={{ 
                  lineHeight: 'var(--line-height-base, 1.6)' 
                }}>
                  Your forensic thinking partner. Add evidence, ask questions, or request documents.
                  Everything is automatically sealed and added to your case.
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-3xl">
                  {SUGGESTED_PROMPTS.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => handlePromptClick(prompt)}
                      disabled={isLoading}
                      className="text-sm hover:bg-accent hover:text-accent-foreground transition-all rounded-xl"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="space-y-6" style={{ maxWidth: 'var(--max-width-chat, 680px)', margin: '0 auto' }}>
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChatMessageComponent message={message} />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-transparent rounded-2xl px-5 py-4">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-75" />
                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse delay-150" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area - Fixed Bottom */}
      <div className="border-t border-border bg-card px-4 py-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto" style={{ maxWidth: 'var(--max-width-chat, 680px)' }}>
          <UnifiedInput
            onSubmit={handleSubmit}
            disabled={isLoading}
            placeholder="Add evidence or ask a question..."
          />
        </div>
      </div>
    </div>
  )
}

export default App