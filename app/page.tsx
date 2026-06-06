'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePlayer } from '@/lib/contexts/player-context'
import { TimelineStrip } from '@/components/ui/timeline-strip'
import { getVenueTidbit } from '@/lib/venue-tidbits'
import { formatDuration } from '@/lib/utils'

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
  segues?: boolean[]
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
  const { enqueueEntireShow, enqueueShowTrack, playShowTrack } = usePlayer()

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
  const [isEnqueuing, setIsEnqueuing] = useState(false)

  // Archive coverage: resolve the featured show's recording and compute which
  // setlist.fm songs have a matching track title in Archive.org.
  const [archiveIdentifier, setArchiveIdentifier] = useState<string | undefined>(undefined)
  const [archiveTracks, setArchiveTracks] = useState<Array<{ title?: string; url?: string; duration?: number }>>([])
  const [archiveLoaded, setArchiveLoaded] = useState(false)

  // Archive fetch runs after showDetail loads so we can pass totalSongs for smart selection.
  useEffect(() => {
    if (!featured?.date || !showDetail) return
    let cancelled = false
    setArchiveLoaded(false)
    setArchiveIdentifier(undefined)
    setArchiveTracks([])
    ;(async () => {
      try {
        const resolveRes = await fetch('/api/archive/resolve-show', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: featured.date,
            venue: featured.venue,
            city: featured.city,
            totalSongs: showDetail.totalSongs,
          }),
        })
        if (!resolveRes.ok || cancelled) return
        const archiveData = await resolveRes.json()
        setArchiveIdentifier(archiveData.identifier)

        const tracksRes = await fetch('/api/archive/song-tracks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: archiveData.identifier, songTitle: '' }),
        })
        if (cancelled) return
        const { tracks } = tracksRes.ok ? await tracksRes.json() : { tracks: [] }
        setArchiveTracks((tracks as Array<{ title?: string; url?: string; duration?: number }>).filter(t => t.url))
      } catch {} finally {
        if (!cancelled) setArchiveLoaded(true)
      }
    })()
    return () => { cancelled = true }
  }, [featured?.date, showDetail?.totalSongs])

  // Which flat song indices have a title match in the archive recording.
  // null = archive not yet loaded (show pending shimmer on rows).
  // Empty set = archive loaded, no title matches found.
  const archiveCoveredIndices = useMemo((): Set<number> | null => {
    if (!archiveLoaded || !showDetail) return null
    if (archiveTracks.length === 0) return new Set<number>()
    const titledTracks = archiveTracks.filter(t => t.title)
    if (titledTracks.length === 0) return new Set<number>()
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
    const covered = new Set<number>()
    let i = 0
    for (const set of showDetail.sets) {
      for (const song of set.songs) {
        const songNorm = norm(song)
        const found = titledTracks.some(t => {
          const titleNorm = norm(t.title ?? '')
          return titleNorm.includes(songNorm) || songNorm.includes(titleNorm)
        })
        if (found) covered.add(i)
        i++
      }
    }
    return covered
  }, [archiveTracks, archiveLoaded, showDetail])

  const archiveSegueIndices = useMemo((): Set<number> => {
    if (!showDetail || archiveTracks.length === 0) return new Set()
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
    const titledTracks = archiveTracks.filter(t => t.title)
    const segued = new Set<number>()
    let i = 0
    for (const set of showDetail.sets) {
      for (const song of set.songs) {
        const songNorm = norm(song)
        const matched = titledTracks.find(t => {
          const titleNorm = norm(t.title!)
          return titleNorm.includes(songNorm) || songNorm.includes(titleNorm)
        })
        if (matched?.title?.trim().endsWith('>')) segued.add(i)
        i++
      }
    }
    return segued
  }, [archiveTracks, showDetail])

  const archiveDurations = useMemo((): Map<number, number> => {
    if (!showDetail || archiveTracks.length === 0) return new Map()
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
    const titledTracks = archiveTracks.filter(t => t.title && t.duration)
    const durations = new Map<number, number>()
    let i = 0
    for (const set of showDetail.sets) {
      for (const song of set.songs) {
        const songNorm = norm(song)
        const matched = titledTracks.find(t => {
          const titleNorm = norm(t.title!)
          return titleNorm.includes(songNorm) || songNorm.includes(titleNorm)
        })
        if (matched?.duration) durations.set(i, matched.duration)
        i++
      }
    }
    return durations
  }, [archiveTracks, showDetail])

  const handlePlayShow = async (startFrom?: number) => {
    if (!featured) return
    setIsEnqueuing(true)
    try {
      const songs = showDetail?.sets.flatMap(s => s.songs) ?? featured.songs
      await enqueueEntireShow(
        { date: featured.date, venue: featured.venue, city: featured.city, identifier: archiveIdentifier },
        { clearExisting: true, songs, startFrom }
      )
    } catch {} finally {
      setIsEnqueuing(false)
    }
  }

  const handleAddToQueue = useCallback(async (e: React.MouseEvent, flatIdx: number) => {
    e.stopPropagation()
    if (!featured) return
    setFlashIdx(flatIdx)
    setQueuedSet(prev => new Set([...prev, flatIdx]))
    setTimeout(() => setFlashIdx(null), 700)
    try {
      const songs = showDetail?.sets.flatMap(s => s.songs) ?? featured.songs
      await enqueueShowTrack(
        { date: featured.date, venue: featured.venue, city: featured.city, identifier: archiveIdentifier },
        flatIdx,
        songs,
      )
    } catch {}
  }, [featured, showDetail, archiveIdentifier, enqueueShowTrack])

  const handlePlaySingleSong = useCallback(async (flatIdx: number) => {
    if (!featured) return
    setIsEnqueuing(true)
    try {
      const songs = showDetail?.sets.flatMap(s => s.songs) ?? featured.songs
      await playShowTrack(
        { date: featured.date, venue: featured.venue, city: featured.city, identifier: archiveIdentifier },
        flatIdx,
        songs,
      )
    } catch {} finally {
      setIsEnqueuing(false)
    }
  }, [featured, showDetail, archiveIdentifier, playShowTrack])

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

  const venueTidbit = featured ? getVenueTidbit(featured.venue, featured.city) : null

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
                <span style={{ fontSize: '0.75em' }}>
                  {weekday}, the {ordinal(dayNum)}{' '}
                  <span className="italic">of</span>{' '}
                  {monthName}
                </span>
                {' '}
                <span style={{ fontSize: '0.90em', color: 'var(--ink-3)', fontStyle: 'italic' }}>
                  {year}
                </span>
              </h2>

              <div className="venue-line">
                <strong>{venue}</strong>{location ? ` · ${location}` : ''}
              </div>

              {venueTidbit && (
                <div style={{ fontStyle: 'italic', fontSize: 13, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.55, maxWidth: 540 }}>
                  {venueTidbit}
                </div>
              )}

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
                  <button className="btn primary" onClick={() => handlePlayShow()} disabled={isEnqueuing} style={isEnqueuing ? { opacity: 0.7 } : undefined}>
                    <span className="play-tri">{isEnqueuing ? '…' : '▶'}</span> {isEnqueuing ? 'Loading…' : 'Play entire show'}
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
                    const pending = archiveCoveredIndices === null
                    const inArchive = !pending && archiveCoveredIndices!.has(globalNum)
                    const hasSegue = set.segues?.[ti] === true || archiveSegueIndices.has(globalNum)
                    return (
                      <div
                        key={`${si}-${ti}`}
                        className={`track${pending ? ' pending' : ''}`}
                        onClick={inArchive ? () => handlePlaySingleSong(globalNum) : undefined}
                        style={!inArchive && !pending ? { cursor: 'default', opacity: 0.4 } : undefined}
                      >
                        <span className="num">{String(globalNum + 1).padStart(2, '0')}</span>
                        <span className="play-dot" style={!inArchive && !pending ? { visibility: 'hidden' } : undefined}>▶</span>
                        <Link
                          href={`/song/${encodeURIComponent(song)}`}
                          className="title"
                          onClick={e => e.stopPropagation()}
                          style={{ textDecoration: 'none', display: 'block' }}
                        >
                          {song}{hasSegue && <span style={{ fontFamily: 'var(--mono)', fontSize: 16, color: 'var(--rust)', marginLeft: 8, fontWeight: 500 }}>→</span>}
                        </Link>
                        <Link
                          href={`/song/${encodeURIComponent(song)}`}
                          className="chev"
                          onClick={e => e.stopPropagation()}
                        >go to song ↗</Link>
                        <span className="dur">
                          {archiveDurations.has(globalNum) ? formatDuration(archiveDurations.get(globalNum)!) : ''}
                        </span>
                        {inArchive ? (
                          <button
                            className={`add-q${flashIdx === globalNum ? ' flash' : queuedSet.has(globalNum) ? ' queued' : ''}`}
                            title="Add to queue"
                            onClick={e => handleAddToQueue(e, globalNum)}
                          >+</button>
                        ) : (
                          <span style={{ width: 26, display: 'inline-block' }} />
                        )}
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
                <div key={i} className="track" onClick={() => handlePlaySingleSong(i)}>
                  <span className="num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="play-dot">▶</span>
                  <Link
                    href={`/song/${encodeURIComponent(song)}`}
                    className="title"
                    onClick={e => e.stopPropagation()}
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    {song}
                  </Link>
                  <Link
                    href={`/song/${encodeURIComponent(song)}`}
                    className="chev"
                    onClick={e => e.stopPropagation()}
                  >go to song ↗</Link>
                  <span className="dur" />
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

        {/* Recording mismatch warning for home page */}
        {archiveLoaded && archiveTracks.length > 0 && showDetail &&
          Math.abs(archiveTracks.length - showDetail.totalSongs) > 2 && (
          <div className="margin-note" style={{ marginTop: 8, borderColor: 'var(--rust)' }}>
            <span className="head" style={{ color: 'var(--rust)' }}>Recording note</span>
            The best available recording for this show has {archiveTracks.length} tracks;
            setlist.fm lists {showDetail.totalSongs} songs. Some songs may be missing from
            this tape.{' '}
            {featured && (
              <Link href={`/show/${featured.date}`} style={{ color: 'var(--rust)' }}>
                Open full setlist ↗
              </Link>
            )}{' '}
            to browse all available recordings and switch between them.
          </div>
        )}

        <div className="margin-note" style={{ marginTop: 8 }}>
          <span className="head">About this archive</span>
          Setlists from setlist.fm. Audio streamed from Archive.org from community-contributed
          soundboard and audience tapes.{archiveIdentifier ? <> Playing: <strong>{archiveIdentifier}</strong></> : ''}
          <br />
          {featured && (
            <Link href={`/show/${featured.date}`} style={{ color: 'var(--rust)' }}>
              Open full setlist ↗
            </Link>
          )}{' '}
          to browse all available recordings for this show and switch between them.
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
