import Link from 'next/link'
import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'
import { getDatesWithAudioForYear } from '@/lib/clients/archive-dates'
import { getOfficialReleasesForDates } from '@/lib/official-releases'
import { ShowsYearTable, type ShowRef } from '@/components/shows/shows-year-table'
import { ReleaseLegend } from '@/components/ui/release-badge'

const PER_PAGE = 200

export const revalidate = 86400

export default async function ShowsByYearPage({ params }: { params: Promise<{ year: string }> }) {
  const { year: yearParam } = await params
  const year = parseInt(yearParam, 10)

  if (isNaN(year)) {
    return (
      <section className="col">
        <div className="crumbs">
          <Link href="/">Home</Link>
          <span className="sep">/</span>
          <Link href="/shows">Shows</Link>
          <span className="sep">/</span>
          <span className="cur">Invalid</span>
        </div>
        <div className="page-head">
          <div>
            <div className="kicker">Shows</div>
            <h2>Invalid year.</h2>
          </div>
        </div>
      </section>
    )
  }

  const [showsResult, audioDates] = await Promise.all([
    realtimeSongFactsService.getShowsByYearRange(year, year, 1, PER_PAGE).catch(() => ({ shows: [] as ShowRef[], total: 0 })),
    getDatesWithAudioForYear(String(year)),
  ])
  const shows = showsResult.shows
  const total = showsResult.total
  const officialReleases = getOfficialReleasesForDates(shows.map(s => s.date))

  return (
    <section className="col">
      <div className="crumbs">
        <Link href="/">Home</Link>
        <span className="sep">/</span>
        <Link href="/shows">Shows</Link>
        <span className="sep">/</span>
        <span className="cur">{year}</span>
      </div>

      <div className="page-head">
        <div>
          <div className="kicker">Shows · {year}</div>
          <h2>Every show, <span className="italic">{year}.</span></h2>
          <div className="lede">
            {total} show{total !== 1 ? 's' : ''} in {year}.
          </div>
        </div>
        <ReleaseLegend releases={officialReleases} />
      </div>

      {shows.length === 0 ? (
        <div style={{ padding: '40px 0', color: 'var(--ink-3)', fontStyle: 'italic', fontFamily: 'var(--serif-body)' }}>
          No shows found for {year}.
        </div>
      ) : (
        <ShowsYearTable initialShows={shows} audioDates={audioDates} officialReleases={officialReleases} />
      )}
    </section>
  )
}
