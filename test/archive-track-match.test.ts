import { describe, it, expect } from 'vitest'
import { matchArchiveTracksToSetlist, formatBonusTrackTitle, deriveBonusSectionLabel, stripLabelPrefix, isFillerTrack } from '@/lib/archive-track-match'
import type { ArchiveTrackPayload } from '@/lib/show-of-the-day-types'

function track(over: Partial<ArchiveTrackPayload> & { title?: string }): ArchiveTrackPayload {
  return { id: over.title ?? 'id', name: over.title ?? 'name', url: 'https://archive.org/x.mp3', archiveItemId: 'gd', ...over }
}

describe('matchArchiveTracksToSetlist', () => {
  it('matches tracks to songs in order', () => {
    const tracks = [track({ title: 'Dark Star' }), track({ title: 'St. Stephen' })]
    const { matched, bonus } = matchArchiveTracksToSetlist(tracks, ['Dark Star', 'St. Stephen'])
    expect(matched.map(m => m.track?.title)).toEqual(['Dark Star', 'St. Stephen'])
    expect(bonus).toEqual([])
  })

  it('drops a banter/tuning track between two matched songs as filler, songs still match around it', () => {
    const tracks = [track({ title: 'Dark Star' }), track({ title: 'tuning' }), track({ title: 'St. Stephen' })]
    const { matched, bonus } = matchArchiveTracksToSetlist(tracks, ['Dark Star', 'St. Stephen'])
    expect(matched.map(m => m.track?.title)).toEqual(['Dark Star', 'St. Stephen'])
    expect(bonus).toEqual([])
  })

  it('drops a short "Encore Break" gap track entirely rather than listing it as bonus', () => {
    const tracks = [track({ title: 'Dark Star' }), track({ title: 'Encore Break', duration: 27 })]
    const { bonus } = matchArchiveTracksToSetlist(tracks, ['Dark Star'])
    expect(bonus).toEqual([])
  })

  it('matches "Encore: U.S. Blues" to "U.S. Blues" — prefix stripped', () => {
    const tracks = [track({ title: 'Encore: U.S. Blues' })]
    const { matched, bonus } = matchArchiveTracksToSetlist(tracks, ['U.S. Blues'])
    expect(matched[0].track?.title).toBe('Encore: U.S. Blues')
    expect(bonus).toEqual([])
  })

  it('puts a trailing soundcheck block entirely into bonus once setlist is exhausted', () => {
    const tracks = [
      track({ title: 'Dark Star' }),
      track({ title: 'Set III: Soundcheck' }),
      track({ title: 'Set III: Soundcheck' }),
    ]
    const { matched, bonus } = matchArchiveTracksToSetlist(tracks, ['Dark Star'])
    expect(matched[0].track?.title).toBe('Dark Star')
    expect(bonus).toHaveLength(2)
    expect(deriveBonusSectionLabel(bonus)).toBe('Soundcheck')
  })

  it('leaves matched[i].track null when no archive track matches a song, without consuming the cursor', () => {
    const tracks = [track({ title: 'St. Stephen' })]
    const { matched, bonus } = matchArchiveTracksToSetlist(tracks, ['Dark Star', 'St. Stephen'])
    expect(matched[0].track).toBeNull()
    expect(matched[1].track?.title).toBe('St. Stephen')
    expect(bonus).toEqual([])
  })

  it('returns all-null matched and empty bonus for empty tracks', () => {
    const { matched, bonus } = matchArchiveTracksToSetlist([], ['Dark Star'])
    expect(matched).toEqual([{ song: 'Dark Star', flatIdx: 0, track: null }])
    expect(bonus).toEqual([])
  })

  it('does not misclassify everything as bonus when no track has a title at all', () => {
    const tracks = [track({ title: undefined }), track({ title: undefined })]
    const { matched, bonus } = matchArchiveTracksToSetlist(tracks, ['Dark Star'])
    expect(matched[0].track).toBeNull()
    expect(bonus).toEqual([])
  })
})

describe('formatBonusTrackTitle', () => {
  it('strips "Set III: Soundcheck" prefix', () => {
    expect(formatBonusTrackTitle(track({ title: 'Set III: Soundcheck' }))).toBe('Soundcheck')
  })

  it('strips a trailing segue marker', () => {
    expect(formatBonusTrackTitle(track({ title: 'tuning>' }))).toBe('Tuning')
  })
})

describe('stripLabelPrefix', () => {
  it('strips short colon-prefixed labels only', () => {
    expect(stripLabelPrefix('Encore: U.S. Blues')).toBe('U.S. Blues')
    expect(stripLabelPrefix('Dark Star')).toBe('Dark Star')
  })
})

describe('isFillerTrack', () => {
  it('flags keyword-matched titles regardless of duration', () => {
    expect(isFillerTrack(track({ title: 'Encore Break', duration: 27 }))).toBe(true)
    expect(isFillerTrack(track({ title: 'tuning' }))).toBe(true)
    expect(isFillerTrack(track({ title: 'Crowd' }))).toBe(true)
  })

  it('flags short untitled tracks by duration alone', () => {
    expect(isFillerTrack(track({ title: undefined, duration: 45 }))).toBe(true)
  })

  it('does not flag a short but real soundcheck snippet just because it is brief', () => {
    // A truncated "Let It Grow" soundcheck take is still worth surfacing as
    // bonus content — duration alone must not override a real title.
    expect(isFillerTrack(track({ title: '06 Let It Grow', duration: 66 }))).toBe(false)
  })

  it('does not flag a real song even if short-ish, when duration is over the threshold', () => {
    expect(isFillerTrack(track({ title: 'Dark Star', duration: 1200 }))).toBe(false)
  })
})

describe('deriveBonusSectionLabel with description', () => {
  const bonus = [track({ title: 'Set III: Soundcheck' })]

  it('prefers "soundcheck" wording from the archive.org description when present', () => {
    expect(deriveBonusSectionLabel(bonus, 'SBD > DAT. Includes a pre-show soundcheck.')).toBe('Soundcheck')
  })

  it('uses "Pre-show" when the description says so but not "soundcheck"', () => {
    expect(deriveBonusSectionLabel(bonus, 'A short pre-show jam is included.')).toBe('Pre-show')
  })

  it('falls back to title-keyword heuristic when no description is given', () => {
    expect(deriveBonusSectionLabel(bonus)).toBe('Soundcheck')
  })
})
