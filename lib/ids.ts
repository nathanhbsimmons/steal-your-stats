import canonicalData from './canonical-songs.json'

export const GRATEFUL_DEAD_MBID = '6faa7ca7-0d99-4a5e-bfa6-1fd5037520c6'

interface CanonicalSong {
  title: string
  aliases: string[]
}

const songs: CanonicalSong[] = canonicalData.songs

/**
 * Strip playback/notation suffixes and normalize whitespace.
 * Keeps internal punctuation (apostrophes, periods) for step-1 matching.
 */
function normalizeRaw(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s*\(live\)\s*/g, ' ')
    .replace(/\s*\(jam\)\s*/g, ' ')
    .replace(/\s*\(tease\)\s*/g, ' ')
    .replace(/\s*\(intro\)\s*/g, ' ')
    .replace(/\s*\(outro\)\s*/g, ' ')
    .replace(/\s*>\s*/g, ' ')
    .replace(/’/g, "'")   // curly → straight apostrophe
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Aggressive normalization: strips all punctuation for fuzzy / key matching.
 * "Truckin'" → "truckin", "St. Stephen" → "st stephen", "Slipknot!" → "slipknot"
 */
function normalizeFuzzy(title: string): string {
  return normalizeRaw(title)
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Build lookup maps at module init (O(1) resolution at runtime).
// Keys use normalizeFuzzy so punctuation variants all land on the same key.
const byNormalizedTitle = new Map<string, CanonicalSong>()
const byAlias = new Map<string, CanonicalSong>()

for (const song of songs) {
  byNormalizedTitle.set(normalizeFuzzy(song.title), song)
  for (const alias of song.aliases) {
    byAlias.set(alias.toLowerCase().trim(), song)
  }
}

export interface SongCatalogEntry {
  title: string        // lowercase canonical (used as Map key downstream)
  displayTitle: string // properly-cased display / URL title
  aliases: string[]
}

export function getSongCatalog(): SongCatalogEntry[] {
  return songs.map(s => ({
    title: s.title.toLowerCase(),
    displayTitle: s.title,
    aliases: s.aliases.filter(a => !a.includes('(live)')),
  })).sort((a, b) => a.displayTitle.localeCompare(b.displayTitle))
}

export interface SongResolution {
  normalizedTitle: string   // punctuation-stripped, lowercase — stable Map key
  displayTitle: string      // properly-cased title for display / URL encoding
  aliases: string[]
  musicbrainzId?: string
}

/**
 * Resolve any song title variant → canonical form.
 *
 * Resolution order:
 *   1. Fuzzy-normalized match against canonical titles
 *   2. Exact match against alias index
 *   3. Raw-normalized query against alias index (pre-alias-strip normalization)
 *   4. Fall through — return input as-is
 */
export function resolveSong({ title }: { title: string }): SongResolution {
  if (!title.trim()) {
    return { normalizedTitle: '', displayTitle: '', aliases: [''] }
  }

  const fuzzy = normalizeFuzzy(title)
  const raw = normalizeRaw(title)

  // 1. Canonical title match (fuzzy-normalized)
  const byTitle = byNormalizedTitle.get(fuzzy)
  if (byTitle) return toResolution(byTitle, title)

  // 2. Alias index exact match
  const byAliasMatch = byAlias.get(raw)
  if (byAliasMatch) return toResolution(byAliasMatch, title)

  // 3. Alias index fuzzy match (handles "FOTD", "NFA", abbreviations)
  const byAliasFuzzy = byAlias.get(fuzzy)
  if (byAliasFuzzy) return toResolution(byAliasFuzzy, title)

  // 4. Linear fuzzy scan over aliases (catches punctuation variants of aliases)
  for (const [key, song] of byAlias) {
    if (normalizeFuzzy(key) === fuzzy) return toResolution(song, title)
  }

  // 5. No match — return raw input as canonical
  const fallback = title.toLowerCase().trim()
  return {
    normalizedTitle: fallback,
    displayTitle: title.trim(),
    aliases: [title.trim()],
  }
}

function toResolution(song: CanonicalSong, inputTitle: string): SongResolution {
  const normalizedTitle = normalizeFuzzy(song.title)
  const aliases = new Set<string>([
    normalizedTitle,          // "dark star" / "truckin" (no punctuation)
    ...song.aliases,          // json alias list: ["darkstar", "fotd", ...]
    inputTitle.toLowerCase().trim(), // preserve raw input: "dark star (live)", "truckin'"
  ])
  return {
    normalizedTitle,
    displayTitle: song.title,
    aliases: [...aliases],
  }
}
