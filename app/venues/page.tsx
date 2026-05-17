'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { TopBar } from '@/components/glass/topbar'
import { StatTile } from '@/components/glass/primitives'
import { Icon, ICONS } from '@/components/glass/icons'

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
  const dq = useDebounce(query, 180)

  useEffect(() => {
    fetch('/api/venues')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setVenues(data.venues)
          setTotal(data.total)
        }
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
      v.country.toLowerCase().includes(q)
    )
  }, [venues, dq])

  const topVenue = venues[0]

  return (
    <>
      <TopBar eyebrow="Venues" title="Where the Dead set up the wall." />

      <div className="scroll-hide" style={{ flex: 1, overflow: 'auto', padding: '0 28px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* KPI strip */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          <StatTile
            label="Unique venues"
            value={loading ? '—' : total.toLocaleString()}
            sub="from setlist.fm"
          />
          <StatTile
            label="Most played"
            value={loading ? '—' : topVenue?.name.split(' ')[0] ?? '—'}
            sub={loading ? '' : topVenue ? `${topVenue.showCount} shows` : ''}
            accent
          />
          <StatTile
            label="Showing"
            value={loading ? '—' : filtered.length.toLocaleString()}
            sub={dq ? 'matching filter' : 'all venues'}
          />
          <StatTile
            label="Top city"
            value={loading ? '—' : (() => {
              const cityMap = new Map<string, number>()
              venues.forEach(v => cityMap.set(v.city, (cityMap.get(v.city) || 0) + v.showCount))
              const top = [...cityMap.entries()].sort((a, b) => b[1] - a[1])[0]
              return top ? top[0].split(',')[0] : '—'
            })()}
            sub="by show count"
          />
        </section>

        {/* Venues table */}
        <section className="glass" style={{ padding: 4, display: 'flex', flexDirection: 'column' }}>
          <header style={{ padding: '14px 18px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <h3 className="t-h3">All venues</h3>
            <span className="t-eyebrow">sorted by shows</span>
            <span style={{ flex: 1 }} />
            <div className="glass" style={{ padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 'var(--r-full)' }}>
              <Icon d={ICONS.search} size={12} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Filter venues…"
                style={{ background: 'transparent', border: 0, outline: 'none', color: 'var(--fg)', fontSize: 12, width: 160 }}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-3)', lineHeight: 1, padding: 0 }}
                >
                  <Icon d={ICONS.close} size={11} />
                </button>
              )}
            </div>
          </header>
          <div className="glass faint" style={{ margin: 8, padding: 0, overflow: 'hidden', borderRadius: 'var(--r-md)' }}>
            {loading ? (
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 36 }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'var(--fg-3)', fontSize: 13 }}>
                No venues match &ldquo;{dq}&rdquo;
              </div>
            ) : (
              <table className="versions-table">
                <thead>
                  <tr>
                    <th>Venue</th>
                    <th>City</th>
                    <th>Country</th>
                    <th style={{ textAlign: 'right' }}>Shows</th>
                    <th style={{ textAlign: 'right' }}>First</th>
                    <th style={{ textAlign: 'right' }}>Last</th>
                    <th style={{ textAlign: 'right' }}>Span</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 200).map((v, i) => {
                    const span = v.lastYear - v.firstYear
                    const peak = v.showCount >= 30
                    const location = v.state ? `${v.city}, ${v.state}` : v.city
                    return (
                      <tr key={i} className={peak ? 'peak' : ''}>
                        <td style={{ color: 'var(--fg)', fontWeight: 500 }}>{v.name}</td>
                        <td>{location}</td>
                        <td className="t-mono" style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>{v.country}</td>
                        <td className="t-mono" style={{ textAlign: 'right', color: peak ? 'var(--accent-strong)' : 'var(--fg)' }}>{v.showCount}</td>
                        <td className="t-mono" style={{ textAlign: 'right' }}>{v.firstYear}</td>
                        <td className="t-mono" style={{ textAlign: 'right' }}>{v.lastYear}</td>
                        <td className="t-mono" style={{ textAlign: 'right', color: 'var(--fg-3)' }}>{span > 0 ? `${span}y` : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
          {!loading && filtered.length > 200 && (
            <p className="t-small" style={{ padding: '8px 18px 14px', color: 'var(--fg-3)' }}>
              Showing top 200 of {filtered.length} — use the filter to narrow results.
            </p>
          )}
        </section>
      </div>
    </>
  )
}
