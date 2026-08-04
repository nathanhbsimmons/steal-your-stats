import type { RecordingType } from '@/lib/clients/archive'
import { ERA_DEFS } from '@/lib/eras'

export type ParsedToken =
  | { facet: 'date'; value: string; label: string; raw: string }
  | { facet: 'year'; value: number; label: string; raw: string }
  | { facet: 'yearRange'; value: { from: number; to: number }; label: string; raw: string }
  | { facet: 'decade'; value: number; label: string; raw: string }
  | { facet: 'month'; value: { year: number; month: number }; label: string; raw: string }
  | { facet: 'season'; value: { year: number; monthFrom: number; monthTo: number }; label: string; raw: string }
  | { facet: 'era'; value: string; label: string; raw: string }
  | { facet: 'series'; value: string; label: string; raw: string }
  | { facet: 'recordingType'; value: RecordingType; label: string; raw: string }
  | { facet: 'hasAudio'; value: true; label: string; raw: string }
  | { facet: 'hasRelease'; value: true; label: string; raw: string }
  | { facet: 'country'; value: string; label: string; raw: string }
  | { facet: 'state'; value: string; label: string; raw: string }

export interface ParsedQuery {
  text: string
  tokens: ParsedToken[]
}

const MIN_YEAR = 1965
const MAX_YEAR = 2015

/** lowercase, strip punctuation, collapse whitespace — used to match facet vocabulary consistently */
export function normalizeFacetText(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeYear(raw: string): number | null {
  const n = parseInt(raw, 10)
  if (raw.length === 4) return n >= MIN_YEAR && n <= MAX_YEAR ? n : null
  if (raw.length <= 2) {
    if (n >= 65 && n <= 99) return 1900 + n
    if (n >= 0 && n <= 15) return 2000 + n
    return null
  }
  return null
}

const MONTH_NAMES: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
}
const MONTH_PATTERN = Object.keys(MONTH_NAMES).sort((a, b) => b.length - a.length).join('|')

