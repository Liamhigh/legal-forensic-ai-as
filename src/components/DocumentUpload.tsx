import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, CheckCircle, Shield, Warning } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { sealDocument, verifySeal, formatSealInfo } from '@/services/documentSealing'
import { 
  determineContext, 
  verifyAuthenticity, 
  constitutionalGate,
  generateRefusalReport,
  type InputBundle,
  EnforcementOutcome
} from '@/services/constitutionalEnforcement'
import { getCurrentSession, lockSession } from '@/services/authContext'

interface UploadedDocument {
  name: string
  sealed: boolean
  sealInfo?: string
  enforcementDenied?: boolean
  denialReason?: string
}

export function DocumentUpload() {
  const [uploadedDoc, setUploadedDoc] = useState<UploadedDocument | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    
    try {
      // Read file as text or binary based on type
      const isTextFile = file.type.startsWith('text/') || 
                         file.name.endsWith('.txt') || 
                         file.name.endsWith('.md')
      const content = isTextFile ? await file.text() : await file.arrayBuffer()
      
      // Create input bundle for constitutional enforcement
      const inputBundle: InputBundle = {
        fileName: file.name,
        content,
        fileType: file.type || 'unknown',
        size: file.size
      }

      // STEP 1: Constitutional Enforcement - Context & Standing Detection
      toast.loading('Analyzing document context and standing...')
      const contextResult = determineContext(inputBundle)
      
      // STEP 2: Constitutional Enforcement - Authenticity Verification
      const authenticityResult = verifyAuthenticity(inputBundle)
      
      // STEP 3: Constitutional Enforcement - Apply Constitutional Gate
      const session = getCurrentSession()
      const enforcementResult = constitutionalGate(
        inputBundle,
        contextResult,
        authenticityResult,
        session.isAuthenticated,
        session.isInstitutional
      )

      // STEP 4: Handle enforcement decision
      if (!enforcementResult.allowed) {
        // Processing DENIED - Lock session and seal everything
        lockSession()
        
        toast.dismiss()
        toast.error('Document Processing Denied', {
          description: 'Constitutional enforcement criteria not met - Session locked',
          duration: 5000
        })

        // Generate sealed refusal report
        const refusalReport = generateRefusalReport(
          inputBundle,
          enforcementResult,
          contextResult,
          authenticityResult
        )

        // Seal the refusal report
        const sealedRefusal = await sealDocument(refusalReport, `refusal_${file.name}.txt`)

        setUploadedDoc({
          name: file.name,
          sealed: true,
          sealInfo: formatSealInfo(sealedRefusal.seal),
          enforcementDenied: true,
          denialReason: enforcementResult.reason
        })
        return
      }

      // STEP 5: Processing ALLOWED - Proceed with sealing
      toast.dismiss()
      
      // Handle enforcement warnings (suspicious content)
      if (enforcementResult.outcome === EnforcementOutcome.ALLOWED && 
          enforcementResult.reason.includes('caution')) {
        toast.warning('Document accepted with caution flags', {
          description: enforcementResult.reason,
          duration: 4000
        })
      }

      // Seal the document
      toast.loading('Sealing document cryptographically...')
      const sealed = await sealDocument(content, file.name)
      
      if (sealed.isVerumOmnisSealed) {
        // Already sealed - verify instead
        const verification = await verifySeal(typeof sealed.originalContent === 'string' ? sealed.originalContent : new TextDecoder().decode(sealed.originalContent))
        toast.dismiss()
        if (verification.isValid) {
          toast.success('✓ Document verified - Already sealed by Verum Omnis', {
            description: verification.message
          })
          setUploadedDoc({
            name: file.name,
            sealed: true,
            sealInfo: verification.seal ? formatSealInfo(verification.seal) : 'Verified'
          })
        } else {
          toast.error('Document seal verification failed', {
            description: verification.message
          })
        }
      } else {
        // Newly sealed
        toast.dismiss()
        toast.success('✓ Document sealed cryptographically', {
          description: `Sealed with ${sealed.seal.jurisdiction || 'location data'}`
        })
        setUploadedDoc({
          name: file.name,
          sealed: true,
          sealInfo: formatSealInfo(sealed.seal)
        })
      }
    } catch (error) {
      toast.error('Failed to process document', {
        description: (error as Error).message
      })
    } finally {
      setIsProcessing(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <Card className="p-6 bg-card border border-border">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Shield size={32} weight="duotone" className="text-primary" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              Your sealed case file
            </h3>
            <p className="text-sm text-muted-foreground">
              Upload documents to seal with geolocation and timestamp verification
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept=".txt,.md,.doc,.docx,.pdf"
        />

        {!uploadedDoc ? (
          <Button
            onClick={handleUploadClick}
            disabled={isProcessing}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl"
          >
            <Upload size={18} weight="fill" className="mr-2" />
            {isProcessing ? 'Processing...' : 'Upload document'}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              uploadedDoc.enforcementDenied ? 'bg-forensic-error-bg border border-forensic-error-border' : 'bg-muted'
            }`}>
              {uploadedDoc.enforcementDenied ? (
                <Warning size={24} weight="fill" className="text-forensic-error" />
              ) : (
                <CheckCircle size={24} weight="fill" className="text-forensic-sealed" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {uploadedDoc.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {uploadedDoc.enforcementDenied ? 'Processing denied - sealed refusal report' : 'Cryptographically sealed - stored in backend'}
                </p>
              </div>
            </div>

            {uploadedDoc.enforcementDenied && uploadedDoc.denialReason && (
              <div className="p-3 bg-forensic-error-bg rounded-lg border border-forensic-error-border">
                <p className="text-xs font-semibold text-forensic-error-text uppercase tracking-wide mb-1">
                  Constitutional Enforcement Notice
                </p>
                <p className="text-xs text-forensic-error-text">
                  {uploadedDoc.denialReason}
                </p>
              </div>
            )}

            {uploadedDoc.sealInfo && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs font-mono text-muted-foreground whitespace-pre-line">
                  {uploadedDoc.sealInfo}
                </p>
              </div>
            )}

            <Button
              onClick={handleUploadClick}
              variant="outline"
              className="w-full"
            >
              <Upload size={18} weight="regular" className="mr-2" />
              Upload Another
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Documents are sealed with cryptographic hash verification</p>
          <p>• Location and jurisdiction data included automatically</p>
          <p>• Artefacts are stored in the backend for forensic integrity</p>
          <p>• Previously sealed documents are verified, not re-sealed</p>
        </div>
      </div>
    </Card>
  )
}
