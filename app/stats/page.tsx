'use client'

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'

interface YearCount { year: number; count: number }
interface LeaderEntry { name: string; count: number; pct: number }
interface SummaryData {
  totalShows?: number
  uniqueSongs?: number
  hoursArchived?: number
  lastRefresh?: string
}

interface GlobalStats {
  showsPerYear: YearCount[]
  leaderboard: LeaderEntry[]
}

interface PositionEntry { label: string; count: number; pct: string }

const DARK_STAR_DEFAULT: PositionEntry[] = [
  { label: 'Opener',  count: 14,  pct: '6%' },
  { label: 'Mid-set', count: 210, pct: '90%' },
  { label: 'Closer',  count: 6,   pct: '3%' },
  { label: 'Encore',  count: 2,   pct: '1%' },
]
const DARK_STAR_TOTAL = 232

// Order matches legend: Opener, Mid-set, Closer, Encore
const COLORS = ['var(--forest)', 'var(--rust)', 'var(--ledger-blue)', 'var(--ink)']

function DonutChart({ positions, songLabel }: { positions: PositionEntry[]; songLabel: string }) {
  const cx = 140, cy = 140, r = 112
  const innerR = 56
  const total = positions.reduce((n, p) => n + p.count, 0)

  const paths = useMemo(() => {
    if (total === 0) return []
    let acc = 0
    return positions.map((p, i) => {
      const start = (acc / total) * Math.PI * 2 - Math.PI / 2
      acc += p.count
      const end = (acc / total) * Math.PI * 2 - Math.PI / 2
      let d: string
      if (p.count === total) {
        // Full circle — SVG arcs can't connect identical start/end points, use two semicircles
        d = `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`
      } else {
        const large = (end - start) > Math.PI ? 1 : 0
        const x1 = cx + r * Math.cos(start)
        const y1 = cy + r * Math.sin(start)
        const x2 = cx + r * Math.cos(end)
        const y2 = cy + r * Math.sin(end)
        d = `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`
      }
      return { ...p, d, color: COLORS[i] }
    })
  }, [positions, total])

  // Wrap label into lines of ~11 chars (fits inside innerR=56 circle at 12px mono)
  const labelWords = songLabel.toUpperCase().split(' ')
  const labelLines: string[] = []
  let cur = ''
  for (const word of labelWords) {
    if (!cur) { cur = word }
    else if (cur.length + 1 + word.length <= 11) { cur += ' ' + word }
    else { labelLines.push(cur); cur = word }
  }
  if (cur) labelLines.push(cur)
  const lineH = 14
  const labelStartY = cy + 14 - ((labelLines.length - 1) * lineH) / 2

  return (
    <svg width="280" height="280" viewBox="0 0 280 280" style={{ flexShrink: 0, display: 'block', margin: '0 auto' }}>
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.color} stroke="var(--paper)" strokeWidth="3" />
      ))}
      <circle cx={cx} cy={cy} r={innerR} fill="var(--paper)" stroke="var(--ink)" strokeWidth="1.5" />
      <text x={cx} y={cy - 8} textAnchor="middle" fontFamily="var(--serif-display)" fontSize="38" fill="var(--ink)">{total}</text>
      {labelLines.map((line, i) => (
        <text key={i} x={cx} y={labelStartY + i * lineH} textAnchor="middle" fontFamily="var(--mono)" fontSize="12" letterSpacing="0.08em" fill="var(--ink-3)">{line}</text>
      ))}
    </svg>
  )
}

interface SongSuggestion { title: string; displayTitle: string }

