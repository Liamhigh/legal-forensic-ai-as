import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, CheckCircle, Shield, Download, Warning } from '@phosphor-icons/react'
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
import { getCurrentSession } from '@/services/authContext'

interface UploadedDocument {
  name: string
  content: string | ArrayBuffer
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
        // Processing DENIED - but still seal everything
        toast.dismiss()
        toast.error('Document Processing Denied', {
          description: 'Constitutional enforcement criteria not met',
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
          content: sealedRefusal.originalContent,
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
          const contentForStorage = typeof sealed.originalContent === 'string' 
            ? sealed.originalContent 
            : sealed.originalContent
          setUploadedDoc({
            name: file.name,
            content: contentForStorage,
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
        const contentForStorage = typeof sealed.originalContent === 'string' 
          ? sealed.originalContent 
          : sealed.originalContent
        setUploadedDoc({
          name: file.name,
          content: contentForStorage,
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

  const handleDownload = () => {
    if (!uploadedDoc) return

    // Determine MIME type based on file extension
    const mimeType = uploadedDoc.name.endsWith('.pdf') ? 'application/pdf' :
                     uploadedDoc.name.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                     'text/plain'

    const blob = new Blob([uploadedDoc.content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sealed_${uploadedDoc.name}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Sealed document downloaded')
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
              Forensic Document Sealing
            </h3>
            <p className="text-sm text-muted-foreground">
              Upload documents to cryptographically seal with geolocation and timestamp
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
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Upload size={18} weight="fill" className="mr-2" />
            {isProcessing ? 'Processing...' : 'Upload Document to Seal'}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              uploadedDoc.enforcementDenied ? 'bg-red-50 dark:bg-red-950/20' : 'bg-muted'
            }`}>
              {uploadedDoc.enforcementDenied ? (
                <Warning size={24} weight="fill" className="text-red-600" />
              ) : (
                <CheckCircle size={24} weight="fill" className="text-green-600" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {uploadedDoc.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {uploadedDoc.enforcementDenied ? 'Processing denied - sealed refusal report' : 'Cryptographically sealed'}
                </p>
              </div>
            </div>

            {uploadedDoc.enforcementDenied && uploadedDoc.denialReason && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-xs font-semibold text-red-900 dark:text-red-100 mb-1">
                  Constitutional Enforcement Notice
                </p>
                <p className="text-xs text-red-800 dark:text-red-200">
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

            <div className="flex gap-2">
              <Button
                onClick={handleDownload}
                variant="outline"
                className="flex-1"
              >
                <Download size={18} weight="regular" className="mr-2" />
                Download {uploadedDoc.enforcementDenied ? 'Report' : 'Sealed'}
              </Button>
              <Button
                onClick={handleUploadClick}
                variant="outline"
                className="flex-1"
              >
                <Upload size={18} weight="regular" className="mr-2" />
                Upload Another
              </Button>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Documents are sealed with SHA-256 cryptographic hash</p>
          <p>• Geolocation and jurisdiction data included for legal compliance</p>
          <p>• Previously sealed documents are verified, not re-sealed</p>
        </div>
      </div>
    </Card>
  )
}
