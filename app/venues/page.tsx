'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

interface VenueStat {
  name: string
  city: string
  state?: string
  country: string
  showCount: number
  firstYear: number
  lastYear: number
}

function useDebounce<T>(value: T, ms: number): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export default function VenuesPage() {
  const [venues, setVenues] = useState<VenueStat[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const dq = useDebounce(query, 200)
  const router = useRouter()

  useEffect(() => {
    setLoading(true)
    fetch('/api/venues')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) { setVenues(d.venues ?? []); setTotal(d.total ?? 0) }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!dq) return venues
    const q = dq.toLowerCase()
    return venues.filter(v =>
      v.name.toLowerCase().includes(q) ||
      v.city.toLowerCase().includes(q) ||
      (v.state ?? '').toLowerCase().includes(q)
    )
  }, [venues, dq])

  const topVenue = venues.sort((a, b) => b.showCount - a.showCount)[0]

  return (
    <section className="col">
      <div className="page-head">
        <div>
          <div className="kicker">Venues · VI</div>
          <h2><span className="italic">Halls</span> and fields.</h2>
          <div className="lede">
            {total > 0
              ? `${total} unique venue${total !== 1 ? 's' : ''} in the archive.`
              : '25 unique venues to truck through.'
            }
          </div>
        </div>
        <div className="toolbar">
          <div className="filter-input" style={{ maxWidth: 280 }}>
            <span style={{ color: 'var(--ink-3)' }}>⌕</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="filter venues…"
            />
            {query && <span className="clear" onClick={() => setQuery('')}>×</span>}
          </div>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="label">Unique Venues</div>
          <div className="val">{total > 0 ? total.toLocaleString() : '—'}</div>
        </div>
        <div className="kpi">
          <div className="label">Most-played Venue</div>
          <div className="val" style={{ fontSize: 24, marginTop: 8 }}>{topVenue?.name ?? '—'}</div>
          <div className="annot">{topVenue ? `${topVenue.showCount} shows` : ''}</div>
        </div>
        <div className="kpi">
          <div className="label">Showing</div>
          <div className="val">{filtered.length}</div>
          <div className="annot">{query ? 'filtered' : 'all venues'}</div>
        </div>
      </div>

      {loading ? (
        Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton-vault" style={{ height: 44, marginBottom: 4 }} />
        ))
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>#</th>
              <th>Venue</th>
              <th>City</th>
              <th className="r">Shows</th>
              <th className="r">Years Active</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v, i) => (
              <tr
                key={v.name + v.city}
                className={i === 0 && !query ? 'hi' : ''}
                style={{ cursor: 'pointer' }}
                onClick={() => router.push(`/search?q=${encodeURIComponent(v.name)}`)}
              >
                <td className="num">{String(i + 1).padStart(2, '0')}</td>
                <td>
                  <span className="tbl-title">{v.name}</span>
                  {i === 0 && !query && <span className="tbl-sub">★ most played</span>}
                </td>
                <td>
                  {v.city}{v.state ? `, ${v.state}` : ''}, {v.country}
                </td>
                <td className="r">{v.showCount.toLocaleString()}</td>
                <td className="r">{v.firstYear} – {v.lastYear}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
