import { describe, it, expect } from 'vitest'
import { parseArchiveSetlist } from '../lib/parse-archive-setlist'

describe('parseArchiveSetlist', () => {
  it('returns empty array for empty input', () => {
    expect(parseArchiveSetlist('')).toEqual([])
    expect(parseArchiveSetlist('   ')).toEqual([])
  })

  it('parses a simple comma-separated list', () => {
    const result = parseArchiveSetlist("Don't Ease Me In, Truckin', Casey Jones")
    expect(result).toEqual(["Don't Ease Me In", "Truckin'", 'Casey Jones'])
  })

  it('splits songs joined by -> segue markers', () => {
    const result = parseArchiveSetlist('China Cat Sunflower-> I Know You Rider, Good Lovin')
    expect(result).toEqual(['China Cat Sunflower', 'I Know You Rider', 'Good Lovin'])
  })

  it('handles trailing -> at end of description', () => {
    const result = parseArchiveSetlist("Good Lovin'-> Drums->")
    expect(result).toEqual(["Good Lovin'", 'Drums'])
  })

  it('handles space-surrounded > segue markers', () => {
    const result = parseArchiveSetlist('Dark Star > El Paso, Truckin')
    expect(result).toEqual(['Dark Star', 'El Paso', 'Truckin'])
  })

  it('strips set header labels', () => {
    const result = parseArchiveSetlist(
      "Set I: Truckin', Sugar Magnolia\nSet II: Dark Star, St. Stephen\nEncore: Casey Jones"
    )
    expect(result).toContain("Truckin'")
    expect(result).toContain('Sugar Magnolia')
    expect(result).toContain('Dark Star')
    expect(result).toContain('St. Stephen')
    expect(result).toContain('Casey Jones')
    expect(result).toHaveLength(5)
  })

  it('strips numeric set labels', () => {
    const result = parseArchiveSetlist('Set 1: Friend of the Devil, Set 2: Truckin')
    expect(result).toContain('Friend of the Devil')
    expect(result).toContain('Truckin')
  })

  it('truncates at a blank line (recording notes section)', () => {
    const result = parseArchiveSetlist("Dark Star, St. Stephen\n\nSource: SBD > DAT\nRecorded by Bob Smith")
    expect(result).toEqual(['Dark Star', 'St. Stephen'])
  })

  it('truncates at Source: keyword on its own line', () => {
    const result = parseArchiveSetlist("Truckin', Sugar Magnolia\nSource: SBD")
    expect(result).toEqual(["Truckin'", 'Sugar Magnolia'])
  })

  it('truncates at Taper: keyword', () => {
    const result = parseArchiveSetlist("Casey Jones, One More Saturday Night\nTaper: Jane Doe")
    expect(result).toEqual(['Casey Jones', 'One More Saturday Night'])
  })

  it('strips HTML tags', () => {
    const result = parseArchiveSetlist('<br>Fire on the Mountain<br>Estimated Prophet')
    expect(result).toContain('Fire on the Mountain')
    expect(result).toContain('Estimated Prophet')
  })

  it('handles the real 1970-06-06 Fillmore West description', () => {
    const desc =
      "Don't Ease Me In, The Frozen Logger, Friend Of The Devil, Candyman, Deep Elem Blues, " +
      "Cumberland Blues, Wake Up Little Susie, New Speedway Boogie Morning Dew, Me & My Uncle, " +
      "Casey Jones, Dancin' In The Streets, Next Time You See Me, China Cat Sunflower-> I Know You Rider, " +
      "Good Lovin'-> Drums->"
    const result = parseArchiveSetlist(desc)
    // China Cat + I Know You Rider split correctly
    expect(result).toContain('China Cat Sunflower')
    expect(result).toContain('I Know You Rider')
    // Good Lovin' + Drums split correctly, trailing -> not included
    expect(result).toContain("Good Lovin'")
    expect(result).toContain('Drums')
    // Reasonable total count (the "New Speedway Boogie Morning Dew" merge means ~15)
    expect(result.length).toBeGreaterThanOrEqual(14)
    expect(result.length).toBeLessThanOrEqual(17)
  })

  it('does not include empty or single-char tokens', () => {
    const result = parseArchiveSetlist('Truckin,,,Casey Jones, ,')
    expect(result.every(s => s.length >= 2)).toBe(true)
  })

  it('does not include very long tokens (prose / recording notes on same line)', () => {
    const long = 'A'.repeat(81)
    const result = parseArchiveSetlist(`Truckin', ${long}, Casey Jones`)
    expect(result).not.toContain(long)
    expect(result).toContain("Truckin'")
    expect(result).toContain('Casey Jones')
  })
})
