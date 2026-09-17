import lyrics from '@/lib/song-of-the-day-lyrics.json'
import { normalizeFuzzy } from '@/lib/ids'
import { hashString } from '@/lib/featured-show'
import type { ShowOfTheDayPayload } from '@/lib/show-of-the-day-types'

const LYRICS: Record<string, string[]> = lyrics

interface PoolEntry {
  song: string
  lineIndex: number
}

// One entry per (song, line) pair — well over the half-year (~183 day)
// minimum this feature needs to stay non-repetitive.
const FLAT_POOL: PoolEntry[] = Object.keys(LYRICS).flatMap(song =>
  LYRICS[song].map((_, lineIndex) => ({ song, lineIndex }))
)

export const QUOTE_POOL_SIZE = FLAT_POOL.length

// Fixed one-time shuffle (not per-request) so the baseline rotation isn't in
// alphabetical-song order, but stays identical across runs/deploys. A raw
// hash(date) % 224 pick would collide within ~15 days (birthday paradox) —
// this permutation + sequential day-offset index guarantees zero repeats
// across any 224 consecutive calendar days instead.
const PERMUTATION_SEED = 'steal-your-stats-quote-v1'

function buildPermutation(size: number): number[] {
  const indices = Array.from({ length: size }, (_, i) => i)
  for (let i = size - 1; i > 0; i--) {
    const j = hashString(`${PERMUTATION_SEED}:${i}`) % (i + 1)
    ;[indices[i], indices[j]] = [indices[j], indices[i]]
  }
  return indices
}

const PERMUTATION = buildPermutation(FLAT_POOL.length)

// normalizeFuzzy(song title) -> canonical lyrics-json key, for matching
// setlist song strings (which may carry punctuation/casing variants).
const NORMALIZED_TO_SONG = new Map<string, string>(
  Object.keys(LYRICS).map(song => [normalizeFuzzy(song), song])
)

const EPOCH_MS = Date.UTC(1970, 0, 1)
const MS_PER_DAY = 24 * 60 * 60 * 1000

function ordinalDay(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number)
  return Math.floor((Date.UTC(year, month - 1, day) - EPOCH_MS) / MS_PER_DAY)
}

function todaysLyricSongs(dayPayload?: ShowOfTheDayPayload | null): string[] {
  if (!dayPayload) return []
  const played = new Set<string>([
    ...(dayPayload.featured?.songs ?? []),
    ...(dayPayload.showDetail?.sets?.flatMap(s => s.songs) ?? []),
  ].map(normalizeFuzzy))

  const matches = new Set<string>()
  for (const normalized of played) {
    const song = NORMALIZED_TO_SONG.get(normalized)
    if (song) matches.add(song)
  }
  return [...matches]
}

export interface QuoteOfTheDay {
  quote: string
  song: string
  lineIndex: number
}

export function getQuoteOfTheDay(
  dateKey: string,
  dayPayload?: ShowOfTheDayPayload | null,
): QuoteOfTheDay {
  const candidates = todaysLyricSongs(dayPayload)

  let song: string
  let lineIndex: number

  if (candidates.length > 0) {
    song = candidates[hashString(`${dateKey}:song`) % candidates.length]
    lineIndex = hashString(`${dateKey}:line`) % LYRICS[song].length
  } else {
    const entry = FLAT_POOL[PERMUTATION[((ordinalDay(dateKey) % FLAT_POOL.length) + FLAT_POOL.length) % FLAT_POOL.length]]
    song = entry.song
    lineIndex = entry.lineIndex
  }

  return { quote: LYRICS[song][lineIndex], song, lineIndex }
}
