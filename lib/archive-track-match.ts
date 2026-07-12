import type { ArchiveTrackPayload, MatchedSongTrack, ArchiveSetlistMatch } from '@/lib/show-of-the-day-types'

const LOOKAHEAD_WINDOW = 8

// Normalize & → "and" before stripping non-alphanumeric so "Samson & Delilah"
// matches "Samson and Delilah".
function normalizeTitle(s: string): string {
  return s.toLowerCase().replace(/\s*&\s*/g, 'and').replace(/[^a-z0-9]/g, '')
}

// Strips "Set N:" / "Encore:" taper-added prefixes and a trailing segue ">".
export function stripLabelPrefix(rawTitle: string): string {
  const c = rawTitle.replace(/>$/, '').trim()
  const ci = c.indexOf(':')
  return ci > 0 && ci < 12 ? c.slice(ci + 1).trim() : c
}

// Non-musical filler: tuning, stage banter, set-break gaps. These aren't
// "bonus tracks" anyone wants to see or hear, so callers drop them entirely.
// A titled track is judged by the keyword list only — duration alone would
// misclassify a short but real soundcheck snippet (e.g. a 66s "Let It Grow"
// fragment) as filler. Duration only decides untitled clips, where there's
// no name to go on.
const FILLER_KEYWORD_RE = /\b(tuning|rap|crowd|intro|announcement|break)\b/i
const FILLER_MAX_DURATION_SECONDS = 90

export function isFillerTrack(track: ArchiveTrackPayload): boolean {
  const title = stripLabelPrefix(track.title ?? '').trim()
  if (title) return FILLER_KEYWORD_RE.test(title)
  return typeof track.duration === 'number' && track.duration < FILLER_MAX_DURATION_SECONDS
}

// Matches Archive.org tracks against a setlist's songs in order. Tracks that
// don't match any song within the lookahead window (banter, tuning, a bundled
// soundcheck reel, etc.) are returned separately as `bonus` rather than
// interleaved into the setlist. Pure filler (tuning, set-break gaps, etc.)
// is dropped rather than surfaced as bonus content.
export function matchArchiveTracksToSetlist(
  tracks: ArchiveTrackPayload[],
  setlistSongs: string[],
): ArchiveSetlistMatch {
  const matched: MatchedSongTrack[] = setlistSongs.map((song, flatIdx) => ({ song, flatIdx, track: null }))

  if (tracks.length === 0 || setlistSongs.length === 0) {
    return { matched, bonus: setlistSongs.length === 0 ? tracks.filter(t => !isFillerTrack(t)) : [] }
  }

  const hasMetadata = tracks.some(t => t.title?.trim())
  if (!hasMetadata) return { matched, bonus: [] }

  const bonus: ArchiveTrackPayload[] = []
  let songCursor = 0
  for (const track of tracks) {
    if (!track.url) continue
    if (!track.title?.trim()) {
      if (!isFillerTrack(track)) bonus.push(track)
      continue
    }
    const titleNorm = normalizeTitle(stripLabelPrefix(track.title))
    let matchIdx = -1
    for (let li = songCursor; li < Math.min(songCursor + LOOKAHEAD_WINDOW, setlistSongs.length); li++) {
      const songNorm = normalizeTitle(setlistSongs[li])
      if (titleNorm.includes(songNorm) || songNorm.includes(titleNorm)) {
        matchIdx = li
        break
      }
    }
    if (matchIdx !== -1) {
      matched[matchIdx].track = track
      songCursor = matchIdx + 1
    } else if (!isFillerTrack(track)) {
      bonus.push(track)
    }
  }
  return { matched, bonus }
}

// Display name for one bonus row — same transform as the app's ancillary-track titles.
export function formatBonusTrackTitle(track: ArchiveTrackPayload): string {
  const stripped = stripLabelPrefix(track.title ?? '')
  const label = stripped || 'Archive Track'
  return label.charAt(0).toUpperCase() + label.slice(1)
}

// Short header for the collapsible bonus section. Prefers the archive.org
// item's own taper-written description when it's explicit about what the
// bonus material is — more honest than a generic "Bonus tracks" label.
export function deriveBonusSectionLabel(bonus: ArchiveTrackPayload[], description?: string | null): string {
  if (bonus.length === 0) return ''
  const desc = (description ?? '').toLowerCase()
  if (desc.includes('soundcheck')) return 'Soundcheck'
  if (desc.includes('pre-show') || desc.includes('preshow')) return 'Pre-show'
  const hasSoundcheck = bonus.some(t => (t.title ?? '').toLowerCase().includes('soundcheck'))
  return hasSoundcheck ? 'Soundcheck' : 'Bonus tracks'
}
