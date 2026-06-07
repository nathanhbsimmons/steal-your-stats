'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const ERA_DEFS = [
  {
    id: 'primal',
    name: 'Primal Dead',
    years: '1965 – 1971',
    startYear: 1965,
    endYear: 1971,
    tag: 'Pigpen era',
    description: 'The raw, exploratory years anchored by Pigpen\'s blues-drenched vocals. Long psychedelic jams, R&B roots, and the first hints of the Dead\'s unique improvisational language.',
    sigSongs: ['Viola Lee Blues', 'Lovelight', 'Dark Star', 'St. Stephen'],
  },
  {
    id: 'europe',
    name: "Europe '72",
    years: '1972 – 1974',
    startYear: 1972,
    endYear: 1974,
    tag: 'wall-of-sound',
    description: 'Peak improvisational power and the Wall of Sound PA system. New songwriting from Garcia/Hunter and Weir/Barlow, legendary European tours, and some of the longest Dark Stars ever played.',
    sigSongs: ['Dark Star', 'Playing in the Band', 'Eyes of the World', 'He\'s Gone'],
  },
  {
    id: 'hiatus',
    name: 'Hiatus & Return',
    years: '1975 – 1979',
    startYear: 1975,
    endYear: 1979,
    tag: 'studio era',
    description: 'A year-long hiatus in 1975 followed by a triumphant return. Keith and Donna Godchaux, Terrapin Station, and a more polished sound balanced against continued exploration.',
    sigSongs: ['Estimated Prophet', 'Terrapin Station', 'Fire on the Mountain', 'Shakedown Street'],
  },
  {
    id: 'brent',
    name: 'Brent Years',
    years: '1980 – 1990',
    startYear: 1980,
    endYear: 1990,
    tag: 'arena Dead',
    description: 'Brent Mydland\'s keyboards defined the sound of a decade. The Dead went arena-scale, expanded their catalog, and became one of the top-grossing touring acts in America.',
    sigSongs: ['Throwing Stones', 'Hell in a Bucket', 'Victim or the Crime', 'Dear Mr. Fantasy'],
  },
  {
    id: 'final',
    name: 'Final Tours',
    years: '1991 – 1995',
    startYear: 1991,
    endYear: 1995,
    tag: 'Vince & Bruce',
    description: 'Vince Welnick and Bruce Hornsby brought new colors. Late-career gems like Lazy River Road and Days Between sat alongside enduring classics, right up to the final show at Soldier Field.',
    sigSongs: ['Lazy River Road', 'Days Between', 'So Many Roads', 'Eternity'],
  },
]

interface ShowRef {
  id: string
  date: string
  venue: string
  city: string
  state?: string
  country: string
}

