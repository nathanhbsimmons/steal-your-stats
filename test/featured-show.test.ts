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

  it('tiebreaks toward 1977', () => {
    const a = show(1970, ['Dark Star'])
    const b = show(1978, ['Dark Star'])
    expect(pickFeaturedShow([a, b])).toBe(b)
  })

  it('sortShowsForFeature does not mutate the input', () => {
    const input = [show(1995, ['x']), show(1977, ['y'])]
    const copy = [...input]
    sortShowsForFeature(input)
    expect(input).toEqual(copy)
  })
})
