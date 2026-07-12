import fs from 'fs'
import path from 'path'
import { ArchiveClientImpl } from '@/lib/clients/archive'
import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'
import { fetchShowDetail } from '@/lib/services/show-detail'
import { pickFeaturedShow } from '@/lib/featured-show'
import { formatArchiveTracks } from '@/lib/archive-track-format'
import type { ShowOfTheDayPayload } from '@/lib/show-of-the-day-types'

// "The day" is server-local time, matching the /api/on-this-day convention.
// The calendar date IS the cache key — rollover invalidates, no TTL needed.
const DISK_CACHE_PATH = path.join(process.cwd(), '.cache', 'show-of-the-day.json')
const INCOMPLETE_RETRY_MS = 10 * 60 * 1000

export function localDateKey(d = new Date()): string {
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
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

  private async compute(dateKey: string): Promise<ShowOfTheDayPayload> {
    const [, month, day] = dateKey.split('-')
    const shows = await realtimeSongFactsService.getShowsOnDate(month, day)
    const featured = pickFeaturedShow(shows)

    if (!featured) {
      return { dateKey, shows, featured: null, showDetail: null, archive: null, complete: true, computedAt: Date.now() }
    }

    let showDetail = null
    try {
      showDetail = await fetchShowDetail(featured.date)
    } catch (err) {
      console.warn('[show-of-the-day] setlist detail failed:', err)
    }

    let archive: ShowOfTheDayPayload['archive'] = null
    try {
      // One client for the whole compute so its HttpClient cache dedupes
      // repeat /metadata fetches within the archive chain.
      const archiveClient = new ArchiveClientImpl()
      const candidates = await archiveClient.listArchiveShowCandidates({
        date: featured.date,
        venue: featured.venue,
        city: featured.city,
      })
      if (candidates.length > 0) {
        const identifier = showDetail?.totalSongs
          ? (await archiveClient.selectBestRecording(candidates, showDetail.totalSongs)).identifier
          : candidates[0].identifier
        const tracks = await archiveClient.getAllTracks(identifier)
        archive = { identifier, tracks: formatArchiveTracks(identifier, tracks) }
      }
    } catch (err) {
      console.warn('[show-of-the-day] archive resolution failed:', err)
    }

    const complete = showDetail !== null && archive !== null
    console.log(`[show-of-the-day] computed ${dateKey}: featured=${featured.date} complete=${complete}`)
    return { dateKey, shows, featured, showDetail, archive, complete, computedAt: Date.now() }
  }

  private loadFromDisk(): ShowOfTheDayPayload | null {
    try {
      const raw = fs.readFileSync(DISK_CACHE_PATH, 'utf8')
      return JSON.parse(raw) as ShowOfTheDayPayload
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

function msUntilNextWarm(): number {
  const next = new Date()
  next.setHours(24, 0, 0, 0)
  return next.getTime() - Date.now() + MIDNIGHT_OFFSET_MS
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
