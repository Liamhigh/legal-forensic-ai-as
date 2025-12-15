/**
 * Intent Detection Service
 * Determines whether user input should trigger forensic sealing
 */

export enum IntentType {
  CONVERSATION = 'conversation', // Normal chat - not sealed
  FORENSIC_OUTPUT = 'forensic_output' // Drafting/evidence - sealed
}

/**
 * Keywords that trigger forensic output mode
 */
const DRAFTING_KEYWORDS = [
  'draft',
  'write',
  'prepare',
  'generate',
  'create',
  'compose',
  'formalise',
  'formalize',
  'email',
  'letter',
  'notice',
  'affidavit',
  'report',
  'memo',
  'memorandum',
  'brief',
  'motion',
  'petition',
  'complaint',
  'response',
  'filing'
]

/**
 * Detect user intent from message content
 */
export function detectIntent(message: string, hasFiles: boolean): IntentType {
  // If files are attached, always seal
  if (hasFiles) {
    return IntentType.FORENSIC_OUTPUT
  }

  const lowerMessage = message.toLowerCase()

  // Check for drafting keywords
  for (const keyword of DRAFTING_KEYWORDS) {
    // Use word boundaries to avoid false positives
    const regex = new RegExp(`\\b${keyword}\\b`, 'i')
    if (regex.test(lowerMessage)) {
      return IntentType.FORENSIC_OUTPUT
    }
  }

  // Default to conversation
  return IntentType.CONVERSATION
}

/**
 * Check if content should be sealed
 */
export function shouldSealContent(intent: IntentType): boolean {
  return intent === IntentType.FORENSIC_OUTPUT
}
