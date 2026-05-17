'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { TopBar } from '@/components/glass/topbar'
import { StatTile, ShowRow } from '@/components/glass/primitives'
import { Icon, ICONS } from '@/components/glass/icons'

interface ShowOnThisDay {
  date: string
  year: number
  venue: string
  city: string
  state?: string
  country: string
  songs: string[]
  setlistUrl?: string
}

interface SummaryStats {
  totalShows: number
  uniqueSongs: number
  hoursArchived: number
  lastUpdated: number | null
}

interface MostPlayedEntry {
  name: string
  count: number
  pct: number
}

type RebuildState = 'idle' | 'loading' | 'success' | 'error'

export default function Home() {
  const [shows, setShows] = useState<ShowOnThisDay[]>([])
  const [currentDate, setCurrentDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [kpi, setKpi] = useState<SummaryStats | null>(null)
  const [mostPlayed, setMostPlayed] = useState<MostPlayedEntry[]>([])
  const [rebuildState, setRebuildState] = useState<RebuildState>('idle')

  useEffect(() => {
    fetch('/api/on-this-day')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setShows(data.shows || [])
          setCurrentDate(data.date || '')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetch('/api/stats/summary')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setKpi(data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.leaderboard) setMostPlayed(data.leaderboard.slice(0, 6)) })
      .catch(() => {})
  }, [])

  async function handleRebuild() {
    setRebuildState('loading')
    try {
      const r = await fetch('/api/rebuild', { method: 'POST' })
      setRebuildState(r.ok ? 'success' : 'error')
    } catch {
      setRebuildState('error')
    }
    setTimeout(() => setRebuildState('idle'), 3000)
  }

  // Format date as "May 14"
  const displayDate = currentDate
    ? new Date(currentDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : ''

  // Pick the best featured show: prefer shows with songs from the golden era (1967–1994)
  const sortedShows = [...shows].sort((a, b) => {
    const aScore = (a.songs.length > 0 ? 100 : 0) + (a.year >= 1967 && a.year <= 1994 ? 50 : 0)
    const bScore = (b.songs.length > 0 ? 100 : 0) + (b.year >= 1967 && b.year <= 1994 ? 50 : 0)
    if (aScore !== bScore) return bScore - aScore
    // Among equally scored shows, prefer the most iconic eras
    const idealYear = 1977
    return Math.abs(a.year - idealYear) - Math.abs(b.year - idealYear)
  })
  const featured = sortedShows[0] || shows[0]
  const featuredYear = featured?.year ?? 1977
  const featuredVenue = featured?.venue ?? 'Barton Hall'
  const featuredCity = featured
    ? `${featured.city}${featured.state ? `, ${featured.state}` : ''}, ${featured.country}`
    : 'Ithaca, NY, USA'
  // Use the actual featured show's date for the hero date block
  const featuredDate = featured?.date || '1977-05-08'
  const [, heroMonth, heroDay] = featuredDate.split('-')
  const heroMonthName = new Date(2000, parseInt(heroMonth) - 1, 1).toLocaleString('en-US', { month: 'short' }).toUpperCase()

  const yearsAgo = new Date().getFullYear() - featuredYear
  // Pick a highlight song for the hero subtitle
  const heroSong = featured?.songs?.[0] ?? 'Scarlet Begonias'

  return (
    <>
      <TopBar eyebrow="Welcome back" title="Pull up a tape, dust off the deck.">
        {rebuildState !== 'idle' && (
          <span className="t-small" style={{
            color: rebuildState === 'success' ? 'var(--accent)' : rebuildState === 'error' ? '#f87171' : 'var(--fg-3)',
          }}>
            {rebuildState === 'loading' ? 'Rebuilding…' : rebuildState === 'success' ? 'Index rebuilt' : 'Rebuild failed'}
          </span>
        )}
        <button className="btn" onClick={handleRebuild} disabled={rebuildState === 'loading'}>
          <Icon d={ICONS.upload} size={14} /> Rebuild index
        </button>
        <button className="btn primary">
          <Icon d={ICONS.play} size={13} fill="currentColor" stroke={0} /> Today&apos;s tape
        </button>
      </TopBar>

      <div className="scroll-hide" style={{ flex: 1, overflow: 'auto', padding: '0 28px 24px', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* Hero card */}
        <section className="glass strong" style={{
          padding: '26px 28px',
          display: 'grid',
          gridTemplateColumns: '1fr 280px',
          gap: 28,
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Waveform decoration */}
          <svg style={{
            position: 'absolute', right: -40, top: 0, bottom: 0,
            opacity: 0.18, pointerEvents: 'none',
          }} width="520" height="100%" viewBox="0 0 520 220" preserveAspectRatio="none">
            {Array.from({ length: 70 }).map((_, i) => {
              const h = Math.round(30 + Math.abs(Math.sin(i * 0.42) * Math.cos(i * 0.18)) * 90)
              return (
                <rect key={i} x={i * 7.4} y={110 - h / 2} width="3.5" height={h} rx="1.5" fill="var(--accent)" />
              )
            })}
          </svg>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="pill accent">
                <span className="dot" />On this day · {featuredYear}
              </span>
              {displayDate && <span className="t-eyebrow">{displayDate}</span>}
            </div>

            {loading ? (
              <div className="skeleton" style={{ height: 80 }} />
            ) : (
              <h2 className="t-display" style={{ fontSize: 38, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
                {featuredVenue}<br />
                <span style={{ color: 'var(--fg-3)' }}>{heroSong} and the all-time tape.</span>
              </h2>
            )}

            <div style={{ display: 'flex', gap: 28, marginTop: 4 }}>
              {[
                { label: 'Show length', value: '2:36:14' },
                { label: 'Tracks',      value: '22' },
                { label: 'Soundboard',  value: 'SBD · A+' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span className="t-eyebrow">{s.label}</span>
                  <span className="t-mono" style={{ fontSize: 16, color: 'var(--fg)' }}>{s.value}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              {featured ? (
                <Link href={`/show/${featured.date}`} className="btn primary lg">
                  <Icon d={ICONS.play} size={14} fill="currentColor" stroke={0} /> Play the show
                </Link>
              ) : (
                <button className="btn primary lg">
                  <Icon d={ICONS.play} size={14} fill="currentColor" stroke={0} /> Play the show
                </button>
              )}
              <button className="btn lg">Open setlist</button>
            </div>
          </div>

          {/* Date block */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: 18, borderRadius: 'var(--r-lg)',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--glass-border)',
            position: 'relative', zIndex: 1,
          }}>
            <span className="t-eyebrow" style={{ textAlign: 'center' }}>{loading ? '…' : featuredVenue}</span>
            <span className="t-mono" style={{ fontSize: 13, color: 'var(--fg-3)', marginTop: 4, textAlign: 'center' }}>
              {featuredCity}
            </span>
            <div style={{ display: 'flex', gap: 18, marginTop: 14, alignItems: 'baseline' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span className="t-mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>{heroMonthName}</span>
                <span className="t-mono" style={{ fontSize: 56, color: 'var(--accent)', lineHeight: 1, letterSpacing: '-0.04em', fontWeight: 500 }}>
                  {heroDay}
                </span>
              </div>
              <span className="t-mono" style={{ fontSize: 32, color: 'var(--fg-3)', letterSpacing: '-0.03em' }}>
                &apos;{String(featuredYear).slice(2)}
              </span>
            </div>
            <div className="divider" style={{ width: '80%', margin: '14px 0 10px' }} />
            <span className="t-small" style={{ textAlign: 'center', fontSize: 11 }}>
              {yearsAgo} years ago today
            </span>
          </div>
        </section>

        {/* KPI strip */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <StatTile
            label="Shows indexed"
            value={kpi ? kpi.totalShows.toLocaleString() : '—'}
            sub="from setlist.fm"
          />
          <StatTile
            label="Unique songs"
            value={kpi ? kpi.uniqueSongs.toLocaleString() : '—'}
            sub="GD catalog"
          />
          <StatTile
            label="Hours archived"
            value={kpi ? kpi.hoursArchived.toLocaleString() : '—'}
            sub="est. at 2.7h/show"
            accent
          />
          <StatTile
            label="Last refresh"
            value={kpi?.lastUpdated
              ? (() => {
                  const mins = Math.round((Date.now() - kpi.lastUpdated) / 60000)
                  return mins < 60 ? `${mins}m ago` : `${Math.round(mins / 60)}h ago`
                })()
              : '—'}
            sub="Auto-refreshes daily"
          />
        </section>

        {/* Two-column row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 22, minHeight: 0 }}>

          {/* Recent activity */}
          <section className="glass" style={{ padding: 4, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <header style={{ display: 'flex', alignItems: 'center', padding: '14px 18px 10px', gap: 12 }}>
              <h3 className="t-h3">Recent Activity</h3>
              <span className="pill" style={{ fontSize: 10.5, padding: '2px 8px', fontFamily: 'var(--font-mono)' }}>
                {loading ? '…' : `${shows.length} NEW`}
              </span>
              <span style={{ flex: 1 }} />
              <Link href="/recent" className="btn" style={{ padding: '6px 12px', fontSize: 12 }}>View all</Link>
            </header>
            <div style={{ display: 'flex', flexDirection: 'column', padding: '4px 4px 10px' }}>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 44, margin: '4px 8px' }} />
                ))
              ) : shows.length > 0 ? (
                shows.slice(0, 6).map(show => (
                  <ShowRow
                    key={show.date}
                    date={show.date}
                    venue={show.venue}
                    city={`${show.city}${show.state ? `, ${show.state}` : ''}`}
                    country={show.country}
                    badge={`${show.year}`}
                  />
                ))
              ) : (
                [
                  { date: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca, NY', country: 'USA', badge: 'Cornell' },
                  { date: '1972-05-26', venue: 'Lyceum Theatre', city: 'London', country: 'UK', badge: 'Europe 72' },
                  { date: '1973-11-11', venue: 'Winterland', city: 'San Francisco, CA', country: 'USA', badge: 'SBD' },
                ].map(r => <ShowRow key={r.date} {...r} />)
              )}
            </div>
          </section>

          {/* Most-played */}
          <section className="glass" style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 className="t-h3">Most-Played</h3>
              <span className="t-eyebrow">all-time</span>
            </header>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {mostPlayed.length > 0
                ? mostPlayed.map((s, i) => (
                    <div key={s.name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span className="t-mono" style={{ fontSize: 10.5, color: 'var(--fg-4)', width: 16 }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <Link
                          href={`/song/${encodeURIComponent(s.name)}`}
                          style={{ fontSize: 13, color: 'var(--fg)', flex: 1 }}
                        >
                          {s.name}
                        </Link>
                        <span className="t-mono" style={{ fontSize: 12, color: 'var(--fg-3)' }}>{s.count}</span>
                      </div>
                      <div className="progress">
                        <div className="fill" style={{ width: `${s.pct}%` }} />
                      </div>
                    </div>
                  ))
                : Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 30 }} />
                  ))
              }
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
