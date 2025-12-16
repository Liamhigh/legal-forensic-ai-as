import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Trash } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { UnifiedInput } from '@/components/UnifiedInput'
import { ChatMessageComponent, type ChatMessage } from '@/components/ChatMessage'
import { CaseExport } from '@/components/CaseExport'
import { SessionStatus } from '@/components/SessionStatus'
import { ScannerStatusIndicator } from '@/components/ScannerStatusIndicator'
import { getForensicLanguageRules } from '@/services/constitutionalEnforcement'
import { isSessionLocked } from '@/services/authContext'
import { detectIntent, IntentType, shouldSealContent } from '@/services/intentDetection'
import { sealDocument } from '@/services/documentSealing'
import { scanEvidence } from '@/services/scannerOrchestrator'
import {
  getCurrentCase,
  addConversationEntry,
  clearCase
} from '@/services/caseManagement'
import { recordSessionEvent, getCurrentSealedSession } from '@/services/sessionSealing'
import { detectAccusation, generateConsistencyReport, formatConsistencyReport } from '@/services/temporalCorrelation'

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
  const [logoError, setLogoError] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Initialize case and session on mount
  useEffect(() => {
    const caseData = getCurrentCase()
    setCurrentCase(caseData)
    
    // Record session start
    recordSessionEvent('session_start', {
      caseId: caseData.caseId,
      startTime: caseData.startTime
    })
    
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

    // Check for accusations/timeline disputes (passive detection)
    const accusationDetection = detectAccusation(message)
    
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
    
    // Record user interaction event
    await recordSessionEvent('user_interaction', {
      messageLength: message.length,
      hasFiles: !!files && files.length > 0,
      accusationDetected: accusationDetection.detected
    })
    
    // Add to conversation log
    addConversationEntry('user', message, shouldSeal)
    
    // If accusation detected, generate consistency report automatically
    if (accusationDetection.detected) {
      try {
        const report = await generateConsistencyReport(message)
        const formattedReport = formatConsistencyReport(report)
        
        // Show consistency report
        const reportMessage: ChatMessage = {
          id: `consistency-${Date.now()}`,
          role: 'system',
          content: `🔍 Timeline correlation detected\n\nA consistency report has been automatically generated based on your sealed session records.\n\n${formattedReport}`,
          timestamp: Date.now(),
          sealed: true
        }
        
        setMessages((current) => [...current, reportMessage])
        
        toast.info('Consistency report generated', {
          description: 'Temporal correlation analysis completed'
        })
      } catch (error) {
        console.log('Consistency report not generated:', error)
        // Silent failure - this is optional augmentation
      }
    }
    
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
    try {
      // Use scanner orchestrator - it manages its own state
      const result = await scanEvidence(file, userMessage)
      
      // Update current case state
      const caseData = getCurrentCase()
      setCurrentCase(caseData)

      // Extract forensic narrative from certificate content
      const certificateText = result.certificateContent || ''
      const integritySummary = '✓ Document received and hashed successfully\n✓ SHA-256 cryptographic hash generated\n✓ Document sealed with forensic marker\n✓ Timestamp recorded\n✓ Cryptographically bound certificate generated'
      
      // Parse certificate to extract analysis
      let findings = 'Forensic analysis complete. Document integrity verified.'
      let aiAnalysis: string | undefined
      
      if (certificateText.includes('NINE-BRAIN AI ANALYSIS')) {
        // AI analysis included
        aiAnalysis = certificateText.split('NINE-BRAIN AI ANALYSIS')[1]?.split('---')[0]?.trim() || undefined
      } else if (certificateText.includes('BASELINE FORENSIC ANALYSIS')) {
        // Baseline analysis
        findings = certificateText.split('BASELINE FORENSIC ANALYSIS')[1]?.split('---')[0]?.trim() || findings
      }

      // Show forensic narrative in chat
      const narrativeMessage: ChatMessage = {
        id: `narrative-${Date.now()}`,
        role: 'system',
        content: result.aiAnalysisIncluded 
          ? '✅ Evidence scanned and sealed — Forensic analysis complete'
          : '✅ Evidence scanned and sealed — Baseline analysis complete',
        timestamp: Date.now(),
        forensicNarrative: {
          caseId: caseData.caseId,
          fileName: file.name,
          evidenceHash: result.evidenceHash,
          timestamp: Date.now(),
          jurisdiction: caseData.jurisdiction,
          certificateId: result.certificateId,
          certificateHash: result.certificateHash,
          bundleHash: result.bundleHash,
          integritySummary,
          findings: certificateText || findings,
          aiAnalysisIncluded: result.aiAnalysisIncluded,
          aiAnalysis: result.aiAnalysisIncluded ? aiAnalysis : undefined
        }
      }

      setMessages((current) => [...current, narrativeMessage])

    } catch (error) {
      console.error('Error processing evidence:', error)
      
      toast.error('Failed to seal evidence', {
        description: (error as Error).message
      })
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: `❌ Scanner error: ${(error as Error).message}\n\nPlease try again or contact support if the issue persists.`,
        timestamp: Date.now()
      }
      setMessages((current) => [...current, errorMessage])
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
          <div className="flex items-center gap-3">
            {!logoError ? (
              <img 
                src="/verum-omnis-logo.jpg" 
                alt="Verum Omnis Logo"
                className="h-10 w-10 object-contain rounded"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="h-10 flex items-center px-2 bg-primary/10 rounded">
                <span className="text-xs font-semibold text-primary whitespace-nowrap">
                  VERUM OMNIS — Forensic AI
                </span>
              </div>
            )}
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
                {!logoError ? (
                  <img 
                    src="/verum-omnis-logo.jpg" 
                    alt="Verum Omnis Logo"
                    className="h-16 w-16 object-contain mb-4 rounded"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="mb-4 px-4 py-2 bg-primary/10 rounded">
                    <span className="text-sm font-semibold text-primary">
                      VERUM OMNIS — Forensic AI
                    </span>
                  </div>
                )}
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
                {/* Scanner Status Indicator - Independent of chat messages */}
                <ScannerStatusIndicator />
                
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