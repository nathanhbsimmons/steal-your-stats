'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface ShowRef {
  id: string
  date: string
  venue: string
  city: string
  state?: string
  country: string
}

const PER_PAGE = 30

export default function ShowsByYearPage() {
  const params = useParams()
  const year = parseInt(params.year as string, 10)

  const [shows, setShows] = useState<ShowRef[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchShows = useCallback((p: number) => {
    if (isNaN(year)) return
    setLoading(true)
    fetch(`/api/shows?yearFrom=${year}&yearTo=${year}&page=${p}&perPage=${PER_PAGE}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) { setShows(d.shows ?? []); setTotal(d.total ?? 0) }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [year])

  useEffect(() => { fetchShows(1) }, [fetchShows])

  const totalPages = Math.ceil(total / PER_PAGE)

  if (isNaN(year)) {
    return (
      <section className="col">
        <div className="page-head">
          <div>
            <div className="kicker">Shows</div>
            <h2>Invalid year.</h2>
          </div>
        </div>
        <Link href="/stats" style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--rust)' }}>← Back to Stats</Link>
      </section>
    )
  }

  return (
    <section className="col">
      <div className="page-head">
        <div>
          <div className="kicker">Shows · {year}</div>
          <h2>Every show, <span className="italic">{year}.</span></h2>
          <div className="lede">
            {loading ? 'Loading…' : `${total} show${total !== 1 ? 's' : ''} in ${year}.`}
          </div>
        </div>
        <div className="toolbar">
          <Link
            href="/stats"
            style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', textDecoration: 'none', letterSpacing: '0.05em' }}
          >
            ← Stats
          </Link>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton-vault" style={{ height: 48 }} />
          ))}
        </div>
      ) : shows.length === 0 ? (
        <div style={{ padding: '40px 0', color: 'var(--ink-3)', fontStyle: 'italic', fontFamily: 'var(--serif-body)' }}>
          No shows found for {year}.
        </div>
      ) : (
        <>
          <div className="result-col">
            {shows.map(s => (
              <Link
                key={s.id}
                href={`/show/${s.date}`}
                className="row"
                style={{ textDecoration: 'none' }}
              >
                <span className="t">{s.venue}</span>
                <span className="s">{s.date} · {s.city}{s.state ? `, ${s.state}` : ''}</span>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
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
        </>
      )}
    </section>
  )
}
