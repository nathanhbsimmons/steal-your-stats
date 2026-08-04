import { normalizeFuzzy } from '@/lib/ids'

/**
 * Match tiers, best first. Used to rank songs/venues/releases by how directly a query
 * matches their name rather than the current no-ranking substring behavior (where an
 * incidental mid-string hit could outrank an exact prefix match).
 */
const enum Tier {
  Exact = 0,
  Prefix = 1,
  WordBoundary = 2,
  Substring = 3,
  Alias = 4,
}

export interface ScoreResult {
  score: number
  matched: boolean
}

/** Lower score = better match. Returns matched:false if the query doesn't appear at all. */
export function scoreTitle(query: string, title: string, aliases: string[] = []): ScoreResult {
  const q = normalizeFuzzy(query)
  const t = normalizeFuzzy(title)
  if (!q) return { matched: true, score: Tier.Exact * 10000 + t.length }

  if (t === q) return { matched: true, score: Tier.Exact * 10000 + t.length }
  if (t.startsWith(q)) return { matched: true, score: Tier.Prefix * 10000 + t.length }
  if (new RegExp(`\\b${escapeRegExp(q)}`).test(t)) {
    return { matched: true, score: Tier.WordBoundary * 10000 + t.length }
  }
  if (t.includes(q)) return { matched: true, score: Tier.Substring * 10000 + t.length }

  for (const alias of aliases) {
    const a = normalizeFuzzy(alias)
    if (a === q || a.startsWith(q) || a.includes(q)) {
      return { matched: true, score: Tier.Alias * 10000 + t.length }
    }
  }

  return { matched: false, score: Infinity }
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export interface Scored<T> {
  item: T
  score: number
}

/** Filter+sort a list by how well `getTitle`/`getAliases` match `query`. */
export function searchAndRank<T>(
  items: T[],
  query: string,
  getTitle: (item: T) => string,
  getAliases: (item: T) => string[] = () => []
): Scored<T>[] {
  const results: Scored<T>[] = []
  for (const item of items) {
    const { matched, score } = scoreTitle(query, getTitle(item), getAliases(item))
    if (matched) results.push({ item, score })
  }
  return results.sort((a, b) => a.score - b.score)
}
