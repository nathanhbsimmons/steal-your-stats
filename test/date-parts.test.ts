import { describe, it, expect } from 'vitest'
import { getDateParts, ordinal } from '@/lib/date-parts'

describe('getDateParts', () => {
  it('derives the true historical weekday for a given date, ignoring the current clock', () => {
    // July 12, 1976 was a Monday.
    expect(getDateParts('1976-07-12').weekday).toBe('Monday')
  })

  it('is stable regardless of local timezone (parses as UTC)', () => {
    const parts = getDateParts('2000-01-01')
    expect(parts.year).toBe(2000)
    expect(parts.monthName).toBe('January')
    expect(parts.day).toBe(1)
  })

  it('formats month name and ordinal day', () => {
    const parts = getDateParts('1977-05-08')
    expect(parts.monthName).toBe('May')
    expect(parts.ordinalDay).toBe('8th')
    expect(parts.year).toBe(1977)
  })
})

describe('ordinal', () => {
  it('handles the 11th-13th special case', () => {
    expect(ordinal(11)).toBe('11th')
    expect(ordinal(12)).toBe('12th')
    expect(ordinal(13)).toBe('13th')
  })

  it('handles 1st/2nd/3rd and their teens exception', () => {
    expect(ordinal(1)).toBe('1st')
    expect(ordinal(2)).toBe('2nd')
    expect(ordinal(3)).toBe('3rd')
    expect(ordinal(21)).toBe('21st')
    expect(ordinal(22)).toBe('22nd')
    expect(ordinal(23)).toBe('23rd')
  })

  it('defaults to th', () => {
    expect(ordinal(4)).toBe('4th')
    expect(ordinal(20)).toBe('20th')
  })
})