const SEASON_MONTHS: Record<string, [number, number]> = {
  spring: [3, 5],
  summer: [6, 8],
  fall: [9, 11],
  autumn: [9, 11],
  winter: [12, 2],
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

function isValidDate(year: number, month: number, day: number): boolean {
  if (year < MIN_YEAR || year > MAX_YEAR) return false
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false
  return true
}

/** A single ordered extraction pass: find the first match of `re` in `str`, and if the
 * matched groups produce a valid token, return the token plus the string with that
 * match removed. Otherwise return null so the caller can try the next pattern. */
interface Extraction<T extends ParsedToken> {
  token: T
  rest: string
}

function extractFirst<T extends ParsedToken>(
  str: string,
  re: RegExp,
  build: (m: RegExpMatchArray) => T | null
): Extraction<T> | null {
  const m = str.match(re)
  if (!m) return null
  const token = build(m)
  if (!token) return null
  const rest = str.slice(0, m.index) + ' ' + str.slice((m.index ?? 0) + m[0].length)
  return { token, rest }
}

function extractDate(str: string): Extraction<Extract<ParsedToken, { facet: 'date' }>> | null {
  // ISO: 1977-05-08
  let hit = extractFirst(str, /\b(\d{4})-(\d{2})-(\d{2})\b/, m => {
    const year = parseInt(m[1], 10), month = parseInt(m[2], 10), day = parseInt(m[3], 10)
    if (!isValidDate(year, month, day)) return null
    const value = `${year}-${pad2(month)}-${pad2(day)}`
    return { facet: 'date', value, label: value, raw: m[0] }
  })
  if (hit) return hit

  // slash / dash: 5/8/77, 5-8-1977 (US mm/dd/yy convention)
  hit = extractFirst(str, /\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/, m => {
    const month = parseInt(m[1], 10), day = parseInt(m[2], 10)
    const year = normalizeYear(m[3])
    if (year === null || !isValidDate(year, month, day)) return null
    const value = `${year}-${pad2(month)}-${pad2(day)}`
    return { facet: 'date', value, label: value, raw: m[0] }
  })
  if (hit) return hit

  // month name day, year: "may 8 1977", "may 8th, 1977"
  hit = extractFirst(str, new RegExp(`\\b(${MONTH_PATTERN})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{2,4})\\b`, 'i'), m => {
    const month = MONTH_NAMES[m[1].toLowerCase()]
    const day = parseInt(m[2], 10)
    const year = normalizeYear(m[3])
    if (year === null || !isValidDate(year, month, day)) return null
    const value = `${year}-${pad2(month)}-${pad2(day)}`
    return { facet: 'date', value, label: value, raw: m[0] }
  })
  if (hit) return hit

  // day month name, year: "8 may 1977"
  hit = extractFirst(str, new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_PATTERN})\\.?,?\\s+(\\d{2,4})\\b`, 'i'), m => {
    const day = parseInt(m[1], 10)
    const month = MONTH_NAMES[m[2].toLowerCase()]
    const year = normalizeYear(m[3])
    if (year === null || !isValidDate(year, month, day)) return null
    const value = `${year}-${pad2(month)}-${pad2(day)}`
    return { facet: 'date', value, label: value, raw: m[0] }
  })
  return hit
}

function extractSeason(str: string): Extraction<Extract<ParsedToken, { facet: 'season' }>> | null {
  return extractFirst(str, /\b(spring|summer|fall|autumn|winter)\s+(\d{2,4})\b/i, m => {
    const year = normalizeYear(m[2])
    if (year === null) return null
    const [monthFrom, monthTo] = SEASON_MONTHS[m[1].toLowerCase()]
    return {
      facet: 'season',
      value: { year, monthFrom, monthTo },
      label: `${m[1][0].toUpperCase()}${m[1].slice(1).toLowerCase()} ${year}`,
      raw: m[0],
    }
  })
}

function extractMonth(str: string): Extraction<Extract<ParsedToken, { facet: 'month' }>> | null {
  // "may 1977"
  let hit = extractFirst(str, new RegExp(`\\b(${MONTH_PATTERN})\\.?\\s+(\\d{4})\\b`, 'i'), m => {
    const month = MONTH_NAMES[m[1].toLowerCase()]
    const year = normalizeYear(m[2])
    if (year === null) return null
    return { facet: 'month', value: { year, month }, label: `${m[1]} ${year}`, raw: m[0] }
  })
  if (hit) return hit

  // "1977-05"
  hit = extractFirst(str, /\b(\d{4})-(\d{2})\b/, m => {
    const year = normalizeYear(m[1])
    const month = parseInt(m[2], 10)
    if (year === null || month < 1 || month > 12) return null
    return { facet: 'month', value: { year, month }, label: `${year}-${pad2(month)}`, raw: m[0] }
  })
  return hit
}

function extractYearRange(str: string): Extraction<Extract<ParsedToken, { facet: 'yearRange' }>> | null {
  let hit = extractFirst(str, /\b(\d{4})\s*-\s*(\d{4})\b/, m => {
    const from = normalizeYear(m[1]), to = normalizeYear(m[2])
    if (from === null || to === null || from > to) return null
    return { facet: 'yearRange', value: { from, to }, label: `${from}–${to}`, raw: m[0] }
  })
  if (hit) return hit

  hit = extractFirst(str, /\b(\d{2})\s*-\s*(\d{2})\b/, m => {
    const fromN = parseInt(m[1], 10), toN = parseInt(m[2], 10)
    if (fromN < 60 || fromN > 99 || toN < 60 || toN > 99 || fromN > toN) return null
    const from = 1900 + fromN, to = 1900 + toN
    return { facet: 'yearRange', value: { from, to }, label: `${from}–${to}`, raw: m[0] }
  })
  return hit
}

function extractDecade(str: string): Extraction<Extract<ParsedToken, { facet: 'decade' }>> | null {
  let hit = extractFirst(str, /\b(19[0-9]0)s\b/i, m => {
    const decade = parseInt(m[1], 10)
    return { facet: 'decade', value: decade, label: `${decade}s`, raw: m[0] }
  })
  if (hit) return hit

  hit = extractFirst(str, /\b([6789]0)s\b/i, m => {
    const decade = 1900 + parseInt(m[1], 10)
    return { facet: 'decade', value: decade, label: `${decade}s`, raw: m[0] }
  })
  return hit
}

function extractBareYear(str: string): Extraction<Extract<ParsedToken, { facet: 'year' }>> | null {
  return extractFirst(str, /\b(\d{2,4})\b/, m => {
    const year = normalizeYear(m[1])
    if (year === null) return null
    return { facet: 'year', value: year, label: `${year}`, raw: m[0] }
  })
}

const ERA_ALIASES: Record<string, string[]> = {
  primal: ['primal dead', 'pigpen era'],
  europe72: ["europe 72", "europe '72", 'wall of sound'],
  hiatus: ['hiatus', 'hiatus and return', 'studio era'],
  brent: ['brent years', 'brent era', 'arena dead'],
  final: ['final tours', 'vince era', 'vince and bruce'],
}

function buildEraMatchers(): { id: string; label: string; phrase: string }[] {
  const out: { id: string; label: string; phrase: string }[] = []
  for (const era of ERA_DEFS) {
    const phrases = new Set<string>([
      normalizeFacetText(era.name),
      normalizeFacetText(era.id),
      normalizeFacetText(era.tag),
      ...(ERA_ALIASES[era.id] ?? []).map(normalizeFacetText),
    ])
    for (const phrase of phrases) {
      if (phrase) out.push({ id: era.id, label: era.name, phrase })
    }
  }
  return out.sort((a, b) => b.phrase.length - a.phrase.length)
}
const ERA_MATCHERS = buildEraMatchers()

function extractEra(str: string): Extraction<Extract<ParsedToken, { facet: 'era' }>> | null {
  const normalized = normalizeFacetText(str)
  for (const { id, label, phrase } of ERA_MATCHERS) {
    const re = new RegExp(`\\b${phrase.replace(/\s+/g, '\\s+')}\\b`, 'i')
    const m = str.match(re)
    if (m && normalized.includes(phrase)) {
      const rest = str.slice(0, m.index) + ' ' + str.slice((m.index ?? 0) + m[0].length)
      return { token: { facet: 'era', value: id, label, raw: m[0] }, rest }
    }
  }
  return null
}

// Phrase lists include the natural singular/shortened variants people actually type
// ("road trip", "vault") alongside the official series names — verified against every
// venue, city, state, and song title in the dataset with no collisions, so these can't
// accidentally hijack an unrelated search term the way a truly generic word could.
const SERIES_MATCHERS: { value: string; phrases: string[] }[] = [
  { value: "Dick's Picks", phrases: ["dicks picks", "dick's picks", "dicks pick", "dick's pick"] },
  { value: "Dave's Picks", phrases: ["daves picks", "dave's picks", "daves pick", "dave's pick"] },
  { value: 'Road Trips', phrases: ['road trips', 'road trip'] },
  { value: 'Download Series', phrases: ['download series'] },
  { value: 'From the Vault', phrases: ['from the vault', 'vault'] },
  { value: 'Play Dead', phrases: ['play dead'] },
]

function extractSeries(str: string): Extraction<Extract<ParsedToken, { facet: 'series' }>> | null {
  for (const { value, phrases } of SERIES_MATCHERS) {
    for (const phrase of phrases) {
      const re = new RegExp(`\\b${phrase.replace(/'/g, "'?").replace(/\s+/g, '\\s+')}\\b`, 'i')
      const m = str.match(re)
      if (m) {
        const rest = str.slice(0, m.index) + ' ' + str.slice((m.index ?? 0) + m[0].length)
        return { token: { facet: 'series', value, label: value, raw: m[0] }, rest }
      }
    }
  }
  return null
}

