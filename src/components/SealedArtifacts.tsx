/**
 * Sealed Artifacts Display Component
 * Shows sealed document and certificate status indicators (no download options)
 * 
 * Per forensic pipeline requirements:
 * - UI exposes only status indicators and integrity confirmations
 * - No immediate download/export options
 * - Documents remain strictly in the backend
 */

import { Lock, Certificate, FileText, CheckCircle } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface SealedArtifactsProps {
  fileName: string
  evidenceHash: string
  certificateId: string
  certificateHash: string
  bundleHash: string
}

export function SealedArtifacts({
  fileName,
  evidenceHash,
  certificateId,
  certificateHash,
  bundleHash
}: SealedArtifactsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex justify-center my-3 sm:my-4 w-full"
    >
      <div className="bg-card border border-border rounded-lg p-3 sm:p-4 max-w-2xl w-full shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
          <Lock size={20} weight="fill" className="text-forensic-sealed" />
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Sealed Forensic Package
          </h3>
          <CheckCircle size={16} weight="fill" className="text-forensic-sealed ml-auto" />
        </div>

        {/* Artifacts Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {/* Sealed Document Status */}
          <div className="bg-muted/50 border border-border rounded-lg p-3">
            <div className="flex items-start gap-2 mb-2">
              <FileText size={18} weight="duotone" className="text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground mb-0.5">
                  Sealed Document
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {fileName}
                </p>
              </div>
              <CheckCircle size={14} weight="fill" className="text-forensic-sealed flex-shrink-0" />
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-mono text-[10px] truncate">
                Hash: {evidenceHash.substring(0, 16)}...
              </p>
              <p className="text-[10px] text-forensic-sealed-text flex items-center gap-1">
                <Lock size={10} weight="fill" />
                Stored in backend
              </p>
            </div>
          </div>

          {/* Forensic Certificate Status */}
          <div className="bg-muted/50 border border-border rounded-lg p-3">
            <div className="flex items-start gap-2 mb-2">
              <Certificate size={18} weight="duotone" className="text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground mb-0.5">
                  Forensic Certificate
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {certificateId}
                </p>
              </div>
              <CheckCircle size={14} weight="fill" className="text-forensic-sealed flex-shrink-0" />
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-mono text-[10px] truncate">
                Hash: {certificateHash.substring(0, 16)}...
              </p>
              <p className="text-[10px] text-forensic-sealed-text flex items-center gap-1">
                <Lock size={10} weight="fill" />
                Stored in backend
              </p>
            </div>
          </div>
        </div>

        {/* Bundle Info */}
        <div className="bg-forensic-sealed-bg border border-forensic-sealed-border rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Lock size={16} weight="fill" className="text-forensic-sealed flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-forensic-sealed-text uppercase tracking-wide mb-1">
                Cryptographically Bound
              </p>
              <p className="text-xs text-forensic-sealed-text mb-2">
                Document and certificate are cryptographically sealed together. 
                Artefacts are stored in the backend and verified on demand.
              </p>
              <p className="text-[10px] font-mono text-forensic-sealed-text break-all">
                Bundle: {bundleHash.substring(0, 32)}...
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
