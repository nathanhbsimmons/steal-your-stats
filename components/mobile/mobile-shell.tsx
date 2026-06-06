'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CANONICAL_SONG_COUNT } from '@/lib/ids'
import { usePlayer } from '@/lib/contexts/player-context'
import { getVenueTidbit } from '@/lib/venue-tidbits'

/* ------------------------------------------------------------------ types */

interface ShowOnThisDay {
  date: string; year: number; venue: string; city: string; state?: string; country: string; songs: string[]
}
interface ShowSet { name: string; encore: boolean; songs: string[] }
interface ShowDetail { date: string; venue: string; city: string; state?: string; country: string; sets: ShowSet[]; totalSongs: number }
interface SongEntry { title: string; displayTitle: string; aliases: string[] }
interface SongFacts { totalPerformances: number; first: { date: string; venue: string; city: string } | null; last: { date: string; venue: string; city: string } | null }
interface VersionTrack { id: string; showDate: string; venue: string; city: string; state?: string; country: string; durationSec?: number }
interface VersionsFacts { tracks: VersionTrack[]; extremes?: { longest?: VersionTrack; shortest?: VersionTrack }; songTitle: string }
interface SummaryStats { totalShows?: number; uniqueSongs?: number; hoursArchived?: number }
interface LeaderEntry { name: string; count: number; pct: number }
interface GlobalStats { leaderboard: LeaderEntry[] }
type ArchiveTrack = { title?: string; url?: string; duration?: number }

/* ---------------------------------------------------------------- helpers */

function formatDur(sec?: number): string {
  if (!sec) return '—'
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function fmtDate(iso: string): string {
  return iso.replace(/-/g, '·')
}

function formatFullDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day))
  const dayOfWeek = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d.getUTCDay()]
  const monthName = ['January','February','March','April','May','June','July','August','September','October','November','December'][d.getUTCMonth()]
  const ord = (n: number) => {
    if (n >= 11 && n <= 13) return `${n}th`
    const r = n % 10
    return `${n}${r === 1 ? 'st' : r === 2 ? 'nd' : r === 3 ? 'rd' : 'th'}`
  }
  return `${dayOfWeek}, ${monthName} ${ord(day)}, ${year}`
}

function shortDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month - 1]
  return `${m} ${day}, ${year}`
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

/* -------------------------------------------------------------- era donut */

const ERAS = [
  { label: 'Pigpen', years: "'65–'72", pct: 0.24, color: 'var(--rust)' },
  { label: 'Keith & Donna', years: "'72–'79", pct: 0.22, color: 'var(--forest)' },
  { label: 'Brent Years', years: "'79–'90", pct: 0.31, color: 'var(--ledger-blue)' },
  { label: 'Final Chapter', years: "'90–'95", pct: 0.14, color: 'var(--ink-2)' },
  { label: 'Reunions', years: "'95+", pct: 0.09, color: 'var(--ink-4)' },
]

function EraDonut() {
  const r = 46, C = 2 * Math.PI * r
  let cum = 0
  const segs = ERAS.map(era => {
    const len = era.pct * C
    const seg = { ...era, len, offset: cum }
    cum += len
    return seg
  })
  return (
    <svg viewBox="-60 -60 120 120" width="120" height="120" style={{ display: 'block' }}>
      <g transform="rotate(-90)">
        {segs.map((seg, i) => (
          <circle key={i} cx="0" cy="0" r={r} fill="none"
            stroke={seg.color} strokeWidth="14"
            strokeDasharray={`${seg.len} ${C - seg.len}`}
            strokeDashoffset={-seg.offset}
          />
        ))}
        <circle cx="0" cy="0" r="28" fill="var(--paper)" />
      </g>
    </svg>
  )
}

/* ------------------------------------------------------------- active tab */

function getActiveTab(pathname: string): string {
  if (pathname === '/' || pathname.startsWith('/show')) return 'deck'
  if (pathname.startsWith('/songs') || pathname.startsWith('/song')) return 'songs'
  if (pathname.startsWith('/stats')) return 'stats'
  if (pathname.startsWith('/search')) return 'search'
  return 'deck'
}

/* --------------------------------------------------------------- tab bar */

