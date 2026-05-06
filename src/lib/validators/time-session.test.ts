import { describe, it, expect } from 'vitest'
import { timeSessionUpdateSchema } from './time-session'

describe('timeSessionUpdateSchema', () => {
  it('accepts valid start_time and end_time', () => {
    const result = timeSessionUpdateSchema.safeParse({
      start_time: '2024-01-15T10:00:00.000Z',
      end_time: '2024-01-15T11:30:00.000Z',
      note: 'Worked on border',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.start_time).toBe('2024-01-15T10:00:00.000Z')
      expect(result.data.end_time).toBe('2024-01-15T11:30:00.000Z')
      expect(result.data.note).toBe('Worked on border')
    }
  })

  it('accepts valid start_time without end_time', () => {
    const result = timeSessionUpdateSchema.safeParse({
      start_time: '2024-01-15T10:00:00.000Z',
    })
    expect(result.success).toBe(true)
  })

  it('accepts empty string end_time (treated as no end time)', () => {
    const result = timeSessionUpdateSchema.safeParse({
      start_time: '2024-01-15T10:00:00.000Z',
      end_time: '',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing start_time', () => {
    const result = timeSessionUpdateSchema.safeParse({
      end_time: '2024-01-15T11:30:00.000Z',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty start_time', () => {
    const result = timeSessionUpdateSchema.safeParse({
      start_time: '',
      end_time: '2024-01-15T11:30:00.000Z',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid start_time format', () => {
    const result = timeSessionUpdateSchema.safeParse({
      start_time: 'not-a-date',
      end_time: '2024-01-15T11:30:00.000Z',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid end_time format', () => {
    const result = timeSessionUpdateSchema.safeParse({
      start_time: '2024-01-15T10:00:00.000Z',
      end_time: 'not-a-date',
    })
    expect(result.success).toBe(false)
  })

  it('rejects end_time before start_time', () => {
    const result = timeSessionUpdateSchema.safeParse({
      start_time: '2024-01-15T12:00:00.000Z',
      end_time: '2024-01-15T10:00:00.000Z',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const endTimeError = result.error.issues.find(
        (issue) => issue.path.includes('end_time')
      )
      expect(endTimeError?.message).toBe('End time must be after start time')
    }
  })

  it('rejects end_time equal to start_time', () => {
    const result = timeSessionUpdateSchema.safeParse({
      start_time: '2024-01-15T10:00:00.000Z',
      end_time: '2024-01-15T10:00:00.000Z',
    })
    expect(result.success).toBe(false)
  })

  it('rejects note longer than 1000 characters', () => {
    const result = timeSessionUpdateSchema.safeParse({
      start_time: '2024-01-15T10:00:00.000Z',
      note: 'a'.repeat(1001),
    })
    expect(result.success).toBe(false)
  })

  it('accepts note at exactly 1000 characters', () => {
    const result = timeSessionUpdateSchema.safeParse({
      start_time: '2024-01-15T10:00:00.000Z',
      note: 'a'.repeat(1000),
    })
    expect(result.success).toBe(true)
  })
})
