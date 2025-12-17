/**
 * Scanner Task Initiated Component
 * Displays a non-chat visual indicator when a scanner command is triggered
 * Replaces chat bubble with a distinct forensic action notification
 */

import { Lock, Clock } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface ScannerTaskInitiatedProps {
  timestamp: number
  fileName?: string
}

export function ScannerTaskInitiated({ timestamp, fileName }: ScannerTaskInitiatedProps) {
  const formattedTime = new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="w-full py-3"
    >
      <div className="w-full border-l-4 border-primary bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-primary/10">
            <Lock size={18} weight="fill" className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              Scanner task initiated
            </p>
            {fileName && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {fileName}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
            <Clock size={12} weight="regular" />
            <span>{formattedTime}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