function MobileTabBar({ pathname }: { pathname: string }) {
  const router = useRouter()
  const active = getActiveTab(pathname)
  const tabs = [
    { id: 'deck', num: 'I', label: 'Deck', href: '/' },
    { id: 'songs', num: 'II', label: 'Songs', href: '/songs' },
    { id: 'stats', num: 'III', label: 'Stats', href: '/stats' },
    { id: 'search', num: 'IV', label: 'Search', href: '/search' },
  ]
  return (
    <div className="mv-tabs" role="navigation" aria-label="Main navigation">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`mv-tab${active === tab.id ? ' active' : ''}`}
          onClick={() => router.push(tab.href)}
          aria-current={active === tab.id ? 'page' : undefined}
        >
          <span className="num">{tab.num}</span>
          <span className="lab">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

/* ---------------------------------------------------------- chapter strip */

function chapterMeta(pathname: string, songTitle?: string): { left: React.ReactNode; right: string } {
  if (pathname === '/') return {
    left: <><span className="num">I.</span> THE DECK · NOW PLAYING</>,
    right: '0001',
  }
  if (pathname.startsWith('/song/') && songTitle) return {
    left: <><span className="num">II·a</span> SONGS › DETAIL</>,
    right: '0214 / 2333',
  }
  if (pathname.startsWith('/songs')) return {
    left: <><span className="num">II.</span> SONGS · CATALOG</>,
    right: String(CANONICAL_SONG_COUNT),
  }
  if (pathname.startsWith('/stats')) return {
    left: <><span className="num">III.</span> STATS · ALMANAC</>,
    right: '1842 / 2333',
  }
  if (pathname.startsWith('/search')) return {
    left: <><span className="num">IV.</span> SEARCH · CATALOG</>,
    right: '2333',
  }
  if (pathname.startsWith('/show/')) return {
    left: <><span className="num">I·a</span> THE DECK · SETLIST</>,
    right: '0001',
  }
  return { left: <><span className="num">I.</span> THE VAULT</>, right: '0001' }
}

function MobileChapter({ pathname, songTitle }: { pathname: string; songTitle?: string }) {
  const router = useRouter()
  const { left, right } = chapterMeta(pathname, songTitle)
  const isDetail = pathname.startsWith('/song/') || pathname.startsWith('/show/')
  return (
    <div className="mv-chapter">
      <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
        {isDetail && (
          <button
            className="mv-back"
            onClick={() => router.back()}
            aria-label="Go back"
          >
            ← Back
          </button>
        )}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{left}</span>
      </span>
      <span className="pg">{right}</span>
    </div>
  )
}

/* ------------------------------------------------------------- masthead */

function MobileMast() {
  const [weather, setWeather] = useState<{ temp: number | null; label: string | null } | null>(null)

  useEffect(() => {
    fetch('/api/weather')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setWeather(d) })
      .catch(() => {})
  }, [])

  const weatherStr = weather?.temp != null && weather?.label
    ? `${weather.temp}°F · ${weather.label}`
    : null

  return (
    <div className="mv-mast">
      {weatherStr && <div className="mv-mast-weather">{weatherStr}</div>}
      <h1>Steal<span className="amp">your</span>Stats</h1>
      <div className="sub">
        The <span className="bl">Dead</span> Archive · <em>by hand, through the deck</em>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- mini player */

function MobileMini() {
  const { currentTrack, isPlaying, play, pause, next } = usePlayer()
  if (!currentTrack) return null
  const dateStr = currentTrack.showDate ?? ''
  const venueStr = [currentTrack.venue, currentTrack.city].filter(Boolean).join(' · ').toUpperCase()
  return (
    <div className={`mv-mini${!isPlaying ? ' paused' : ''}`} role="status" aria-live="polite">
      <div className="stamp" aria-hidden="true" />
      <div className="meta">
        <div className="title">{currentTrack.name}</div>
        <div className="sub">{dateStr}{venueStr ? ` · ${venueStr}` : ''}</div>
      </div>
      <button className="next" onClick={next} aria-label="Skip to next track">▶▶</button>
      <button className="pp" onClick={isPlaying ? pause : play} aria-label={isPlaying ? 'Pause' : 'Play'}>
        {isPlaying ? '❚❚' : '▶'}
      </button>
      <div className="hair" style={{ width: '0%' }} aria-hidden="true" />
    </div>
  )
}

/* ============================================================ DECK SCREEN */

function DeckScreen() {
  const { currentTrack, isPlaying, queue, play, pause, next, previous, enqueueEntireShow, playShowTrack } = usePlayer()

  const [featured, setFeatured] = useState<ShowOnThisDay | null>(null)
  const [showDetail, setShowDetail] = useState<ShowDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [archiveDurations, setArchiveDurations] = useState<Map<number, number>>(new Map())

  const displayDate = currentTrack?.showDate ?? featured?.date ?? null

  useEffect(() => {
    fetch('/api/on-this-day')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.shows?.length) {
          const sorted = [...data.shows].sort((a: ShowOnThisDay, b: ShowOnThisDay) => {
            const score = (s: ShowOnThisDay) => (s.songs.length > 0 ? 100 : 0) + (s.year >= 1967 && s.year <= 1994 ? 50 : 0)
            if (score(b) !== score(a)) return score(b) - score(a)
            return Math.abs(a.year - 1977) - Math.abs(b.year - 1977)
          })
          setFeatured(sorted[0])
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!displayDate) return
    fetch(`/api/show?date=${displayDate}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setShowDetail(data) })
      .catch(() => {})
  }, [displayDate])

  // Fetch archive track durations
  useEffect(() => {
    if (!displayDate || !showDetail) return
    let cancelled = false
    setArchiveDurations(new Map())
    ;(async () => {
      try {
        const resolveRes = await fetch('/api/archive/resolve-show', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: displayDate,
            venue: featured?.venue,
            city: featured?.city,
            totalSongs: showDetail.totalSongs,
          }),
        })
        if (!resolveRes.ok || cancelled) return
        const { identifier } = await resolveRes.json()
        if (!identifier || cancelled) return

        const tracksRes = await fetch('/api/archive/song-tracks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: identifier, songTitle: '' }),
        })
        if (cancelled) return
        const { tracks } = tracksRes.ok ? await tracksRes.json() : { tracks: [] }
        const allSongs = showDetail.sets.flatMap(s => s.songs)
        const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
        const durMap = new Map<number, number>()
        for (const t of (tracks as ArchiveTrack[])) {
          if (!t.title || !t.duration || !t.url) continue
          const tn = norm(t.title)
          if (!tn) continue
          for (let i = 0; i < allSongs.length; i++) {
            const sn = norm(allSongs[i])
            if (sn && (sn.includes(tn) || tn.includes(sn)) && !durMap.has(i)) {
              durMap.set(i, t.duration)
            }
          }
        }
        if (!cancelled) setArchiveDurations(durMap)
      } catch {}
    })()
    return () => { cancelled = true }
  }, [displayDate, showDetail?.totalSongs])

  const [audioTime, setAudioTime] = useState({ currentTime: 0, duration: 0 })
  useEffect(() => {
    const handler = (e: Event) => {
      const { currentTime, duration } = (e as CustomEvent<{ currentTime: number; duration: number }>).detail
      setAudioTime({ currentTime, duration })
    }
    window.addEventListener('vault-time-update', handler)
    return () => window.removeEventListener('vault-time-update', handler)
  }, [])

  const progressBarRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const bar = progressBarRef.current
    if (!bar) return
    const onTouch = (e: TouchEvent) => {
      e.preventDefault()
      const rect = bar.getBoundingClientRect()
      const t = e.touches[0] ?? e.changedTouches[0]
      if (!t) return
      const fraction = Math.max(0, Math.min(1, (t.clientX - rect.left) / rect.width))
      window.dispatchEvent(new CustomEvent('vault-seek-to-fraction', { detail: { fraction } }))
    }
    bar.addEventListener('touchstart', onTouch, { passive: false })
    bar.addEventListener('touchmove', onTouch, { passive: false })
    return () => {
      bar.removeEventListener('touchstart', onTouch)
      bar.removeEventListener('touchmove', onTouch)
    }
  }, [])

  const handleBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    window.dispatchEvent(new CustomEvent('vault-seek-to-fraction', { detail: { fraction } }))
  }, [])

  const handlePlay = useCallback(async () => {
    const show = currentTrack
      ? { date: currentTrack.showDate!, venue: currentTrack.venue!, city: currentTrack.city! }
      : featured ? { date: featured.date, venue: featured.venue, city: featured.city } : null
    if (!show) return
    if (isPlaying) { pause(); return }
    if (currentTrack?.showDate === show.date) { play(); return }
    const songs = showDetail?.sets.flatMap(s => s.songs) ?? featured?.songs
    try { await enqueueEntireShow(show, { clearExisting: true, songs }) } catch {}
  }, [currentTrack, featured, showDetail, isPlaying, play, pause, enqueueEntireShow])

  const handleTrackClick = useCallback(async (flatIdx: number) => {
    const show = currentTrack
      ? { date: currentTrack.showDate!, venue: currentTrack.venue!, city: currentTrack.city! }
      : featured ? { date: featured.date, venue: featured.venue, city: featured.city } : null
    if (!show) return
    const songs = showDetail?.sets.flatMap(s => s.songs) ?? featured?.songs
    try { await playShowTrack(show, flatIdx, songs) } catch {}
  }, [currentTrack, featured, showDetail, playShowTrack])

  const displayShow = showDetail ?? featured
  const displayVenue = currentTrack?.venue ?? featured?.venue ?? ''
  const displayCity = currentTrack?.city ?? (featured ? `${featured.city}${featured.state ? `, ${featured.state}` : ''}` : '')
  const subLine = [displayDate ? shortDate(displayDate) : '', displayVenue, displayCity].filter(Boolean).join(' · ')
  const venueTidbit = featured ? getVenueTidbit(featured.venue, featured.city) : null

  const currentSongName = currentTrack?.name ?? null
  const totalTracks = queue.length
  const isPlaying_ = isPlaying && !!currentTrack
  const playerActive = !!currentTrack || queue.length > 0

  return (
    <>
      {!playerActive ? (
        /* Pre-play state: show info + Play Show button */
        <div className="mv-preplay">
          {loading ? (
            <div style={{ height: 80 }} />
          ) : displayShow ? (
            <>
              {displayDate && <div className="mv-preplay-date">{formatFullDate(displayDate)}</div>}
              {displayVenue && <div className="mv-preplay-venue">{displayVenue}</div>}
              {displayCity && <div className="mv-preplay-city">{displayCity}</div>}
              {venueTidbit && <div className="mv-preplay-tidbit">{venueTidbit}</div>}
              {displayDate && (
                <button className="mv-play-show-btn" onClick={handlePlay}>▶ Play Show</button>
              )}
            </>
          ) : (
            <div style={{ fontSize: 18, color: 'var(--ink-3)', fontStyle: 'italic', fontFamily: 'var(--serif-body)' }}>
              No show for today&apos;s date.
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Reel hero */}
          <div className="mv-deck-hero">
            <div className={`mv-reel${!isPlaying_ ? ' paused' : ''}`} aria-label="Reel-to-reel player">
              <div className="spokes" aria-hidden="true">
                <span style={{ transform: 'translateX(-50%) rotate(0deg)' }} />
                <span style={{ transform: 'translateX(-50%) rotate(120deg)' }} />
                <span style={{ transform: 'translateX(-50%) rotate(240deg)' }} />
              </div>
              <div className="hub">A · 01</div>
            </div>

            {loading ? (
              <div style={{ height: 60 }} />
            ) : displayShow ? (
              <>
                <div className="mv-now-title">
                  {currentTrack?.name ?? (featured?.songs?.[0] ?? (displayShow as ShowDetail).sets?.[0]?.songs?.[0] ?? 'No track loaded')}
                </div>
                <div className="mv-now-sub">{subLine}</div>
              </>
            ) : (
              <div className="mv-now-title" style={{ fontSize: 18, color: 'var(--ink-3)', fontStyle: 'italic' }}>
                No show for today&apos;s date.
              </div>
            )}
          </div>

          {/* Transport */}
          <div className="mv-transport">
            <div className="mv-progress">
              <span className="t">{formatDur(audioTime.currentTime)}</span>
              <div
                ref={progressBarRef}
                className="mv-bar"
                onClick={handleBarClick}
                role="slider"
                aria-label="Seek"
                aria-valuenow={Math.round(audioTime.currentTime)}
                aria-valuemin={0}
                aria-valuemax={Math.round(audioTime.duration)}
                style={{ cursor: 'pointer' }}
              >
                <div className="rule" />
                <div className="ticks">
                  {Array.from({ length: 11 }).map((_, i) => <span key={i} />)}
                </div>
                <div className="fill" style={{ width: `${audioTime.duration > 0 ? (audioTime.currentTime / audioTime.duration) * 100 : 0}%` }} />
                <div className="needle" style={{ left: `${audioTime.duration > 0 ? (audioTime.currentTime / audioTime.duration) * 100 : 0}%` }} />
              </div>
              <span className="t right">
                {audioTime.duration > 0 ? formatDur(audioTime.duration) : currentTrack?.duration ? formatDur(currentTrack.duration) : '—'}
              </span>
            </div>
            <div className="mv-ctrls">
              <button className="mv-iconbtn ghost" onClick={previous} aria-label="Previous track">◀◀</button>
              <button className="mv-iconbtn ghost" aria-label="Skip back 10 seconds" onClick={() => window.dispatchEvent(new CustomEvent('vault-seek-by', { detail: { seconds: -10 } }))}>−10</button>
              <button className="mv-iconbtn play" onClick={handlePlay} aria-label={isPlaying_ ? 'Pause' : 'Play'}>
                {isPlaying_ ? '❚❚' : '▶'}
              </button>
              <button className="mv-iconbtn ghost" aria-label="Skip forward 10 seconds" onClick={() => window.dispatchEvent(new CustomEvent('vault-seek-by', { detail: { seconds: 10 } }))}>+10</button>
              <button className="mv-iconbtn ghost" onClick={next} aria-label="Next track">▶▶</button>
            </div>
          </div>

          {/* Status row */}
          <div className="mv-status">
            <span className="lit">
              {isPlaying_ ? (
                <><span className="dot" aria-hidden="true" />{totalTracks === 1 ? 'playing · 1 track' : `playing entire show · ${totalTracks} tracks`}</>
              ) : totalTracks > 0 ? (
                `cued · ${totalTracks} tracks`
              ) : (
                'standby · no queue'
              )}
            </span>
            {currentTrack?.showDate && (
              <Link href={`/show/${currentTrack.showDate}`} style={{ color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>
                open setlist ↗
              </Link>
            )}
          </div>
        </>
      )}

      {/* Setlist */}
      {showDetail && showDetail.sets.length > 0 && (
        <div className="mv-setlist">
          {showDetail.sets.map((set, si) => {
            const isEncore = set.encore
            const roman = isEncore ? 'E.' : (ROMAN[si] ?? String(si + 1))
            return (
              <div key={set.name}>
                <div className="mv-set-head">
                  <span className="name"><span style={{ color: 'var(--rust)', fontFamily: 'var(--mono)', fontSize: 14, marginRight: 6 }}>{roman}</span>{set.name}</span>
                  <span className="meta">{set.songs.length} tracks</span>
                </div>
                {set.songs.map((song, ti) => {
                  const flatIdx = showDetail.sets.slice(0, si).reduce((n, s) => n + s.songs.length, ti)
                  const isCurrent = currentSongName === song && currentTrack?.showDate === showDetail.date
                  const dur = archiveDurations.get(flatIdx)
                  return (
                    <div
                      key={`${si}-${ti}`}
                      className={`mv-track${isCurrent ? ' current' : ''}`}
                      onClick={() => handleTrackClick(flatIdx)}
                      role="button"
                      aria-label={`Play ${song}`}
                    >
                      <span className="n">{String(flatIdx + 1).padStart(2, '0')}</span>
                      <span className="title">{song}</span>
                      <span className="dur">{dur ? formatDur(dur) : '—'}</span>
                      <span className="pin">❡</span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {featured && (
        <div className="mv-setlist" style={{ paddingTop: 0 }}>
          <div className="mv-divider"><span className="glyph">❦</span></div>
        </div>
      )}
    </>
  )
}

/* ============================================================ SONGS SCREEN */

function SongsScreen() {
  const [songs, setSongs] = useState<SongEntry[]>([])
  const [playCounts, setPlayCounts] = useState<Record<string, number>>({})
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLoading(true)
    const params = query ? `?q=${encodeURIComponent(query)}` : ''
    fetch(`/api/songs${params}`)
      .then(r => r.json())
      .then(d => setSongs(d.songs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [query])

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(d => {
        const counts: Record<string, number> = {}
        for (const e of d.leaderboard ?? []) counts[e.name.toLowerCase()] = e.count
        setPlayCounts(counts)
      })
      .catch(() => {})
  }, [])

  const grouped = new Map<string, SongEntry[]>()
  for (const s of songs) {
    const letter = s.title.charAt(0).toUpperCase()
    if (!grouped.has(letter)) grouped.set(letter, [])
    grouped.get(letter)!.push(s)
  }
  const letters = Array.from(grouped.keys()).sort()

  return (
    <>
      <div className="mv-search">
        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink-3)' }}>⌕</span>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="search songs…"
          aria-label="Search songs"
        />
        <span className="kbd">{songs.length}</span>
      </div>

      {loading ? (
        <div style={{ padding: '20px 18px', color: 'var(--ink-3)', fontStyle: 'italic', fontFamily: 'var(--serif-body)' }}>
          Loading catalog…
        </div>
      ) : query ? (
        songs.map(s => (
          <Link
            key={s.title}
            href={`/song/${encodeURIComponent(s.displayTitle)}`}
            className="mv-song-row"
            style={{ display: 'grid', textDecoration: 'none' }}
          >
            <span className="title">{s.displayTitle}</span>
            <span className="plays">{playCounts[s.title.toLowerCase()] ? `${playCounts[s.title.toLowerCase()]}×` : ''}</span>
            <span className="chev">›</span>
          </Link>
        ))
      ) : (
        letters.map(letter => {
          const group = grouped.get(letter) ?? []
          const first = group[0]?.displayTitle ?? ''
          const last = group[group.length - 1]?.displayTitle ?? ''
          return (
            <div key={letter}>
              <div className="mv-alpha-head">
                <span className="letter">{letter}</span>
                <span className="count">{group.length} · {first} → {last}</span>
              </div>
              {group.map(s => (
                <Link
                  key={s.title}
                  href={`/song/${encodeURIComponent(s.displayTitle)}`}
                  className="mv-song-row"
                  style={{ display: 'grid', textDecoration: 'none' }}
                >
                  <span className="title">{s.displayTitle}</span>
                  <span className="plays">{playCounts[s.title.toLowerCase()] ? `${playCounts[s.title.toLowerCase()]}×` : ''}</span>
                  <span className="chev">›</span>
                </Link>
              ))}
            </div>
          )
        })
      )}
      <div className="mv-divider" style={{ paddingBottom: 8 }}><span className="glyph">❦</span></div>
    </>
  )
}

/* ========================================================= SONG DETAIL SCREEN */

function SongDetailScreen({ slug }: { slug: string }) {
  const router = useRouter()
  const [facts, setFacts] = useState<SongFacts | null>(null)
  const [versions, setVersions] = useState<VersionsFacts | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setFacts(null)
    setVersions(null)
    Promise.all([
      fetch(`/api/song-facts?songTitle=${encodeURIComponent(slug)}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/versions?songTitle=${encodeURIComponent(slug)}`).then(r => r.ok ? r.json() : null),
    ]).then(([f, v]) => {
      if (f) setFacts(f)
      if (v) setVersions(v)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [slug])

  const [showAllVersions, setShowAllVersions] = useState(false)
  const shortest = versions?.extremes?.shortest
  const longest = versions?.extremes?.longest
  const allVersions = versions?.tracks ?? []
  const VERSIONS_LIMIT = 12
  const displayedVersions = showAllVersions ? allVersions : allVersions.slice(0, VERSIONS_LIMIT)

  return (
    <>
      <div className="mv-song-hero">
        <div className="kicker">CATALOG · {facts?.totalPerformances ? `${facts.totalPerformances} PERFORMANCES` : 'SONG DETAIL'}</div>
        <h2>{slug}</h2>
        <div className="byline">
          {loading ? 'Loading…' : facts?.first ? (
            <>First played {fmtDate(facts.first.date)} · {facts.first.venue}, {facts.first.city}</>
          ) : 'No performance data found.'}
        </div>
      </div>

      {facts && (
        <div className="mv-kpi-row">
          <div className="mv-kpi">
            <div className="lab">Times Played</div>
            <div className="val">{facts.totalPerformances}</div>
          </div>
          <div className="mv-kpi">
            <div className="lab">First</div>
            <div className={`val${facts.first ? ' small' : ''}`}>
              {facts.first ? fmtDate(facts.first.date.slice(0, 7)) : '—'}
            </div>
          </div>
          <div className="mv-kpi">
            <div className="lab">Last</div>
            <div className={`val${facts.last ? ' small' : ''}`}>
              {facts.last ? fmtDate(facts.last.date.slice(0, 7)) : '—'}
            </div>
          </div>
        </div>
      )}

      {(shortest || longest) && (
        <div className="mv-extremes">
          <div className="mv-extreme">
            <div className="lab">Shortest</div>
            <div className="dur">{formatDur(shortest?.durationSec)}</div>
            {shortest && <div className="when">{fmtDate(shortest.showDate)}</div>}
          </div>
          <div className="mv-extreme">
            <div className="lab">Longest</div>
            <div className="dur">{formatDur(longest?.durationSec)}</div>
            {longest && <div className="when">{fmtDate(longest.showDate)}</div>}
          </div>
        </div>
      )}

      {displayedVersions.length > 0 && (
        <>
          <div className="mv-sec">
            <span className="name">Versions</span>
            <span className="more">{displayedVersions.length} / {allVersions.length} ›</span>
          </div>
          {displayedVersions.map(v => (
            <div
              key={v.id}
              className="mv-version"
              onClick={() => router.push(`/show/${v.showDate}`)}
              role="button"
              aria-label={`Show from ${v.showDate}`}
            >
              <span className="date">{fmtDate(v.showDate)}</span>
              <span className="ven">
                {v.venue}
                <span className="city">{v.city}{v.state ? `, ${v.state}` : ''}</span>
              </span>
              <span className="dur">{formatDur(v.durationSec)}</span>
            </div>
          ))}
          {!showAllVersions && allVersions.length > VERSIONS_LIMIT && (
            <button
              className="mv-load-more"
              onClick={() => setShowAllVersions(true)}
            >
              Show all {allVersions.length} versions ↓
            </button>
          )}
        </>
      )}

      <div className="mv-setlist" style={{ paddingTop: 8 }}>
        <div className="mv-note">
          All performance data sourced from setlist.fm. Durations from Internet Archive recordings where available.
        </div>
        <div className="mv-divider"><span className="glyph">❦</span></div>
      </div>
    </>
  )
}

/* ============================================================ STATS SCREEN */

function StatsScreen() {
  const [summary, setSummary] = useState<SummaryStats | null>(null)
  const [stats, setStats] = useState<GlobalStats | null>(null)

  useEffect(() => {
    fetch('/api/stats/summary').then(r => r.ok ? r.json() : null).then(d => { if (d) setSummary(d) }).catch(() => {})
    fetch('/api/stats').then(r => r.ok ? r.json() : null).then(d => { if (d) setStats(d) }).catch(() => {})
  }, [])

  const leaderboard = stats?.leaderboard ?? []
  const leaderMax = leaderboard[0]?.count ?? 1
  const totalShows = summary?.totalShows ?? 2333
  const uniqueSongs = summary?.uniqueSongs ?? 442
  const hoursArchived = summary?.hoursArchived

  return (
    <>
      <div className="mv-bigfig">
        <div className="num">{totalShows.toLocaleString()}</div>
        <div className="lab">
          documented shows between <strong>1965</strong> and <strong>1995</strong>
        </div>
      </div>

      <div className="mv-kpi-quad">
        <div className="cell">
          <div className="lab">Unique Songs</div>
          <div className="val">{uniqueSongs}</div>
          <div className="foot">of which ~218 are originals</div>
        </div>
        <div className="cell">
          <div className="lab">Total Perfs.</div>
          <div className="val" style={{ fontSize: 22 }}>41,807</div>
          <div className="foot">across thirty years</div>
        </div>
        <div className="cell">
          <div className="lab">Hours on Tape</div>
          <div className="val" style={{ fontSize: 22 }}>{hoursArchived ? hoursArchived.toLocaleString() : '6,422'}</div>
          <div className="foot">≈ 267 days</div>
        </div>
        <div className="cell">
          <div className="lab">Venues</div>
          <div className="val">382</div>
          <div className="foot">in 31 countries</div>
        </div>
      </div>

      {leaderboard.length > 0 && (
        <>
          <div className="mv-sec">
            <span className="name">Most-played, all-time</span>
            <span className="more">›</span>
          </div>
          <div className="mv-ledger">
            {leaderboard.slice(0, 10).map((entry, i) => (
              <Link
                key={entry.name}
                href={`/song/${encodeURIComponent(entry.name)}`}
                className="mv-ledger row"
                style={{ display: 'grid', textDecoration: 'none' }}
              >
                <span className="rank">{ROMAN[i] ?? String(i + 1)}</span>
                <span className="name">{entry.name}</span>
                <span className="num">{entry.count}×</span>
                <div className="bar" style={{ '--w': `${(entry.count / leaderMax) * 100}%` } as React.CSSProperties} />
              </Link>
            ))}
          </div>
        </>
      )}

      <div className="mv-sec">
        <span className="name">Era distribution</span>
        <span className="more">5 eras ›</span>
      </div>
      <div className="mv-era-block">
        <div className="mv-era-donut">
          <EraDonut />
          <div className="mv-era-legend">
            {ERAS.map((era, i) => (
              <div className="row" key={i}>
                <span className="swatch" style={{ background: era.color }} />
                <span className="nm">
                  {era.label}
                  <span className="yr">{era.years}</span>
                </span>
                <span className="pct">{Math.round(era.pct * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mv-setlist" style={{ paddingTop: 8 }}>
        <div className="mv-note">
          Era distribution is approximate, based on full-band lineup transitions. The Brent Years (1979–1990) account for the largest share of the archived catalog.
        </div>
        <div className="mv-divider"><span className="glyph">❦</span></div>
      </div>
    </>
  )
}

/* ============================================================ SEARCH SCREEN */

function useDebounce<T>(value: T, ms: number): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

function SearchScreen() {
  const [query, setQuery] = useState('')
  const [songs, setSongs] = useState<SongEntry[]>([])
  const [shows, setShows] = useState<{ date: string; venue: string; city: string; state?: string; songs: string[] }[]>([])
  const [venues, setVenues] = useState<{ date: string; venue: string; city: string; state?: string; songs: string[] }[]>([])
  const [songsLoading, setSongsLoading] = useState(false)
  const dq = useDebounce(query, 280)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (!dq) { setSongs([]); setShows([]); setVenues([]); return }
    setSongsLoading(true)
    fetch(`/api/songs?q=${encodeURIComponent(dq)}`)
      .then(r => r.json())
      .then(d => { setSongs(d.songs ?? []) })
      .catch(() => {})
      .finally(() => setSongsLoading(false))
  }, [dq])

  useEffect(() => {
    if (!dq || songs.length === 0) { setShows([]); return }
    fetch(`/api/search/shows-with-songs?songs[]=${encodeURIComponent(songs[0]?.displayTitle ?? dq)}`)
      .then(r => r.json())
      .then(d => setShows((d.shows ?? []).slice(0, 8)))
      .catch(() => setShows([]))
  }, [dq, songs])

  useEffect(() => {
    if (!dq) { setVenues([]); return }
    fetch(`/api/shows/by-venue?name=${encodeURIComponent(dq)}`)
      .then(r => r.json())
      .then(d => setVenues((d.shows ?? []).slice(0, 8)))
      .catch(() => setVenues([]))
  }, [dq])

  return (
    <>
      <div className="mv-search">
        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink-3)' }}>⌕</span>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="search songs, venues…"
          aria-label="Search the catalog"
        />
        {query && (
          <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 11, padding: '0 2px' }}>
            clear
          </button>
        )}
      </div>

      {!query && (
        <div style={{ padding: '40px 18px', color: 'var(--ink-3)', fontFamily: 'var(--serif-body)', fontStyle: 'italic', fontSize: 16, lineHeight: 1.5 }}>
          Start typing to search 2,333 shows and {CANONICAL_SONG_COUNT} songs.
        </div>
      )}

      {query && (
        <div className="mv-results-section">
          <div className="mv-sec" style={{ marginTop: 8 }}>
            <span className="name">Songs</span>
            <span className="more">{songs.length > 0 ? `${songs.length} found` : songsLoading ? '…' : 'none'}</span>
          </div>
          {songsLoading ? (
            <div style={{ padding: '12px 18px', color: 'var(--ink-3)', fontStyle: 'italic', fontFamily: 'var(--serif-body)', fontSize: 14 }}>Searching…</div>
          ) : songs.length === 0 ? (
            <div style={{ padding: '12px 18px', color: 'var(--ink-3)', fontStyle: 'italic', fontFamily: 'var(--serif-body)', fontSize: 14 }}>No songs found.</div>
          ) : (
            songs.slice(0, 8).map(s => (
              <Link key={s.title} href={`/song/${encodeURIComponent(s.displayTitle)}`} className="mv-result-row" style={{ display: 'grid' }}>
                <span className="t">{s.displayTitle}</span>
                {s.aliases.length > 0 && <span className="s">{s.aliases[0]}</span>}
              </Link>
            ))
          )}

          {shows.length > 0 && (
            <>
              <div className="mv-sec">
                <span className="name">Shows featuring {songs[0]?.displayTitle ?? query}</span>
                <span className="more">{shows.length}</span>
              </div>
              {shows.map(show => (
                <Link key={show.date} href={`/show/${show.date}`} className="mv-result-row" style={{ display: 'grid' }}>
                  <span className="t">{show.venue}</span>
                  <span className="s">{fmtDate(show.date)} · {show.city}{show.state ? `, ${show.state}` : ''}</span>
                </Link>
              ))}
            </>
          )}

          {venues.length > 0 && (
            <>
              <div className="mv-sec">
                <span className="name">Shows at venue</span>
                <span className="more">{venues.length}</span>
              </div>
              {venues.map(show => (
                <Link key={`venue-${show.date}`} href={`/show/${show.date}`} className="mv-result-row" style={{ display: 'grid' }}>
                  <span className="t">{show.venue}</span>
                  <span className="s">{fmtDate(show.date)} · {show.city}{show.state ? `, ${show.state}` : ''}</span>
                </Link>
              ))}
            </>
          )}
        </div>
      )}

      <div className="mv-divider" style={{ marginTop: 24 }}><span className="glyph">❦</span></div>
    </>
  )
}

/* =========================================================== SHOW DETAIL SCREEN */

function ShowDetailScreen({ date }: { date: string }) {
  const { playShowTrack, currentTrack, enqueueEntireShow } = usePlayer()
  const [showDetail, setShowDetail] = useState<ShowDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [archiveDurations, setArchiveDurations] = useState<Map<number, number>>(new Map())

  useEffect(() => {
    setLoading(true)
    fetch(`/api/show?date=${date}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setShowDetail(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [date])

  // Fetch archive track durations
  useEffect(() => {
    if (!showDetail) return
    let cancelled = false
    setArchiveDurations(new Map())
    ;(async () => {
      try {
        const resolveRes = await fetch('/api/archive/resolve-show', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, totalSongs: showDetail.totalSongs }),
        })
        if (!resolveRes.ok || cancelled) return
        const { identifier } = await resolveRes.json()
        if (!identifier || cancelled) return

        const tracksRes = await fetch('/api/archive/song-tracks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: identifier, songTitle: '' }),
        })
        if (cancelled) return
        const { tracks } = tracksRes.ok ? await tracksRes.json() : { tracks: [] }
        const allSongs = showDetail.sets.flatMap(s => s.songs)
        const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
        const durMap = new Map<number, number>()
        for (const t of (tracks as ArchiveTrack[])) {
          if (!t.title || !t.duration || !t.url) continue
          const tn = norm(t.title)
          if (!tn) continue
          for (let i = 0; i < allSongs.length; i++) {
            const sn = norm(allSongs[i])
            if (sn && (sn.includes(tn) || tn.includes(sn)) && !durMap.has(i)) {
              durMap.set(i, t.duration)
            }
          }
        }
        if (!cancelled) setArchiveDurations(durMap)
      } catch {}
    })()
    return () => { cancelled = true }
  }, [date, showDetail?.totalSongs])

  const handleTrackClick = useCallback(async (flatIdx: number) => {
    if (!showDetail) return
    const songs = showDetail.sets.flatMap(s => s.songs)
    try { await playShowTrack({ date: showDetail.date, venue: showDetail.venue, city: showDetail.city }, flatIdx, songs) } catch {}
  }, [showDetail, playShowTrack])

  const handlePlayAll = useCallback(async () => {
    if (!showDetail) return
    const songs = showDetail.sets.flatMap(s => s.songs)
    try { await enqueueEntireShow({ date: showDetail.date, venue: showDetail.venue, city: showDetail.city }, { clearExisting: true, songs }) } catch {}
  }, [showDetail, enqueueEntireShow])

  return (
    <>
      <div className="mv-show-hero">
        <div className="kicker">{formatFullDate(date)}</div>
        {loading ? (
          <h2 style={{ fontSize: 22, color: 'var(--ink-3)' }}>Loading…</h2>
        ) : showDetail ? (
          <>
            <h2>{showDetail.venue}</h2>
            <div className="byline">{showDetail.city}{showDetail.state ? `, ${showDetail.state}` : ''} · {showDetail.totalSongs} songs</div>
          </>
        ) : (
          <h2 style={{ fontSize: 22, color: 'var(--ink-3)' }}>Show not found.</h2>
        )}
        {showDetail && (
          <button className="mv-play-show-btn" style={{ marginTop: 14 }} onClick={handlePlayAll}>
            ▶ Play Entire Show
          </button>
        )}
      </div>

      {showDetail && (
        <div className="mv-setlist">
          {showDetail.sets.map((set, si) => {
            const isEncore = set.encore
            const roman = isEncore ? 'E.' : (ROMAN[si] ?? String(si + 1))
            return (
              <div key={set.name}>
                <div className="mv-set-head">
                  <span className="name"><span style={{ color: 'var(--rust)', fontFamily: 'var(--mono)', fontSize: 14, marginRight: 6 }}>{roman}</span>{set.name}</span>
                  <span className="meta">{set.songs.length} tracks</span>
                </div>
                {set.songs.map((song, ti) => {
                  const flatIdx = showDetail.sets.slice(0, si).reduce((n, s) => n + s.songs.length, ti)
                  const isCurrent = currentTrack?.name === song && currentTrack?.showDate === date
                  const dur = archiveDurations.get(flatIdx)
                  return (
                    <div
                      key={`${si}-${ti}`}
                      className={`mv-track${isCurrent ? ' current' : ''}`}
                      onClick={() => handleTrackClick(flatIdx)}
                      role="button"
                      aria-label={`Play ${song}`}
                    >
                      <span className="n">{String(flatIdx + 1).padStart(2, '0')}</span>
                      <span className="title">{song}</span>
                      <span className="dur">{dur ? formatDur(dur) : '—'}</span>
                      <span className="pin">❡</span>
                    </div>
                  )
                })}
              </div>
            )
          })}
          <div className="mv-divider"><span className="glyph">❦</span></div>
        </div>
      )}
    </>
  )
}

