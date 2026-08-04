import type { Setlist } from '@/lib/clients/setlist'
import type { RecordingType } from '@/lib/clients/archive'
import { archiveCatalog } from '@/lib/services/archive-catalog'
import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'
import { getOfficialReleasesForDates, type OfficialRelease } from '@/lib/official-releases'
import { getEraForYear } from '@/lib/eras'
import { fromSetlistDate, slugifyVenue } from '@/lib/utils'
import { normalizeFuzzy } from '@/lib/ids'
import type { ParsedToken } from '@/lib/search/query-parser'

export interface ShowIndexEntry {
  id: string
  date: string
  year: number
  month: number
  day: number
  eraId?: string
  venue: string
  venueSlug: string
  city: string
  state?: string
  country: string
  tour?: string
  songs: string[]
  songCount: number
  setlistUrl?: string
  hasAudio: boolean
  recordingType?: RecordingType
  archiveIdentifier?: string
  releases: OfficialRelease[]
  hasRelease: boolean
  releaseSeries: string[]
  haystack: string
}

function buildEntry(setlist: Setlist, releasesByDate: Map<string, OfficialRelease[]>): ShowIndexEntry {
  const date = fromSetlistDate(setlist.eventDate)
  const [yearStr, monthStr, dayStr] = date.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  const day = parseInt(dayStr, 10)

  const venue = setlist.venue.name
  const city = setlist.venue.city.name
  const state = setlist.venue.city.state
  const country = setlist.venue.city.country.name
  const tour = setlist.tour?.name

  const songs = setlist.sets.set.flatMap(set => set.song.map(s => s.name))
  const releases = releasesByDate.get(date) ?? []
  const archiveEntry = archiveCatalog.getByDate(date)

  const haystack = normalizeFuzzy([
    venue, city, state ?? '', country, tour ?? '',
    ...releases.map(r => r.title), ...releases.map(r => r.series),
  ].join(' '))

  return {
    id: setlist.id,
    date,
    year,
    month,
    day,
    eraId: getEraForYear(year)?.id,
    venue,
    venueSlug: slugifyVenue(venue, city),
    city,
    state,
    country,
    tour,
    songs,
    songCount: songs.length,
    setlistUrl: setlist.url,
    hasAudio: !!archiveEntry?.best,
    recordingType: archiveEntry?.candidates?.[0]?.recordingType,
    archiveIdentifier: archiveEntry?.best?.identifier,
    releases,
    hasRelease: releases.length > 0,
    releaseSeries: [...new Set(releases.map(r => r.series))],
    haystack,
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __showIndex: ShowIndexEntry[] | undefined
  // eslint-disable-next-line no-var
  var __showIndexBuildPromise: Promise<ShowIndexEntry[]> | undefined
}

async function buildShowIndex(): Promise<ShowIndexEntry[]> {
  const setlists = await realtimeSongFactsService.getAllSetlists()
  const dates = setlists.map(s => fromSetlistDate(s.eventDate))
  const flatReleases = getOfficialReleasesForDates(dates)
  const releasesByDate = new Map<string, OfficialRelease[]>()
  for (const r of flatReleases) {
    const list = releasesByDate.get(r.date)
    if (list) list.push(r)
    else releasesByDate.set(r.date, [r])
  }
  return setlists
    .map(s => buildEntry(s, releasesByDate))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Server-only singleton, rebuilt whenever the underlying setlist cache is refreshed
 * (the setlist service already handles its own stale-while-revalidate; this index is
 * cheap enough to rebuild per cold start rather than tracking invalidation itself). */
export async function getShowIndex(): Promise<ShowIndexEntry[]> {
  if (globalThis.__showIndex) return globalThis.__showIndex
  if (!globalThis.__showIndexBuildPromise) {
    globalThis.__showIndexBuildPromise = buildShowIndex().then(index => {
      globalThis.__showIndex = index
      return index
    })
  }
  return globalThis.__showIndexBuildPromise
}

export interface ShowFilters {
  date?: string
  hasAudio?: boolean
  recordingType?: RecordingType
  hasRelease?: boolean
  series?: string[]
  year?: number
  yearFrom?: number
  yearTo?: number
  /** Multiple decades OR together — "70s or 80s" is a sensible request. */
  decade?: number[]
  /** Multiple eras OR together, same reasoning as decade. */
  eraId?: string[]
  /** Multiple countries OR together. */
  country?: string[]
  /** Multiple states OR together. */
  state?: string[]
  city?: string
  tour?: string
  month?: { year: number; month: number }
  season?: { year: number; monthFrom: number; monthTo: number }
}

/** Build ShowFilters from parsed query tokens + explicit rail selections (rail wins on overlap). */
const TIME_KEYS: (keyof ShowFilters)[] = ['date', 'year', 'yearFrom', 'yearTo', 'month', 'season', 'decade', 'eraId']
const PLACE_KEYS: (keyof ShowFilters)[] = ['country', 'state']

function hasAny(obj: Partial<ShowFilters>, keys: (keyof ShowFilters)[]): boolean {
  return keys.some(k => {
    const v = obj[k]
    if (v === undefined) return false
    return Array.isArray(v) ? v.length > 0 : true
  })
}

/**
 * Merge parsed-query tokens with explicit rail selections into one ShowFilters.
 *
 * Same-axis *facets* can't both hold true at once — "1980s" (decade) and "Primal Dead"
 * (era, 1965-71) aren't two constraints to AND together, they're two ways of saying
 * "when", and combining them either double-narrows redundantly or silently produces
 * zero results with no indication why. Two precedence rules resolve every case:
 *
 *   1. Rail beats token on the same axis: a deliberate click always overrides an
 *      ambient typed word (Time: date/year/yearFrom/yearTo/month/season/decade/eraId;
 *      Place: country/state; plus the single-valued recordingType).
 *   2. Within a single source, the more specific facet wins: eraId over decade,
 *      state over country (every state in this dataset belongs to exactly one
 *      country, so state already implies it).
 *
 * Within one facet, multiple values are a different story: decade, eraId, country,
 * state, and series are all OR-combined ("70s or 80s", "California or New York") —
 * that's not a contradiction, so those merge like series always has (token's one
 * match unioned with however many the rail has checked), while decade-vs-era and
 * country-vs-state stay mutually exclusive per the axis rule above.
 */
export function tokensToFilters(tokens: ParsedToken[], railOverrides: Partial<ShowFilters> = {}): ShowFilters {
  const fromTokens: ShowFilters = {}
  for (const token of tokens) {
    switch (token.facet) {
      case 'date': fromTokens.date = token.value; break
      case 'year': fromTokens.year = token.value; break
      case 'yearRange': fromTokens.yearFrom = token.value.from; fromTokens.yearTo = token.value.to; break
      case 'decade': fromTokens.decade = [...(fromTokens.decade ?? []), token.value]; break
      case 'month': fromTokens.month = token.value; break
      case 'season': fromTokens.season = token.value; break
      case 'era': fromTokens.eraId = [...(fromTokens.eraId ?? []), token.value]; break
      case 'series': fromTokens.series = [...(fromTokens.series ?? []), token.value]; break
      case 'recordingType': fromTokens.recordingType = token.value; break
      case 'hasAudio': fromTokens.hasAudio = true; break
      case 'hasRelease': fromTokens.hasRelease = true; break
      case 'country': fromTokens.country = [...(fromTokens.country ?? []), token.value]; break
      case 'state': fromTokens.state = [...(fromTokens.state ?? []), token.value]; break
    }
  }

  // Rule 1: rail wins over token, per axis (and for the single-valued recordingType).
  // Note this suppresses the token's Time/Place contribution entirely rather than
  // merging it — once the rail has taken a position on an axis, an ambient typed word
  // for that same axis is dropped, not unioned in (unlike same-facet multi-select).
  if (hasAny(railOverrides, TIME_KEYS)) {
    for (const key of TIME_KEYS) delete fromTokens[key]
  }
  if (hasAny(railOverrides, PLACE_KEYS)) {
    for (const key of PLACE_KEYS) delete fromTokens[key]
  }
  if (railOverrides.recordingType !== undefined) {
    delete fromTokens.recordingType
  }

  const union = (a?: string[], b?: string[]) => {
    const merged = [...new Set([...(a ?? []), ...(b ?? [])])]
    return merged.length > 0 ? merged : undefined
  }
  const unionNum = (a?: number[], b?: number[]) => {
    const merged = [...new Set([...(a ?? []), ...(b ?? [])])]
    return merged.length > 0 ? merged : undefined
  }

  const merged: ShowFilters = {
    ...fromTokens,
    ...railOverrides,
    series: union(fromTokens.series, railOverrides.series),
    decade: unionNum(fromTokens.decade, railOverrides.decade),
    eraId: union(fromTokens.eraId, railOverrides.eraId),
    country: union(fromTokens.country, railOverrides.country),
    state: union(fromTokens.state, railOverrides.state),
  }

  // Rule 2: defensive same-source resolution — the more specific facet wins even if
  // both somehow ended up set together (e.g. a hand-edited URL with both params).
  if (merged.eraId?.length && merged.decade?.length) delete merged.decade
  if (merged.state?.length && merged.country?.length) delete merged.country

  return merged
}

function matchesFilters(entry: ShowIndexEntry, filters: ShowFilters, skip?: keyof ShowFilters): boolean {
  if (filters.date && skip !== 'date' && entry.date !== filters.date) return false
  if (filters.hasAudio && skip !== 'hasAudio' && !entry.hasAudio) return false
  if (filters.recordingType && skip !== 'recordingType' && entry.recordingType !== filters.recordingType) return false
  if (filters.hasRelease && skip !== 'hasRelease' && !entry.hasRelease) return false
  if (filters.series?.length && skip !== 'series' && !filters.series.some(s => entry.releaseSeries.includes(s))) return false
  if (filters.year !== undefined && skip !== 'year' && entry.year !== filters.year) return false
  if (filters.yearFrom !== undefined && skip !== 'yearFrom' && skip !== 'yearTo') {
    if (entry.year < filters.yearFrom || entry.year > (filters.yearTo ?? filters.yearFrom)) return false
  }
  if (filters.decade?.length && skip !== 'decade') {
    if (!filters.decade.some(d => entry.year >= d && entry.year <= d + 9)) return false
  }
  if (filters.eraId?.length && skip !== 'eraId' && !filters.eraId.includes(entry.eraId ?? '')) return false
  if (filters.country?.length && skip !== 'country') {
    if (!filters.country.some(c => normalizeFuzzy(entry.country) === normalizeFuzzy(c))) return false
  }
  if (filters.state?.length && skip !== 'state') {
    if (!filters.state.some(s => normalizeFuzzy(entry.state ?? '') === normalizeFuzzy(s))) return false
  }
  if (filters.city && skip !== 'city' && normalizeFuzzy(entry.city) !== normalizeFuzzy(filters.city)) return false
  if (filters.tour && skip !== 'tour' && normalizeFuzzy(entry.tour ?? '') !== normalizeFuzzy(filters.tour)) return false
  if (filters.month && skip !== 'month') {
    if (entry.year !== filters.month.year || entry.month !== filters.month.month) return false
  }
  if (filters.season && skip !== 'season') {
    const { year, monthFrom, monthTo } = filters.season
    if (monthFrom <= monthTo) {
      if (entry.year !== year || entry.month < monthFrom || entry.month > monthTo) return false
    } else {
      // wraps year boundary (winter: Dec–Feb)
      const inEarlyWindow = entry.year === year && entry.month <= monthTo
      const inLateWindow = entry.year === year - 1 && entry.month >= monthFrom
      if (!inEarlyWindow && !inLateWindow) return false
    }
  }
  return true
}

export function filterShows(index: ShowIndexEntry[], filters: ShowFilters, text?: string): ShowIndexEntry[] {
  const q = text ? normalizeFuzzy(text) : ''
  return index.filter(entry => {
    if (!matchesFilters(entry, filters)) return false
    if (q && !entry.haystack.includes(q)) return false
    return true
  })
}

export interface FacetOption {
  value: string
  label: string
  count: number
}

/** Standard faceted-search counting: each facet's option counts are computed against the
 * set filtered by every OTHER active facet, so toggling a facet never zeroes out its own
 * sibling options. */
export function computeFacetCounts(
  index: ShowIndexEntry[],
  filters: ShowFilters,
  text?: string
): Record<string, FacetOption[]> {
  const q = text ? normalizeFuzzy(text) : ''
  const base = index.filter(entry => !q || entry.haystack.includes(q))

  const count = (skip: keyof ShowFilters, get: (e: ShowIndexEntry) => (string | undefined)[]) => {
    const tally = new Map<string, number>()
    for (const entry of base) {
      if (!matchesFilters(entry, filters, skip)) continue
      for (const value of get(entry)) {
        if (!value) continue
        tally.set(value, (tally.get(value) ?? 0) + 1)
      }
    }
    return tally
  }

  const toOptions = (tally: Map<string, number>): FacetOption[] =>
    [...tally.entries()]
      .map(([value, cnt]) => ({ value, label: value, count: cnt }))
      .sort((a, b) => b.count - a.count)

  const recordingTypeTally = count('recordingType', e => [e.recordingType])
  const seriesTally = count('series', e => e.releaseSeries)
  const eraTally = count('eraId', e => [e.eraId])
  const countryTally = count('country', e => [e.country])
  const stateTally = count('state', e => [e.state])
  const tourTally = count('tour', e => [e.tour])
  const decadeTally = count('decade', e => [`${Math.floor(e.year / 10) * 10}`])

  let hasAudioCount = 0
  let hasReleaseCount = 0
  for (const entry of base) {
    if (matchesFilters(entry, filters, 'hasAudio') && entry.hasAudio) hasAudioCount++
    if (matchesFilters(entry, filters, 'hasRelease') && entry.hasRelease) hasReleaseCount++
  }

  return {
    hasAudio: [{ value: 'true', label: 'has audio', count: hasAudioCount }],
    hasRelease: [{ value: 'true', label: 'official release', count: hasReleaseCount }],
    recordingType: toOptions(recordingTypeTally),
    series: toOptions(seriesTally),
    era: toOptions(eraTally),
    country: toOptions(countryTally),
    state: toOptions(stateTally),
    tour: toOptions(tourTally),
    decade: toOptions(decadeTally).sort((a, b) => a.value.localeCompare(b.value)),
  }
}
