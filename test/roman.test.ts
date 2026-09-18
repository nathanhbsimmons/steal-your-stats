import { describe, it, expect } from 'vitest'
import { toRoman } from '@/lib/roman'

describe('toRoman', () => {
  it('converts the numerals used by set headers and leaderboards', () => {
    expect(toRoman(1)).toBe('I')
    expect(toRoman(4)).toBe('IV')
    expect(toRoman(5)).toBe('V')
    expect(toRoman(9)).toBe('IX')
    expect(toRoman(10)).toBe('X')
    expect(toRoman(12)).toBe('XII')
    expect(toRoman(20)).toBe('XX')
  })

  it('falls back to the arabic string for out-of-range input', () => {
    expect(toRoman(0)).toBe('0')
    expect(toRoman(-3)).toBe('-3')
  })
})
