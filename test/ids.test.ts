import { describe, it, expect } from 'vitest'
import {
  normalizeTitle,
  generateAliases,
  calculateConfidence,
  resolveSong,
  findBestMatch,
  ARTIST_MBIDS,
} from '../lib/ids'

describe('normalizeTitle', () => {
  it('should remove common prefixes', () => {
    expect(normalizeTitle('The Dark Star')).toBe('Dark Star')
    expect(normalizeTitle('A Friend of the Devil')).toBe('Friend of the Devil')
    expect(normalizeTitle('An American Beauty')).toBe('American Beauty')
  })

  it('should handle medleys and segues', () => {
    expect(normalizeTitle('Dark Star > St. Stephen')).toBe('Dark Star > St. Stephen')
    expect(normalizeTitle('Dark Star->St. Stephen')).toBe('Dark Star > St. Stephen')
    expect(normalizeTitle('Dark Star→St. Stephen')).toBe('Dark Star > St. Stephen')
  })

  it('should remove common suffixes', () => {
    expect(normalizeTitle('Dark Star (Reprise)')).toBe('Dark Star')
    expect(normalizeTitle('Dark Star (Encore)')).toBe('Dark Star')
    expect(normalizeTitle('Dark Star (Outro)')).toBe('Dark Star')
  })

  it('should standardize punctuation', () => {
    expect(normalizeTitle("Friend's of the Devil")).toBe("Friend's of the Devil")
    expect(normalizeTitle('Friend`s of the Devil')).toBe("Friend's of the Devil")
    expect(normalizeTitle("Friend's of the Devil")).toBe("Friend's of the Devil")
  })

  it('should handle empty or whitespace titles', () => {
    expect(normalizeTitle('')).toBe('')
    expect(normalizeTitle('   ')).toBe('')
    expect(normalizeTitle('  Dark Star  ')).toBe('Dark Star')
  })
})

describe('generateAliases', () => {
  it('should generate basic aliases', () => {
    const aliases = generateAliases('Dark Star')
    expect(aliases).toContain('Dark Star')
    expect(aliases).toContain('dark star')
  })

  it('should handle medleys', () => {
    const aliases = generateAliases('Dark Star > St. Stephen')
    expect(aliases).toContain('Dark Star > St. Stephen')
    expect(aliases).toContain('Dark Star')
    expect(aliases).toContain('St. Stephen')
    expect(aliases).toContain('dark star')
    expect(aliases).toContain('st. stephen')
  })

  it('should handle punctuation variations', () => {
    const aliases = generateAliases("Friend's of the Devil")
    expect(aliases).toContain("Friend's of the Devil")
    expect(aliases).toContain('Friends of the Devil')
    expect(aliases).toContain("friend's of the devil")
  })

  it('should not include empty aliases', () => {
    const aliases = generateAliases('Dark Star')
    expect(aliases.every(alias => alias.length > 0)).toBe(true)
  })
})

describe('calculateConfidence', () => {
  it('should return 1.0 for exact matches', () => {
    expect(calculateConfidence('Dark Star', 'Dark Star')).toBe(1.0)
  })

  it('should return 0.9 for normalized matches', () => {
    expect(calculateConfidence('The Dark Star', 'Dark Star')).toBe(0.9)
    expect(calculateConfidence('Dark Star (Reprise)', 'Dark Star')).toBe(0.9)
  })

  it('should return 0.8 for case-insensitive matches', () => {
    expect(calculateConfidence('dark star', 'Dark Star')).toBe(0.8)
    expect(calculateConfidence('DARK STAR', 'Dark Star')).toBe(0.8)
  })

  it('should return 0.7 for high word match ratio', () => {
    expect(calculateConfidence('Dark Star Jam', 'Dark Star')).toBe(0.7)
  })

  it('should return 0.7 for medium word match ratio', () => {
    expect(calculateConfidence('Dark Star Blues', 'Dark Star Jam')).toBe(0.7)
  })

  it('should return 0 for no word match', () => {
    expect(calculateConfidence('Dark Star', 'Friend of the Devil')).toBe(0)
  })

  it('should return 0 for no match', () => {
    expect(calculateConfidence('Dark Star', 'Truckin')).toBe(0)
  })

  it('should handle empty strings', () => {
    expect(calculateConfidence('', 'Dark Star')).toBe(0)
    expect(calculateConfidence('Dark Star', '')).toBe(0)
    expect(calculateConfidence('', '')).toBe(0)
  })
})

describe('resolveSong', () => {
  it('should resolve a basic song', async () => {
    const result = await resolveSong({ title: 'Dark Star' })
    
    expect(result.normalizedTitle).toBe('Dark Star')
    expect(result.aliases).toContain('Dark Star')
    expect(result.aliases).toContain('dark star')
    expect(result.confidence).toBe(1.0)
  })

  it('should handle complex titles', async () => {
    const result = await resolveSong({ title: 'The Dark Star > St. Stephen (Reprise)' })
    
    expect(result.normalizedTitle).toBe('Dark Star > St. Stephen')
    expect(result.aliases).toContain('Dark Star')
    expect(result.aliases).toContain('St. Stephen')
  })

  it('should throw error for empty title', async () => {
    await expect(resolveSong({ title: '' })).rejects.toThrow('Song title is required')
  })

  it('should accept artist MBID', async () => {
    const result = await resolveSong({ 
      title: 'Dark Star', 
      artistMbid: ARTIST_MBIDS.GRATEFUL_DEAD 
    })
    
    expect(result.normalizedTitle).toBe('Dark Star')
  })
})

describe('findBestMatch', () => {
  const candidates = [
    { title: 'Dark Star', id: '1' },
    { title: 'Dark Star Jam', id: '2' },
    { title: 'Friend of the Devil', id: '3' },
    { title: 'Truckin', id: '4' },
  ]

  it('should find exact match', () => {
    const result = findBestMatch('Dark Star', candidates)
    expect(result.match?.id).toBe('1')
    expect(result.confidence).toBe(1.0)
  })

  it('should find best partial match', () => {
    const result = findBestMatch('Dark Star Blues', candidates)
    expect(result.match?.id).toBe('1')
    expect(result.confidence).toBeGreaterThan(0.5)
  })

  it('should return null for no candidates', () => {
    const result = findBestMatch('Dark Star', [])
    expect(result.match).toBeNull()
    expect(result.confidence).toBe(0)
  })

  it('should handle case-insensitive matching', () => {
    const result = findBestMatch('dark star', candidates)
    expect(result.match?.id).toBe('1')
    expect(result.confidence).toBe(0.8)
  })
})

describe('ARTIST_MBIDS', () => {
  it('should export Grateful Dead MBID', () => {
    expect(ARTIST_MBIDS.GRATEFUL_DEAD).toBeDefined()
    expect(typeof ARTIST_MBIDS.GRATEFUL_DEAD).toBe('string')
  })
})
