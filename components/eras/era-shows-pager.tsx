'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import { getOfficialReleasesForDate } from '@/lib/official-releases'
import { ReleaseBadge } from '@/components/ui/release-badge'

interface ShowRef {
  id: string
  date: string
  venue: string
  city: string
  state?: string
  country: string
}

interface EraDef {
  id: string
  name: string
  years: string
  startYear: number
  endYear: number
  tag: string
  description: string
  sigSongs: string[]
}

const PER_PAGE = 30

export function EraShowsPager({
  era,
  initialShows,
  initialTotal,
  topSongs,
}: {
  era: EraDef
  initialShows: ShowRef[]
  initialTotal: number
  topSongs: { name: string; count: number }[]
}) {
  const [shows, setShows] = useState<ShowRef[]>(initialShows)
  const [total] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [loadingShows, setLoadingShows] = useState(false)

  const fetchShows = useCallback((p: number) => {
    setLoadingShows(true)
    fetch(`/api/shows?yearFrom=${era.startYear}&yearTo=${era.endYear}&page=${p}&perPage=${PER_PAGE}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setShows(data.shows)
      })
      .catch(() => {})
      .finally(() => setLoadingShows(false))
  }, [era])

  const totalPages = Math.ceil(total / PER_PAGE)
  const leaderMax = topSongs[0]?.count ?? 1

  return (
    <>
      {/* Signature songs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '0 0 18px' }}>
        {era.sigSongs.map(s => (
          <Link
            key={s}
            href={`/song/${encodeURIComponent(s)}`}
            style={{
              display: 'inline-block',
              border: '2px solid var(--ink)',
              borderRadius: 0,
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
                {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total}
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
                    <span className="t" style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                      {show.venue}
                      <ReleaseBadge releases={getOfficialReleasesForDate(show.date)} size="xs" />
                    </span>
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
        </div>
      </div>
    </>
  )
}
