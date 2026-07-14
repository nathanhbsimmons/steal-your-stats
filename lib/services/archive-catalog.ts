import fs from 'fs'
import path from 'path'
import type { ArchiveShowCandidate } from '@/lib/clients/archive'

export interface ArchiveIndexTrack {
  name: string
  title?: string
  length?: string
}

export interface ArchiveIndexBest {
  identifier: string
  venue?: string
  city?: string
  state?: string
  country?: string
  licenseurl?: string
  rights?: string
  publicdate?: string
  description?: string | null
  tracks: ArchiveIndexTrack[]
}

export interface ArchiveIndexEntry {
  date: string
  candidates: ArchiveShowCandidate[]
  best?: ArchiveIndexBest
  resolvedAt: number
}

const INDEX_PATH = path.join(process.cwd(), '.cache', 'archive-index.json')

// Persisted catalog of Grateful Dead show → Archive.org recording resolutions,
// built offline by scripts/build-archive-index.ts and committed to git — shows
// are historical and essentially static, so this replaces live per-show
// Archive.org lookups with an in-memory map lookup for anything catalogued.
// Uncatalogued shows (or a catalog-less checkout) fall through to live HTTP
// calls in ArchiveClientImpl, so this is purely an additive fast path.
class ArchiveCatalog {
  private byDate = new Map<string, ArchiveIndexEntry>()
  private byIdentifier = new Map<string, ArchiveIndexEntry>()
  private loaded = false

  private load(): void {
    if (this.loaded) return
    this.loaded = true
    try {
      const raw = fs.readFileSync(INDEX_PATH, 'utf8')
      const entries = JSON.parse(raw) as ArchiveIndexEntry[]
      for (const entry of entries) {
        this.byDate.set(entry.date, entry)
        if (entry.best) this.byIdentifier.set(entry.best.identifier, entry)
      }
      console.log(`[archive-catalog] loaded ${entries.length} entries from disk`)
    } catch {
      // No catalog on disk yet (or unreadable) — every lookup misses and
      // callers fall through to live Archive.org resolution.
    }
  }

  getByDate(date: string): ArchiveIndexEntry | undefined {
    this.load()
    return this.byDate.get(date)
  }

  getByIdentifier(identifier: string): ArchiveIndexEntry | undefined {
    this.load()
    return this.byIdentifier.get(identifier)
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __archiveCatalog: ArchiveCatalog | undefined
}

export const archiveCatalog: ArchiveCatalog = (() => {
  if (globalThis.__archiveCatalog) return globalThis.__archiveCatalog
  const catalog = new ArchiveCatalog()
  globalThis.__archiveCatalog = catalog
  return catalog
})()
