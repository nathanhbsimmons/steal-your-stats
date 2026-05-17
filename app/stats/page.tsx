'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { TopBar } from '@/components/glass/topbar'
import { StatTile, DonutChart } from '@/components/glass/primitives'

interface YearCount { year: number; count: number }
interface LeaderEntry { name: string; count: number; pct: number }
interface GlobalStats {
  showsPerYear: YearCount[]
  leaderboard: LeaderEntry[]
}

export default function StatsPage() {
  const [stats, setStats] = useState<GlobalStats | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setStats(data) })
      .catch(() => {})
  }, [])

  const barData = stats?.showsPerYear ?? []
  const barMax = barData.length > 0 ? Math.max(...barData.map(d => d.count), 1) : 1
  const peakYear = barData.reduce((best, d) => d.count > best.count ? d : best, { year: 0, count: 0 })

  const leaderboard = stats?.leaderboard ?? []

  const DONUT_SEGMENTS = [
    { label: 'Opener',  value: 14,  color: 'var(--accent)' },
    { label: 'Mid-set', value: 210, color: 'rgba(255,255,255,0.6)' },
    { label: 'Closer',  value: 6,   color: 'rgba(255,255,255,0.3)' },
    { label: 'Encore',  value: 2,   color: 'rgba(255,255,255,0.15)' },
  ]

  return (
    <>
      <TopBar eyebrow="The numbers" title="Stats across 30 years of tapes." />

      <div className="scroll-hide" style={{ flex: 1, overflow: 'auto', padding: '0 28px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* KPI strip — driven by the /api/stats/summary endpoint via home page; show placeholders here */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
          <StatTile label="Total shows"    value={stats ? leaderboard.length > 0 ? '—' : '—' : '—'} sub="indexed from setlist.fm" />
          <StatTile label="Unique songs"   value="—"   sub="+ covers" />
          <StatTile label="Hours of tape"  value="—"   sub="avg 2h 42m / show" />
          <StatTile label="Peak year"      value={stats ? `${peakYear.year}` : '—'} sub={stats ? `${peakYear.count} shows` : 'loading…'} accent />
          <StatTile label="Avg jam length" value="11:24" sub="vs. 8:09 studio" />
        </section>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>

          {/* Bar chart */}
          <section className="glass" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <header style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <h3 className="t-h3">Shows per year</h3>
              <span className="t-eyebrow">1965 – 1995</span>
              <span style={{ flex: 1 }} />
              {stats && (
                <span className="t-small">peak · {peakYear.count} shows in {peakYear.year}</span>
              )}
            </header>
            {!stats ? (
              <div className="skeleton" style={{ height: 200 }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 200, padding: '0 4px' }}>
                {barData.map((d) => {
                  const isPeak = d.count === barMax && d.count > 0
                  const showLabel = [1970, 1975, 1980, 1985, 1990, 1995].includes(d.year)
                  return (
                    <div key={d.year} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{
                        width: '100%',
                        height: `${(d.count / barMax) * 100}%`,
                        background: isPeak ? 'var(--accent)' : 'rgba(255,255,255,0.22)',
                        borderRadius: '3px 3px 0 0',
                        minHeight: d.count > 0 ? 4 : 0,
                      }} />
                      {showLabel && (
                        <span className="t-mono" style={{ fontSize: 9.5, color: 'var(--fg-4)' }}>
                          {String(d.year).slice(2)}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Donut chart — Dark Star position breakdown (editorial) */}
          <section className="glass" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 className="t-h3">Where Dark Star landed</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <DonutChart segments={DONUT_SEGMENTS} total={232} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { l: 'Mid-set', v: 210, c: 'rgba(255,255,255,0.6)' },
                  { l: 'Opener',  v: 14,  c: 'var(--accent)' },
                  { l: 'Closer',  v: 6,   c: 'rgba(255,255,255,0.3)' },
                  { l: 'Encore',  v: 2,   c: 'rgba(255,255,255,0.15)' },
                ].map(s => (
                  <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: s.c, flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: 'var(--fg-2)', flex: 1 }}>{s.l}</span>
                    <span className="t-mono" style={{ fontSize: 12, color: 'var(--fg)' }}>{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Leaderboard */}
        <section className="glass" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <header style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h3 className="t-h3">Most-played songs</h3>
            <span className="t-eyebrow">all-time leaderboard</span>
          </header>
          {!stats ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px 36px' }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 36 }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px 36px' }}>
              {leaderboard.map((entry, i) => (
                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                  <span className="t-mono" style={{ fontSize: 11, color: 'var(--fg-4)', width: 22 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <Link
                    href={`/song/${encodeURIComponent(entry.name)}`}
                    style={{ flex: 1, fontSize: 13, color: 'var(--fg)' }}
                  >
                    {entry.name}
                  </Link>
                  <div className="progress" style={{ width: 100 }}>
                    <div className="fill" style={{ width: `${entry.pct}%` }} />
                  </div>
                  <span className="t-mono" style={{ fontSize: 12, color: 'var(--fg-2)', width: 40, textAlign: 'right' }}>
                    {entry.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
