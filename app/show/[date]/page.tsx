import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { fetchShowDetail } from '@/lib/services/show-detail'
import { getOfficialReleasesForDate } from '@/lib/official-releases'
import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'
import { ShowDetailClient } from '@/components/show/show-detail-client'
import { JsonLd, BreadcrumbLd } from '@/components/seo/json-ld'
import { SITE_URL } from '@/lib/site-config'

export const revalidate = 86400

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> {
  const { date } = await params
  const show = await fetchShowDetail(date)

  if (!show) {
    return { title: `Show not found — ${date}` }
  }

  const title = `${date} — ${show.venue}, ${show.city} | Grateful Dead Setlist`
  const description = `Full setlist for the Grateful Dead show at ${show.venue} in ${show.city}${show.state ? `, ${show.state}` : ''} on ${date}. ${show.totalSongs} songs performed.`
  const url = `${SITE_URL}/show/${date}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'article' },
  }
}

export default async function ShowPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  const show = await fetchShowDetail(date)

  if (!show) {
    notFound()
  }

  const officialReleases = getOfficialReleasesForDate(date)
  const adjacentShows = await realtimeSongFactsService.getAdjacentShows(date).catch(() => ({ prev: null, next: null }))

  const musicEventLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicEvent',
    name: `Grateful Dead at ${show.venue}`,
    startDate: show.date,
    location: {
      '@type': 'Place',
      name: show.venue,
      address: {
        '@type': 'PostalAddress',
        addressLocality: show.city,
        addressRegion: show.state,
        addressCountry: show.country,
      },
    },
    performer: { '@type': 'MusicGroup', name: 'Grateful Dead' },
    url: `${SITE_URL}/show/${date}`,
  }

  const year = date.slice(0, 4)
  const breadcrumbItems = [
    { name: 'Home', url: SITE_URL },
    { name: 'Shows', url: `${SITE_URL}/shows` },
    { name: year, url: `${SITE_URL}/shows/${year}` },
    { name: date, url: `${SITE_URL}/show/${date}` },
  ]

  return (
    <>
      <JsonLd data={musicEventLd} />
      <BreadcrumbLd items={breadcrumbItems} />
      <ShowDetailClient date={date} initialShow={show} officialReleases={officialReleases} adjacentShows={adjacentShows} />
    </>
  )
}
