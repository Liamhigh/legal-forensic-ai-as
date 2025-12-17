/**
 * Forensic Integrity Guard Tests
 * Tests for the anti-abuse layer that ensures the forensic pipeline cannot be abused
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  logAbuseAttempt,
  registerSealedArtefact,
  verifyArtefactIntegrity,
  validateTimestamp,
  validateOperation,
  verifyCustodyChain,
  getAbuseLog
} from '../services/forensicIntegrityGuard'

describe('Forensic Integrity Guard', () => {
  describe('Abuse Detection', () => {
    it('should log abuse attempts with correct metadata', () => {
      const attempt = logAbuseAttempt(
        'timestamp_manipulation',
        'Test abuse attempt',
        'high',
        { testData: 'value' }
      )

      expect(attempt.type).toBe('timestamp_manipulation')
      expect(attempt.description).toBe('Test abuse attempt')
      expect(attempt.severity).toBe('high')
      expect(attempt.blocked).toBe(true)
      expect(attempt.id).toMatch(/^ABUSE-/)
    })

    it('should always block abuse attempts', () => {
      const attempt = logAbuseAttempt(
        'signature_forgery',
        'Attempted signature forgery',
        'critical'
      )

      expect(attempt.blocked).toBe(true)
    })

    it('should store abuse attempts in immutable log', () => {
      const initialCount = getAbuseLog().length
      
      logAbuseAttempt('chain_break_attempt', 'Test chain break', 'medium')
      
      const newCount = getAbuseLog().length
      expect(newCount).toBeGreaterThan(initialCount)
    })
  })

  describe('Artefact Registration', () => {
    it('should register new artefacts successfully', () => {
      const artefactId = `test-artefact-${Date.now()}`
      const hash = 'abc123def456'

      const result = registerSealedArtefact(artefactId, hash, 'document')

      expect(result).toBe(true)
    })

    it('should allow re-registration with same hash', () => {
      const artefactId = `test-artefact-same-${Date.now()}`
      const hash = 'same-hash-123'

      registerSealedArtefact(artefactId, hash, 'document')
      const result = registerSealedArtefact(artefactId, hash, 'document')

      expect(result).toBe(true)
    })

    it('should block re-registration with different hash', () => {
      const artefactId = `test-artefact-diff-${Date.now()}`

      registerSealedArtefact(artefactId, 'original-hash', 'document')
      const result = registerSealedArtefact(artefactId, 'different-hash', 'document')

      expect(result).toBe(false)
    })
  })

  describe('Artefact Integrity Verification', () => {
    it('should verify valid artefact', () => {
      const artefactId = `verify-test-${Date.now()}`
      const hash = 'valid-hash-456'

      registerSealedArtefact(artefactId, hash, 'certificate')
      const result = verifyArtefactIntegrity(artefactId, hash)

      expect(result.valid).toBe(true)
    })

    it('should detect tampered artefact', () => {
      const artefactId = `tamper-test-${Date.now()}`
      const originalHash = 'original-789'
      const tamperedHash = 'tampered-999'

      registerSealedArtefact(artefactId, originalHash, 'report')
      const result = verifyArtefactIntegrity(artefactId, tamperedHash)

      expect(result.valid).toBe(false)
      expect(result.message).toContain('INTEGRITY VIOLATION')
    })

    it('should report unregistered artefact', () => {
      const result = verifyArtefactIntegrity('non-existent-id', 'any-hash')

      expect(result.valid).toBe(false)
      expect(result.message).toContain('not found')
    })
  })

  describe('Timestamp Validation', () => {
    it('should accept current timestamp', () => {
      const result = validateTimestamp(Date.now())

      expect(result.valid).toBe(true)
    })

    it('should accept recent past timestamp', () => {
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
      const result = validateTimestamp(fiveMinutesAgo)

      expect(result.valid).toBe(true)
    })

    it('should reject future timestamp', () => {
      const futureTime = Date.now() + (5 * 60 * 1000) // 5 minutes in future
      const result = validateTimestamp(futureTime)

      expect(result.valid).toBe(false)
      expect(result.message).toContain('TIMESTAMP VIOLATION')
    })
  })

  describe('Operation Validation', () => {
    it('should allow read operations on sealed artefacts', () => {
      const artefactId = `sealed-op-test-${Date.now()}`
      registerSealedArtefact(artefactId, 'test-hash', 'document')

      expect(validateOperation('view', artefactId).allowed).toBe(true)
      expect(validateOperation('verify', artefactId).allowed).toBe(true)
      expect(validateOperation('print', artefactId).allowed).toBe(true)
    })

    it('should block dangerous operations', () => {
      expect(validateOperation('delete_audit').allowed).toBe(false)
      expect(validateOperation('modify_hash').allowed).toBe(false)
      expect(validateOperation('forge_signature').allowed).toBe(false)
      expect(validateOperation('bypass_seal').allowed).toBe(false)
      expect(validateOperation('backdate').allowed).toBe(false)
    })

    it('should allow normal operations', () => {
      expect(validateOperation('create').allowed).toBe(true)
      expect(validateOperation('read').allowed).toBe(true)
    })
  })

  describe('Custody Chain Verification', () => {
    it('should verify valid chain', async () => {
      const events = [
        { hash: 'hash1', priorHash: undefined, timestamp: 1000 },
        { hash: 'hash2', priorHash: 'hash1', timestamp: 2000 },
        { hash: 'hash3', priorHash: 'hash2', timestamp: 3000 }
      ]

      const result = await verifyCustodyChain(events)

      expect(result.valid).toBe(true)
    })

    it('should detect broken chain', async () => {
      const events = [
        { hash: 'hash1', priorHash: undefined, timestamp: 1000 },
        { hash: 'hash2', priorHash: 'wrong-hash', timestamp: 2000 },
        { hash: 'hash3', priorHash: 'hash2', timestamp: 3000 }
      ]

      const result = await verifyCustodyChain(events)

      expect(result.valid).toBe(false)
      expect(result.brokenAt).toBe(1)
      expect(result.message).toContain('CHAIN VIOLATION')
    })

    it('should detect timestamp regression', async () => {
      const events = [
        { hash: 'hash1', priorHash: undefined, timestamp: 3000 },
        { hash: 'hash2', priorHash: 'hash1', timestamp: 2000 }, // Earlier than previous!
        { hash: 'hash3', priorHash: 'hash2', timestamp: 1000 }
      ]

      const result = await verifyCustodyChain(events)

      expect(result.valid).toBe(false)
      expect(result.message).toContain('TIMESTAMP VIOLATION')
    })

    it('should handle empty chain', async () => {
      const result = await verifyCustodyChain([])

      expect(result.valid).toBe(true)
    })
  })
})
