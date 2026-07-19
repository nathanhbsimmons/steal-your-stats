import { notFound, permanentRedirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getSongPageData } from '@/lib/services/song-page-data'
import { SongDetailClient } from '@/components/song/song-detail-client'
import { JsonLd, BreadcrumbLd } from '@/components/seo/json-ld'
import { SITE_URL } from '@/lib/site-config'
import { resolveSong } from '@/lib/ids'

export const revalidate = 86400

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const songTitle = resolveSong({ title: decodeURIComponent(slug) }).displayTitle
  const { facts } = await getSongPageData(songTitle)

  const title = `${songTitle} — Grateful Dead Setlist Stats`
  const description = facts.totalPerformances > 0 && facts.first && facts.last
    ? `${songTitle} was performed ${facts.totalPerformances} times by the Grateful Dead, first on ${facts.first.date} at ${facts.first.venue} and last on ${facts.last.date} at ${facts.last.venue}.`
    : `Performance history, first/last shows, and Archive.org recordings of "${songTitle}" by the Grateful Dead.`
  const url = `${SITE_URL}/song/${encodeURIComponent(songTitle)}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'article' },
  }
}

export default async function SongPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ venue?: string }>
}) {
  const { slug } = await params
  const { venue } = await searchParams
  const rawTitle = decodeURIComponent(slug)
  const songTitle = resolveSong({ title: rawTitle }).displayTitle

  // Alias/casing/punctuation variant of a canonical song — redirect to the one true URL
  // instead of serving duplicate content at two addresses.
  if (songTitle !== rawTitle) {
    const canonicalUrl = `/song/${encodeURIComponent(songTitle)}${venue ? `?venue=${encodeURIComponent(venue)}` : ''}`
    permanentRedirect(canonicalUrl)
  }

  const { facts, positions, versions, timeline } = await getSongPageData(songTitle)

  if (facts.totalPerformances === 0) {
    notFound()
  }

  const songLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicComposition',
    name: songTitle,
    musicArtist: { '@type': 'MusicGroup', name: 'Grateful Dead' },
    url: `${SITE_URL}/song/${encodeURIComponent(songTitle)}`,
    ...(facts.first ? {
      firstPerformance: {
        '@type': 'MusicEvent',
        startDate: facts.first.date,
        location: { '@type': 'Place', name: facts.first.venue },
      },
    } : {}),
  }

  const breadcrumbItems = [
    { name: 'Home', url: SITE_URL },
    { name: 'Songs', url: `${SITE_URL}/songs` },
    { name: songTitle, url: `${SITE_URL}/song/${encodeURIComponent(songTitle)}` },
  ]

  return (
    <>
      <JsonLd data={songLd} />
      <BreadcrumbLd items={breadcrumbItems} />
      <SongDetailClient
        songTitle={songTitle}
        venueFilter={venue ?? null}
        initialFacts={facts}
        initialPositions={positions}
        initialVersions={versions}
        initialTimeline={timeline}
      />
    </>
  )
}
