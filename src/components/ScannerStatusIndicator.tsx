/**
 * Scanner Status Component
 * Displays the current state of the scanner pipeline
 * 
 * Design principles:
 * - Vertically anchored and stable (no horizontal movement)
 * - No bubble-style layout
 * - Single column, full width
 * - Scanner status indicator is the primary visual spine
 * 
 * Conceptual Rule: Chat speaks. Scanner acts. They are never visually identical.
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Lock, 
  ShieldCheck, 
  Certificate, 
  FileText, 
  CheckCircle,
  Warning,
  Clock
} from '@phosphor-icons/react'
import { 
  scannerStateMachine, 
  ScannerState, 
  type ScannerProgress 
} from '@/services/scannerStateMachine'

const stateConfig = {
  [ScannerState.IDLE]: {
    icon: FileText,
    iconWeight: 'regular' as const,
    color: 'text-muted-foreground',
    borderColor: 'border-muted',
    bgColor: 'bg-transparent',
    showProgress: false
  },
  [ScannerState.INGESTED]: {
    icon: FileText,
    iconWeight: 'duotone' as const,
    color: 'text-primary',
    borderColor: 'border-primary',
    bgColor: 'bg-muted/30',
    showProgress: true
  },
  [ScannerState.SCANNING]: {
    icon: ShieldCheck,
    iconWeight: 'duotone' as const,
    color: 'text-primary',
    borderColor: 'border-primary',
    bgColor: 'bg-muted/30',
    showProgress: true
  },
  [ScannerState.ANALYZED]: {
    icon: ShieldCheck,
    iconWeight: 'fill' as const,
    color: 'text-primary',
    borderColor: 'border-primary',
    bgColor: 'bg-muted/30',
    showProgress: true
  },
  [ScannerState.SEALED]: {
    icon: Certificate,
    iconWeight: 'duotone' as const,
    color: 'text-primary',
    borderColor: 'border-primary',
    bgColor: 'bg-muted/30',
    showProgress: true
  },
  [ScannerState.OUTPUT_READY]: {
    icon: CheckCircle,
    iconWeight: 'fill' as const,
    color: 'text-forensic-sealed',
    borderColor: 'border-forensic-sealed',
    bgColor: 'bg-forensic-sealed-bg',
    showProgress: false
  },
  [ScannerState.ERROR]: {
    icon: Warning,
    iconWeight: 'fill' as const,
    color: 'text-forensic-error',
    borderColor: 'border-forensic-error',
    bgColor: 'bg-forensic-error-bg',
    showProgress: false
  }
}

export function ScannerStatusIndicator() {
  const [progress, setProgress] = useState<ScannerProgress>(
    scannerStateMachine.getCurrentProgress()
  )

  useEffect(() => {
    // Subscribe to scanner state changes
    const unsubscribe = scannerStateMachine.subscribe(setProgress)
    return unsubscribe
  }, [])

  // Don't show anything in IDLE state
  if (progress.state === ScannerState.IDLE) {
    return null
  }

  const config = stateConfig[progress.state]
  const Icon = config.icon

  const formattedTime = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="w-full py-2"
      layout
    >
      {/* Full-width, vertically anchored scanner spine - no bubble style */}
      <div className={`w-full border-l-4 ${config.borderColor} ${config.bgColor} px-4 py-4`}>
        {/* Scanner status header */}
        <div className="flex items-start gap-3">
          <motion.div
            animate={config.showProgress ? { 
              opacity: [0.7, 1, 0.7]
            } : {}}
            transition={config.showProgress ? { 
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            } : {}}
            className="flex items-center justify-center w-10 h-10 rounded bg-primary/10 flex-shrink-0"
          >
            <Icon 
              size={22} 
              weight={config.iconWeight} 
              className={config.color} 
            />
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <Lock size={14} weight="fill" className={config.color} />
                <p className="text-sm font-semibold text-foreground">
                  {progress.message}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
                <Clock size={12} weight="regular" />
                <span>{formattedTime}</span>
              </div>
            </div>
            
            {progress.subMessage && (
              <p className="text-xs text-muted-foreground mb-2">
                {progress.subMessage}
              </p>
            )}
            
            {progress.fileName && (
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mb-2">
                <FileText size={12} weight="regular" />
                {progress.fileName}
              </p>
            )}

            {!progress.aiAnalysisAvailable && progress.state === ScannerState.OUTPUT_READY && (
              <div className="mt-2 p-2 bg-forensic-condition-bg border border-forensic-condition-border rounded text-xs">
                <p className="text-forensic-condition-text font-semibold uppercase tracking-wide">
                  ⚠️ Condition Noted
                </p>
                <p className="text-forensic-condition-text mt-1">
                  Document sealed successfully with baseline forensic processing.
                  Certificate notes AI unavailability.
                </p>
              </div>
            )}
            
            {/* Progress bar - full width, stable vertical position */}
            {config.showProgress && (
              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden w-full">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            )}

            {/* Error details */}
            {progress.error && (
              <div className="mt-2 p-2 bg-forensic-error-bg border border-forensic-error-border rounded text-xs">
                <p className="text-forensic-error-text font-semibold uppercase tracking-wide">Error Details:</p>
                <p className="text-forensic-error-text mt-1">{progress.error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
