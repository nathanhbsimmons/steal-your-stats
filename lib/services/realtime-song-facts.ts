import fs from 'fs'
import path from 'path'
import { SetlistClientImpl, Setlist } from '../clients/setlist'
import { ArchiveClientImpl } from '../clients/archive'
import { HttpError } from '../http'
import { resolveSong } from '../ids'
import { fromSetlistDate, parseArchiveDuration, toTitleCase } from '../utils'

export interface ShowRef {
  id: string
  date: string
  venue: string
  city: string
  state?: string
  country: string
  url: string
  source: 'setlist.fm'
}

export interface FirstLastFacts {
  first: ShowRef | null
  last: ShowRef | null
  totalPerformances: number
  songTitle: string
  aliases: string[]
}

export interface PositionFacts {
  opener: {
    count: number
    shows: ShowRef[]
  }
  closer: {
    count: number
    shows: ShowRef[]
  }
  encore: {
    count: number
    shows: ShowRef[]
  }
  set1Closer: {
    count: number
    shows: ShowRef[]
  }
  set2Opener: {
    count: number
    shows: ShowRef[]
  }
  songTitle: string
  aliases: string[]
}

export interface VersionTrack {
  id: string
  showDate: string
  venue: string
  city: string
  state?: string
  country: string
  archiveItemId?: string
  durationSec?: number
  url?: string
}

export interface VersionsFacts {
  tracks: VersionTrack[]
  extremes?: {
    longest?: VersionTrack
    shortest?: VersionTrack
  }
  songTitle: string
}

// Cache of all GD setlists. Populated once on first request, reused for all
// subsequent song queries. The songName filter on setlist.fm's API is broken
// (always returns all GD shows), so we fetch every page and filter client-side.
interface AllSetlistsCache {
  setlists: Setlist[]
  cachedAt: number
}

interface VersionsCache {
  facts: VersionsFacts
  cachedAt: number
}

const ALL_SETLISTS_TTL = 4 * 60 * 60 * 1000  // 4 hours in-memory
const DISK_CACHE_TTL  = 12 * 60 * 60 * 1000  // 12 hours on disk
const VERSIONS_TTL = 24 * 60 * 60 * 1000     // 24 hours
const RATE_LIMIT_DELAY = 800 // ms between sequential page requests
const ENRICH_TIMEOUT_MS = 12_000 // max time to spend fetching Archive.org durations
const DISK_CACHE_PATH = path.join(process.cwd(), '.cache', 'gd-setlists.json')

export class RealtimeSongFactsService {
  private setlistClient: SetlistClientImpl
  private archiveClient: ArchiveClientImpl
  private readonly GRATEFUL_DEAD_MBID = '6faa7ca7-0d99-4a5e-bfa6-1fd5037520c6'
  private allSetlistsCache: AllSetlistsCache | null = null
  private versionsCache = new Map<string, VersionsCache>()
  private buildPromise: Promise<Setlist[]> | null = null
  private successorMap: Map<string, { name: string; count: number }[]> | null = null
  private predecessorMap: Map<string, { name: string; count: number }[]> | null = null

  constructor() {
    this.setlistClient = new SetlistClientImpl()
    this.archiveClient = new ArchiveClientImpl()
  }

  private loadFromDisk(): { setlists: Setlist[]; stale: boolean } | null {
    try {
      const raw = fs.readFileSync(DISK_CACHE_PATH, 'utf8')
      const { setlists, cachedAt } = JSON.parse(raw) as { setlists: Setlist[]; cachedAt: number }
      const stale = Date.now() - cachedAt >= DISK_CACHE_TTL
      console.log(`[setlists] loaded ${setlists.length} setlists from disk cache (${stale ? 'stale' : 'fresh'})`)
      return { setlists, stale }
    } catch {}
    return null
  }

  private saveToDisk(setlists: Setlist[]): void {
    try {
      fs.mkdirSync(path.dirname(DISK_CACHE_PATH), { recursive: true })
      fs.writeFileSync(DISK_CACHE_PATH, JSON.stringify({ setlists, cachedAt: Date.now() }))
      console.log(`[setlists] saved ${setlists.length} setlists to disk cache`)
    } catch (err) {
      console.warn('[setlists] failed to save disk cache:', err)
    }
  }