export default function EraDetailPage() {
  const params = useParams()
  const eraId = params['era-id'] as string
  const era = ERA_DEFS.find(e => e.id === eraId)

  const [shows, setShows] = useState<ShowRef[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loadingShows, setLoadingShows] = useState(true)
  const [topSongs, setTopSongs] = useState<{ name: string; count: number }[]>([])
  const [loadingSongs, setLoadingSongs] = useState(true)

  const fetchShows = useCallback((p: number) => {
    if (!era) return
    setLoadingShows(true)
    fetch(`/api/shows?yearFrom=${era.startYear}&yearTo=${era.endYear}&page=${p}&perPage=30`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) { setShows(data.shows); setTotal(data.total) }
      })
      .catch(() => {})
      .finally(() => setLoadingShows(false))
  }, [era])

  useEffect(() => {
    if (!era) return
    fetchShows(1)
    setLoadingSongs(true)
    fetch(`/api/shows?yearFrom=${era.startYear}&yearTo=${era.endYear}&topSongs=1`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.songs) setTopSongs(data.songs) })
      .catch(() => {})
      .finally(() => setLoadingSongs(false))
  }, [era, fetchShows])

  if (!era) {
    return (
      <section className="col">
        <div className="crumbs">
          <Link href="/">Home</Link>
          <span className="sep">/</span>
          <Link href="/eras">Eras</Link>
          <span className="sep">/</span>
          <span className="cur">Not found</span>
        </div>
        <div style={{ padding: '40px 0', fontFamily: 'var(--serif-body)', fontStyle: 'italic', color: 'var(--ink-3)' }}>
          Era not found. <Link href="/eras" style={{ color: 'var(--rust)' }}>Back to Eras</Link>
        </div>
      </section>
    )
  }

  const totalPages = Math.ceil(total / 30)
  const leaderMax = topSongs[0]?.count ?? 1

  return (
    <section className="col">
      {/* Breadcrumbs */}
      <div className="crumbs">
        <Link href="/">Home</Link>
        <span className="sep">/</span>
        <Link href="/eras">Eras</Link>
        <span className="sep">/</span>
        <span className="cur">{era.name}</span>
      </div>

      {/* Page head */}
      <div className="page-head">
        <div>
          <div className="kicker">Eras · {era.tag}</div>
          <h2>{era.name} · <span style={{ color: 'var(--ink-3)', fontStyle: 'italic' }}>{era.years}</span></h2>
          <div className="lede" style={{ marginTop: 6 }}>{era.description}</div>
        </div>
        {total > 0 && (
          <div className="toolbar">
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-3)' }}>{total} shows</span>
          </div>
        )}
      </div>

      {/* Signature songs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '0 0 18px' }}>
        {era.sigSongs.map(s => (
          <Link
            key={s}
            href={`/song/${encodeURIComponent(s)}`}
            style={{
              display: 'inline-block',
              border: '2px solid var(--ink)',
              borderRadius: 12,
              padding: '5px 14px',
              fontFamily: 'var(--serif-display)',
              fontSize: 13,
              color: 'var(--ink)',
              textDecoration: 'none',
              background: 'var(--paper)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--hi)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--paper)')}
          >
            {s}
          </Link>
        ))}
      </div>

      {/* Two-column content */}
      <div className="results-cols" style={{ gridTemplateColumns: '3fr 2fr', alignItems: 'start' }}>

        {/* Shows list */}
        <div className="result-col">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h4>Shows</h4>
            {total > 0 && (
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.04em' }}>
                {(page - 1) * 30 + 1}–{Math.min(page * 30, total)} of {total}
              </span>
            )}
          </div>

          {loadingShows
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="skeleton-vault" style={{ height: 44, marginBottom: 3 }} />
              ))
            : shows.length === 0
              ? <div style={{ padding: '20px 0', color: 'var(--ink-3)', fontStyle: 'italic' }}>No shows found.</div>
              : shows.map(show => (
                  <Link
                    key={show.id}
                    href={`/show/${show.date}`}
                    className="row"
                    style={{ textDecoration: 'none' }}
                  >
                    <span className="t">{show.venue}</span>
                    <span className="s">{show.date} · {show.city}{show.state ? `, ${show.state}` : ''}</span>
                  </Link>
                ))
          }

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 14 }}>
              <button
                className="btn"
                disabled={page <= 1}
                onClick={() => { const p = page - 1; setPage(p); fetchShows(p) }}
                style={{ opacity: page <= 1 ? 0.4 : 1 }}
              >
                ← Prev
              </button>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', flex: 1, textAlign: 'center' }}>
                {page} / {totalPages}
              </span>
              <button
                className="btn"
                disabled={page >= totalPages}
                onClick={() => { const p = page + 1; setPage(p); fetchShows(p) }}
                style={{ opacity: page >= totalPages ? 0.4 : 1 }}
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Most-played songs sidebar */}
        <div className="result-col">
          <h4>Most played</h4>
          {loadingSongs
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton-vault" style={{ height: 36, marginBottom: 4 }} />
              ))
            : (
              <ul className="toptable">
                {topSongs.map((song, i) => {
                  const pct = Math.round((song.count / leaderMax) * 100)
                  return (
                    <li key={song.name}>
                      <Link href={`/song/${encodeURIComponent(song.name)}`} style={{ textDecoration: 'none', display: 'block' }}>
                        <div className="row1">
                          <span className="rank">{i + 1}.</span>
                          <span style={{ fontFamily: 'var(--serif-display)', fontSize: 16 }}>{song.name}</span>
                          <span className="plays">{song.count}</span>
                        </div>
                        <div className="bar">
                          <div className="fill" style={{ width: `${pct}%` }} />
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )
          }
        </div>
      </div>
    </section>
  )
}
