/**
 * Document Scanner Indicator Component
 * Shows professional, calm feedback during document scanning process
 */

import { motion } from 'framer-motion'
import { Lock, ShieldCheck, Certificate, FileText } from '@phosphor-icons/react'

export type ScanningPhase = 
  | 'received'
  | 'verifying'
  | 'analyzing'
  | 'generating-cert'
  | 'sealing'

interface DocumentScannerIndicatorProps {
  fileName: string
  phase: ScanningPhase
}

const phaseConfig = {
  received: {
    icon: FileText,
    text: 'Document received',
    subtext: 'Preparing forensic scan…'
  },
  verifying: {
    icon: ShieldCheck,
    text: 'Verifying integrity',
    subtext: 'Checking document authenticity…'
  },
  analyzing: {
    icon: ShieldCheck,
    text: 'Running forensic analysis',
    subtext: 'Nine-Brain analysis in progress…'
  },
  'generating-cert': {
    icon: Certificate,
    text: 'Generating certificate',
    subtext: 'Creating cryptographic seal…'
  },
  sealing: {
    icon: Lock,
    text: 'Sealing document',
    subtext: 'Applying final cryptographic lock…'
  }
}

export function DocumentScannerIndicator({ fileName, phase }: DocumentScannerIndicatorProps) {
  const config = phaseConfig[phase]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex justify-center my-4"
    >
      <div className="bg-card border border-primary/30 rounded-lg px-4 py-3 max-w-md w-full shadow-lg">
        <div className="flex items-start gap-3">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Icon size={24} weight="duotone" className="text-primary flex-shrink-0" />
          </motion.div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Lock size={14} weight="fill" className="text-primary" />
              <p className="text-sm font-semibold text-foreground">
                {config.text}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {config.subtext}
            </p>
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <FileText size={12} weight="regular" />
              {fileName}
            </p>
            
            {/* Scanning bar animation */}
            <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{ width: '50%' }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
