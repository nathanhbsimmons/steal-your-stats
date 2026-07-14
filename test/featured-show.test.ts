import { describe, it, expect } from 'vitest'
import { pickFeaturedShow, sortShowsForFeature } from '@/lib/featured-show'
import type { ShowOnThisDay } from '@/lib/show-of-the-day-types'

function show(year: number, songs: string[] = []): ShowOnThisDay {
  return { date: `${year}-05-08`, year, venue: 'V', city: 'C', country: 'US', songs }
}

describe('pickFeaturedShow', () => {
  it('returns null for an empty list', () => {
    expect(pickFeaturedShow([])).toBeNull()
  })

  it('prefers shows with songs over shows without', () => {
    const withSongs = show(1995, ['Dark Star'])
    const withoutSongs = show(1977)
    expect(pickFeaturedShow([withoutSongs, withSongs])).toBe(withSongs)
  })

  it('prefers the 1967-1994 era when both have songs', () => {
    const era = show(1970, ['Dark Star'])
    const late = show(1995, ['Dark Star'])
    expect(pickFeaturedShow([late, era])).toBe(era)
  })

  it('tiebreak is deterministic for a given seed', () => {
    const a = show(1970, ['Dark Star'])
    const b = show(1978, ['Dark Star'])
    const first = pickFeaturedShow([a, b], '2026-07-13')
    const second = pickFeaturedShow([a, b], '2026-07-13')
    expect(first).toBe(second)
  })

  it('tiebreak varies across seeds instead of always favoring one year', () => {
    const a = show(1970, ['Dark Star'])
    const b = show(1978, ['Dark Star'])
    const c = show(1985, ['Dark Star'])
    const seeds = ['2026-01-01', '2026-02-14', '2026-03-09', '2026-04-20', '2026-05-08', '2026-06-01', '2026-07-13']
    const yearsPicked = new Set(seeds.map(seed => pickFeaturedShow([a, b, c], seed)?.year))
    expect(yearsPicked.size).toBeGreaterThan(1)
  })

  it('sortShowsForFeature does not mutate the input', () => {
    const input = [show(1995, ['x']), show(1977, ['y'])]
    const copy = [...input]
    sortShowsForFeature(input)
    expect(input).toEqual(copy)
  })
})
