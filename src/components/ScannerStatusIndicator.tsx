/**
 * Scanner Status Component
 * Displays the current state of the scanner pipeline
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Lock, 
  ShieldCheck, 
  Certificate, 
  FileText, 
  CheckCircle,
  Warning 
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
    showProgress: false
  },
  [ScannerState.INGESTED]: {
    icon: FileText,
    iconWeight: 'duotone' as const,
    color: 'text-primary',
    showProgress: true
  },
  [ScannerState.SCANNING]: {
    icon: ShieldCheck,
    iconWeight: 'duotone' as const,
    color: 'text-primary',
    showProgress: true
  },
  [ScannerState.ANALYZED]: {
    icon: ShieldCheck,
    iconWeight: 'fill' as const,
    color: 'text-primary',
    showProgress: true
  },
  [ScannerState.SEALED]: {
    icon: Certificate,
    iconWeight: 'duotone' as const,
    color: 'text-primary',
    showProgress: true
  },
  [ScannerState.OUTPUT_READY]: {
    icon: CheckCircle,
    iconWeight: 'fill' as const,
    color: 'text-green-600',
    showProgress: false
  },
  [ScannerState.ERROR]: {
    icon: Warning,
    iconWeight: 'fill' as const,
    color: 'text-red-600',
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex justify-center my-4"
    >
      <div className={`border rounded-lg px-4 py-3 max-w-md w-full shadow-lg ${
        progress.state === ScannerState.ERROR 
          ? 'bg-red-50 border-red-300' 
          : progress.state === ScannerState.OUTPUT_READY
          ? 'bg-green-50 border-green-300'
          : 'bg-card border-primary/30'
      }`}>
        <div className="flex items-start gap-3">
          <motion.div
            animate={config.showProgress ? { 
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7]
            } : {}}
            transition={config.showProgress ? { 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            } : {}}
          >
            <Icon 
              size={24} 
              weight={config.iconWeight} 
              className={`${config.color} flex-shrink-0`} 
            />
          </motion.div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Lock size={14} weight="fill" className={config.color} />
              <p className="text-sm font-semibold text-foreground">
                {progress.message}
              </p>
            </div>
            
            {progress.fileName && (
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mb-2">
                <FileText size={12} weight="regular" />
                {progress.fileName}
              </p>
            )}

            {progress.subMessage && (
              <p className="text-xs text-muted-foreground mb-2">
                {progress.subMessage}
              </p>
            )}
            
            {/* Progress bar for active states */}
            {config.showProgress && (
              <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            )}

            {/* Error details */}
            {progress.error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                <p className="text-red-800 font-medium">Error Details:</p>
                <p className="text-red-700 mt-1">{progress.error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
