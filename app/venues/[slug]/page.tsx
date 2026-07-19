import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'
import { JsonLd, BreadcrumbLd } from '@/components/seo/json-ld'
import { SITE_URL } from '@/lib/site-config'
import { slugifyVenue } from '@/lib/utils'

export const revalidate = 86400

async function findVenue(slug: string) {
  const venues = await realtimeSongFactsService.getVenueStats().catch(() => [])
  return venues.find(v => slugifyVenue(v.name, v.city) === slug) ?? null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const venue = await findVenue(slug)

  if (!venue) {
    return { title: 'Venue not found' }
  }

  const title = `${venue.name} — Grateful Dead Shows & Setlists`
  const description = `The Grateful Dead played ${venue.name} in ${venue.city}${venue.state ? `, ${venue.state}` : ''} ${venue.showCount} time${venue.showCount !== 1 ? 's' : ''} between ${venue.firstYear} and ${venue.lastYear}.`
  const url = `${SITE_URL}/venues/${slug}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'article' },
  }
}

export default async function VenuePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const venue = await findVenue(slug)

  if (!venue) {
    notFound()
  }

  const shows = await realtimeSongFactsService.getShowsAtVenue(venue.name, venue.city).catch(() => [])

  const venueLd = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: venue.name,
    address: {
      '@type': 'PostalAddress',
      addressLocality: venue.city,
      addressRegion: venue.state,
      addressCountry: venue.country,
    },
    url: `${SITE_URL}/venues/${slug}`,
  }

  const breadcrumbItems = [
    { name: 'Home', url: SITE_URL },
    { name: 'Venues', url: `${SITE_URL}/venues` },
    { name: venue.name, url: `${SITE_URL}/venues/${slug}` },
  ]

  return (
    <section className="col">
      <JsonLd data={venueLd} />
      <BreadcrumbLd items={breadcrumbItems} />

      <div className="crumbs">
        <Link href="/">Home</Link>
        <span className="sep">/</span>
        <Link href="/venues">Venues</Link>
        <span className="sep">/</span>
        <span className="cur">{venue.name}</span>
      </div>

      <div className="page-head">
        <div>
          <div className="kicker">Venue</div>
          <h2>{venue.name}</h2>
          <div className="lede">
            {venue.city}{venue.state ? `, ${venue.state}` : ''}, {venue.country}
            {' · '}{venue.showCount} show{venue.showCount !== 1 ? 's' : ''}, {venue.firstYear}–{venue.lastYear}
          </div>
        </div>
      </div>

      <table className="tbl">
        <thead>
          <tr>
            <th>#</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {shows.map((s, i) => (
            <tr key={s.date}>
              <td className="num">{String(i + 1).padStart(2, '0')}</td>
              <td>
                <Link href={`/show/${s.date}`}>{s.date}</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
