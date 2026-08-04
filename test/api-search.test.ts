import { describe, it, expect } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/search/route'

async function callSearch(qs: string) {
  const req = new NextRequest(`http://localhost/api/search?${qs}`)
  const res = await GET(req)
  return res.json()
}

describe('GET /api/search', () => {
  it('returns empty sections and a chip token for a query with no free text', async () => {
    const json = await callSearch('q=1977')
    expect(json.tokens).toEqual([{ facet: 'year', value: 1977, label: '1977', raw: '1977' }])
    expect(json.text).toBe('')
    expect(json.songs).toEqual([])
    expect(json.totals.shows).toBeGreaterThan(0)
  })

  it('narrows shows to a single result for an exact date + venue query', async () => {
    const json = await callSearch(`q=${encodeURIComponent('cornell 5/8/77')}`)
    expect(json.totals.shows).toBe(1)
    expect(json.shows[0].date).toBe('1977-05-08')
  })

  it('applies rail filters on top of a free-text query', async () => {
    const withoutFilter = await callSearch(`q=${encodeURIComponent('barton hall')}`)
    const withAudio = await callSearch(`q=${encodeURIComponent('barton hall')}&audio=1`)
    expect(withAudio.totals.shows).toBeLessThanOrEqual(withoutFilter.totals.shows)
    for (const show of withAudio.shows) expect(show.hasAudio).toBe(true)
  })

  it('paginates shows', async () => {
    const page1 = await callSearch('q=1977&page=1')
    const page2 = await callSearch('q=1977&page=2')
    expect(page1.shows[0]?.date).not.toBe(page2.shows[0]?.date)
  })

  it('returns no songs/venues/releases but all shows for a fully empty query', async () => {
    // The API itself has no "inactive" concept — that gate lives client-side. With no
    // text and no filters it returns the unfiltered show index; songs/venues/releases
    // stay empty since they're only searched when there's free text to match against.
    const json = await callSearch('q=')
    expect(json.songs).toEqual([])
    expect(json.venues).toEqual([])
    expect(json.releases).toEqual([])
    expect(json.totals.shows).toBeGreaterThan(2000)
  })
})