export default function StatsPage() {
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [summary, setSummary] = useState<SummaryData | null>(null)

  // Position breakdown state
  const [positionSong, setPositionSong] = useState('Dark Star')
  const [positionData, setPositionData] = useState<PositionEntry[]>(DARK_STAR_DEFAULT)
  const [positionTotal, setPositionTotal] = useState(DARK_STAR_TOTAL)
  const [positionLoading, setPositionLoading] = useState(false)
  const [songQuery, setSongQuery] = useState('')
  const [suggestions, setSuggestions] = useState<SongSuggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d) })
      .catch(() => {})
    fetch('/api/stats/summary')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setSummary(d) })
      .catch(() => {})
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        inputRef.current && !inputRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const fetchPositionData = useCallback(async (songTitle: string) => {
    setPositionLoading(true)
    try {
      const [posRes, factsRes] = await Promise.all([
        fetch(`/api/position-facts?songTitle=${encodeURIComponent(songTitle)}`),
        fetch(`/api/song-facts?songTitle=${encodeURIComponent(songTitle)}`),
      ])
      const pos = posRes.ok ? await posRes.json() : null
      const facts = factsRes.ok ? await factsRes.json() : null

      const opener = pos?.opener?.count ?? 0
      const closer = pos?.closer?.count ?? 0
      const encore = pos?.encore?.count ?? 0
      const total = facts?.totalPerformances ?? (opener + closer + encore)
      const midset = Math.max(0, total - opener - closer - encore)
      const safe = total > 0 ? total : 1

      setPositionData([
        { label: 'Opener',  count: opener, pct: `${Math.round((opener / safe) * 100)}%` },
        { label: 'Mid-set', count: midset, pct: `${Math.round((midset / safe) * 100)}%` },
        { label: 'Closer',  count: closer, pct: `${Math.round((closer / safe) * 100)}%` },
        { label: 'Encore',  count: encore, pct: `${Math.round((encore / safe) * 100)}%` },
      ])
      setPositionTotal(total)
      setPositionSong(pos?.songTitle || songTitle)
    } catch {
      // keep existing data on error
    } finally {
      setPositionLoading(false)
    }
  }, [])

  function handleQueryChange(q: string) {
    setSongQuery(q)
    setActiveIdx(-1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) { setSuggestions([]); setShowDropdown(false); return }
    debounceRef.current = setTimeout(() => {
      fetch(`/api/songs?q=${encodeURIComponent(q)}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          const found: SongSuggestion[] = (d?.songs ?? []).slice(0, 8)
          setSuggestions(found)
          setShowDropdown(found.length > 0)
        })
        .catch(() => {})
    }, 180)
  }

  function selectSong(song: SongSuggestion) {
    setSongQuery('')
    setSuggestions([])
    setShowDropdown(false)
    void fetchPositionData(song.displayTitle)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown || suggestions.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); selectSong(suggestions[activeIdx]) }
    else if (e.key === 'Escape') { setShowDropdown(false) }
  }

  const barData = stats?.showsPerYear ?? []
  const barMax = barData.length > 0 ? Math.max(...barData.map(d => d.count), 1) : 1
  const peakYear = barData.reduce((best, d) => d.count > best.count ? d : best, { year: 0, count: 0 })
  const leaderboard = stats?.leaderboard ?? []
  const leaderMax = leaderboard.length > 0 ? leaderboard[0].count : 1

  return (
    <section className="col">
      <div className="page-head">
        <div>
          <div className="kicker">Statistics · thirty years on the road</div>
          <h2>The big numbers, <span className="italic">through the years.</span></h2>
          <div className="lede">Every show, every song, every hour of hand-filed tape.</div>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="label">Total Shows</div>
          <div className="val rust">{summary?.totalShows ? summary.totalShows.toLocaleString() : stats ? '2,333' : '—'}</div>
          <div className="annot">indexed from setlist.fm</div>
        </div>
        <div className="kpi">
          <div className="label">Unique Songs</div>
          <div className="val">{summary?.uniqueSongs ? summary.uniqueSongs.toLocaleString() : '442'}</div>
          <div className="annot">titles in the catalog</div>
        </div>
        <div className="kpi">
          <div className="label">Hours Archived</div>
          <div className="val rust">{summary?.hoursArchived ? summary.hoursArchived.toLocaleString() : '—'}</div>
          <div className="annot">avg 2h 42m per show</div>
        </div>
        <div className="kpi">
          <div className="label">Peak Year</div>
          <div className="val">{stats ? `${peakYear.year}` : '—'}</div>
          <div className="annot">{stats ? `${peakYear.count} shows` : 'loading…'}</div>
        </div>
      </div>

      <div className="section-head">
        <h3>Shows per year <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--rust)', marginLeft: 10 }}>1965 — 1995</span></h3>
        <div className="descr">peak year highlighted</div>
        <span className="meta">N = 2,333</span>
      </div>

      {!stats ? (
        <div className="skeleton-vault" style={{ height: 200 }} />
      ) : (
        <>
          <div className="barchart">
            {barData.map(d => (
              <Link
                key={d.year}
                href={`/shows/${d.year}`}
                className={`bbar${d.count === barMax && d.count > 0 ? ' peak' : ''}`}
                style={{ height: `${(d.count / barMax) * 100}%`, textDecoration: 'none', cursor: 'pointer', display: 'block' }}
                title={`${d.year}: ${d.count} shows`}
              >
                <span className="val">{d.count}</span>
              </Link>
            ))}
          </div>
          <div className="barchart-axis">
            <span>&#x2019;65</span><span>&#x2019;70</span><span>&#x2019;75</span>
            <span>&#x2019;80</span><span>&#x2019;85</span><span>&#x2019;90</span><span>&#x2019;95</span>
          </div>
          <div style={{ marginTop: 8, fontFamily: 'var(--serif-body)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-3)' }}>
            Peak — {peakYear.year}, {peakYear.count} shows. The longest stretches off-road came in 1975 (the studio year) and 1986 (Garcia&#x2019;s coma).
          </div>
        </>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 28, marginTop: 24 }}>
        {/* Donut — position breakdown with song search */}
        <div>
          <div className="section-head" style={{ marginTop: 0 }}>
            <h3>Position breakdown</h3>
            <div className="descr">{positionLoading ? 'loading…' : `${positionSong} — where it landed`}</div>
            <span className="meta">N = {positionTotal}</span>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
            <div style={{ paddingTop: 36 }}>
              <DonutChart positions={positionData} songLabel={positionSong} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Search bar — 250px, anchored to the top of the column */}
              <div style={{ position: 'relative', width: 250 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  border: '1.5px solid var(--gray)', borderRadius: 8,
                  padding: '5px 10px', background: 'var(--paper)',
                }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>⌕</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={songQuery}
                    onChange={e => handleQueryChange(e.target.value)}
                    onFocus={() => { if (suggestions.length > 0) setShowDropdown(true) }}
                    onKeyDown={handleKeyDown}
                    placeholder={positionSong}
                    style={{
                      border: 'none', outline: 'none', background: 'transparent',
                      fontFamily: 'var(--serif-body)', fontSize: 13, color: 'var(--ink)',
                      flex: 1, minWidth: 0,
                    }}
                  />
                  {positionLoading && (
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>…</span>
                  )}
                </div>
                {showDropdown && suggestions.length > 0 && (
                  <div
                    ref={dropdownRef}
                    style={{
                      position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0,
                      background: 'var(--paper)', border: '2px solid var(--ink)',
                      borderRadius: 8, zIndex: 50, overflow: 'hidden',
                      boxShadow: '4px 4px 0 var(--ink)',
                    }}
                  >
                    {suggestions.map((s, i) => (
                      <div
                        key={s.title}
                        onMouseDown={() => selectSong(s)}
                        onMouseEnter={() => setActiveIdx(i)}
                        style={{
                          padding: '7px 12px',
                          fontFamily: 'var(--serif-display)', fontSize: 14, color: 'var(--ink)',
                          cursor: 'pointer',
                          background: i === activeIdx ? 'var(--hi)' : 'transparent',
                          borderBottom: i < suggestions.length - 1 ? '1px solid var(--rule-soft)' : 'none',
                        }}
                      >
                        {s.displayTitle}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Legend — centered in remaining space below the search bar */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}>
                {positionData.map((p, i) => (
                  <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 14, height: 14, flexShrink: 0, background: COLORS[i] }} />
                    <span style={{ flex: 1, fontFamily: 'var(--serif-body)', fontSize: 15, color: 'var(--ink-2)' }}>{p.label}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--ink)', fontWeight: 600 }}>{p.count}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>· {p.pct}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div>
          <div className="section-head" style={{ marginTop: 0 }}>
            <h3>All-time leaderboard</h3>
            <div className="descr">top {leaderboard.length} most-played</div>
            <span className="meta">N=442 songs</span>
          </div>
          {!stats ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton-vault" style={{ height: 36 }} />
              ))}
            </div>
          ) : (
            <ul className="toptable">
              {leaderboard.slice(0, 12).map((entry, i) => (
                <li key={entry.name}>
                  <Link href={`/song/${encodeURIComponent(entry.name)}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <div className="row1">
                      <span className="rank">{i + 1}.</span>
                      <span style={{ fontFamily: 'var(--serif-display)', fontSize: 16 }}>{entry.name}</span>
                      <span className="plays">{entry.count}</span>
                    </div>
                    <div className="bar">
                      <div className="fill" style={{ width: `${(entry.count / leaderMax) * 100}%` }} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
