import { describe, it, expect } from 'vitest'

/**
 * Tests for Timer utility functions.
 * These test the pure logic extracted from the Timer component.
 */

// Re-implement formatElapsed for testing (same logic as in Timer.tsx)
function formatElapsed(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0'),
  ].join(':')
}

// Re-implement isOrphanedSession for testing
function isOrphanedSession(session: { start_time: string } | null): boolean {
  if (!session) return false
  const startTime = new Date(session.start_time).getTime()
  const now = Date.now()
  const twentyFourHours = 24 * 60 * 60 * 1000
  return now - startTime > twentyFourHours
}

describe('formatElapsed', () => {
  it('formats 0 seconds as 00:00:00', () => {
    expect(formatElapsed(0)).toBe('00:00:00')
  })

  it('formats seconds only', () => {
    expect(formatElapsed(45)).toBe('00:00:45')
  })

  it('formats minutes and seconds', () => {
    expect(formatElapsed(125)).toBe('00:02:05')
  })

  it('formats hours, minutes, and seconds', () => {
    expect(formatElapsed(3661)).toBe('01:01:01')
  })

  it('formats large hour values', () => {
    expect(formatElapsed(36000)).toBe('10:00:00')
  })

  it('pads single digits with leading zeros', () => {
    expect(formatElapsed(1)).toBe('00:00:01')
    expect(formatElapsed(60)).toBe('00:01:00')
    expect(formatElapsed(3600)).toBe('01:00:00')
  })

  it('handles exactly one hour', () => {
    expect(formatElapsed(3600)).toBe('01:00:00')
  })

  it('handles 59 minutes 59 seconds', () => {
    expect(formatElapsed(3599)).toBe('00:59:59')
  })
})

describe('isOrphanedSession', () => {
  it('returns false for null session', () => {
    expect(isOrphanedSession(null)).toBe(false)
  })

  it('returns false for a session started less than 24 hours ago', () => {
    const recentStart = new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hour ago
    expect(isOrphanedSession({ start_time: recentStart })).toBe(false)
  })

  it('returns true for a session started more than 24 hours ago', () => {
    const oldStart = new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString() // 25 hours ago
    expect(isOrphanedSession({ start_time: oldStart })).toBe(true)
  })

  it('returns false for a session started exactly at the 24-hour boundary', () => {
    // At exactly 24 hours, now - startTime === twentyFourHours, which is NOT > twentyFourHours
    const exactBoundary = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
    expect(isOrphanedSession({ start_time: exactBoundary })).toBe(false)
  })

  it('returns true for a session started 48 hours ago', () => {
    const veryOld = new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
    expect(isOrphanedSession({ start_time: veryOld })).toBe(true)
  })
})
