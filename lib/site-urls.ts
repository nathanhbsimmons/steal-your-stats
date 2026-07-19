import { SITE_URL } from '@/lib/site-config'
import { getSongCatalog } from '@/lib/ids'
import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'
import { ERA_IDS } from '@/lib/eras'
import { MEMBER_SLUGS } from '@/lib/members'
import { slugifyVenue } from '@/lib/utils'

export interface SiteEntry {
  url: string
  lastModified: Date
}

export async function getSiteEntries(): Promise<SiteEntry[]> {
  const now = new Date()

  const staticRoutes = ['', '/shows', '/venues', '/artists', '/eras', '/songs', '/search', '/recent', '/stats']
    .map(route => ({ url: `${SITE_URL}${route}`, lastModified: now }))

  const { shows: allShows } = await realtimeSongFactsService
    .getShowsByYearRange(1965, 1995, 1, 3000)
    .catch(() => ({ shows: [], total: 0, page: 1, perPage: 0 }))

  // Reflects when the underlying setlist dataset was actually last fetched,
  // rather than falsely signaling a change on every regeneration.
  const { lastUpdated } = await realtimeSongFactsService
    .getSummaryStats()
    .catch(() => ({ lastUpdated: null as number | null }))
  const dataLastModified = lastUpdated ? new Date(lastUpdated) : now

  const songs = getSongCatalog().map(s => ({
    url: `${SITE_URL}/song/${encodeURIComponent(s.displayTitle)}`,
    lastModified: dataLastModified,
  }))

  const showPages = allShows.map(s => ({ url: `${SITE_URL}/show/${s.date}`, lastModified: dataLastModified }))

  const years = Array.from(new Set(allShows.map(s => s.date.slice(0, 4))))
  const yearPages = years.map(y => ({ url: `${SITE_URL}/shows/${y}`, lastModified: dataLastModified }))

  const eraPages = ERA_IDS.map(id => ({ url: `${SITE_URL}/eras/${id}`, lastModified: dataLastModified }))
  const memberPages = MEMBER_SLUGS.map(slug => ({ url: `${SITE_URL}/member/${slug}`, lastModified: dataLastModified }))

  const venues = await realtimeSongFactsService.getVenueStats().catch(() => [])
  const venuePages = venues.map(v => ({
    url: `${SITE_URL}/venues/${slugifyVenue(v.name, v.city)}`,
    lastModified: dataLastModified,
  }))

  return [...staticRoutes, ...songs, ...showPages, ...yearPages, ...eraPages, ...memberPages, ...venuePages]
}
