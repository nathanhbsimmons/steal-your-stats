import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site-config'
import { getSongCatalog } from '@/lib/ids'
import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'
import { ERA_IDS } from '@/lib/eras'
import { MEMBER_SLUGS } from '@/lib/members'

export const revalidate = 86400

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes = ['', '/shows', '/venues', '/artists', '/eras', '/songs', '/search', '/recent', '/stats']
    .map(route => ({ url: `${SITE_URL}${route}`, lastModified: now }))

  const songs = getSongCatalog().map(s => ({
    url: `${SITE_URL}/song/${encodeURIComponent(s.displayTitle)}`,
    lastModified: now,
  }))

  const { shows: allShows } = await realtimeSongFactsService
    .getShowsByYearRange(1965, 1995, 1, 3000)
    .catch(() => ({ shows: [], total: 0, page: 1, perPage: 0 }))

  const showPages = allShows.map(s => ({ url: `${SITE_URL}/show/${s.date}`, lastModified: now }))

  const years = Array.from(new Set(allShows.map(s => s.date.slice(0, 4))))
  const yearPages = years.map(y => ({ url: `${SITE_URL}/shows/${y}`, lastModified: now }))

  const eraPages = ERA_IDS.map(id => ({ url: `${SITE_URL}/eras/${id}`, lastModified: now }))
  const memberPages = MEMBER_SLUGS.map(slug => ({ url: `${SITE_URL}/member/${slug}`, lastModified: now }))

  return [...staticRoutes, ...songs, ...showPages, ...yearPages, ...eraPages, ...memberPages]
}