  // Returns all GD setlists, fetching from setlist.fm if needed.
  // Strategy: stale-while-revalidate.
  //   • If in-memory cache is fresh → return immediately.
  //   • If disk cache exists (even stale) → return it immediately, then kick off a
  //     background refresh so the next request gets fresher data.
  //   • If no cache at all → block while fetching (cold start, unavoidable).
  // Concurrent callers share the same in-flight promise so the API is only hit once.
  private async getAllGDSetlists(): Promise<Setlist[]> {
    // 1. In-memory cache is fresh — fastest path.
    if (this.allSetlistsCache && Date.now() - this.allSetlistsCache.cachedAt < ALL_SETLISTS_TTL) {
      return this.allSetlistsCache.setlists
    }

    // 2. Disk cache exists — serve it immediately regardless of age,
    //    then revalidate in the background if stale.
    const fromDisk = this.loadFromDisk()
    if (fromDisk) {
      this.allSetlistsCache = { setlists: fromDisk.setlists, cachedAt: Date.now() }
      this.successorMap = this.buildSuccessorMap(fromDisk.setlists)
      this.predecessorMap = this.buildPredecessorMap(fromDisk.setlists)

      if (fromDisk.stale && !this.buildPromise) {
        // Background refresh — never blocks the caller.
        this.buildPromise = this.fetchAllPages().then(setlists => {
          this.allSetlistsCache = { setlists, cachedAt: Date.now() }
          this.successorMap = this.buildSuccessorMap(setlists)
          this.predecessorMap = this.buildPredecessorMap(setlists)
          this.saveToDisk(setlists)
          this.buildPromise = null
          return setlists
        }).catch(err => {
          console.warn('[setlists] background refresh failed:', err)
          this.buildPromise = null
          throw err
        })
      }

      return fromDisk.setlists
    }

    // 3. No cache at all — must block (cold start after a clean deploy).
    if (this.buildPromise) return this.buildPromise

    this.buildPromise = this.fetchAllPages().then(setlists => {
      this.allSetlistsCache = { setlists, cachedAt: Date.now() }
      this.successorMap = this.buildSuccessorMap(setlists)
      this.predecessorMap = this.buildPredecessorMap(setlists)
      this.saveToDisk(setlists)
      this.buildPromise = null
      return setlists
    }).catch(err => {
      this.buildPromise = null
      throw err
    })

    return this.buildPromise
  }

