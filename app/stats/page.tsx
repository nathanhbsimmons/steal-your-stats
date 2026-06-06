'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'

interface YearCount { year: number; count: number }
interface LeaderEntry { name: string; count: number; pct: number }
interface SummaryData {
  totalShows?: number
  uniqueSongs?: number
  hoursArchived?: number
  lastRefresh?: string
}

interface GlobalStats {
  showsPerYear: YearCount[]
  leaderboard: LeaderEntry[]
}

const DARK_STAR_POSITIONS = [
  { label: 'Mid-set', count: 210, pct: '90%' },
  { label: 'Opener',  count: 14,  pct: '6%' },
  { label: 'Closer',  count: 6,   pct: '3%' },
  { label: 'Encore',  count: 2,   pct: '1%' },
]

function DonutChart({ total }: { total: number }) {
  const cx = 70, cy = 70, r = 56
  const COLORS = ['var(--rust)', 'var(--forest)', 'var(--ledger-blue)', 'var(--ink)']

  const paths = useMemo(() => {
    let acc = 0
    return DARK_STAR_POSITIONS.map((p, i) => {
      const start = (acc / total) * Math.PI * 2 - Math.PI / 2
      acc += p.count
      const end = (acc / total) * Math.PI * 2 - Math.PI / 2
      const large = (end - start) > Math.PI ? 1 : 0
      const x1 = cx + r * Math.cos(start)
      const y1 = cy + r * Math.sin(start)
      const x2 = cx + r * Math.cos(end)
      const y2 = cy + r * Math.sin(end)
      return { ...p, d: `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`, color: COLORS[i] }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total])

  return (
    <svg width="140" height="140" viewBox="0 0 140 140" style={{ flexShrink: 0 }}>
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.color} stroke="var(--paper)" strokeWidth="2" />
      ))}
      <circle cx={cx} cy={cy} r="28" fill="var(--paper)" stroke="var(--ink)" strokeWidth="1" />
      <text x={cx} y={cy - 4} textAnchor="middle" fontFamily="var(--serif-display)" fontSize="20" fill="var(--ink)">{total}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontFamily="var(--mono)" fontSize="7" letterSpacing="0.1em" fill="var(--ink-3)">DARK STAR</text>
    </svg>
  )
}

export default function StatsPage() {
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [summary, setSummary] = useState<SummaryData | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d) })
      .catch(() => {})
    fetch('/api/stats/summary')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setSummary(d) })
      .catch(() => {})
  }, [])

  const barData = stats?.showsPerYear ?? []
  const barMax = barData.length > 0 ? Math.max(...barData.map(d => d.count), 1) : 1
  const peakYear = barData.reduce((best, d) => d.count > best.count ? d : best, { year: 0, count: 0 })

  const leaderboard = stats?.leaderboard ?? []
  const leaderMax = leaderboard.length > 0 ? leaderboard[0].count : 1

  const donutTotal = DARK_STAR_POSITIONS.reduce((n, p) => n + p.count, 0)

  return (
    <section className="col">
      <div className="page-head">
        <div>
          <div className="kicker">Statistics · thirty years on the road</div>
          <h2>The big numbers, <span className="italic">through the years.</span></h2>
          <div className="lede">Every show, every song, every hour of hand-filed tape.</div>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="label">Total Shows</div>
          <div className="val rust">{summary?.totalShows ? summary.totalShows.toLocaleString() : stats ? '2,333' : '—'}</div>
          <div className="annot">indexed from setlist.fm</div>
        </div>
        <div className="kpi">
          <div className="label">Unique Songs</div>
          <div className="val">{summary?.uniqueSongs ? summary.uniqueSongs.toLocaleString() : '442'}</div>
          <div className="annot">titles in the catalog</div>
        </div>
        <div className="kpi">
          <div className="label">Hours Archived</div>
          <div className="val rust">{summary?.hoursArchived ? summary.hoursArchived.toLocaleString() : '—'}</div>
          <div className="annot">avg 2h 42m per show</div>
        </div>
        <div className="kpi">
          <div className="label">Peak Year</div>
          <div className="val">{stats ? `${peakYear.year}` : '—'}</div>
          <div className="annot">{stats ? `${peakYear.count} shows` : 'loading…'}</div>
        </div>
      </div>

      <div className="section-head">
        <h3>Shows per year <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--rust)', marginLeft: 10 }}>1965 — 1995</span></h3>
        <div className="descr">peak year highlighted</div>
        <span className="meta">N = 2,333</span>
      </div>

      {!stats ? (
        <div className="skeleton-vault" style={{ height: 200 }} />
      ) : (
        <>
          <div className="barchart">
            {barData.map(d => (
              <Link
                key={d.year}
                href={`/shows/${d.year}`}
                className={`bbar${d.count === barMax && d.count > 0 ? ' peak' : ''}`}
                style={{ height: `${(d.count / barMax) * 100}%`, textDecoration: 'none', cursor: 'pointer', display: 'block' }}
                title={`${d.year}: ${d.count} shows`}
              >
                <span className="val">{d.count}</span>
              </Link>
            ))}
          </div>
          <div className="barchart-axis">
            <span>&#x2019;65</span><span>&#x2019;70</span><span>&#x2019;75</span>
            <span>&#x2019;80</span><span>&#x2019;85</span><span>&#x2019;90</span><span>&#x2019;95</span>
          </div>
          <div style={{ marginTop: 8, fontFamily: 'var(--serif-body)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-3)' }}>
            Peak — {peakYear.year}, {peakYear.count} shows. The longest stretches off-road came in 1975 (the studio year) and 1986 (Garcia&#x2019;s coma).
          </div>
        </>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 28, marginTop: 24 }}>
        {/* Donut — Dark Star position breakdown */}
        <div>
          <div className="section-head" style={{ marginTop: 0 }}>
            <h3>Position breakdown</h3>
            <div className="descr">Dark Star — where it landed</div>
            <span className="meta">N = {donutTotal}</span>
          </div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginTop: 8 }}>
            <DonutChart total={donutTotal} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DARK_STAR_POSITIONS.map((p, i) => (
                <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 10, height: 10, flexShrink: 0,
                    background: ['var(--rust)', 'var(--forest)', 'var(--ledger-blue)', 'var(--ink)'][i],
                  }} />
                  <span style={{ flex: 1, fontFamily: 'var(--serif-body)', fontSize: 13.5, color: 'var(--ink-2)' }}>{p.label}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink)' }}>{p.count}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>· {p.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div>
          <div className="section-head" style={{ marginTop: 0 }}>
            <h3>All-time leaderboard</h3>
            <div className="descr">top {leaderboard.length} most-played</div>
            <span className="meta">N=442 songs</span>
          </div>
          {!stats ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton-vault" style={{ height: 36 }} />
              ))}
            </div>
          ) : (
            <ul className="toptable">
              {leaderboard.slice(0, 12).map((entry, i) => (
                <li key={entry.name}>
                  <Link href={`/song/${encodeURIComponent(entry.name)}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <div className="row1">
                      <span className="rank">{i + 1}.</span>
                      <span style={{ fontFamily: 'var(--serif-display)', fontSize: 16 }}>{entry.name}</span>
                      <span className="plays">{entry.count}</span>
                    </div>
                    <div className="bar">
                      <div className="fill" style={{ width: `${(entry.count / leaderMax) * 100}%` }} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
