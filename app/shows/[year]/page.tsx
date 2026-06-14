'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

interface ShowRef {
  id: string
  date: string
  venue: string
  city: string
  state?: string
  country: string
}

type SortKey = 'date' | 'date-desc' | 'venue'

const PER_PAGE = 200

function formatDate(iso: string) { return iso.replace(/-/g, ' · ') }

export default function ShowsByYearPage() {
  const params = useParams()
  const router = useRouter()
  const year = parseInt(params.year as string, 10)

  const [shows, setShows] = useState<ShowRef[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [audioDates, setAudioDates] = useState<Set<string>>(new Set())
  const [audioLoading, setAudioLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('date')

  const fetchShows = useCallback(() => {
    if (isNaN(year)) return
    setLoading(true)
    fetch(`/api/shows?yearFrom=${year}&yearTo=${year}&page=1&perPage=${PER_PAGE}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) { setShows(d.shows ?? []); setTotal(d.total ?? 0) }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [year])

  useEffect(() => { fetchShows() }, [fetchShows])

  // Batch check: one Archive.org search covers all recordings for the year
  useEffect(() => {
    if (isNaN(year)) return
    setAudioLoading(true)
    fetch(`/api/archive/dates-with-audio?year=${year}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.dates) setAudioDates(new Set(d.dates)) })
      .catch(() => {})
      .finally(() => setAudioLoading(false))
  }, [year])

  const sortedShows = [...shows].sort((a, b) => {
    if (sortKey === 'date') return a.date.localeCompare(b.date)
    if (sortKey === 'date-desc') return b.date.localeCompare(a.date)
    return a.venue.localeCompare(b.venue) || a.date.localeCompare(b.date)
  })

  if (isNaN(year)) {
    return (
      <section className="col">
        <div className="crumbs">
          <Link href="/">Home</Link>
          <span className="sep">/</span>
          <Link href="/shows">Shows</Link>
          <span className="sep">/</span>
          <span className="cur">Invalid</span>
        </div>
        <div className="page-head">
          <div>
            <div className="kicker">Shows</div>
            <h2>Invalid year.</h2>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="col">
      <div className="crumbs">
        <Link href="/">Home</Link>
        <span className="sep">/</span>
        <Link href="/shows">Shows</Link>
        <span className="sep">/</span>
        <span className="cur">{year}</span>
      </div>

      <div className="page-head">
        <div>
          <div className="kicker">Shows · {year}</div>
          <h2>Every show, <span className="italic">{year}.</span></h2>
          <div className="lede">
            {loading ? 'Loading…' : `${total} show${total !== 1 ? 's' : ''} in ${year}.`}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton-vault" style={{ height: 40 }} />
          ))}
        </div>
      ) : shows.length === 0 ? (
        <div style={{ padding: '40px 0', color: 'var(--ink-3)', fontStyle: 'italic', fontFamily: 'var(--serif-body)' }}>
          No shows found for {year}.
        </div>
      ) : (
        <>
          {/* Sort controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Sort</span>
            {([
              { key: 'date' as const,  label: sortKey === 'date' ? 'Date ↑' : sortKey === 'date-desc' ? 'Date ↓' : 'Date ↑' },
              { key: 'venue' as const, label: 'Venue' },
            ] as const).map(({ key, label }) => {
              const isDateBtn = key === 'date'
              const isActive = isDateBtn ? (sortKey === 'date' || sortKey === 'date-desc') : sortKey === key
              return (
                <button
                  key={key}
                  onClick={() => {
                    if (isDateBtn) setSortKey(sortKey === 'date' ? 'date-desc' : 'date')
                    else setSortKey(key)
                  }}
                  style={{
                    background: isActive ? 'var(--ink)' : 'var(--paper)',
                    border: '1px solid var(--ink)',
                    color: isActive ? 'var(--paper)' : 'var(--ink)',
                    fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.08em',
                    padding: '4px 10px', cursor: 'pointer',
                  }}
                >{label}</button>
              )
            })}
            <span style={{ flex: 1 }} />
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>
              {total} shows
            </span>
          </div>

          {/* Shows table */}
          <table className="tbl">
            <thead>
              <tr>
                <th>Date</th>
                <th>Venue</th>
                <th>City</th>
                <th style={{ width: 80, textAlign: 'right' }}>Audio</th>
              </tr>
            </thead>
            <tbody>
              {sortedShows.map((s, i) => {
                const hasAudio = audioDates.has(s.date)
                return (
                  <tr
                    key={s.id || i}
                    style={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/show/${s.date}`)}
                  >
                    <td style={{ fontFamily: 'var(--mono)', fontSize: 12, whiteSpace: 'nowrap' }}>{formatDate(s.date)}</td>
                    <td><span className="tbl-title">{s.venue}</span></td>
                    <td style={{ fontFamily: 'var(--serif-body)', fontSize: 13, color: 'var(--ink-3)' }}>
                      {s.city}{s.state ? `, ${s.state}` : ''}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {!audioLoading && hasAudio && (
                        <span style={{
                          fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.1em',
                          textTransform: 'uppercase', color: 'var(--rust)',
                          border: '1px solid var(--rust)', padding: '2px 5px',
                        }}>
                          ▶ audio
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </>
      )}
    </section>
  )
}
