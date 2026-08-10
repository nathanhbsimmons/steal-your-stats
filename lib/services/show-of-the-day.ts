import fs from 'fs'
import path from 'path'
import { ArchiveClientImpl } from '@/lib/clients/archive'
import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'
import { fetchShowDetail, mapSetlistToShowDetail } from '@/lib/services/show-detail'
import { pickFeaturedShow } from '@/lib/featured-show'
import { widenDateSearch } from '@/lib/date-offset'
import { formatArchiveTracks } from '@/lib/archive-track-format'
import { matchArchiveTracksToSetlist } from '@/lib/archive-track-match'
import type { ShowOfTheDayPayload, ShowOnThisDay } from '@/lib/show-of-the-day-types'

// "The day" is fixed to US/Eastern, matching the /api/on-this-day convention.
// Deploy hosts run UTC, which rolls to the next date hours before US evening —
// pin to a real TZ instead of the server's local clock.
// The calendar date IS the cache key — rollover invalidates, no TTL needed.
const DISK_CACHE_PATH = path.join(process.cwd(), '.cache', 'show-of-the-day.json')
const INCOMPLETE_RETRY_MS = 10 * 60 * 1000
const SHOW_DAY_TZ = 'America/New_York'
// Each direction; widening only walks the offline setlist/archive-catalog
// indexes (see selectFeatured), so 14 extra getShowsOnDate calls worst case
// stays cheap/local — no new network calls in the common case.
export const MAX_WIDEN_DAYS = 7

const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: SHOW_DAY_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function localDateKey(d = new Date()): string {
  // en-CA formats as YYYY-MM-DD
  return dateKeyFormatter.format(d)
}

export class ShowOfTheDayService {
  private memory: ShowOfTheDayPayload | null = null
  private inflight: Promise<ShowOfTheDayPayload> | null = null

  async get(): Promise<ShowOfTheDayPayload> {
    const key = localDateKey()

    if (this.memory?.dateKey !== key) {
      const fromDisk = this.loadFromDisk()
      if (fromDisk?.dateKey === key) this.memory = fromDisk
    }

    if (this.memory?.dateKey === key) {
      if (
        !this.memory.complete &&
        Date.now() - this.memory.computedAt > INCOMPLETE_RETRY_MS &&
        !this.inflight
      ) {
        // Partial payload (e.g. Archive.org was down): retry in the background,
        // serve what we have now.
        this.recompute().catch(err =>
          console.warn('[show-of-the-day] background retry failed:', err)
        )
      }
      return this.memory
    }

    if (this.inflight) return this.inflight
    return this.recompute()
  }

  async recompute(): Promise<ShowOfTheDayPayload> {
    if (this.inflight) return this.inflight
    const key = localDateKey()
    this.inflight = this.compute(key)
      .then(payload => {
        this.memory = payload
        this.saveToDisk(payload)
        return payload
      })
      .finally(() => {
        this.inflight = null
      })
    return this.inflight
  }

  // Picks the featured show, preferring one with a cached Archive.org
  // recording. If the exact date's best pick has no audio (or there are no
  // shows at all on the exact date), widens outward across nearby calendar
  // dates (year-agnostic) looking for the closest one with audio, falling
  // back to the exact-date pick (which may be null) if the cap is exhausted.
  // Stays entirely on the offline setlist/archive-catalog fast path — no
  // live HTTP calls are made here.
  private async selectFeatured(
    exactShows: ShowOnThisDay[],
    seed: string,
    month: string,
    day: string,
    getAudioTrackCount: (date: string) => number,
  ): Promise<ShowOnThisDay | null> {
    const bestExact = pickFeaturedShow(exactShows, seed, getAudioTrackCount)
    if (bestExact && getAudioTrackCount(bestExact.date) > 0) return bestExact

    for (const candidate of widenDateSearch(month, day, MAX_WIDEN_DAYS)) {
      const shows = await realtimeSongFactsService.getShowsOnDate(candidate.month, candidate.day)
      const best = pickFeaturedShow(shows, seed, getAudioTrackCount)
      if (best && getAudioTrackCount(best.date) > 0) return best
    }

    return bestExact
  }

