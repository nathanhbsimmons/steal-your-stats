import type { ShowOnThisDay } from '@/lib/show-of-the-day-types'

// Featured-show scoring: prefer shows with setlists, prefer the classic
// 1967-1994 era. Ties within a score tier are broken by a seed-dependent hash
// (typically the calendar date) instead of a fixed year target — a fixed
// target (e.g. abs(year-1977)) always wins the tiebreak for that era, so
// every day's pick converges on the same few years.
function score(s: ShowOnThisDay): number {
  return (s.songs.length > 0 ? 100 : 0) + (s.year >= 1967 && s.year <= 1994 ? 50 : 0)
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

export function sortShowsForFeature(shows: ShowOnThisDay[], seed = ''): ShowOnThisDay[] {
  return [...shows].sort((a, b) => {
    if (score(b) !== score(a)) return score(b) - score(a)
    return seededRank(seed, a.year) - seededRank(seed, b.year)
  })
}

export function pickFeaturedShow(shows: ShowOnThisDay[], seed = ''): ShowOnThisDay | null {
  return sortShowsForFeature(shows, seed)[0] ?? null
}
