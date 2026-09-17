import { describe, it, expect } from 'vitest'
import { getQuoteOfTheDay, QUOTE_POOL_SIZE } from '@/lib/quote-of-the-day'
import lyrics from '@/lib/song-of-the-day-lyrics.json'
import type { ShowOfTheDayPayload } from '@/lib/show-of-the-day-types'

function dateKeys(startYear: number, count: number): string[] {
  const keys: string[] = []
  const d = new Date(Date.UTC(startYear, 0, 1))
  for (let i = 0; i < count; i++) {
    keys.push(d.toISOString().slice(0, 10))
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return keys
}

describe('getQuoteOfTheDay baseline path (no dayPayload)', () => {
  it('is deterministic for a given date', () => {
    const first = getQuoteOfTheDay('2026-07-13')
    const second = getQuoteOfTheDay('2026-07-13')
    expect(first).toEqual(second)
  })

  it('never repeats a (song, line) pick within one pool-length window', () => {
    // Keyed by song + line position, not rendered text: a few songs
    // legitimately repeat a line verbatim (e.g. call-and-response verses),
    // so text alone isn't a reliable uniqueness key.
    expect(QUOTE_POOL_SIZE).toBeGreaterThanOrEqual(183)
    const seen = new Set<string>()
    for (const key of dateKeys(2026, QUOTE_POOL_SIZE)) {
      const { song, lineIndex } = getQuoteOfTheDay(key)
      const id = `${song}::${lineIndex}`
      expect(seen.has(id)).toBe(false)
      seen.add(id)
    }
  })

  it('returns a line that actually belongs to the cited song', () => {
    const { quote, song } = getQuoteOfTheDay('2026-03-09')
    expect((lyrics as Record<string, string[]>)[song]).toContain(quote)
  })
})

describe('getQuoteOfTheDay nice-to-have path (dayPayload with matching song)', () => {
  it('prefers a song actually played that day', () => {
    const payload = {
      dateKey: '2026-08-01',
      shows: [],
      featured: {
        date: '2026-08-01',
        year: 1977,
        venue: 'V',
        city: 'C',
        country: 'US',
        songs: ['Bertha'],
      },
      showDetail: null,
      archive: null,
      archiveMatch: null,
      complete: true,
      computedAt: Date.now(),
    } as unknown as ShowOfTheDayPayload

    const { song } = getQuoteOfTheDay('2026-08-01', payload)
    expect(song).toBe('Bertha')
  })

  it('falls back to the baseline pool when no played song has a lyric entry', () => {
    const payload = {
      dateKey: '2026-08-02',
      shows: [],
      featured: {
        date: '2026-08-02',
        year: 1977,
        venue: 'V',
        city: 'C',
        country: 'US',
        songs: ['Some Unmapped Jam'],
      },
      showDetail: null,
      archive: null,
      archiveMatch: null,
      complete: true,
      computedAt: Date.now(),
    } as unknown as ShowOfTheDayPayload

    const withPayload = getQuoteOfTheDay('2026-08-02', payload)
    const withoutPayload = getQuoteOfTheDay('2026-08-02', null)
    expect(withPayload).toEqual(withoutPayload)
  })
})
