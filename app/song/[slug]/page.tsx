import type { Metadata } from 'next'
import { getSongPageData } from '@/lib/services/song-page-data'
import { SongDetailClient } from '@/components/song/song-detail-client'
import { JsonLd } from '@/components/seo/json-ld'
import { SITE_URL } from '@/lib/site-config'

export const revalidate = 86400

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const songTitle = decodeURIComponent(slug)
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
  const songTitle = decodeURIComponent(slug)

  const { facts, positions, versions, timeline } = await getSongPageData(songTitle)

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

  return (
    <>
      <JsonLd data={songLd} />
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