const RECORDING_TYPE_MATCHERS: { value: RecordingType; phrases: string[] }[] = [
  { value: 'sbd', phrases: ['soundboard', 'sbd'] },
  { value: 'aud', phrases: ['audience recording', 'audience', 'aud'] },
  { value: 'matrix', phrases: ['matrix'] },
]

function extractRecordingType(str: string): Extraction<Extract<ParsedToken, { facet: 'recordingType' }>> | null {
  for (const { value, phrases } of RECORDING_TYPE_MATCHERS) {
    for (const phrase of phrases) {
      const re = new RegExp(`\\b${phrase.replace(/\s+/g, '\\s+')}\\b`, 'i')
      const m = str.match(re)
      if (m) {
        const rest = str.slice(0, m.index) + ' ' + str.slice((m.index ?? 0) + m[0].length)
        return { token: { facet: 'recordingType', value, label: value, raw: m[0] }, rest }
      }
    }
  }
  return null
}

function extractHasAudio(str: string): Extraction<Extract<ParsedToken, { facet: 'hasAudio' }>> | null {
  return extractFirst(str, /\b(has audio|with audio|audio only)\b/i, m => (
    { facet: 'hasAudio', value: true, label: 'has audio', raw: m[0] }
  ))
}

function extractHasRelease(str: string): Extraction<Extract<ParsedToken, { facet: 'hasRelease' }>> | null {
  return extractFirst(str, /\b(official release|officially released|has release)\b/i, m => (
    { facet: 'hasRelease', value: true, label: 'official release', raw: m[0] }
  ))
}

