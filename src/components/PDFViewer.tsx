import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'

export function PDFViewer() {
  const [isOpen, setIsOpen] = useState(false)
  
  const pdfUrl = '/pdfs/Verum_Omnis_Master_Forensic_Archive_v5.2.7_(Institutional_Edition).PDF'
  
  const openPDF = () => {
    // Open PDF in new window/tab
    window.open(pdfUrl, '_blank')
  }
  
  return (
    <Card className="p-4 bg-card border border-border">
      <div className="flex items-center gap-3">
        <FileText size={32} weight="duotone" className="text-primary" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">
            Master Forensic Archive
          </h3>
          <p className="text-sm text-muted-foreground">
            Verum Omnis v5.2.7 (Institutional Edition)
          </p>
        </div>
        <Button
          onClick={openPDF}
          variant="default"
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <FileText size={18} weight="fill" className="mr-2" />
          Open PDF
        </Button>
      </div>
    </Card>
  )
}
