import type { ShowOnThisDay } from '@/lib/show-of-the-day-types'

// Featured-show scoring: prefer shows with setlists, prefer the classic
// 1967-1994 era, tiebreak toward 1977.
function score(s: ShowOnThisDay): number {
  return (s.songs.length > 0 ? 100 : 0) + (s.year >= 1967 && s.year <= 1994 ? 50 : 0)
}

export function sortShowsForFeature(shows: ShowOnThisDay[]): ShowOnThisDay[] {
  return [...shows].sort((a, b) => {
    if (score(b) !== score(a)) return score(b) - score(a)
    return Math.abs(a.year - 1977) - Math.abs(b.year - 1977)
  })
}

export function pickFeaturedShow(shows: ShowOnThisDay[]): ShowOnThisDay | null {
  return sortShowsForFeature(shows)[0] ?? null
}
