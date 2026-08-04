import { describe, it, expect } from 'vitest'
import { tokensToFilters } from '@/lib/services/show-index'
import type { ParsedToken } from '@/lib/search/query-parser'

const yearToken = (value: number): ParsedToken => ({ facet: 'year', value, label: `${value}`, raw: `${value}` })
const decadeToken = (value: number): ParsedToken => ({ facet: 'decade', value, label: `${value}s`, raw: `${value}s` })
const eraToken = (value: string): ParsedToken => ({ facet: 'era', value, label: value, raw: value })
const seasonToken = (): ParsedToken => ({ facet: 'season', value: { year: 1977, monthFrom: 3, monthTo: 5 }, label: 'Spring 1977', raw: 'spring 1977' })
const countryToken = (value: string): ParsedToken => ({ facet: 'country', value, label: value, raw: value })
const stateToken = (value: string): ParsedToken => ({ facet: 'state', value, label: value, raw: value })
const seriesToken = (value: string): ParsedToken => ({ facet: 'series', value, label: value, raw: value })
const recTypeToken = (value: 'sbd' | 'aud' | 'matrix'): ParsedToken => ({ facet: 'recordingType', value, label: value, raw: value })

describe('tokensToFilters: same-axis collisions', () => {
  describe('Time axis: rail beats token', () => {
    it('a rail decade drops a token-derived year', () => {
      const filters = tokensToFilters([yearToken(1977)], { decade: [1980] })
      expect(filters.decade).toEqual([1980])
      expect(filters.year).toBeUndefined()
    })

    it('a rail era drops a token-derived season', () => {
      const filters = tokensToFilters([seasonToken()], { eraId: ['brent'] })
      expect(filters.eraId).toEqual(['brent'])
      expect(filters.season).toBeUndefined()
    })

    it('a rail year drops a token-derived decade', () => {
      const filters = tokensToFilters([decadeToken(1970)], { year: 1977 })
      expect(filters.year).toBe(1977)
      expect(filters.decade).toBeUndefined()
    })

    it('a rail yearFrom/yearTo range drops a token-derived era', () => {
      const filters = tokensToFilters([eraToken('primal')], { yearFrom: 1972, yearTo: 1974 })
      expect(filters.yearFrom).toBe(1972)
      expect(filters.yearTo).toBe(1974)
      expect(filters.eraId).toBeUndefined()
    })

    it('leaves a token-derived Time field alone when rail has no Time selection', () => {
      const filters = tokensToFilters([yearToken(1977)], { country: ['united states'] })
      expect(filters.year).toBe(1977)
    })
  })

  describe('Time axis: defensive same-source resolution (era wins over decade)', () => {
    it('drops decade when both decade and eraId are set directly', () => {
      const filters = tokensToFilters([], { decade: [1970], eraId: ['brent'] })
      expect(filters.eraId).toEqual(['brent'])
      expect(filters.decade).toBeUndefined()
    })
  })

  describe('Place axis: rail beats token', () => {
    it('a rail state drops a token-derived country', () => {
      const filters = tokensToFilters([countryToken('france')], { state: ['california'] })
      expect(filters.state).toEqual(['california'])
      expect(filters.country).toBeUndefined()
    })

    it('a rail country drops a token-derived state', () => {
      const filters = tokensToFilters([stateToken('california')], { country: ['france'] })
      expect(filters.country).toEqual(['france'])
      expect(filters.state).toBeUndefined()
    })

    it('leaves a token-derived place field alone when rail has no place selection', () => {
      const filters = tokensToFilters([stateToken('california')], { decade: [1970] })
      expect(filters.state).toEqual(['california'])
    })
  })

  describe('Place axis: defensive same-source resolution (state wins over country)', () => {
    it('drops country when both country and state are set directly', () => {
      // Every state in this dataset belongs to exactly one country, so state already
      // implies it — keeping a conflicting country would just zero out results.
      const filters = tokensToFilters([], { country: ['france'], state: ['california'] })
      expect(filters.state).toEqual(['california'])
      expect(filters.country).toBeUndefined()
    })
  })

  describe('recordingType: rail beats token (single-valued, can genuinely conflict)', () => {
    it('rail aud drops a token-derived sbd', () => {
      const filters = tokensToFilters([recTypeToken('sbd')], { recordingType: 'aud' })
      expect(filters.recordingType).toBe('aud')
    })

    it('leaves a token-derived recordingType alone when rail does not set one', () => {
      const filters = tokensToFilters([recTypeToken('sbd')], {})
      expect(filters.recordingType).toBe('sbd')
    })
  })

  describe('series: additive union, never overridden', () => {
    it('unions token-derived and rail-derived series rather than one replacing the other', () => {
      const filters = tokensToFilters([seriesToken("Dick's Picks")], { series: ["Dave's Picks"] })
      expect(filters.series).toEqual(expect.arrayContaining(["Dick's Picks", "Dave's Picks"]))
      expect(filters.series).toHaveLength(2)
    })

    it('de-duplicates when the same series appears in both sources', () => {
      const filters = tokensToFilters([seriesToken("Dick's Picks")], { series: ["Dick's Picks"] })
      expect(filters.series).toEqual(["Dick's Picks"])
    })

    it('falls back to token series when rail has none', () => {
      const filters = tokensToFilters([seriesToken("Dick's Picks")], {})
      expect(filters.series).toEqual(["Dick's Picks"])
    })
  })

  describe('decade/era/country/state: multi-select within one facet is additive, not a collision', () => {
    it('keeps multiple rail-selected decades together ("70s or 80s")', () => {
      const filters = tokensToFilters([], { decade: [1970, 1980] })
      expect(filters.decade).toEqual(expect.arrayContaining([1970, 1980]))
      expect(filters.decade).toHaveLength(2)
    })

    it('keeps multiple rail-selected eras together', () => {
      const filters = tokensToFilters([], { eraId: ['primal', 'brent'] })
      expect(filters.eraId).toEqual(expect.arrayContaining(['primal', 'brent']))
      expect(filters.eraId).toHaveLength(2)
    })

    it('keeps multiple rail-selected countries together', () => {
      const filters = tokensToFilters([], { country: ['united states', 'france'] })
      expect(filters.country).toEqual(expect.arrayContaining(['united states', 'france']))
    })

    it('keeps multiple rail-selected states together', () => {
      const filters = tokensToFilters([], { state: ['california', 'new york'] })
      expect(filters.state).toEqual(expect.arrayContaining(['california', 'new york']))
    })

    it('still drops a token decade once rail has taken a position on the Time axis, even via decade itself', () => {
      // Multi-select is a rail-only affordance (checkbox clicks accumulate into the
      // array); the "rail beats token" axis rule is unchanged and unconditional — once
      // rail has any Time value, an ambient typed word for that axis is dropped, not
      // merged. This keeps precedence simple and matches how decade-vs-era already work.
      const filters = tokensToFilters([decadeToken(1980)], { decade: [1970] })
      expect(filters.decade).toEqual([1970])
    })
  })

  describe('non-collisions: independent axes combine normally', () => {
    it('combines a Time rail selection with a Place rail selection', () => {
      const filters = tokensToFilters([], { decade: [1970], state: ['california'] })
      expect(filters.decade).toEqual([1970])
      expect(filters.state).toEqual(['california'])
    })

    it('combines hasAudio and hasRelease booleans freely (never contradictory)', () => {
      const filters = tokensToFilters([{ facet: 'hasAudio', value: true, label: 'has audio', raw: 'has audio' }], { hasRelease: true })
      expect(filters.hasAudio).toBe(true)
      expect(filters.hasRelease).toBe(true)
    })

    it('combines series with hasRelease without needing exclusivity (series implies release)', () => {
      const filters = tokensToFilters([], { hasRelease: true, series: ["Dick's Picks"] })
      expect(filters.hasRelease).toBe(true)
      expect(filters.series).toEqual(["Dick's Picks"])
    })

    it('a tour selection combines with a Time selection (cross-axis AND is normal, not a collision)', () => {
      const filters = tokensToFilters([], { tour: 'Summer Tour 1990', decade: [1990] })
      expect(filters.tour).toBe('Summer Tour 1990')
      expect(filters.decade).toEqual([1990])
    })
  })
})