/* ============================================================= MAIN SHELL */

export function MobileShell() {
  const pathname = usePathname()

  const isHome = pathname === '/'
  const isSongs = pathname === '/songs'
  const isSongDetail = pathname.startsWith('/song/')
  const isStats = pathname === '/stats'
  const isSearch = pathname.startsWith('/search')
  const isShowDetail = pathname.startsWith('/show/')
  const isNoMini = isHome

  const songSlug = isSongDetail ? decodeURIComponent(pathname.replace('/song/', '')) : undefined
  const showDate = isShowDetail ? pathname.replace('/show/', '') : undefined

  const showMast = isHome

  return (
    <div className="mv" role="main">
      <div className={`mv-scroll${isNoMini ? ' no-mini' : ''}`}>
        {showMast && <MobileMast />}
        <MobileChapter pathname={pathname} songTitle={songSlug} />
        {isHome && <DeckScreen />}
        {isSongs && <SongsScreen />}
        {isSongDetail && songSlug && <SongDetailScreen slug={songSlug} />}
        {isStats && <StatsScreen />}
        {isSearch && <SearchScreen />}
        {isShowDetail && showDate && <ShowDetailScreen date={showDate} />}
        {!isHome && !isSongs && !isSongDetail && !isStats && !isSearch && !isShowDetail && (
          <div style={{ padding: '40px 18px', color: 'var(--ink-3)', fontFamily: 'var(--serif-body)', fontStyle: 'italic', fontSize: 16 }}>
            Use the navigation below to explore the archive.
          </div>
        )}
      </div>
      {!isNoMini && <MobileMini />}
      <MobileTabBar pathname={pathname} />
    </div>
  )
}
