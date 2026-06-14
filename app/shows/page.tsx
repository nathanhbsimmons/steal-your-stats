'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

interface YearCount { year: number; count: number }

const TOUR_YEARS = Array.from({ length: 31 }, (_, i) => 1965 + i)

export default function ShowsIndexPage() {
  const [yearData, setYearData] = useState<YearCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.showsPerYear) setYearData(d.showsPerYear) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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
            {loading ? 'Loading…' : `${yearData.reduce((s, d) => s + d.count, 0).toLocaleString()} shows across 31 years.`}
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
              <div style={{
                border: '2px solid var(--ink)',
                borderRadius: 0,
                padding: '14px 16px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                cursor: 'pointer',
                background: 'var(--paper)',
                transition: 'background 0.12s, box-shadow 0.12s',
              }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLDivElement).style.background = 'var(--ink)'
                ;(e.currentTarget as HTMLDivElement).style.color = 'var(--paper)'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLDivElement).style.background = 'var(--paper)'
                ;(e.currentTarget as HTMLDivElement).style.color = ''
              }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--serif-display)', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
                    {year}
                  </span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: loading ? 'transparent' : 'inherit', letterSpacing: '0.06em' }}>
                    {count > 0 ? count : '—'}
                  </span>
                </div>
                {/* Mini bar */}
                <div style={{ height: 3, background: 'var(--rule-soft)', overflow: 'hidden' }}>
                  {count > 0 && (
                    <div style={{ height: '100%', width: `${barPct}%`, background: 'var(--rust)' }} />
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