// Countries actually present in the show dataset (lib/clients/setlist.ts venue.city.country.name).
const COUNTRIES = [
  'united states', 'canada', 'united kingdom', 'france', 'germany',
  'sweden', 'jamaica', 'spain', 'netherlands', 'denmark', 'egypt', 'luxembourg',
]

// Full US state names as used by setlist.fm venue.city.state, plus DC variants.
const US_STATES = [
  'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut',
  'delaware', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa',
  'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan',
  'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada',
  'new hampshire', 'new jersey', 'new mexico', 'new york', 'north carolina',
  'north dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode island',
  'south carolina', 'south dakota', 'tennessee', 'texas', 'utah', 'vermont',
  'virginia', 'washington', 'west virginia', 'wisconsin', 'wyoming',
  'washington dc', 'district of columbia',
]

function extractPlace(
  str: string,
  vocab: string[],
  facet: 'country' | 'state'
): Extraction<ParsedToken> | null {
  const sorted = [...vocab].sort((a, b) => b.length - a.length)
  for (const phrase of sorted) {
    const re = new RegExp(`\\b${phrase.replace(/\s+/g, '[\\s,]+')}\\b`, 'i')
    const m = str.match(re)
    if (m) {
      const rest = str.slice(0, m.index) + ' ' + str.slice((m.index ?? 0) + m[0].length)
      const label = m[0].trim()
      return { token: { facet, value: phrase, label, raw: m[0] } as ParsedToken, rest }
    }
  }
  return null
}

// Facets grouped by axis. A query can only mean one thing on the Time axis and one
// thing on the Place axis at once — "spring 1977 primal dead" naming both a season and
// an era isn't two constraints, it's one ambiguous one, so only the first (highest
// priority) match on each axis is kept and any other same-axis phrase is left as free
// text rather than promoted into a second, contradictory token. Series is the one
// deliberately multi-valued facet (OR semantics — "dick's picks dave's picks" is a
// sensible request for either), so it keeps extracting until no more phrases match.
type Axis = 'time' | 'place' | 'other'

const TIME_PASSES: Array<(s: string) => Extraction<ParsedToken> | null> = [
  extractDate,
  extractSeason,
  extractMonth,
  extractYearRange,
  extractDecade,
  extractEra,
  extractBareYear,
]

const PLACE_PASSES: Array<(s: string) => Extraction<ParsedToken> | null> = [
  (s) => extractPlace(s, US_STATES, 'state'),
  (s) => extractPlace(s, COUNTRIES, 'country'),
]

const OTHER_PASSES: Array<(s: string) => Extraction<ParsedToken> | null> = [
  extractRecordingType,
  extractHasAudio,
  extractHasRelease,
]

/**
 * Parse a free-text search query into recognized facet tokens plus whatever free text
 * remains. Extraction is longest/most-specific-first and only removes a match from the
 * working string when it unambiguously resolves to a valid token — anything else is left
 * as searchable text, which is what keeps this from hijacking song/venue names.
 */
export function parseQuery(raw: string): ParsedQuery {
  let working = ` ${raw} `
  const tokens: ParsedToken[] = []

  const axisTaken: Record<Axis, boolean> = { time: false, place: false, other: false }

  const tryPasses = (axis: Axis, passes: Array<(s: string) => Extraction<ParsedToken> | null>, stopAfterFirst: boolean) => {
    for (const pass of passes) {
      if (stopAfterFirst && axisTaken[axis]) return
      const hit = pass(working)
      if (hit) {
        tokens.push(hit.token)
        working = hit.rest
        axisTaken[axis] = true
      }
    }
  }

  tryPasses('time', TIME_PASSES, true)
  tryPasses('place', PLACE_PASSES, true)

  // Series: repeat until no more phrases match — this is the multi-select facet.
  let seriesHit = extractSeries(working)
  while (seriesHit) {
    tokens.push(seriesHit.token)
    working = seriesHit.rest
    seriesHit = extractSeries(working)
  }

  tryPasses('other', OTHER_PASSES, false)

  const text = working.replace(/\s+/g, ' ').trim()
  return { text, tokens }
}
