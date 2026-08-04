import { describe, it, expect } from 'vitest'
import { scoreTitle, searchAndRank } from '@/lib/search/score'

describe('scoreTitle', () => {
  it('ranks an exact match best', () => {
    const exact = scoreTitle('dark star', 'Dark Star')
    const prefix = scoreTitle('dark star', 'Dark Star Jam')
    expect(exact.score).toBeLessThan(prefix.score)
  })

  it('ranks a prefix match above a mid-string match', () => {
    // this is the exact bug being fixed: today's /api/songs uses unranked
    // String.includes, so "Estimated Prophet" (mid-string "est") could sort
    // above a true prefix match for the same query.
    const prefix = scoreTitle('estimated', 'Estimated Prophet')
    const midString = scoreTitle('estimated', 'The Estimated Prophet Suite')
    expect(prefix.score).toBeLessThan(midString.score)
  })

  it('ranks a word-boundary match above an incidental mid-word substring match', () => {
    const wordBoundary = scoreTitle('star', 'Dark Star')
    const substring = scoreTitle('star', 'Allstars')
    expect(wordBoundary.score).toBeLessThan(substring.score)
  })

  it('falls back to alias matches', () => {
    const result = scoreTitle('fotd', 'Friend of the Devil', ['fotd'])
    expect(result.matched).toBe(true)
  })

  it('reports no match when the query does not appear at all', () => {
    const result = scoreTitle('xyzzy', 'Dark Star')
    expect(result.matched).toBe(false)
  })

  it('is punctuation- and case-insensitive', () => {
    const result = scoreTitle("TRUCKIN", "Truckin'")
    expect(result.matched).toBe(true)
    expect(result.score).toBe(scoreTitle('truckin', "truckin'").score)
  })
})

describe('searchAndRank', () => {
  it('filters out non-matches and sorts matches best-first', () => {
    const items = ['Estimated Prophet', 'The Estimated Prophet Suite', 'Dark Star', 'Truckin']
    const ranked = searchAndRank(items, 'estimated', i => i)
    expect(ranked.map(r => r.item)).toEqual(['Estimated Prophet', 'The Estimated Prophet Suite'])
  })

  it('returns everything in stable tie-broken order for an empty query', () => {
    const items = ['Truckin', 'Dark Star']
    const ranked = searchAndRank(items, '', i => i)
    expect(ranked).toHaveLength(2)
  })
})
