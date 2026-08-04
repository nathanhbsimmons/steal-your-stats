import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { getShowIndex, filterShows, computeFacetCounts, tokensToFilters } from '@/lib/services/show-index'

const setlistCount = (JSON.parse(
  fs.readFileSync(path.join(process.cwd(), '.cache', 'gd-setlists.json'), 'utf8')
).setlists as unknown[]).length

const archiveEntries = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), '.cache', 'archive-index.json'), 'utf8')
) as { date: string; best?: unknown }[]
const expectedAudioCount = archiveEntries.filter(e => !!e.best).length

describe('show index', () => {
  it('builds one entry per setlist', async () => {
    const index = await getShowIndex()
    expect(index).toHaveLength(setlistCount)
  })

  it('marks hasAudio consistently with the archive catalog', async () => {
    // A handful of dates have two setlists (early/late shows) but only one Archive.org
    // catalog entry per calendar date, so compare unique dates rather than entry count.
    const index = await getShowIndex()
    const audioDates = new Set(index.filter(e => e.hasAudio).map(e => e.date))
    expect(audioDates.size).toBe(expectedAudioCount)
  })

  it('attaches official releases where they exist', async () => {
    const index = await getShowIndex()
    const cornell = index.find(e => e.date === '1977-05-08')
    expect(cornell?.hasRelease).toBe(true)
    expect(cornell?.releases.map(r => r.title)).toContain('Cornell 5/8/77')
  })

  it('filters shows by an exact date', async () => {
    const index = await getShowIndex()
    const results = filterShows(index, { date: '1977-05-08' })
    expect(results).toHaveLength(1)
    expect(results[0].venue).toContain('Cornell')
  })

  it('filters shows by year and series together', async () => {
    const index = await getShowIndex()
    const results = filterShows(index, { year: 1990, series: ["Dave's Picks"] })
    expect(results.length).toBeGreaterThan(0)
    for (const show of results) {
      expect(show.year).toBe(1990)
      expect(show.releaseSeries).toContain("Dave's Picks")
    }
  })

  it('filters shows by a season month range', async () => {
    const index = await getShowIndex()
    const results = filterShows(index, { season: { year: 1977, monthFrom: 3, monthTo: 5 } })
    expect(results.length).toBeGreaterThan(0)
    for (const show of results) {
      expect(show.year).toBe(1977)
      expect(show.month).toBeGreaterThanOrEqual(3)
      expect(show.month).toBeLessThanOrEqual(5)
    }
  })

  it('keeps a facet\'s own sibling counts non-zero when that facet is selected', async () => {
    const index = await getShowIndex()
    const facets = computeFacetCounts(index, { hasAudio: true })
    const seriesOptions = facets.series
    expect(seriesOptions.some(o => o.count > 0)).toBe(true)
  })

  it('converts parsed tokens into show filters', () => {
    const filters = tokensToFilters([
      { facet: 'year', value: 1977, label: '1977', raw: '1977' },
      { facet: 'series', value: "Dick's Picks", label: "Dick's Picks", raw: "dick's picks" },
    ])
    expect(filters.year).toBe(1977)
    expect(filters.series).toEqual(["Dick's Picks"])
  })
})
