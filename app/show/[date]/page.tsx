import Link from 'next/link'
import type { Metadata } from 'next'
import { fetchShowDetail } from '@/lib/services/show-detail'
import { getOfficialReleasesForDate } from '@/lib/official-releases'
import { ShowDetailClient } from '@/components/show/show-detail-client'
import { JsonLd } from '@/components/seo/json-ld'
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
    return (
      <section className="col">
        <div className="crumbs">
          <Link href="/">Home</Link>
          <span className="sep">/</span>
          <span className="cur">{date}</span>
        </div>
        <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: 'var(--serif-body)', fontStyle: 'italic', color: 'var(--ink-3)' }}>
          <div style={{ fontFamily: 'var(--serif-display)', fontSize: 28, color: 'var(--ink)', marginBottom: 8 }}>
            Show not found
          </div>
          No setlist data available for {date}.{' '}
          <Link href="/" style={{ color: 'var(--rust)', textDecoration: 'underline' }}>
            Go home
          </Link>
        </div>
      </section>
    )
  }

  const officialReleases = getOfficialReleasesForDate(date)

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

  return (
    <>
      <JsonLd data={musicEventLd} />
      <ShowDetailClient date={date} initialShow={show} officialReleases={officialReleases} />
    </>
  )
}