  private async fetchAllPages(): Promise<Setlist[]> {
    const page1 = await this.setlistClient.getArtistSetlistsPage(this.GRATEFUL_DEAD_MBID, 1)
    const totalPages = page1.total > 0 ? Math.ceil(page1.total / (page1.itemsPerPage || 20)) : 120

    const all: Setlist[] = [...page1.setlists]

    // Fetch remaining pages sequentially to avoid rate limiting
    for (let page = 2; page <= totalPages; page++) {
      await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY))
      try {
        const result = await this.setlistClient.getArtistSetlistsPage(this.GRATEFUL_DEAD_MBID, page)
        all.push(...result.setlists)
      } catch (err) {
        if (err instanceof HttpError && err.status === 429) {
          // Rate limited — cache and return what we have rather than failing entirely
          console.warn(`Rate limited at page ${page}; returning ${all.length} partial setlists`)
          return all
        }
        throw err
      }
    }

    return all
  }

  // Build a map of song → top successors from every consecutive song pair in the cache.
  // Runs once after the setlist cache is populated; subsequent lookups are O(1).
  private buildSuccessorMap(setlists: Setlist[]): Map<string, { name: string; count: number }[]> {
    const raw = new Map<string, Map<string, number>>()

    for (const setlist of setlists) {
      for (const set of setlist.sets.set) {
        const songs = set.song
        for (let i = 0; i < songs.length - 1; i++) {
          const curr = songs[i].name
          const next = songs[i + 1]?.name
          if (!curr || !next) continue
          const currKey = resolveSong({ title: curr }).normalizedTitle.toLowerCase()
          const nextLabel = toTitleCase(resolveSong({ title: next }).normalizedTitle)
          if (!raw.has(currKey)) raw.set(currKey, new Map())
          const m = raw.get(currKey)!
          m.set(nextLabel, (m.get(nextLabel) || 0) + 1)
        }
      }
    }

    const result = new Map<string, { name: string; count: number }[]>()
    for (const [key, counts] of raw) {
      result.set(key, [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count })))
    }
    return result
  }

  async getSongPairings(songTitle: string, limit = 3): Promise<{ name: string; count: number }[]> {
    await this.getAllGDSetlists() // ensure map is built
    if (!this.successorMap) return []
    const searchNames = this.buildSearchNames(songTitle)
    for (const name of searchNames) {
      const hits = this.successorMap.get(name)
      if (hits) return hits.slice(0, limit)
    }
    return []
  }

  private buildPredecessorMap(setlists: Setlist[]): Map<string, { name: string; count: number }[]> {
    const raw = new Map<string, Map<string, number>>()
    for (const setlist of setlists) {
      for (const set of setlist.sets.set) {
        const songs = set.song
        for (let i = 1; i < songs.length; i++) {
          const curr = songs[i].name
          const prev = songs[i - 1]?.name
          if (!curr || !prev) continue
          const currKey = resolveSong({ title: curr }).normalizedTitle.toLowerCase()
          const prevLabel = toTitleCase(resolveSong({ title: prev }).normalizedTitle)
          if (!raw.has(currKey)) raw.set(currKey, new Map())
          const m = raw.get(currKey)!
          m.set(prevLabel, (m.get(prevLabel) || 0) + 1)
        }
      }
    }
    const result = new Map<string, { name: string; count: number }[]>()
    for (const [key, counts] of raw) {
      result.set(key, [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count })))
    }
    return result
  }

  async getSongPredecessors(songTitle: string, limit = 3): Promise<{ name: string; count: number }[]> {
    await this.getAllGDSetlists()
    if (!this.predecessorMap) return []
    const searchNames = this.buildSearchNames(songTitle)
    for (const name of searchNames) {
      const hits = this.predecessorMap.get(name)
      if (hits) return hits.slice(0, limit)
    }
    return []
  }

  private toShowRef(setlist: Setlist): ShowRef {
    return {
      id: setlist.id,
      date: fromSetlistDate(setlist.eventDate),
      venue: setlist.venue.name,
      city: setlist.venue.city.name,
      state: setlist.venue.city.state,
      country: setlist.venue.city.country.name,
      url: setlist.url || `https://www.setlist.fm/setlist/${setlist.id}`,
      source: 'setlist.fm',
    }
  }

  private buildSearchNames(songTitle: string): Set<string> {
    const resolution = resolveSong({ title: songTitle })
    return new Set([resolution.normalizedTitle, ...resolution.aliases].map(a => a.toLowerCase()))
  }

  private setlistContainsSong(setlist: Setlist, searchNames: Set<string>): boolean {
    return setlist.sets.set.some(set =>
      set.song.some(song => searchNames.has(song.name.toLowerCase()))
    )
  }

  async getAllPerformances(songTitle: string): Promise<{ performances: ShowRef[]; songTitle: string }> {
    const resolution = resolveSong({ title: songTitle })
    const searchNames = this.buildSearchNames(songTitle)
    const allSetlists = await this.getAllGDSetlists()
    const matching = allSetlists.filter(s => this.setlistContainsSong(s, searchNames))
    const performances = matching.map(s => this.toShowRef(s)).sort((a, b) => a.date.localeCompare(b.date))
    return { performances, songTitle: resolution.normalizedTitle }
  }

  async getFirstLast(songTitle: string): Promise<FirstLastFacts> {
    const resolution = resolveSong({ title: songTitle })
    const searchNames = this.buildSearchNames(songTitle)
    const allSetlists = await this.getAllGDSetlists()

    const matching = allSetlists.filter(s => this.setlistContainsSong(s, searchNames))

    if (matching.length === 0) {
      return { first: null, last: null, totalPerformances: 0, songTitle: resolution.normalizedTitle, aliases: resolution.aliases }
    }

    const refs = matching.map(s => this.toShowRef(s)).sort((a, b) => a.date.localeCompare(b.date))

    return {
      first: refs[0],
      last: refs[refs.length - 1],
      totalPerformances: matching.length,
      songTitle: resolution.normalizedTitle,
      aliases: resolution.aliases,
    }
  }

  async getPositions(songTitle: string): Promise<PositionFacts> {
    const resolution = resolveSong({ title: songTitle })
    const searchNames = this.buildSearchNames(songTitle)
    const allSetlists = await this.getAllGDSetlists()

    const openerShows: ShowRef[] = []
    const closerShows: ShowRef[] = []
    const encoreShows: ShowRef[] = []
    const set1CloserShows: ShowRef[] = []
    const set2OpenerShows: ShowRef[] = []

    for (const setlist of allSetlists) {
      const sets = setlist.sets?.set || []
      if (sets.length === 0) continue
      if (!this.setlistContainsSong(setlist, searchNames)) continue

      const regularSets = sets.filter(s => !s.encore)
      const encoreSets = sets.filter(s => s.encore)
      const showRef = this.toShowRef(setlist)

      for (const set of encoreSets) {
        if (set.song.some(s => searchNames.has(s.name.toLowerCase()))) {
          encoreShows.push(showRef)
          break
        }
      }

      if (regularSets.length > 0 && regularSets[0].song.length > 0) {
        if (searchNames.has(regularSets[0].song[0].name.toLowerCase())) {
          openerShows.push(showRef)
        }
      }

      const lastRegular = regularSets[regularSets.length - 1]
      if (lastRegular && lastRegular.song.length > 0) {
        const lastSong = lastRegular.song[lastRegular.song.length - 1]
        if (searchNames.has(lastSong.name.toLowerCase())) {
          closerShows.push(showRef)
        }
      }

      // Set I closer: last song of the first regular set (only when there are 2+ regular sets)
      if (regularSets.length >= 2 && regularSets[0].song.length > 0) {
        const set1Last = regularSets[0].song[regularSets[0].song.length - 1]
        if (searchNames.has(set1Last.name.toLowerCase())) {
          set1CloserShows.push(showRef)
        }
      }

      // Set II opener: first song of the second regular set
      if (regularSets.length >= 2 && regularSets[1].song.length > 0) {
        if (searchNames.has(regularSets[1].song[0].name.toLowerCase())) {
          set2OpenerShows.push(showRef)
        }
      }
    }

    return {
      opener: { count: openerShows.length, shows: openerShows },
      closer: { count: closerShows.length, shows: closerShows },
      encore: { count: encoreShows.length, shows: encoreShows },
      set1Closer: { count: set1CloserShows.length, shows: set1CloserShows },
      set2Opener: { count: set2OpenerShows.length, shows: set2OpenerShows },
      songTitle: resolution.normalizedTitle,
      aliases: resolution.aliases,
    }
  }

  // Resolve a single track's Archive.org duration and URL.
  // Skips silently on any error (show may not be on Archive.org).
  private async enrichTrack(
    track: VersionTrack,
    normalizedTitle: string,
    aliases: string[],
  ): Promise<void> {
    try {
      const show = await this.archiveClient.resolveArchiveShow({
        date: track.showDate,
        venue: track.venue,
        city: track.city,
      })
      if (!show) return

      track.archiveItemId = show.identifier

      const allTracks = await this.archiveClient.listTracks(show.identifier)
      if (allTracks.length === 0) return

      const searchTitles = [normalizedTitle, ...aliases].map(t => t.toLowerCase())
      const matched = allTracks.filter(t => {
        const nameHit = searchTitles.some(st => t.name.toLowerCase().includes(st))
        const titleHit = t.title && searchTitles.some(st => t.title!.toLowerCase().includes(st))
        return nameHit || titleHit
      })
      const best = matched[0]
      if (!best?.length) return

      const dur = parseArchiveDuration(best.length)
      if (dur) track.durationSec = dur
      track.url = `https://archive.org/download/${show.identifier}/${best.name}`
    } catch {
      // Archive.org unavailable for this show — leave fields undefined
    }
  }

  // Enrich every track with Archive.org durations. Cheap now that ArchiveClientImpl
  // is catalog-backed (in-memory lookup, no network) for any indexed show — only
  // uncatalogued shows fall through to live Archive.org calls. Still races against
  // ENRICH_TIMEOUT_MS as a safety net so a slew of uncatalogued shows can't block
  // the response indefinitely.
  private async enrichSample(tracks: VersionTrack[], normalizedTitle: string, aliases: string[]): Promise<void> {
    const work = Promise.allSettled(
      tracks.map(track => this.enrichTrack(track, normalizedTitle, aliases))
    )
    const timeout = new Promise<void>(resolve => setTimeout(resolve, ENRICH_TIMEOUT_MS))
    await Promise.race([work, timeout])
  }

  async getVersions(songTitle: string): Promise<VersionsFacts> {
    const resolution = resolveSong({ title: songTitle })
    const cacheKey = resolution.normalizedTitle.toLowerCase()

    // Return cached enriched result if still fresh
    const cached = this.versionsCache.get(cacheKey)
    if (cached && Date.now() - cached.cachedAt < VERSIONS_TTL) {
      return cached.facts
    }

    const searchNames = this.buildSearchNames(songTitle)
    const allSetlists = await this.getAllGDSetlists()

    const matching = allSetlists.filter(s => this.setlistContainsSong(s, searchNames))

    const tracks: VersionTrack[] = matching
      .map((setlist, index) => {
        const ref = this.toShowRef(setlist)
        return {
          id: `${resolution.normalizedTitle}-${ref.id}-${index}`,
          showDate: ref.date,
          venue: ref.venue,
          city: ref.city,
          state: ref.state,
          country: ref.country,
          archiveItemId: undefined,
          durationSec: undefined,
          url: undefined,
        }
      })
      .sort((a, b) => b.showDate.localeCompare(a.showDate))

    await this.enrichSample(tracks, resolution.normalizedTitle, resolution.aliases)

    const withDuration = tracks.filter(t => t.durationSec !== undefined)
    const extremes = withDuration.length >= 2
      ? {
          longest: withDuration.reduce((a, b) => (b.durationSec! > a.durationSec! ? b : a)),
          shortest: withDuration.reduce((a, b) => (b.durationSec! < a.durationSec! ? b : a)),
        }
      : undefined

    const facts: VersionsFacts = { tracks, extremes, songTitle: resolution.normalizedTitle }
    this.versionsCache.set(cacheKey, { facts, cachedAt: Date.now() })
    return facts
  }

  async getShowsOnDate(month: string, day: string): Promise<ShowOnThisDay[]> {
    const allSetlists = await this.getAllGDSetlists()
    return allSetlists
      .filter(setlist => {
        const parts = setlist.eventDate.split('-') // DD-MM-YYYY
        return parts[0] === day && parts[1] === month
      })
      .map(setlist => {
        const isoDate = fromSetlistDate(setlist.eventDate)
        const songs: string[] = []
        for (const set of setlist.sets.set) {
          for (const song of set.song) {
            if (song.name) songs.push(song.name)
          }
        }
        return {
          date: isoDate,
          year: parseInt(isoDate.split('-')[0]),
          venue: setlist.venue.name,
          city: setlist.venue.city.name,
          state: setlist.venue.city.state,
          country: setlist.venue.city.country.name,
          songs,
          setlistUrl: setlist.url,
        }
      })
      .sort((a, b) => a.year - b.year)
  }

  async getVenueStats(): Promise<VenueStat[]> {
    const allSetlists = await this.getAllGDSetlists()

    const venueMap = new Map<string, VenueStat>()
    for (const setlist of allSetlists) {
      const { venue } = setlist
      const key = `${venue.name}||${venue.city.name}`
      const isoDate = fromSetlistDate(setlist.eventDate)
      const year = parseInt(isoDate.split('-')[0])

      if (venueMap.has(key)) {
        const v = venueMap.get(key)!
        v.showCount++
        if (year < v.firstYear) v.firstYear = year
        if (year > v.lastYear) v.lastYear = year
      } else {
        venueMap.set(key, {
          name: venue.name,
          city: venue.city.name,
          state: venue.city.state,
          country: venue.city.country.name,
          showCount: 1,
          firstYear: year,
          lastYear: year,
        })
      }
    }

    return [...venueMap.values()].sort((a, b) => b.showCount - a.showCount)
  }

  async getSummaryStats(): Promise<SummaryStats> {
    const allSetlists = await this.getAllGDSetlists()

    const songNames = new Set<string>()
    for (const setlist of allSetlists) {
      for (const set of setlist.sets.set) {
        for (const song of set.song) {
          if (song.name) songNames.add(song.name.toLowerCase())
        }
      }
    }

    return {
      totalShows: allSetlists.length,
      uniqueSongs: songNames.size,
      hoursArchived: Math.round(allSetlists.length * 2.7),
      lastUpdated: this.allSetlistsCache?.cachedAt ?? null,
    }
  }

  async getShowsByYearRange(yearFrom: number, yearTo: number, page = 1, perPage = 25): Promise<{ shows: ShowRef[]; total: number; page: number; perPage: number }> {
    const allSetlists = await this.getAllGDSetlists()
    const filtered = allSetlists.filter(s => {
      const year = parseInt(fromSetlistDate(s.eventDate).split('-')[0])
      return year >= yearFrom && year <= yearTo
    }).sort((a, b) => fromSetlistDate(a.eventDate).localeCompare(fromSetlistDate(b.eventDate)))

    const total = filtered.length
    const start = (page - 1) * perPage
    const shows = filtered.slice(start, start + perPage).map(s => this.toShowRef(s))
    return { shows, total, page, perPage }
  }

  async getTopSongsByYearRange(yearFrom: number, yearTo: number, limit = 20): Promise<{ name: string; count: number }[]> {
    const allSetlists = await this.getAllGDSetlists()
    const inRange = allSetlists.filter(s => {
      const year = parseInt(fromSetlistDate(s.eventDate).split('-')[0])
      return year >= yearFrom && year <= yearTo
    })
    const counts = new Map<string, number>()
    for (const setlist of inRange) {
      for (const set of setlist.sets.set) {
        for (const song of set.song) {
          if (!song.name) continue
          const key = toTitleCase(resolveSong({ title: song.name }).normalizedTitle)
          counts.set(key, (counts.get(key) || 0) + 1)
        }
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([name, count]) => ({ name, count }))
  }

  async getTopSongsByVenue(venueName: string, limit = 20): Promise<{ name: string; count: number }[]> {
    const allSetlists = await this.getAllGDSetlists()
    const lower = venueName.toLowerCase()
    const matching = allSetlists.filter(s => s.venue.name.toLowerCase().includes(lower))
    const counts = new Map<string, number>()
    for (const setlist of matching) {
      for (const set of setlist.sets.set) {
        for (const song of set.song) {
          if (!song.name) continue
          const key = toTitleCase(resolveSong({ title: song.name }).normalizedTitle)
          counts.set(key, (counts.get(key) || 0) + 1)
        }
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }))
  }

  async getGlobalStats(): Promise<GlobalStats> {
    const allSetlists = await this.getAllGDSetlists()

    const yearMap = new Map<number, number>()
    for (const setlist of allSetlists) {
      const isoDate = fromSetlistDate(setlist.eventDate)
      const year = parseInt(isoDate.split('-')[0])
      if (!isNaN(year) && year >= 1965 && year <= 1995) {
        yearMap.set(year, (yearMap.get(year) || 0) + 1)
      }
    }
    const showsPerYear = Array.from({ length: 31 }, (_, i) => {
      const year = 1965 + i
      return { year, count: yearMap.get(year) || 0 }
    })

    const songCounts = new Map<string, number>()
    for (const setlist of allSetlists) {
      for (const set of setlist.sets.set) {
        for (const song of set.song) {
          if (!song.name) continue
          const resolution = resolveSong({ title: song.name })
          const key = resolution.normalizedTitle
          songCounts.set(key, (songCounts.get(key) || 0) + 1)
        }
      }
    }
    const sorted = [...songCounts.entries()].sort((a, b) => b[1] - a[1])
    const maxCount = sorted[0]?.[1] ?? 1
    const leaderboard = sorted.slice(0, 20).map(([name, count]) => ({
      name: toTitleCase(name),
      count,
      pct: Math.round((count / maxCount) * 100),
    }))

    return { showsPerYear, leaderboard }
  }
}

