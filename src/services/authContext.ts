/**
 * Authentication Context Service
 * Manages user authentication state and institutional access
 * Authentication is scope permission, not trust - all users are subject to enforcement
 */

export interface UserSession {
  isAuthenticated: boolean
  isInstitutional: boolean
  userId?: string
  institutionName?: string
  sessionId: string
  createdAt: number
}

// Session state - in production, this would be persisted and server-validated
let currentSession: UserSession = {
  isAuthenticated: false,
  isInstitutional: false,
  sessionId: generateSessionId(),
  createdAt: Date.now()
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Get current session state
 */
export function getCurrentSession(): UserSession {
  return { ...currentSession }
}

/**
 * Initialize a public (unauthenticated) session
 */
export function initializePublicSession(): UserSession {
  currentSession = {
    isAuthenticated: false,
    isInstitutional: false,
    sessionId: generateSessionId(),
    createdAt: Date.now()
  }
  return { ...currentSession }
}

/**
 * Authenticate an institutional user
 * In production, this would validate credentials with a backend service
 */
export function authenticateInstitutionalUser(
  userId: string,
  institutionName: string
): UserSession {
  currentSession = {
    isAuthenticated: true,
    isInstitutional: true,
    userId,
    institutionName,
    sessionId: generateSessionId(),
    createdAt: Date.now()
  }
  return { ...currentSession }
}

/**
 * Log out and return to public session
 */
export function logout(): UserSession {
  return initializePublicSession()
}

/**
 * Check if current session has institutional access
 */
export function hasInstitutionalAccess(): boolean {
  return currentSession.isAuthenticated && currentSession.isInstitutional
}

/**
 * Check if current session is authenticated
 */
export function isAuthenticated(): boolean {
  return currentSession.isAuthenticated
}

/**
 * Lock the current session (terminate processing)
 * Used when constitutional violations are detected
 */
export function lockSession(): void {
  // Mark session as locked - in production, this would prevent any further operations
  currentSession = {
    ...currentSession,
    sessionId: `LOCKED_${currentSession.sessionId}`
  }
}

/**
 * Check if session is locked
 */
export function isSessionLocked(): boolean {
  return currentSession.sessionId.startsWith('LOCKED_')
}
