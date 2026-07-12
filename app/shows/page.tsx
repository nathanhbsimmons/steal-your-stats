import React from 'react'
import Link from 'next/link'
import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'

interface YearCount { year: number; count: number }

const TOUR_YEARS = Array.from({ length: 31 }, (_, i) => 1965 + i)

export const revalidate = 86400

export default async function ShowsIndexPage() {
  const stats = await realtimeSongFactsService.getGlobalStats().catch(() => ({ showsPerYear: [] as YearCount[], leaderboard: [] }))
  const yearData = stats.showsPerYear

  const countByYear = new Map(yearData.map(d => [d.year, d.count]))
  const maxCount = Math.max(...yearData.map(d => d.count), 1)

  return (
    <section className="col">
      <div className="crumbs">
        <Link href="/">Home</Link>
        <span className="sep">/</span>
        <span className="cur">Shows</span>
      </div>

      <div className="page-head">
        <div>
          <div className="kicker">Shows · VII</div>
          <h2>Every show, <span className="italic">by year.</span></h2>
          <div className="lede">
            {yearData.reduce((s, d) => s + d.count, 0).toLocaleString()} shows across 31 years.
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 10,
        marginTop: 8,
      }}>
        {TOUR_YEARS.map(year => {
          const count = countByYear.get(year) ?? 0
          const barPct = maxCount > 0 ? (count / maxCount) * 100 : 0
          return (
            <Link
              key={year}
              href={`/shows/${year}`}
              style={{ textDecoration: 'none' }}
            >
              <div className="year-card">
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--serif-display)', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
                    {year}
                  </span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.06em' }}>
                    {count > 0 ? count : '—'}
                  </span>
                </div>
                {/* Mini bar */}
                <div className="mini-bar">
                  {count > 0 && (
                    <div className="mini-bar-fill" style={{ width: `${barPct}%` }} />
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