export interface VenueStat {
  name: string
  city: string
  state?: string
  country: string
  showCount: number
  firstYear: number
  lastYear: number
}

export interface SummaryStats {
  totalShows: number
  uniqueSongs: number
  hoursArchived: number
  lastUpdated: number | null
}

export interface GlobalStats {
  showsPerYear: { year: number; count: number }[]
  leaderboard: { name: string; count: number; pct: number }[]
}

export interface ShowOnThisDay {
  date: string
  year: number
  venue: string
  city: string
  state?: string
  country: string
  songs: string[]
  setlistUrl?: string
}

// Compute a fingerprint of the class's public API so the singleton is
// automatically replaced when methods are added or removed (e.g. after a
// hot-reload that would otherwise keep a stale instance in globalThis).
const _classMethods = Object.getOwnPropertyNames(RealtimeSongFactsService.prototype).sort().join(',')

declare global {
  // eslint-disable-next-line no-var
  var __realtimeSongFactsService: RealtimeSongFactsService | undefined
  // eslint-disable-next-line no-var
  var __realtimeSongFactsServiceMethods: string | undefined
}

export const realtimeSongFactsService: RealtimeSongFactsService = (() => {
  if (
    globalThis.__realtimeSongFactsService &&
    globalThis.__realtimeSongFactsServiceMethods === _classMethods
  ) {
    return globalThis.__realtimeSongFactsService
  }
  const svc = new RealtimeSongFactsService()
  globalThis.__realtimeSongFactsService = svc
  globalThis.__realtimeSongFactsServiceMethods = _classMethods
  return svc
})()
