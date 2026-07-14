import { describe, it, expect } from 'vitest'
import { getOfficialReleasesForDate, getOfficialReleasesForDates, hasOfficialRelease } from '@/lib/official-releases'

describe('officialReleases', () => {
  it('returns the known release for a date with a single release', () => {
    const releases = getOfficialReleasesForDate('1971-02-19')
    expect(releases).toHaveLength(1)
    expect(releases[0].title).toBe('Three from the Vault')
  })

  it('tags a show with only one release even when multiple releases exist for that date', () => {
    const releases = getOfficialReleasesForDate('1970-02-13')
    expect(releases).toHaveLength(1)
    expect(releases[0].title).toBe("Dick's Picks Vol. 4")
  })

  it('returns an empty array for a date with no release', () => {
    expect(getOfficialReleasesForDate('1994-06-24')).toEqual([])
  })

  it('flattens results across multiple dates', () => {
    const releases = getOfficialReleasesForDates(['1977-05-08', '1977-05-25', '1994-06-24'])
    expect(releases.map(r => r.date)).toEqual(['1977-05-08', '1977-05-25'])
  })

  it('reports whether a date has any official release', () => {
    expect(hasOfficialRelease('1977-05-08')).toBe(true)
    expect(hasOfficialRelease('1994-06-24')).toBe(false)
  })
})
