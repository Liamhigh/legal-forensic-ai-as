import { describe, it, expect } from 'vitest';

describe('Sanity Tests', () => {
  it('should pass basic assertion', () => {
    expect(true).toBe(true);
  });

  it('should verify environment is configured', () => {
    // In Node environment, window is undefined; in browser it's an object
    // This test verifies the test environment can detect both contexts
    const isNodeEnv = typeof window === 'undefined';
    const isBrowserEnv = typeof window === 'object';
    expect(isNodeEnv || isBrowserEnv).toBe(true);
  });
});
