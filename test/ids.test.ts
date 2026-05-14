import { describe, it, expect } from 'vitest'
import { resolveSong, GRATEFUL_DEAD_MBID } from '../lib/ids'

describe('ids', () => {
  describe('GRATEFUL_DEAD_MBID', () => {
    it('should have the correct MusicBrainz ID', () => {
      expect(GRATEFUL_DEAD_MBID).toBe('6faa7ca7-0d99-4a5e-bfa6-1fd5037520c6')
    })
  })

  describe('resolveSong', () => {
    it('should normalize common song titles', () => {
      const result = resolveSong({ title: 'Dark Star' })
      expect(result.normalizedTitle).toBe('dark star')
      expect(result.aliases).toContain('dark star')
      expect(result.aliases).toContain('darkstar')
    })

    it('should handle variations with parentheses', () => {
      const result = resolveSong({ title: 'Dark Star (Live)' })
      expect(result.normalizedTitle).toBe('dark star')
      expect(result.aliases).toContain('dark star (live)')
    })

    it('should handle apostrophes', () => {
      const result = resolveSong({ title: "Truckin'" })
      expect(result.normalizedTitle).toBe('truckin')
      expect(result.aliases).toContain("truckin'")
    })

    it('should handle abbreviations', () => {
      const result = resolveSong({ title: 'FOTD' })
      expect(result.normalizedTitle).toBe('friend of the devil')
      expect(result.aliases).toContain('fotd')
    })

    it('should handle unknown songs', () => {
      const result = resolveSong({ title: 'Unknown Song' })
      expect(result.normalizedTitle).toBe('unknown song')
      expect(result.aliases).toEqual(['Unknown Song'])
    })

    it('should handle empty titles', () => {
      const result = resolveSong({ title: '' })
      expect(result.normalizedTitle).toBe('')
      expect(result.aliases).toEqual([''])
    })

    it('should handle whitespace', () => {
      const result = resolveSong({ title: '  Dark Star  ' })
      expect(result.normalizedTitle).toBe('dark star')
      expect(result.aliases).toContain('dark star')
    })

    it('should return unique aliases', () => {
      const result = resolveSong({ title: 'Dark Star' })
      const uniqueAliases = [...new Set(result.aliases)]
      expect(result.aliases).toEqual(uniqueAliases)
    })
  })
})