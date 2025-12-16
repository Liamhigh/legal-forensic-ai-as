/**
 * Scanner State Machine Service
 * Independent, deterministic scanner pipeline that runs regardless of AI/chat availability
 */

export enum ScannerState {
  IDLE = 'IDLE',
  INGESTED = 'INGESTED',
  SCANNING = 'SCANNING',
  ANALYZED = 'ANALYZED',
  SEALED = 'SEALED',
  OUTPUT_READY = 'OUTPUT_READY',
  ERROR = 'ERROR'
}

export interface ScannerProgress {
  state: ScannerState
  fileName?: string
  progress: number // 0-100
  message: string
  subMessage?: string
  evidenceId?: string
  certificateId?: string
  error?: string
  aiAnalysisAvailable?: boolean
}

export interface ScannerResult {
  success: boolean
  evidenceId: string
  certificateId: string
  evidenceHash: string
  certificateHash: string
  bundleHash: string
  documentContent: string | ArrayBuffer
  certificateContent: string
  aiAnalysisIncluded: boolean
  message: string
}

type ScannerStateListener = (progress: ScannerProgress) => void

class ScannerStateMachine {
  private currentState: ScannerState = ScannerState.IDLE
  private listeners: ScannerStateListener[] = []
  private currentProgress: ScannerProgress = {
    state: ScannerState.IDLE,
    progress: 0,
    message: 'Ready to scan'
  }

  /**
   * Subscribe to scanner state changes
   */
  subscribe(listener: ScannerStateListener): () => void {
    this.listeners.push(listener)
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  /**
   * Get current scanner state
   */
  getCurrentState(): ScannerState {
    return this.currentState
  }

  /**
   * Get current progress information
   */
  getCurrentProgress(): ScannerProgress {
    return { ...this.currentProgress }
  }

  /**
   * Update state and notify listeners
   */
  private updateState(progress: ScannerProgress): void {
    this.currentState = progress.state
    this.currentProgress = progress
    
    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(progress)
      } catch (error) {
        console.error('Error in scanner state listener:', error)
      }
    })
  }

  /**
   * Transition to INGESTED state
   */
  transitionToIngested(fileName: string): void {
    this.updateState({
      state: ScannerState.INGESTED,
      fileName,
      progress: 10,
      message: 'Document received',
      subMessage: 'Preparing forensic scan…'
    })
  }

  /**
   * Transition to SCANNING state
   */
  transitionToScanning(fileName: string, phase: 'verifying' | 'analyzing'): void {
    const phaseMessages = {
      verifying: {
        message: 'Verifying integrity',
        subMessage: 'Checking document authenticity…',
        progress: 30
      },
      analyzing: {
        message: 'Running forensic analysis',
        subMessage: 'Applying cryptographic seal…',
        progress: 50
      }
    }

    const config = phaseMessages[phase]
    
    this.updateState({
      state: ScannerState.SCANNING,
      fileName,
      progress: config.progress,
      message: config.message,
      subMessage: config.subMessage
    })
  }

  /**
   * Transition to ANALYZED state
   */
  transitionToAnalyzed(fileName: string, aiAvailable: boolean): void {
    this.updateState({
      state: ScannerState.ANALYZED,
      fileName,
      progress: 70,
      message: 'Forensic analysis complete',
      subMessage: aiAvailable 
        ? 'AI analysis included' 
        : 'AI analysis unavailable - baseline scan completed',
      aiAnalysisAvailable: aiAvailable
    })
  }

  /**
   * Transition to SEALED state
   */
  transitionToSealed(fileName: string, evidenceId: string): void {
    this.updateState({
      state: ScannerState.SEALED,
      fileName,
      evidenceId,
      progress: 85,
      message: 'Generating certificate',
      subMessage: 'Creating cryptographic seal…'
    })
  }

  /**
   * Transition to OUTPUT_READY state
   */
  transitionToOutputReady(result: ScannerResult): void {
    this.updateState({
      state: ScannerState.OUTPUT_READY,
      fileName: result.documentContent ? 'Document' : undefined,
      evidenceId: result.evidenceId,
      certificateId: result.certificateId,
      progress: 100,
      message: 'Document scanned and sealed',
      subMessage: result.aiAnalysisIncluded 
        ? 'Analysis mode: Enhanced (AI included)' 
        : 'Analysis mode: Baseline (AI unavailable)',
      aiAnalysisAvailable: result.aiAnalysisIncluded
    })
  }

  /**
   * Transition to ERROR state
   */
  transitionToError(fileName: string, error: string): void {
    this.updateState({
      state: ScannerState.ERROR,
      fileName,
      progress: 0,
      message: 'Scan failed',
      subMessage: error,
      error
    })
  }

  /**
   * Reset to IDLE state
   */
  reset(): void {
    this.updateState({
      state: ScannerState.IDLE,
      progress: 0,
      message: 'Ready to scan'
    })
  }

  /**
   * Check if scanner is currently processing
   */
  isProcessing(): boolean {
    return [
      ScannerState.INGESTED,
      ScannerState.SCANNING,
      ScannerState.ANALYZED,
      ScannerState.SEALED
    ].includes(this.currentState)
  }

  /**
   * Check if scanner is ready for new input
   */
  isReady(): boolean {
    return this.currentState === ScannerState.IDLE || 
           this.currentState === ScannerState.OUTPUT_READY
  }
}

// Export singleton instance
export const scannerStateMachine = new ScannerStateMachine()
