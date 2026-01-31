import { describe, it, expect } from 'vitest'
import { normalizeDate } from './date-normalizer.js'

describe('normalizeDate', () => {
  it('should normalize ISO date strings', () => {
    const date = '2024-01-20T12:00:00Z'
    expect(normalizeDate(date)).toBe('2024-01-20T12:00:00.000Z')
  })

  it('should normalize YYYY-MM-DD', () => {
    expect(normalizeDate('2024-01-20')).toBe(
      new Date('2024-01-20').toISOString()
    )
  })

  it('should normalize RFC2822 dates', () => {
    expect(normalizeDate('Wed, 21 Oct 2015 07:28:00 GMT')).toBe(
      '2015-10-21T07:28:00.000Z'
    )
  })

  it('should handle whitespace', () => {
    expect(normalizeDate('  2024-01-20  ')).toBe(
      new Date('2024-01-20').toISOString()
    )
  })

  it('should return null for invalid dates', () => {
    expect(normalizeDate('not-a-date')).toBeNull()
    expect(normalizeDate('2024-13-45')).toBeNull()
  })

  it('should return null for empty or null input', () => {
    expect(normalizeDate('')).toBeNull()
    expect(normalizeDate('   ')).toBeNull()
    expect(normalizeDate(null)).toBeNull()
  })

  it('should handle short dates', () => {
    expect(normalizeDate('2024')).toBe(new Date('2024').toISOString())
  })

  it('should handle historical dates', () => {
    expect(normalizeDate('1850-01-01')).toBe(
      new Date('1850-01-01').toISOString()
    )
  })

  it('should handle ancient dates (BC)', () => {
    // Note: JS Date handles negative years. Year -500 is roughly Tao Te Ching era.
    const bcDate = '-000500-01-01'
    const normalized = normalizeDate(bcDate)
    expect(normalized).not.toBeNull()
    expect(new Date(normalized!).getUTCFullYear()).toBe(-500)
  })

  it('should clean suffixes like (Updated) or | News', () => {
    expect(normalizeDate('2024-01-20 (Updated)')).toBe(
      new Date('2024-01-20').toISOString()
    )
    expect(normalizeDate('2024-01-20 | World News')).toBe(
      new Date('2024-01-20').toISOString()
    )
  })

  it('should clean prefixes like Published on:', () => {
    expect(normalizeDate('Published on: 2024-01-20')).toBe(
      new Date('2024-01-20').toISOString()
    )
    // "Last updated at 2024-01-21" should be cleaned to "2024-01-21" which is parsed as UTC
    expect(normalizeDate('Last updated at 2024-01-21')).toBe(
      new Date('2024-01-21').toISOString()
    )
    // For non-ISO strings like "Jan 22, 2024", it will be parsed as local time.
    // We should construct the expectation the same way.
    const expectedJan22 = new Date('Jan 22, 2024').toISOString()
    expect(normalizeDate('Posted on Jan 22, 2024')).toBe(expectedJan22)
  })

  it('should handle suffixes like "by Admin" or "5 min read"', () => {
    expect(normalizeDate('2024-01-20 by Riceball')).toBe(
      new Date('2024-01-20').toISOString()
    )
    const expected = new Date('Jan 20, 2024').toISOString()
    expect(normalizeDate('Jan 20, 2024 - 10 min read')).toBe(expected)
  })

  it('should fail sanity check for unrealistic years', () => {
    expect(normalizeDate('5000-01-01')).toBeNull()
    expect(normalizeDate('-20000-01-01')).toBeNull()
  })
})
