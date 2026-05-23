'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePlayer } from '@/lib/contexts/player-context'
import { TimelineStrip } from '@/components/ui/timeline-strip'

interface ShowOnThisDay {
  date: string
  year: number
  venue: string
  city: string
  state?: string
  country: string
  songs: string[]
}

interface ShowSet {
  name: string
  encore: boolean
  songs: string[]
}

interface ShowDetail {
  date: string
  venue: string
  city: string
  state?: string
  country: string
  sets: ShowSet[]
  totalSongs: number
}

interface SummaryStats {
  totalShows: number
  uniqueSongs: number
  hoursArchived: number
  lastUpdated: number | null
}

interface MostPlayed {
  name: string
  count: number
  pct: number
}

function ordinal(n: number): string {
  const s = String(n)
  if (s.endsWith('11') || s.endsWith('12') || s.endsWith('13')) return s + 'th'
  if (s.endsWith('1')) return s + 'st'
  if (s.endsWith('2')) return s + 'nd'
  if (s.endsWith('3')) return s + 'rd'
  return s + 'th'
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const WEEKDAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export default function HomePage() {
  const [shows, setShows] = useState<ShowOnThisDay[]>([])
  const [showDetail, setShowDetail] = useState<ShowDetail | null>(null)
  const [kpi, setKpi] = useState<SummaryStats | null>(null)
  const [mostPlayed, setMostPlayed] = useState<MostPlayed[]>([])
  const [loading, setLoading] = useState(true)
  const { enqueueEntireShow, enqueueShowTrack } = usePlayer()

  // Fetch on-this-day shows
  useEffect(() => {
    fetch('/api/on-this-day')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setShows(data.shows ?? []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Fetch KPI summary
  useEffect(() => {
    fetch('/api/stats/summary')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setKpi(data) })
      .catch(() => {})
  }, [])

  // Fetch most-played leaderboard
  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.leaderboard) setMostPlayed(data.leaderboard.slice(0, 8)) })
      .catch(() => {})
  }, [])

  // Pick the best featured show
  const sortedShows = [...shows].sort((a, b) => {
    const score = (s: ShowOnThisDay) => (s.songs.length > 0 ? 100 : 0) + (s.year >= 1967 && s.year <= 1994 ? 50 : 0)
    if (score(b) !== score(a)) return score(b) - score(a)
    return Math.abs(a.year - 1977) - Math.abs(b.year - 1977)
  })
  const featured = sortedShows[0] ?? null

  // Fetch full setlist for featured show
  useEffect(() => {
    if (!featured?.date) return
    fetch(`/api/show?date=${featured.date}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setShowDetail(data) })
      .catch(() => {})
  }, [featured?.date])

  const [queuedSet, setQueuedSet] = useState<Set<number>>(new Set())
  const [flashIdx, setFlashIdx] = useState<number | null>(null)

  const handlePlayShow = async (startFrom?: number) => {
    if (!featured) return
    try {
      const songs = showDetail?.sets.flatMap(s => s.songs) ?? featured.songs
      await enqueueEntireShow(
        { date: featured.date, venue: featured.venue, city: featured.city },
        { clearExisting: true, songs, startFrom }
      )
    } catch {}
  }

  const handleAddToQueue = useCallback(async (e: React.MouseEvent, flatIdx: number) => {
    e.stopPropagation()
    if (!featured) return
    setFlashIdx(flatIdx)
    setQueuedSet(prev => new Set([...prev, flatIdx]))
    setTimeout(() => setFlashIdx(null), 700)
    try {
      const songs = showDetail?.sets.flatMap(s => s.songs) ?? featured.songs
      await enqueueShowTrack({ date: featured.date, venue: featured.venue, city: featured.city }, flatIdx, songs)
    } catch {}
  }, [featured, showDetail, enqueueShowTrack])

  // Format the featured date for the display — use today's calendar date for weekday/month/day
  const today = new Date()
  const weekday = WEEKDAY_NAMES[today.getDay()]
  const monthName = MONTH_NAMES[today.getMonth()]
  const dayNum = today.getDate()
  const year = featured?.year ?? 0
  const yearsAgo = new Date().getFullYear() - year
  const venue = featured?.venue ?? ''
  const location = featured
    ? `${featured.city}${featured.state ? `, ${featured.state}` : ''}`
    : ''

  const totalSongs = showDetail?.totalSongs ?? featured?.songs?.length ?? 0
  const opener = showDetail?.sets?.[0]?.songs?.[0] ?? featured?.songs?.[0] ?? ''
  const lastSet = showDetail?.sets ? [...showDetail.sets].reverse().find(s => !s.encore) : null
  const closer = lastSet?.songs?.slice(-1)[0] ?? ''

  // Format last updated
  const lastRefresh = kpi?.lastUpdated
    ? (() => {
        const m = Math.round((Date.now() - kpi.lastUpdated) / 60000)
        return m < 60 ? `${m}m ago` : `${Math.round(m / 60)}h ago`
      })()
    : '—'

  return (
    <>
      {/* Main content column */}
      <section className="col">
        <div className="gutter-label gutter-label-lg">
          <span>Featured · On This Day</span>
          <span className="mono">{year ? `PG. ${year}` : ''}</span>
        </div>

        <div className="feature">
          <span className="tag">
            <span className="pulse" />
            On this day · {yearsAgo > 0 ? `${yearsAgo} years gone` : 'today'}
          </span>

          {loading ? (
            <div className="skeleton-vault" style={{ height: 120, marginTop: 14 }} />
          ) : featured ? (
            <>
              <h2>
                <span style={{ fontSize: '0.88em' }}>
                  {weekday}, the {ordinal(dayNum)}{' '}
                  <span className="italic">of</span>{' '}
                  {monthName}
                </span>
                <br />
                <span style={{ fontSize: '0.85em', color: 'var(--ink-3)', fontStyle: 'italic' }}>
                  {year}
                </span>
              </h2>

              <div className="venue-line">
                <strong>{venue}</strong>{location ? ` · ${location}` : ''}
              </div>

              <div className="meta-row">
                {totalSongs > 0 && (
                  <div className="item">Tracks<strong>{totalSongs}</strong></div>
                )}
                {opener && (
                  <div className="item rust">
                    Opener<strong style={{ fontSize: 19 }}>{opener}</strong>
                  </div>
                )}
                {closer && closer !== opener && (
                  <div className="item">
                    Closer<strong style={{ fontSize: 19 }}>{closer}</strong>
                  </div>
                )}
                <div className="actions">
                  <button className="btn primary" onClick={() => handlePlayShow()}>
                    <span className="play-tri">▶</span> Play entire show
                  </button>
                  <Link href={`/show/${featured.date}`} className="btn ghost">
                    Open setlist ↗
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: '22px 0', color: 'var(--ink-3)', fontStyle: 'italic' }}>
              No shows found for today&apos;s date in the archive.
            </div>
          )}
        </div>

        {/* Timeline strip */}
        {showDetail && showDetail.sets.length > 0 && (
          <TimelineStrip
            sets={showDetail.sets}
            showDate={featured?.date ?? ''}
            onPlayFrom={handlePlayShow}
          />
        )}

        {/* Setlist from the show detail */}
        {showDetail && showDetail.sets.length > 0 && (
          <div className="setlist">
            {showDetail.sets.map((set, si) => {
              const romanNumerals = ['I', 'II', 'III', 'IV', 'E.']
              const isEncore = set.encore
              const roman = isEncore ? 'E.' : romanNumerals[si] ?? String(si + 1)
              return (
                <div key={set.name} className={`set-block${si === 1 ? ' alt' : ''}`}>
                  <div className="set-head">
                    <h3>
                      <span className="roman">{roman}</span>
                      {set.name}
                    </h3>
                    <div className="duration">{set.songs.length} songs</div>
                  </div>
                  {set.songs.map((song, ti) => {
                    const globalNum = showDetail.sets.slice(0, si).reduce((n, s) => n + s.songs.length, ti)
                    return (
                      <div
                        key={`${si}-${ti}`}
                        className="track"
                        onClick={() => handlePlayShow(globalNum)}
                      >
                        <span className="num">{String(globalNum + 1).padStart(2, '0')}</span>
                        <span className="play-dot">▶</span>
                        <span className="title">{song}</span>
                        <span className="chev">→</span>
                        <button
                          className={`add-q${flashIdx === globalNum ? ' flash' : queuedSet.has(globalNum) ? ' queued' : ''}`}
                          title="Add to queue"
                          onClick={e => handleAddToQueue(e, globalNum)}
                        >+</button>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        {/* Fallback: song list from on-this-day when no detail */}
        {!showDetail && featured && featured.songs.length > 0 && (
          <div className="setlist">
            <div className="set-block">
              <div className="set-head">
                <h3><span className="roman">—</span>Setlist</h3>
                <div className="duration">{featured.songs.length} songs</div>
              </div>
              {featured.songs.map((song, i) => (
                <div key={i} className="track" onClick={() => handlePlayShow(i)}>
                  <span className="num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="play-dot">▶</span>
                  <span className="title">{song}</span>
                  <span className="chev">→</span>
                  <button
                    className={`add-q${flashIdx === i ? ' flash' : queuedSet.has(i) ? ' queued' : ''}`}
                    title="Add to queue"
                    onClick={e => handleAddToQueue(e, i)}
                  >+</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="margin-note" style={{ marginTop: 18 }}>
          <span className="head">About this archive</span>
          Setlists sourced from setlist.fm. Audio streams from the Internet Archive (archive.org).
          Click any track or &ldquo;Play entire show&rdquo; to load the tape.
        </div>
      </section>

      {/* Right ledger column */}
      <aside className="col right-col">
        {/* Stats hero */}
        <div className="gutter-label">
          <span>The Ledger · Stats</span>
          <span className="mono">MMXXVI</span>
        </div>
        <div className="ledger-hero">
          <div className="cell">
            <div className="label">Shows Indexed</div>
            <div className="val">{kpi?.totalShows?.toLocaleString() ?? '—'}</div>
            <div className="annot">from setlist.fm</div>
          </div>
          <div className="cell">
            <div className="label">Hours Archived</div>
            <div className="val rust">{kpi?.hoursArchived?.toLocaleString() ?? '—'}</div>
            <div className="annot">est. at 2.7h / show</div>
          </div>
        </div>
        <ul className="ledger">
          <li>
            <div className="label">Unique Songs<span className="annot">GD catalog</span></div>
            <div className="val forest">{kpi?.uniqueSongs?.toLocaleString() ?? '—'}</div>
          </li>
          <li>
            <div className="label">Last Refresh<span className="annot">auto-refreshes daily</span></div>
            <div className="val" style={{ fontSize: 14 }}>{lastRefresh}</div>
          </li>
        </ul>

        {/* Most played */}
        {mostPlayed.length > 0 && (
          <>
            <div className="gutter-label" style={{ marginTop: 18 }}>
              <span>Most Played · All-Time</span>
              <span className="mono">N={kpi?.totalShows?.toLocaleString() ?? '—'}</span>
            </div>
            <ul className="toptable">
              {mostPlayed.map((m, i) => (
                <li key={m.name}>
                  <Link href={`/song/${encodeURIComponent(m.name)}`} style={{ textDecoration: 'none' }}>
                    <div className="row1">
                      <span className="rank">{String(i + 1).padStart(2, '0')}.</span>
                      <span>{m.name}</span>
                      <span className="plays">{m.count}</span>
                    </div>
                    <div className="bar">
                      <div className="fill" style={{ width: `${m.pct}%` }} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Also on this day */}
        {shows.length > 1 && (
          <>
            <div className="gutter-label" style={{ marginTop: 18 }}>
              <span>Also On This Day</span>
              <span className="mono">{shows.length} SHOWS</span>
            </div>
            <ul className="alsolist">
              {shows.slice(0, 6).map(show => (
                <li key={show.date}>
                  <Link href={`/show/${show.date}`} style={{ display: 'contents' }}>
                    <span className="yr">{show.year}</span>
                    <span className="where">
                      {show.venue}
                      <span className="city">{show.city}{show.state ? `, ${show.state}` : ''}</span>
                    </span>
                    <span className="ext">↗</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="cartouche">
          <div className="quote">If you get confused, just listen to the music play.</div>
          <div className="cite">— Franklin&apos;s Tower, R. Hunter</div>
        </div>
      </aside>
    </>
  )
}
