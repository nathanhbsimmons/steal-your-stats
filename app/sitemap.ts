import type { MetadataRoute } from 'next'
import { getSiteEntries } from '@/lib/site-urls'

export const revalidate = 86400

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getSiteEntries()
}
