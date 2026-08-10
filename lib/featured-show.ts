import type { ShowOnThisDay } from '@/lib/show-of-the-day-types'

export type AudioTrackCountLookup = (date: string) => number
const noAudio: AudioTrackCountLookup = () => 0

// Featured-show scoring: prefer shows with a matched Archive.org recording
// (more tracks over fewer), then shows with setlists, then the classic
// 1967-1994 era. Ties within a score tier are broken by a seed-dependent hash
// (typically the calendar date) instead of a fixed year target — a fixed
// target (e.g. abs(year-1977)) always wins the tiebreak for that era, so
// every day's pick converges on the same few years.
function score(s: ShowOnThisDay, getAudioTrackCount: AudioTrackCountLookup): number {
  const audioCount = Math.max(0, getAudioTrackCount(s.date))
  const hasAudio = audioCount > 0 ? 1 : 0
  const audioTracksCapped = Math.min(audioCount, 999)
  const hasSetlist = s.songs.length > 0 ? 1 : 0
  const eraBonus = s.year >= 1967 && s.year <= 1994 ? 1 : 0
  return hasAudio * 1_000_000 + audioTracksCapped * 1_000 + hasSetlist * 100 + eraBonus * 50
}

function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function seededRank(seed: string, year: number): number {
  return hashString(`${seed}:${year}`)
}

export function sortShowsForFeature(
  shows: ShowOnThisDay[],
  seed = '',
  getAudioTrackCount: AudioTrackCountLookup = noAudio,
): ShowOnThisDay[] {
  return [...shows].sort((a, b) => {
    const scoreA = score(a, getAudioTrackCount)
    const scoreB = score(b, getAudioTrackCount)
    if (scoreB !== scoreA) return scoreB - scoreA
    return seededRank(seed, a.year) - seededRank(seed, b.year)
  })
}

export function pickFeaturedShow(
  shows: ShowOnThisDay[],
  seed = '',
  getAudioTrackCount: AudioTrackCountLookup = noAudio,
): ShowOnThisDay | null {
  return sortShowsForFeature(shows, seed, getAudioTrackCount)[0] ?? null
}
