import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, CheckCircle, Shield, Download } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { sealDocument, verifySeal, formatSealInfo } from '@/services/documentSealing'

interface UploadedDocument {
  name: string
  content: string
  sealed: boolean
  sealInfo?: string
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
      const content = await file.text()
      
      // Seal the document
      toast.loading('Sealing document cryptographically...')
      const sealed = await sealDocument(content, file.name)
      
      if (sealed.isVerumOmnisSealed) {
        // Already sealed - verify instead
        const verification = await verifySeal(content)
        toast.dismiss()
        if (verification.isValid) {
          toast.success('✓ Document verified - Already sealed by Verum Omnis', {
            description: verification.message
          })
          setUploadedDoc({
            name: file.name,
            content: typeof sealed.originalContent === 'string' ? sealed.originalContent : new TextDecoder().decode(sealed.originalContent),
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
          content: typeof sealed.originalContent === 'string' ? sealed.originalContent : new TextDecoder().decode(sealed.originalContent),
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

    const blob = new Blob([uploadedDoc.content], { type: 'text/plain' })
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
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <CheckCircle size={24} weight="fill" className="text-green-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {uploadedDoc.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Cryptographically sealed
                </p>
              </div>
            </div>

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
                Download Sealed
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
