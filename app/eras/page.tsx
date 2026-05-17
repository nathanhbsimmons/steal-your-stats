'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { TopBar } from '@/components/glass/topbar'
import { Icon, ICONS } from '@/components/glass/icons'

interface YearCount { year: number; count: number }

const ERA_DEFS = [
  {
    id: 'primal',
    name: 'Primal Dead',
    years: '1965 – 1971',
    startYear: 1965,
    endYear: 1971,
    tag: 'Pigpen era',
    sig: 'Lovelight, Caution, Viola Lee',
    barColor: 'rgba(240,176,74,0.85)',
    searchSong: 'Viola Lee Blues',
  },
  {
    id: 'europe',
    name: "Europe '72",
    years: '1972 – 1974',
    startYear: 1972,
    endYear: 1974,
    tag: 'wall-of-sound',
    sig: 'Dark Star, Playing, Eyes',
    barColor: 'rgba(240,176,74,0.55)',
    highlight: true,
    searchSong: 'Dark Star',
  },
  {
    id: 'hiatus',
    name: 'Hiatus & Return',
    years: '1975 – 1979',
    startYear: 1975,
    endYear: 1979,
    tag: 'studio era',
    sig: 'Estimated Prophet, Terrapin',
    barColor: 'rgba(255,255,255,0.30)',
    searchSong: 'Terrapin Station',
  },
  {
    id: 'brent',
    name: 'Brent years',
    years: '1980 – 1990',
    startYear: 1980,
    endYear: 1990,
    tag: 'arena Dead',
    sig: 'Throwing Stones, Hell in a Bucket',
    barColor: 'rgba(240,176,74,0.30)',
    searchSong: 'Hell in a Bucket',
  },
  {
    id: 'final',
    name: 'Final tours',
    years: '1991 – 1995',
    startYear: 1991,
    endYear: 1995,
    tag: 'Vince & Bruce',
    sig: 'Lazy River Road, Days Between',
    barColor: 'rgba(240,176,74,0.18)',
    searchSong: 'Days Between',
  },
]

const YEAR_TICKS = ['1965', '1970', '1975', '1980', '1985', '1990', '1995']

function sumYears(data: YearCount[], from: number, to: number): number {
  return data.filter(d => d.year >= from && d.year <= to).reduce((s, d) => s + d.count, 0)
}

export default function ErasPage() {
  const [showsPerYear, setShowsPerYear] = useState<YearCount[]>([])

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.showsPerYear) setShowsPerYear(data.showsPerYear) })
      .catch(() => {})
  }, [])

  const eras = ERA_DEFS.map(e => ({
    ...e,
    shows: showsPerYear.length > 0 ? sumYears(showsPerYear, e.startYear, e.endYear) : null,
  }))

  const totalShows = eras.reduce((s, e) => s + (e.shows ?? 0), 0)

  return (
    <>
      <TopBar eyebrow="Eras" title="Five movements, one long strange trip." />

      <div className="scroll-hide" style={{ flex: 1, overflow: 'auto', padding: '0 28px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Timeline strip */}
        <section className="glass" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {YEAR_TICKS.map(y => <span key={y} className="t-eyebrow">{y}</span>)}
          </div>
          <div style={{ display: 'flex', height: 36, borderRadius: 'var(--r-xs)', overflow: 'hidden' }}>
            {eras.map((e, i) => (
              <div
                key={e.id}
                style={{
                  flex: e.shows ?? e.startYear,
                  background: e.barColor,
                  borderRight: i < eras.length - 1 ? '2px solid var(--bg-0)' : 'none',
                }}
              />
            ))}
          </div>
          {totalShows > 0 && (
            <p className="t-small" style={{ color: 'var(--fg-3)' }}>
              {totalShows.toLocaleString()} shows total · 1965–1995
            </p>
          )}
        </section>

        {/* Era cards */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
          {eras.map(e => (
            <div
              key={e.id}
              className={`glass${e.highlight ? ' strong' : ''}`}
              style={{
                padding: '18px 18px 16px',
                display: 'flex', flexDirection: 'column', gap: 10, minHeight: 220,
                ...(e.highlight ? { boxShadow: 'var(--shadow-card), 0 0 0 1px rgba(240,176,74,0.3)' } : {}),
              }}
            >
              <span className="t-eyebrow" style={{ color: e.highlight ? 'var(--accent)' : 'var(--fg-3)' }}>{e.tag}</span>
              <h3 className="t-display" style={{ fontSize: 22, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{e.name}</h3>
              <span className="t-mono" style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>{e.years}</span>
              <div className="divider" style={{ margin: '4px 0' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <span className="t-eyebrow">shows</span>
                  <span className="t-mono" style={{ fontSize: 22, color: 'var(--fg)' }}>
                    {e.shows !== null ? e.shows.toLocaleString() : '—'}
                  </span>
                </div>
                <span className="t-small" style={{ fontSize: 11.5, color: 'var(--fg-4)' }}>{e.sig}</span>
              </div>
              <Link
                href={`/eras/${e.id}`}
                className="btn"
                style={{ marginTop: 'auto', padding: '7px 12px', fontSize: 12, justifyContent: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                Explore →
              </Link>
            </div>
          ))}
        </section>

        {/* Focus card — Europe '72 */}
        <section className="glass" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <header style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span className="t-eyebrow" style={{ color: 'var(--accent)' }}>FOCUS</span>
            <h3 className="t-h3">Europe &apos;72 · the wall-of-sound era</h3>
            <span className="t-mono" style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>
              {eras[1].shows !== null ? `${eras[1].shows} shows` : '…'} · 22 countries
            </span>
          </header>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
            <div className="glass faint" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span className="t-eyebrow">Signature jam</span>
              <span style={{ fontSize: 15, color: 'var(--fg)' }}>Dark Star · Lyceum &apos;72</span>
              <span className="t-mono" style={{ fontSize: 18, color: 'var(--accent)' }}>47:18</span>
              <Link
                href="/song/Dark Star"
                className="btn"
                style={{ padding: '6px 12px', fontSize: 11.5, alignSelf: 'flex-start', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Icon d={ICONS.play} size={11} fill="currentColor" stroke={0} /> Play
              </Link>
            </div>
            <div className="glass faint" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span className="t-eyebrow">Songs debuted</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {['Brown-Eyed Women', "He's Gone", 'Tennessee Jed', 'Ramble On Rose', 'Jack Straw', 'Mr. Charlie'].map(s => (
                  <Link
                    key={s}
                    href={`/song/${encodeURIComponent(s)}`}
                    className="pill"
                    style={{ fontSize: 11, padding: '3px 9px', textDecoration: 'none' }}
                  >
                    {s}
                  </Link>
                ))}
              </div>
            </div>
            <div className="glass faint" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span className="t-eyebrow">Avg show length</span>
              <span className="t-mono" style={{ fontSize: 28, color: 'var(--fg)', letterSpacing: '-0.02em' }}>3:11:42</span>
              <span className="t-small">~28% longer than the avg show</span>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
