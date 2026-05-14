import { describe, it, expect } from 'vitest'
import { formatArchiveTrackName } from '../lib/hooks/use-audio-player'

describe('formatArchiveTrackName', () => {
  it('parses single-disc track numbers', () => {
    expect(formatArchiveTrackName('gd1993-09-09d1t01')).toBe('Track 1')
    expect(formatArchiveTrackName('gd1993-09-09d1t12')).toBe('Track 12')
  })

  it('parses multi-disc track numbers', () => {
    expect(formatArchiveTrackName('gd1993-09-09d2t03')).toBe('Track 3 (Disc 2)')
    expect(formatArchiveTrackName('gd1977-05-08d3t01')).toBe('Track 1 (Disc 3)')
  })

  it('handles GratefulMondays identifier patterns', () => {
    expect(formatArchiveTrackName('GratefulMondays2016-06-27d1t01')).toBe('Track 1')
    expect(formatArchiveTrackName('GratefulMondays2016-06-27d2t05')).toBe('Track 5 (Disc 2)')
  })

  it('cleans up filenames without disc/track pattern', () => {
    const result = formatArchiveTrackName('some-random-filename')
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })

  it('falls back to raw filename when cleaning produces empty string', () => {
    const result = formatArchiveTrackName('abc')
    expect(result).toBe('abc')
  })

  it('handles uppercase D and T in pattern', () => {
    expect(formatArchiveTrackName('gd1993-09-09D1T05')).toBe('Track 5')
  })
})
