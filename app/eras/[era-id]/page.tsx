'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { TopBar } from '@/components/glass/topbar'
import { ShowRow, GlassSkeleton } from '@/components/glass/primitives'

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
    highlight: true,
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
        if (data) {
          setShows(data.shows)
          setTotal(data.total)
        }
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
      <>
        <TopBar eyebrow="Eras" title="Era not found." />
        <div style={{ padding: '32px 28px' }}>
          <Link href="/eras" className="btn" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            ← Back to Eras
          </Link>
        </div>
      </>
    )
  }

  const totalPages = Math.ceil(total / 30)

  return (
    <>
      <TopBar eyebrow="Eras" title={`${era.name} · ${era.years}`} />

      <div className="scroll-hide" style={{ flex: 1, overflow: 'auto', padding: '0 28px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Era header */}
        <section className={`glass${era.highlight ? ' strong' : ''}`} style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span className="t-eyebrow" style={{ color: era.highlight ? 'var(--accent)' : 'var(--fg-3)' }}>{era.tag}</span>
            {total > 0 && <span className="t-mono" style={{ fontSize: 12, color: 'var(--fg-3)' }}>{total} shows</span>}
          </div>
          <p style={{ fontSize: 14.5, color: 'var(--fg-2)', lineHeight: 1.6, maxWidth: 680 }}>{era.description}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {era.sigSongs.map(s => (
              <Link key={s} href={`/song/${encodeURIComponent(s)}`} className="pill" style={{ fontSize: 11.5, padding: '4px 10px', textDecoration: 'none' }}>
                {s}
              </Link>
            ))}
          </div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18, alignItems: 'start' }}>

          {/* Shows list */}
          <section className="glass" style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ padding: '0 16px 12px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span className="t-eyebrow">Shows</span>
              {total > 0 && (
                <span className="t-mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>
                  {(page - 1) * 30 + 1}–{Math.min(page * 30, total)} of {total}
                </span>
              )}
            </div>
            <div className="divider" style={{ margin: '0 0 4px' }} />

            {loadingShows ? (
              <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Array.from({ length: 8 }).map((_, i) => <GlassSkeleton key={i} height={48} />)}
              </div>
            ) : shows.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--fg-3)' }}>
                <span className="t-small">No shows found</span>
              </div>
            ) : (
              shows.map(show => (
                <Link key={show.id} href={`/show/${show.date}`} style={{ textDecoration: 'none' }}>
                  <ShowRow
                    date={show.date}
                    venue={show.venue}
                    city={show.city}
                    country={show.state ? `${show.state} · ${show.country}` : show.country}
                  />
                </Link>
              ))
            )}

            {totalPages > 1 && (
              <div style={{ padding: '12px 16px 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  className="btn"
                  disabled={page <= 1}
                  onClick={() => { const p = page - 1; setPage(p); fetchShows(p) }}
                  style={{ padding: '6px 14px', fontSize: 12, opacity: page <= 1 ? 0.4 : 1 }}
                >
                  ← Prev
                </button>
                <span className="t-mono" style={{ fontSize: 11.5, color: 'var(--fg-3)', flex: 1, textAlign: 'center' }}>
                  {page} / {totalPages}
                </span>
                <button
                  className="btn"
                  disabled={page >= totalPages}
                  onClick={() => { const p = page + 1; setPage(p); fetchShows(p) }}
                  style={{ padding: '6px 14px', fontSize: 12, opacity: page >= totalPages ? 0.4 : 1 }}
                >
                  Next →
                </button>
              </div>
            )}
          </section>

          {/* Top songs sidebar */}
          <section className="glass" style={{ padding: '16px 0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '0 16px 12px' }}>
              <span className="t-eyebrow">Most played</span>
            </div>
            <div className="divider" style={{ margin: '0 0 4px' }} />

            {loadingSongs ? (
              <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Array.from({ length: 6 }).map((_, i) => <GlassSkeleton key={i} height={36} />)}
              </div>
            ) : (
              topSongs.map((song, i) => {
                const maxCount = topSongs[0]?.count ?? 1
                const pct = Math.round((song.count / maxCount) * 100)
                return (
                  <Link
                    key={song.name}
                    href={`/song/${encodeURIComponent(song.name)}`}
                    style={{ textDecoration: 'none', padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12.5, color: 'var(--fg)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="t-mono" style={{ fontSize: 10.5, color: 'var(--fg-3)', width: 16 }}>{i + 1}</span>
                        {song.name}
                      </span>
                      <span className="t-mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{song.count}</span>
                    </div>
                    <div style={{ height: 3, borderRadius: 2, background: 'var(--glass-border)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.4s ease' }} />
                    </div>
                  </Link>
                )
              })
            )}
          </section>
        </div>
      </div>
    </>
  )
}