  private async compute(dateKey: string): Promise<ShowOfTheDayPayload> {
    const [, month, day] = dateKey.split('-')
    const shows = await realtimeSongFactsService.getShowsOnDate(month, day)
    // One client for the whole compute so its HttpClient cache dedupes
    // repeat /metadata fetches within the archive chain, and so the widen
    // search's catalog-only lookups and the final live-resolution chain
    // share the same instance.
    const archiveClient = new ArchiveClientImpl()
    const featured = await this.selectFeatured(
      shows, dateKey, month, day,
      date => archiveClient.getCachedAudioTrackCount(date),
    )

    if (!featured) {
      return { dateKey, shows, featured: null, showDetail: null, archive: null, archiveMatch: null, complete: true, computedAt: Date.now() }
    }

    let showDetail = null
    try {
      // Prefer the cached full-catalog setlist (no live setlist.fm call) —
      // fetchShowDetail's live lookup competes with the rest of the app for a
      // tight rate-limit budget and shouldn't be on this hot path.
      const cachedSetlist = await realtimeSongFactsService.getSetlistForDate(featured.date)
      showDetail = cachedSetlist ? mapSetlistToShowDetail(cachedSetlist) : await fetchShowDetail(featured.date)
    } catch (err) {
      console.warn('[show-of-the-day] setlist detail failed:', err)
    }

    let archive: ShowOfTheDayPayload['archive'] = null
    try {
      const candidates = await archiveClient.listArchiveShowCandidates({
        date: featured.date,
        venue: featured.venue,
        city: featured.city,
      })
      if (candidates.length > 0) {
        const identifier = showDetail?.totalSongs
          ? (await archiveClient.selectBestRecording(candidates, showDetail.totalSongs)).identifier
          : candidates[0].identifier
        const [tracks, description] = await Promise.all([
          archiveClient.getAllTracks(identifier),
          archiveClient.getItemDescription(identifier),
        ])
        archive = { identifier, tracks: formatArchiveTracks(identifier, tracks), description }
      }
    } catch (err) {
      console.warn('[show-of-the-day] archive resolution failed:', err)
    }

    let archiveMatch: ShowOfTheDayPayload['archiveMatch'] = null
    if (archive && showDetail) {
      const setlistSongs = showDetail.sets.flatMap(s => s.songs)
      archiveMatch = matchArchiveTracksToSetlist(archive.tracks, setlistSongs)
    }

    const complete = showDetail !== null && archive !== null && archiveMatch !== null
    console.log(`[show-of-the-day] computed ${dateKey}: featured=${featured.date} complete=${complete}`)
    return { dateKey, shows, featured, showDetail, archive, archiveMatch, complete, computedAt: Date.now() }
  }

  private loadFromDisk(): ShowOfTheDayPayload | null {
    try {
      const raw = fs.readFileSync(DISK_CACHE_PATH, 'utf8')
      const payload = JSON.parse(raw) as ShowOfTheDayPayload
      // A disk payload written before archiveMatch existed has archive but no
      // match data — treat as incomplete so it self-heals via the normal
      // background-retry path instead of serving permanently-ungraded matches.
      if (payload.archive && !payload.archiveMatch) payload.complete = false
      return payload
    } catch {}
    return null
  }

  private saveToDisk(payload: ShowOfTheDayPayload): void {
    try {
      fs.mkdirSync(path.dirname(DISK_CACHE_PATH), { recursive: true })
      fs.writeFileSync(DISK_CACHE_PATH, JSON.stringify(payload))
    } catch (err) {
      console.warn('[show-of-the-day] failed to save disk cache:', err)
    }
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __showOfTheDayService: ShowOfTheDayService | undefined
  // eslint-disable-next-line no-var
  var __sotdWarmerStarted: boolean | undefined
}

export const showOfTheDayService: ShowOfTheDayService = (() => {
  if (globalThis.__showOfTheDayService) return globalThis.__showOfTheDayService
  const svc = new ShowOfTheDayService()
  globalThis.__showOfTheDayService = svc
  return svc
})()

const MIDNIGHT_OFFSET_MS = 5 * 60 * 1000 // fire at 00:05 to avoid racing the rollover
const WARM_RETRIES = 3
const WARM_RETRY_DELAY_MS = 5 * 60 * 1000

const timeOfDayFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: SHOW_DAY_TZ,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

function msUntilNextWarm(): number {
  const now = new Date()
  const parts = timeOfDayFormatter.formatToParts(now)
  const get = (type: string) => Number(parts.find(p => p.type === type)?.value ?? 0)
  const msSinceMidnight = ((get('hour') % 24) * 3600 + get('minute') * 60 + get('second')) * 1000 + now.getMilliseconds()
  return (24 * 60 * 60 * 1000 - msSinceMidnight) + MIDNIGHT_OFFSET_MS
}

async function warmWithRetries(): Promise<void> {
  for (let attempt = 1; attempt <= WARM_RETRIES; attempt++) {
    try {
      await showOfTheDayService.recompute()
      return
    } catch (err) {
      console.warn(`[show-of-the-day] warm attempt ${attempt}/${WARM_RETRIES} failed:`, err)
      if (attempt < WARM_RETRIES) {
        await new Promise(r => setTimeout(r, WARM_RETRY_DELAY_MS))
      }
    }
  }
}

function scheduleNextWarm(): void {
  // Chained setTimeout (not setInterval) so each firing recomputes the next
  // midnight from the clock — safe across DST changes.
  const timer = setTimeout(() => {
    warmWithRetries().finally(scheduleNextWarm)
  }, msUntilNextWarm())
  timer.unref()
}

export function startShowOfTheDayWarmer(): void {
  if (globalThis.__sotdWarmerStarted) return
  globalThis.__sotdWarmerStarted = true

  console.log('[show-of-the-day] warmer started')
  showOfTheDayService.get().catch(err =>
    console.warn('[show-of-the-day] boot warm failed:', err)
  )
  scheduleNextWarm()
}
