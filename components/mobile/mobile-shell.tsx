'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CANONICAL_SONG_COUNT } from '@/lib/ids'
import { usePlayer } from '@/lib/contexts/player-context'
import { getVenueTidbit } from '@/lib/venue-tidbits'
import { getOfficialReleasesForDate, getOfficialReleasesForDates } from '@/lib/official-releases'
import { ReleaseBadge, ReleaseLegend } from '@/components/ui/release-badge'
import { getDateParts } from '@/lib/date-parts'
import { matchArchiveTracksToSetlist, formatBonusTrackTitle, deriveBonusSectionLabel } from '@/lib/archive-track-match'
import type { ArchiveSetlistMatch, ArchiveTrackPayload } from '@/lib/show-of-the-day-types'
import { parseQuery } from '@/lib/search/query-parser'
import { useDebounce, activeRailCount, type RailFilters } from '@/components/search/use-search-state'
import { useSearchResults } from '@/components/search/use-search-results'
import { ActiveChips, buildActiveChips } from '@/components/search/active-chips'
import { FilterSheet } from '@/components/search/filter-sheet'
import { deriveEffectiveFilters } from '@/components/search/categories'

/* ------------------------------------------------------------------ types */

interface ShowOnThisDay {
  date: string; year: number; venue: string; city: string; state?: string; country: string; songs: string[]
}
interface ShowSet { name: string; encore: boolean; songs: string[] }
interface ShowDetail { date: string; venue: string; city: string; state?: string; country: string; sets: ShowSet[]; totalSongs: number }
interface SongEntry { title: string; displayTitle: string; aliases: string[] }
interface SongFacts { totalPerformances: number; first: { date: string; venue: string; city: string } | null; last: { date: string; venue: string; city: string } | null }
interface VersionTrack { id: string; showDate: string; venue: string; city: string; state?: string; country: string; durationSec?: number; url?: string; archiveItemId?: string }
interface VersionsFacts { tracks: VersionTrack[]; extremes?: { longest?: VersionTrack; shortest?: VersionTrack }; songTitle: string }
interface SummaryStats { totalShows?: number; uniqueSongs?: number; hoursArchived?: number }
interface LeaderEntry { name: string; count: number; pct: number }
interface GlobalStats { leaderboard: LeaderEntry[]; showsPerYear?: { year: number; count: number }[] }

/* ---------------------------------------------------------------- helpers */

function formatDur(sec?: number): string {
  if (!sec) return ''
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatQueueTime(tracks: Array<{ duration?: number }>): string {
  const total = tracks.reduce((s, t) => s + (t.duration ?? 0), 0)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = Math.floor(total % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function fmtDate(iso: string): string {
  return iso.replace(/-/g, '·')
}

function ShowDate({ iso }: { iso: string }) {
  const { weekday, ordinalDay, monthName, year } = getDateParts(iso)
  return (
    <>
      {weekday}, the {ordinalDay}{' '}
      <em>of</em>{' '}
      {monthName}{' '}
      <span className="mv-date-year">{year}</span>
    </>
  )
}

function shortDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month - 1]
  return `${m} ${day}, ${year}`
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

/* ---------------------------------------- archive coverage helpers */

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

type MobileTabId = 'home' | 'deck' | 'shows' | 'songs' | 'stats' | 'search'

function getUrlTab(pathname: string): MobileTabId {
  if (pathname === '/' || pathname.startsWith('/show/')) return 'home'
  if (pathname.startsWith('/songs') || pathname.startsWith('/song')) return 'songs'
  if (pathname.startsWith('/shows')) return 'shows'
  if (pathname === '/stats') return 'stats'
  if (pathname.startsWith('/search')) return 'search'
  return 'home'
}

/* --------------------------------------------------------------- tab bar */

interface MobileTabBarProps {
  activeTabId: MobileTabId
  onTabClick: (id: MobileTabId) => void
}

function MobileTabBar({ activeTabId, onTabClick }: MobileTabBarProps) {
  const tabs: Array<{ id: MobileTabId; num: string; label: string }> = [
    { id: 'home',   num: 'I',   label: 'Home'   },
    { id: 'deck',   num: 'II',  label: 'Deck'   },
    { id: 'shows',  num: 'III', label: 'Shows'  },
    { id: 'songs',  num: 'IV',  label: 'Songs'  },
    { id: 'stats',  num: 'V',   label: 'Stats'  },
    { id: 'search', num: 'VI',  label: 'Search' },
  ]
  return (
    <div className="mv-tabs mv-tabs-6" role="navigation" aria-label="Main navigation">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`mv-tab${activeTabId === tab.id ? ' active' : ''}`}
          onClick={() => onTabClick(tab.id)}
          aria-current={activeTabId === tab.id ? 'page' : undefined}
        >
          <span className="num">{tab.num}</span>
          <span className="lab">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

/* ---------------------------------------------------------- chapter strip */

function chapterMeta(tabId: MobileTabId, pathname: string, songTitle?: string): { left: React.ReactNode; right: string } {
  if (tabId === 'home') {
    if (pathname.startsWith('/show/')) return {
      left: <><span className="num">I·a</span> HOME · SETLIST</>,
      right: '0001',
    }
    return {
      left: <><span className="num">I.</span> HOME · ON THIS DAY</>,
      right: '0001',
    }
  }
  if (tabId === 'deck') return {
    left: <><span className="num">II.</span> DECK · NOW PLAYING</>,
    right: '0001',
  }
  if (tabId === 'shows') {
    const yearMatch = pathname.match(/^\/shows\/(\d{4})$/)
    if (yearMatch) return {
      left: <><span className="num">III·a</span> SHOWS › {yearMatch[1]}</>,
      right: yearMatch[1],
    }
    return {
      left: <><span className="num">III.</span> SHOWS · BY DECADE</>,
      right: '2333',
    }
  }
  if (tabId === 'songs') {
    if (pathname.startsWith('/song/') && songTitle) return {
      left: <><span className="num">IV·a</span> SONGS › DETAIL</>,
      right: '0214 / 2333',
    }
    return {
      left: <><span className="num">IV.</span> SONGS · CATALOG</>,
      right: String(CANONICAL_SONG_COUNT),
    }
  }
  if (tabId === 'stats') return {
    left: <><span className="num">V.</span> STATS · BY THE NUMBERS</>,
    right: '2333',
  }
  if (tabId === 'search') return {
    left: <><span className="num">VI.</span> SEARCH · CATALOG</>,
    right: '2333',
  }
  return { left: <><span className="num">I.</span> THE VAULT</>, right: '0001' }
}

function MobileChapter({ tabId, pathname, songTitle }: { tabId: MobileTabId; pathname: string; songTitle?: string }) {
  const router = useRouter()
  const { left, right } = chapterMeta(tabId, pathname, songTitle)
  const isDetail = pathname.startsWith('/song/') || pathname.startsWith('/show/') || pathname.match(/^\/shows\/\d{4}$/)
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
        The <span className="bl">Grateful Dead</span> Archive · <em>compiled by hand, played through the deck</em>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- mini player */

function MobileMini({ onOpen }: { onOpen: () => void }) {
  const { currentTrack, isPlaying, play, pause, next } = usePlayer()
  if (!currentTrack) return null
  const dateStr = currentTrack.showDate ?? ''
  const venueStr = [currentTrack.venue, currentTrack.city].filter(Boolean).join(' · ').toUpperCase()
  const releases = currentTrack.showDate ? getOfficialReleasesForDate(currentTrack.showDate) : []
  return (
    <div className={`mv-mini${!isPlaying ? ' paused' : ''}`} role="status" aria-live="polite">
      <div className="stamp" aria-hidden="true" />
      <button className="mv-mini-open" onClick={onOpen} aria-label="Open player">
        <div className="meta">
          <div className="title-row">
            <div className="title">{currentTrack.name}</div>
            {releases.length > 0 && <ReleaseBadge releases={releases} variant="icon" size="xs" />}
          </div>
          <div className="sub">{dateStr}{venueStr ? ` · ${venueStr}` : ''}</div>
        </div>
      </button>
      <button className="next" onClick={next} aria-label="Skip to next track">▶▶</button>
      <button className="pp" onClick={isPlaying ? pause : play} aria-label={isPlaying ? 'Pause' : 'Play'}>
        {isPlaying ? '❚❚' : '▶'}
      </button>
      <div className="hair" style={{ width: '0%' }} aria-hidden="true" />
    </div>
  )
}

/* --------------------------------------------------- shared now-playing */

function MobileNowPlaying() {
  const { currentTrack, isPlaying, play, pause, next, previous } = usePlayer()

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

  if (!currentTrack) return null

  const isPlaying_ = isPlaying && !!currentTrack
  const subLine = [
    currentTrack.showDate ? shortDate(currentTrack.showDate) : '',
    currentTrack.venue,
    currentTrack.city,
  ].filter(Boolean).join(' · ')
  const pct = audioTime.duration > 0 ? (audioTime.currentTime / audioTime.duration) * 100 : 0

  return (
    <>
      <div className="mv-deck-hero">
        <div className={`mv-reel${!isPlaying_ ? ' paused' : ''}`} aria-label="Reel-to-reel player">
          <div className="spokes" aria-hidden="true">
            <span style={{ transform: 'translateX(-50%) rotate(0deg)' }} />
            <span style={{ transform: 'translateX(-50%) rotate(120deg)' }} />
            <span style={{ transform: 'translateX(-50%) rotate(240deg)' }} />
          </div>
          <div className="hub">A · 01</div>
        </div>
        <div className="mv-now-title">{currentTrack.name}</div>
        <div className="mv-now-sub">{subLine}</div>
        {currentTrack.showDate && (() => {
          const releases = getOfficialReleasesForDate(currentTrack.showDate)
          return releases.length > 0 ? (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <ReleaseBadge releases={releases} />
            </div>
          ) : null
        })()}
      </div>

      <div className="mv-transport">
        <div className="mv-progress">
          <span className="t">{formatDur(audioTime.currentTime) || '0:00'}</span>
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
            <div className="fill" style={{ width: `${pct}%` }} />
            <div className="needle" style={{ left: `${pct}%` }} />
          </div>
          <span className="t right">
            {audioTime.duration > 0
              ? (formatDur(audioTime.duration) || '')
              : currentTrack.duration
              ? (formatDur(currentTrack.duration) || '')
              : ''}
          </span>
        </div>
        <div className="mv-ctrls">
          <button className="mv-iconbtn ghost" onClick={previous} aria-label="Previous track">◀◀</button>
          <button className="mv-iconbtn ghost" aria-label="Skip back 10 seconds" onClick={() => window.dispatchEvent(new CustomEvent('vault-seek-by', { detail: { seconds: -10 } }))}>−10</button>
          <button className="mv-iconbtn play" onClick={isPlaying_ ? pause : play} aria-label={isPlaying_ ? 'Pause' : 'Play'}>
            {isPlaying_ ? '❚❚' : '▶'}
          </button>
          <button className="mv-iconbtn ghost" aria-label="Skip forward 10 seconds" onClick={() => window.dispatchEvent(new CustomEvent('vault-seek-by', { detail: { seconds: 10 } }))}>+10</button>
          <button className="mv-iconbtn ghost" onClick={next} aria-label="Next track">▶▶</button>
        </div>
      </div>
    </>
  )
}

/* ============================================================ DECK SCREEN (player tab) */

function DeckScreen({ onClose }: { onClose: () => void }) {
  const { currentTrack, queue, queueResolving, selectTrack, removeFromQueue, clearQueue } = usePlayer()
  const currentIdx = currentTrack ? queue.findIndex(t => t.id === currentTrack.id) : -1

  return (
    <>
      <div className="mv-deck-topbar">
        <button className="mv-deck-close" onClick={onClose} aria-label="Close deck">
          ← Close Deck
        </button>
        {currentTrack?.showDate && (
          <Link href={`/show/${currentTrack.showDate}`} className="mv-go-to-show">
            Go to Show →
          </Link>
        )}
      </div>
      {!currentTrack ? (
        <div className="mv-deck-empty">
          {queueResolving ? (
            <>
              <div style={{ fontSize: 18, color: 'var(--ink-3)', fontStyle: 'italic', fontFamily: 'var(--serif-body)', marginBottom: 8 }}>
                Finding tracks on Archive.org…
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-4)' }}>
                {queueResolving.done} / {queueResolving.total} checked
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 18, color: 'var(--ink-3)', fontStyle: 'italic', fontFamily: 'var(--serif-body)', marginBottom: 8 }}>
                The deck is empty.
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-4)' }}>
                Play a show or song to begin.
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          <MobileNowPlaying />
          <div className="mv-player-queue" style={{ paddingBottom: 24 }}>
            <div className="mv-queue-head">
              <span className="name">Queue</span>
              <span className="meta">
                {queue.length} {queue.length === 1 ? 'track' : 'tracks'} · {formatQueueTime(queue)}
                {queueResolving ? ` · finding more (${queueResolving.done}/${queueResolving.total})…` : ''}
              </span>
            </div>
            {queue.length === 0 ? (
              <div className="mv-queue-empty">The deck is empty. Cue a track to begin.</div>
            ) : (
              queue.map((t, i) => (
                <div
                  key={t.id + i}
                  className={`mv-qrow${i === currentIdx ? ' current' : ''}`}
                  onClick={() => selectTrack(t)}
                  role="button"
                  aria-label={`Play ${t.name}`}
                >
                  <span className="mv-qnum">{String(i + 1).padStart(2, '0')}</span>
                  <span className="mv-qmeta">
                    <span className="mv-qtitle">{t.name}</span>
                    <span className="mv-qsub">{t.showDate}{t.venue ? ` · ${t.venue}` : ''}</span>
                  </span>
                  <span className="mv-qdur">{formatDur(t.duration)}</span>
                  <button
                    className="mv-qx"
                    onClick={e => { e.stopPropagation(); removeFromQueue(t.id) }}
                    aria-label={`Remove ${t.name} from queue`}
                  >×</button>
                </div>
              ))
            )}
            {queue.length > 0 && (
              <div className="mv-queue-foot">
                <span>{queue.length} cued</span>
                <button className="mv-qclear" onClick={() => clearQueue()}>Clear queue</button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}

/* ============================================================ HOME SCREEN */

function HomeScreen({ onPlayShow }: { onPlayShow: () => void }) {
  const { currentTrack, isPlaying, play, pause, enqueueEntireShow, playShowTrack, enqueueShowTrack, prependToQueue, selectTrack, addToQueue } = usePlayer()

  const [shows, setShows] = useState<ShowOnThisDay[]>([])
  const [featured, setFeatured] = useState<ShowOnThisDay | null>(null)
  const [showDetail, setShowDetail] = useState<ShowDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [archiveMatch, setArchiveMatch] = useState<ArchiveSetlistMatch | null>(null)
  const [archiveIdentifier, setArchiveIdentifier] = useState<string | undefined>(undefined)
  const [archiveDescription, setArchiveDescription] = useState<string | null>(null)

  const otherShows = shows.filter(s => s.date !== featured?.date)

  const displayDate = featured?.date ?? null

  // The show-of-the-day payload is fetched once, in full — there is no
  // separate archive-resolution step to await afterward. A null archiveMatch
  // means no recording was found for this show, not "still loading", so this
  // must default to an empty Set rather than null (which would otherwise be
  // read as a permanent loading state below).
  const archiveCoveredIndices = archiveMatch
    ? new Set(archiveMatch.matched.filter(m => m.track).map(m => m.flatIdx))
    : new Set<number>()
  const archiveDurations = new Map(
    archiveMatch ? archiveMatch.matched.filter(m => m.track?.duration).map(m => [m.flatIdx, m.track!.duration!]) : []
  )

  // Single aggregated fetch: the server precomputes shows, featured pick,
  // setlist detail, and the archive/setlist track match once per day.
  useEffect(() => {
    fetch('/api/show-of-the-day')
      .then(r => r.ok ? r.json() : null)
      .then(payload => {
        if (!payload) return
        setShows(payload.shows ?? [])
        setFeatured(payload.featured ?? null)
        setShowDetail(payload.showDetail ?? null)
        setArchiveIdentifier(payload.archive?.identifier)
        setArchiveDescription(payload.archive?.description ?? null)
        setArchiveMatch(payload.archiveMatch ?? null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handlePlayBonusTrack = useCallback((track: ArchiveTrackPayload) => {
    if (!featured) return
    const t = {
      id: track.id, name: formatBonusTrackTitle(track), url: track.url, duration: track.duration,
      showDate: featured.date, venue: featured.venue, city: featured.city, archiveItemId: track.archiveItemId,
    }
    prependToQueue([t])
    selectTrack(t)
  }, [featured, prependToQueue, selectTrack])

  const handleAddBonusTrack = useCallback((e: React.MouseEvent, track: ArchiveTrackPayload) => {
    e.stopPropagation()
    if (!featured) return
    addToQueue([{
      id: track.id, name: formatBonusTrackTitle(track), url: track.url, duration: track.duration,
      showDate: featured.date, venue: featured.venue, city: featured.city, archiveItemId: track.archiveItemId,
    }])
  }, [featured, addToQueue])

  const handlePlay = useCallback(async () => {
    if (!featured) return
    if (isPlaying && currentTrack?.showDate === featured.date) { pause(); return }
    if (!isPlaying && currentTrack?.showDate === featured.date) { play(); return }
    const songs = showDetail?.sets.flatMap(s => s.songs) ?? featured.songs
    try {
      await enqueueEntireShow(
        { date: featured.date, venue: featured.venue, city: featured.city, identifier: archiveIdentifier },
        { clearExisting: true, songs }
      )
      onPlayShow()
    } catch {}
  }, [featured, showDetail, isPlaying, currentTrack, play, pause, enqueueEntireShow, archiveIdentifier, onPlayShow])

  const handleTrackClick = useCallback(async (flatIdx: number) => {
    if (!featured) return
    const songs = showDetail?.sets.flatMap(s => s.songs) ?? featured.songs
    try { await playShowTrack({ date: featured.date, venue: featured.venue, city: featured.city }, flatIdx, songs) } catch {}
  }, [featured, showDetail, playShowTrack])

  const handleAddTrack = useCallback(async (flatIdx: number) => {
    if (!featured) return
    const songs = showDetail?.sets.flatMap(s => s.songs) ?? featured.songs
    try { await enqueueShowTrack({ date: featured.date, venue: featured.venue, city: featured.city }, flatIdx, songs) } catch {}
  }, [featured, showDetail, enqueueShowTrack])

  const displayVenue = featured?.venue ?? ''
  const displayCity = featured ? `${featured.city}${featured.state ? `, ${featured.state}` : ''}` : ''
  const venueTidbit = featured ? getVenueTidbit(featured.venue, featured.city) : null
  const allSongs = showDetail?.sets.flatMap(s => s.songs) ?? []
  const hasMissingAudio = allSongs.length > 0 && allSongs.some((_, i) => !archiveCoveredIndices.has(i))

  return (
    <>
      {/* Featured show header */}
      <div className="mv-preplay">
        {loading ? (
          <div style={{ height: 80 }} />
        ) : featured ? (
          <>
            {displayDate && <div className="mv-preplay-date"><ShowDate iso={displayDate} /></div>}
            {displayVenue && <div className="mv-preplay-venue">{displayVenue}</div>}
            {displayCity && <div className="mv-preplay-city">{displayCity}</div>}
            {venueTidbit && <div className="mv-preplay-tidbit">{venueTidbit}</div>}
            {displayDate && (() => {
              const releases = getOfficialReleasesForDate(displayDate)
              return releases.length > 0 ? (
                <div style={{ textAlign: 'center', marginBottom: 14 }}>
                  <ReleaseBadge releases={releases} />
                </div>
              ) : null
            })()}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              {displayDate && archiveCoveredIndices.size > 0 && (
                <button className="mv-play-show-btn" onClick={handlePlay}>▶ Play Show</button>
              )}
              {displayDate && (
                <Link href={`/show/${displayDate}`} className="mv-open-setlist-btn">Open Setlist ↗</Link>
              )}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 18, color: 'var(--ink-3)', fontStyle: 'italic', fontFamily: 'var(--serif-body)' }}>
            No show for today&apos;s date.
          </div>
        )}
      </div>

      {/* Setlist */}
      {showDetail && showDetail.sets.length > 0 && (
        <div className="mv-setlist">
          {hasMissingAudio && (
            <div className="mv-archive-note">
              Some songs from this show don&apos;t have available audio.{' '}
              {displayDate && (
                <Link href={`/show/${displayDate}`} style={{ color: 'var(--rust)', textDecoration: 'underline' }}>
                  Open setlist ↗
                </Link>
              )}{' '}
              to browse available recordings.
            </div>
          )}
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
                  const isCurrent = currentTrack?.name === song && currentTrack?.showDate === showDetail.date
                  const inArchive = archiveCoveredIndices.has(flatIdx)
                  const dur = archiveDurations.get(flatIdx)
                  return (
                    <div
                      key={`${si}-${ti}`}
                      className={`mv-track${isCurrent ? ' current' : ''}${!inArchive ? ' unavailable' : ''}`}
                      onClick={inArchive ? () => handleTrackClick(flatIdx) : undefined}
                      role={inArchive ? 'button' : undefined}
                      aria-label={inArchive ? `Play ${song}` : undefined}
                    >
                      <span className="n">{String(flatIdx + 1).padStart(2, '0')}</span>
                      <span className="title">{song}</span>
                      {!inArchive ? (
                        <span className="mv-unavail">Audio Unavailable</span>
                      ) : (
                        <span className="dur">{formatDur(dur)}</span>
                      )}
                      {inArchive ? (
                        <button
                          className="mv-addq"
                          onClick={e => { e.stopPropagation(); handleAddTrack(flatIdx) }}
                          aria-label={`Add ${song} to queue`}
                        >+</button>
                      ) : (
                        <span className="pin" style={{ opacity: 0 }}>❡</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {/* Bonus tracks (soundcheck, banter, etc.) bundled in the recording but not part of the setlist */}
      {archiveMatch && archiveMatch.bonus.length > 0 && (
        <div className="mv-setlist" style={{ paddingTop: 0 }}>
          <div className="mv-set-head">
            <span className="name"><span style={{ color: 'var(--rust)', fontFamily: 'var(--mono)', fontSize: 14, marginRight: 6 }}>B.</span>{deriveBonusSectionLabel(archiveMatch.bonus, archiveDescription)}</span>
            <span className="meta">{archiveMatch.bonus.length} tracks</span>
          </div>
          {archiveMatch.bonus.map(track => (
            <div
              key={track.id}
              className="mv-track"
              onClick={() => handlePlayBonusTrack(track)}
              role="button"
              aria-label={`Play ${formatBonusTrackTitle(track)}`}
            >
              <span className="n" style={{ opacity: 0.35 }}>·</span>
              <span className="title" style={{ fontStyle: 'italic' }}>{formatBonusTrackTitle(track)}</span>
              <span className="dur">{formatDur(track.duration)}</span>
              <button
                className="mv-addq"
                onClick={e => handleAddBonusTrack(e, track)}
                aria-label={`Add ${formatBonusTrackTitle(track)} to queue`}
              >+</button>
            </div>
          ))}
        </div>
      )}

      {/* Also on this day */}
      {otherShows.length > 0 && (
        <div className="mv-setlist" style={{ paddingTop: 0 }}>
          <div className="mv-set-head" style={{ marginBottom: 10 }}>
            <span className="name" style={{ fontSize: 18 }}>Also on this day</span>
            <span className="meta">{otherShows.length} shows</span>
          </div>
          <div className="mv-also-list">
            {otherShows.slice(0, 8).map((show, i) => (
              <Link
                key={`${show.date}-${i}`}
                href={`/show/${show.date}`}
                className="mv-also-row"
              >
                <span className="yr">{show.year}</span>
                <span className="where">
                  {show.venue}
                  <span className="city">{show.city}{show.state ? `, ${show.state}` : ''}</span>
                </span>
                <span className="ext">↗</span>
              </Link>
            ))}
          </div>
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
      </div>

      {loading ? (
        <div className="mv-loading-center">Loading catalog…</div>

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
          return (
            <div key={letter}>
              <div className="mv-alpha-head">
                <span className="letter">{letter}</span>
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
    </>
  )
}

/* ========================================================= SONG DETAIL SCREEN */

function SongDetailScreen({ slug, onOpenPlayer }: { slug: string; onOpenPlayer: () => void }) {
  const router = useRouter()
  const { enqueueSongVersions } = usePlayer()
  const [facts, setFacts] = useState<SongFacts | null>(null)
  const [versions, setVersions] = useState<VersionsFacts | null>(null)
  const [loading, setLoading] = useState(true)
  const [playAllBusy, setPlayAllBusy] = useState(false)
  const [queueAllBusy, setQueueAllBusy] = useState(false)

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
  const allVersions = versions?.tracks ?? []
  const VERSIONS_LIMIT = 12
  const displayedVersions = showAllVersions ? allVersions : allVersions.slice(0, VERSIONS_LIMIT)

  const toRef = (v: VersionTrack) => ({
    showDate: v.showDate, venue: v.venue, city: v.city,
    url: v.url, archiveItemId: v.archiveItemId, durationSec: v.durationSec,
  })

  const handlePlayAll = async () => {
    if (!allVersions.length || playAllBusy) return
    setPlayAllBusy(true)
    onOpenPlayer()
    try { await enqueueSongVersions(slug, allVersions.map(toRef), { mode: 'replace' }) }
    finally { setPlayAllBusy(false) }
  }

  const handleQueueAll = async () => {
    if (!allVersions.length || queueAllBusy) return
    setQueueAllBusy(true)
    try { await enqueueSongVersions(slug, allVersions.map(toRef), { mode: 'append' }) }
    finally { setQueueAllBusy(false) }
  }

  return (
    <>
      <div className="mv-song-hero">
        <div className="kicker">CATALOG · {facts?.totalPerformances ? `${facts.totalPerformances} PERFORMANCES` : 'SONG DETAIL'}</div>
        <h2>{slug}</h2>
        {loading && <div className="byline">Loading…</div>}
        {!loading && !facts?.first && <div className="byline">No performance data found.</div>}
      </div>

      {facts && (
        <div className="mv-kpi-row">
          <div className="mv-kpi">
            <div className="lab">Times Played</div>
            <div className="val count">{facts.totalPerformances}</div>
          </div>
          <div className="mv-kpi">
            <div className="lab">First</div>
            {facts.first ? (
              <Link href={`/show/${facts.first.date}`} className="mv-kpi-goto">
                <div className="val date">{fmtDate(facts.first.date)}</div>
                <span className="goto">go to show →</span>
              </Link>
            ) : (
              <div className="val">—</div>
            )}
          </div>
          <div className="mv-kpi">
            <div className="lab">Last</div>
            {facts.last ? (
              <Link href={`/show/${facts.last.date}`} className="mv-kpi-goto">
                <div className="val date">{fmtDate(facts.last.date)}</div>
                <span className="goto">go to show →</span>
              </Link>
            ) : (
              <div className="val">—</div>
            )}
          </div>
        </div>
      )}


      {displayedVersions.length > 0 && (
        <>
          <div className="mv-sec">
            <span className="name">Versions</span>
            <span className="more">{displayedVersions.length} / {allVersions.length} ›</span>
          </div>
          <div className="mv-version-bar">
            <button className="mv-play-all" onClick={handlePlayAll} disabled={playAllBusy}>
              {playAllBusy ? 'Loading…' : '▶ Play all versions'}
            </button>
            <button className="mv-queue-all" onClick={handleQueueAll} disabled={queueAllBusy}>
              {queueAllBusy ? 'Adding…' : '+ Queue all'}
            </button>
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
              <span className="mv-version-actions">
                <button
                  className="mv-vbtn"
                  onClick={e => { e.stopPropagation(); enqueueSongVersions(slug, [toRef(v)], { mode: 'prepend' }); onOpenPlayer() }}
                  aria-label={`Play ${slug} from ${v.showDate}`}
                >▶</button>
                <button
                  className="mv-vbtn"
                  onClick={e => { e.stopPropagation(); enqueueSongVersions(slug, [toRef(v)], { mode: 'append' }) }}
                  aria-label={`Add ${slug} from ${v.showDate} to queue`}
                >+</button>
              </span>
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

    </>
  )
}

/* ============================================================ STATS SCREEN */

interface PositionEntry { label: string; count: number; pct: string }

const POSITION_COLORS = ['var(--forest)', 'var(--rust)', 'var(--ledger-blue)', 'var(--ink)']

const DARK_STAR_DEFAULTS: PositionEntry[] = [
  { label: 'Opener',  count: 14,  pct: '6%'  },
  { label: 'Mid-set', count: 210, pct: '90%' },
  { label: 'Closer',  count: 6,   pct: '3%'  },
  { label: 'Encore',  count: 2,   pct: '1%'  },
]

function MobileDonut({ positions, songLabel }: { positions: PositionEntry[]; songLabel: string }) {
  const cx = 90, cy = 90, r = 72, innerR = 36
  const total = positions.reduce((n, p) => n + p.count, 0)
  const paths = React.useMemo(() => {
    if (total === 0) return []
    let acc = 0
    return positions.map((p, i) => {
      const start = (acc / total) * Math.PI * 2 - Math.PI / 2
      acc += p.count
      const end = (acc / total) * Math.PI * 2 - Math.PI / 2
      let d: string
      if (p.count === total) {
        d = `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`
      } else {
        const large = (end - start) > Math.PI ? 1 : 0
        const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start)
        const x2 = cx + r * Math.cos(end),   y2 = cy + r * Math.sin(end)
        d = `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`
      }
      return { ...p, d, color: POSITION_COLORS[i] }
    })
  }, [positions, total])

  const words = songLabel.toUpperCase().split(' ')
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    if (!cur) { cur = w }
    else if (cur.length + 1 + w.length <= 9) { cur += ' ' + w }
    else { lines.push(cur); cur = w }
  }
  if (cur) lines.push(cur)
  const lineH = 12
  const startY = cy + 8 - ((lines.length - 1) * lineH) / 2

  return (
    <svg width="180" height="180" viewBox="0 0 180 180" style={{ display: 'block', flexShrink: 0 }}>
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.color} stroke="var(--paper)" strokeWidth="2" />
      ))}
      <circle cx={cx} cy={cy} r={innerR} fill="var(--paper)" stroke="var(--ink)" strokeWidth="1" />
      <text x={cx} y={cy - 6} textAnchor="middle" fontFamily="var(--serif-display)" fontSize="26" fill="var(--ink)">{total}</text>
      {lines.map((line, i) => (
        <text key={i} x={cx} y={startY + i * lineH} textAnchor="middle" fontFamily="var(--mono)" fontSize="9" letterSpacing="0.08em" fill="var(--ink-3)">{line}</text>
      ))}
    </svg>
  )
}

function StatsScreen() {
  const [summary, setSummary] = useState<SummaryStats | null>(null)
  const [stats, setStats] = useState<GlobalStats | null>(null)

  // Position breakdown
  const [positionSong, setPositionSong] = useState('Dark Star')
  const [positionData, setPositionData] = useState<PositionEntry[]>(DARK_STAR_DEFAULTS)
  const [positionTotal, setPositionTotal] = useState(232)
  const [positionLoading, setPositionLoading] = useState(false)
  const [songQuery, setSongQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Array<{ title: string; displayTitle: string }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const posDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/stats/summary').then(r => r.ok ? r.json() : null).then(d => { if (d) setSummary(d) }).catch(() => {})
    fetch('/api/stats').then(r => r.ok ? r.json() : null).then(d => { if (d) setStats(d) }).catch(() => {})
  }, [])

  const fetchPosition = useCallback(async (title: string) => {
    setPositionLoading(true)
    try {
      const [posRes, factsRes] = await Promise.all([
        fetch(`/api/position-facts?songTitle=${encodeURIComponent(title)}`),
        fetch(`/api/song-facts?songTitle=${encodeURIComponent(title)}`),
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
      setPositionSong(pos?.songTitle || title)
    } catch {} finally { setPositionLoading(false) }
  }, [])

  function handlePosQuery(q: string) {
    setSongQuery(q)
    if (posDebounce.current) clearTimeout(posDebounce.current)
    if (!q.trim()) { setSuggestions([]); setShowSuggestions(false); return }
    posDebounce.current = setTimeout(() => {
      fetch(`/api/songs?q=${encodeURIComponent(q)}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          const found = (d?.songs ?? []).slice(0, 8)
          setSuggestions(found)
          setShowSuggestions(found.length > 0)
        })
        .catch(() => {})
    }, 180)
  }

  function selectPosSong(s: { title: string; displayTitle: string }) {
    setSongQuery('')
    setSuggestions([])
    setShowSuggestions(false)
    void fetchPosition(s.displayTitle)
  }

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

      {/* Position breakdown */}
      <div className="mv-sec">
        <span className="name">Position breakdown</span>
        <span className="more">{positionLoading ? '…' : positionSong}</span>
      </div>
      <div className="mv-pos-block">
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1.5px solid var(--gray)', borderRadius: 8, padding: '6px 10px', background: 'var(--paper)' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>⌕</span>
            <input
              type="text"
              value={songQuery}
              onChange={e => handlePosQuery(e.target.value)}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Search…"
              aria-label="Search songs for position breakdown"
              style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--serif-body)', fontSize: 14, color: 'var(--ink)', flex: 1, minWidth: 0 }}
            />
            {positionLoading && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>…</span>}
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, background: 'var(--paper)', border: '2px solid var(--ink)', borderRadius: 8, zIndex: 50, overflow: 'hidden', boxShadow: '4px 4px 0 var(--ink)' }}>
              {suggestions.map(s => (
                <div
                  key={s.title}
                  onMouseDown={() => selectPosSong(s)}
                  style={{ padding: '8px 12px', fontFamily: 'var(--serif-display)', fontSize: 15, color: 'var(--ink)', cursor: 'pointer', borderBottom: '1px solid var(--rule-soft)' }}
                >
                  {s.displayTitle}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <MobileDonut positions={positionData} songLabel={positionSong} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
            {positionData.map((p, i) => (
              <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 12, height: 12, flexShrink: 0, background: POSITION_COLORS[i] }} />
                <span style={{ flex: 1, fontFamily: 'var(--serif-body)', fontSize: 14, color: 'var(--ink-2)' }}>{p.label}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--ink)', fontWeight: 600 }}>{p.count}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>{p.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

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

    </>
  )
}

/* ============================================================ SEARCH SCREEN */

const MULTI_SELECT_FIELDS = new Set<keyof RailFilters>(['series', 'decade', 'era', 'country', 'state'])

function SearchScreen() {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<RailFilters>({ audio: false, release: false, series: [], decade: [], era: [], country: [], state: [] })
  const [sheetOpen, setSheetOpen] = useState(false)
  const [page, setPage] = useState(1)
  const dq = useDebounce(query, 280)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data, loading, loadingMore, active } = useSearchResults(dq, filters, page)
  const { tokens } = parseQuery(dq)

  // Any new search (new debounced text or a filter change) starts back at page 1 —
  // only the "load more" button should ever advance it.
  useEffect(() => { setPage(1) }, [dq, filters])

  useEffect(() => { inputRef.current?.focus() }, [])

  const toggleBoolean = useCallback((key: 'audio' | 'release') => {
    setFilters(f => ({ ...f, [key]: !f[key] }))
  }, [])
  const setRecordingType = useCallback((value?: string) => {
    setFilters(f => ({ ...f, rec: value }))
  }, [])
  const toggleArrayField = useCallback((key: 'series' | 'decade' | 'era' | 'country' | 'state', value: string) => {
    setFilters(f => ({ ...f, [key]: f[key].includes(value) ? f[key].filter(v => v !== value) : [...f[key], value] }))
  }, [])
  const setSingle = useCallback((key: 'year' | 'city' | 'tour', value?: string) => {
    setFilters(f => ({ ...f, [key]: value }))
  }, [])
  const setFields = useCallback((fields: Partial<RailFilters>) => {
    setFilters(f => ({ ...f, ...fields }))
  }, [])
  const setYearRange = useCallback((from?: string, to?: string) => {
    setFilters(f => ({ ...f, yearFrom: from, yearTo: to }))
  }, [])
  const clearField = useCallback((key: keyof RailFilters) => {
    setFilters(f => ({ ...f, [key]: MULTI_SELECT_FIELDS.has(key) ? [] : undefined }))
  }, [])
  const removeToken = useCallback((raw: string) => {
    setQuery(prev => prev.replace(raw, '').replace(/\s+/g, ' ').trim())
  }, [])
  const clearAll = useCallback(() => {
    setQuery('')
    setFilters({ audio: false, release: false, series: [], decade: [], era: [], country: [], state: [] })
  }, [])

  // Rail-only would undercount: a typed token (e.g. "70s") shows as a chip and a checked
  // box in the sheet via the same effective merge (see categories.ts), so the badge must
  // count it too or it reads as fewer filters than are visibly active.
  const filterCount = activeRailCount(deriveEffectiveFilters(filters, tokens))
  const chipCount = buildActiveChips(tokens, filters, {
    removeToken, toggleBoolean, setRecordingType, toggleArrayField, clearField, setYearRange,
  }).length

  return (
    <div className="mfx">
      <div className="mfx-bar">
        <div className="fx-search">
          <span className="gl">⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="search the vault…"
            aria-label="Search the catalog"
          />
          {query && (
            <button className="clear" onClick={() => setQuery('')}>clear</button>
          )}
        </div>
        <div className="mfx-chiprow">
          <button
            className="mfx-open"
            onClick={() => setSheetOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
          >
            Filters{filterCount > 0 ? <span className="n">{filterCount}</span> : null} <span>▾</span>
          </button>
          <ActiveChips
            tokens={tokens}
            filters={filters}
            removeToken={removeToken}
            toggleBoolean={toggleBoolean}
            setRecordingType={setRecordingType}
            toggleArrayField={toggleArrayField}
            clearField={clearField}
            setYearRange={setYearRange}
            clearAll={clearAll}
            emptyState={false}
            showClearAll={false}
          />
          {/* margin-left: auto (see .mfx-clear-pin) keeps this last-and-right on
              whichever wrapped line it ends up on, however many chips accumulate. */}
          {chipCount > 0 && (
            <button type="button" className="mfx-clear-pin" onClick={clearAll}>clear all</button>
          )}
        </div>
      </div>

      {active && (
        <div className="mfx-meta">
          <span className="fx-count" aria-live="polite">shows · <b>{data?.totals.shows ?? 0}</b></span>
          <span className="fx-count">sorted by date</span>
        </div>
      )}

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        filters={filters}
        facets={data?.facets ?? {}}
        resultCount={data?.totals.shows ?? 0}
        clearAll={clearAll}
        toggleBoolean={toggleBoolean}
        setRecordingType={setRecordingType}
        toggleArrayField={toggleArrayField}
        setSingle={setSingle}
        setFields={setFields}
        clearField={clearField}
        setYearRange={setYearRange}
        tokens={tokens}
      />

      {!active && (
        <div style={{ padding: '40px 18px', color: 'var(--ink-3)', fontFamily: 'var(--serif-body)', fontStyle: 'italic', fontSize: 16, lineHeight: 1.5 }}>
          Start typing to search 2,333 shows and {CANONICAL_SONG_COUNT} songs.
        </div>
      )}

      {active && (
        <div className="mv-results-section">
          <div className="mv-sec" style={{ marginTop: 8 }}>
            <span className="name">Shows</span>
            <span className="more">{data?.totals.shows ?? 0}</span>
          </div>
          {!loading && !data?.shows.length ? (
            <div style={{ padding: '12px 18px', color: 'var(--ink-3)', fontStyle: 'italic', fontFamily: 'var(--serif-body)', fontSize: 14 }}>No shows found.</div>
          ) : (
            <>
              {data?.shows.map(show => (
                <Link key={show.id} href={`/show/${show.date}`} className="mv-result-row" style={{ display: 'grid' }}>
                  <span className="t">
                    {show.hasAudio && <span style={{ color: 'var(--forest)', marginRight: 6, fontSize: 11 }}>▶</span>}
                    {show.venue}
                    {show.releases.length > 0 && <ReleaseBadge releases={show.releases} size="xs" />}
                  </span>
                  <span className="s">{fmtDate(show.date)} · {show.city}{show.state ? `, ${show.state}` : ''}</span>
                </Link>
              ))}
              {!loading && (data?.shows.length ?? 0) < (data?.totals.shows ?? 0) && (
                <button className="mv-load-more" onClick={() => setPage(p => p + 1)} disabled={loadingMore}>
                  {loadingMore ? 'Loading…' : `Load more (${(data?.totals.shows ?? 0) - (data?.shows.length ?? 0)} remaining)`}
                </button>
              )}
            </>
          )}

          <div className="mv-sec">
            <span className="name">Songs</span>
            <span className="more">{data?.songs.length ? `${data.songs.length} found` : loading ? '…' : 'none'}</span>
          </div>
          {loading ? (
            <div style={{ padding: '12px 18px', color: 'var(--ink-3)', fontStyle: 'italic', fontFamily: 'var(--serif-body)', fontSize: 14 }}>Searching…</div>
          ) : !data?.songs.length ? (
            <div style={{ padding: '12px 18px', color: 'var(--ink-3)', fontStyle: 'italic', fontFamily: 'var(--serif-body)', fontSize: 14 }}>No songs found.</div>
          ) : (
            data.songs.map(s => (
              <Link key={s.title} href={`/song/${encodeURIComponent(s.displayTitle)}`} className="mv-result-row" style={{ display: 'grid' }}>
                <span className="t">{s.displayTitle}</span>
                {s.aliases.length > 0 && <span className="s">{s.aliases[0]}</span>}
              </Link>
            ))
          )}

          {(data?.venues.length ?? 0) > 0 && (
            <>
              <div className="mv-sec">
                <span className="name">Venues</span>
                <span className="more">{data!.venues.length}</span>
              </div>
              {data!.venues.map(v => (
                <Link key={`${v.name}-${v.city}`} href={`/search?q=${encodeURIComponent(v.name)}`} className="mv-result-row" style={{ display: 'grid' }}>
                  <span className="t">{v.name}</span>
                  <span className="s">{v.city}{v.state ? `, ${v.state}` : ''} · {v.showCount} shows · {v.firstYear}–{v.lastYear}</span>
                </Link>
              ))}
            </>
          )}

          {(data?.releases.length ?? 0) > 0 && (
            <>
              <div className="mv-sec">
                <span className="name">Releases</span>
                <span className="more">{data!.releases.length}</span>
              </div>
              {data!.releases.map(r => (
                <Link key={r.title} href={`/show/${r.date}`} className="mv-result-row" style={{ display: 'grid' }}>
                  <span className="t">{r.title}</span>
                  <span className="s">{r.series} · {r.date}</span>
                </Link>
              ))}
            </>
          )}
        </div>
      )}

    </div>
  )
}

/* =========================================================== SHOW DETAIL SCREEN */

interface RecordingCandidate { identifier: string; title: string; recordingType: string; score: number }

function ShowDetailScreen({ date, onPlayShow }: { date: string; onPlayShow: () => void }) {
  const { playShowTrack, currentTrack, enqueueEntireShow, enqueueShowTrack, prependToQueue, selectTrack, addToQueue } = usePlayer()
  const [showDetail, setShowDetail] = useState<ShowDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [archiveMatch, setArchiveMatch] = useState<ArchiveSetlistMatch | null>(null)
  const [archiveDescription, setArchiveDescription] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<RecordingCandidate[]>([])
  const [selectedIdentifier, setSelectedIdentifier] = useState<string | null>(null)
  const [showRecordingPicker, setShowRecordingPicker] = useState(false)

  const archiveCoveredIndices = archiveMatch
    ? new Set(archiveMatch.matched.filter(m => m.track).map(m => m.flatIdx))
    : null
  const archiveDurations = new Map(
    archiveMatch ? archiveMatch.matched.filter(m => m.track?.duration).map(m => [m.flatIdx, m.track!.duration!]) : []
  )

  useEffect(() => {
    // .mv is CSS-hidden (not unmounted) above the 767px breakpoint — skip the
    // fetch chain entirely when the desktop route is the one actually visible,
    // since it already fetches this same show server-side.
    if (typeof window.matchMedia === 'function' && !window.matchMedia('(max-width: 767px)').matches) {
      setLoading(false)
      return
    }
    setLoading(true)
    fetch(`/api/show?date=${date}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setShowDetail(data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [date])

  useEffect(() => {
    if (!showDetail) return
    let cancelled = false
    setCandidates([])
    setSelectedIdentifier(null)
    // archiveCoveredIndices === null reads as "still resolving" further down —
    // any exit from this resolution (no recording found, request failed) must
    // settle archiveMatch to a real (possibly all-null) match, or that state
    // never clears and the UI is stuck showing "Loading…" forever.
    const noRecordingFound = () => {
      if (cancelled) return
      setArchiveMatch({ matched: showDetail.sets.flatMap(s => s.songs).map((song, flatIdx) => ({ song, flatIdx, track: null })), bonus: [] })
    }
    ;(async () => {
      try {
        const resolveRes = await fetch('/api/archive/resolve-show', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, totalSongs: showDetail.totalSongs }),
        })
        if (cancelled) return
        if (!resolveRes.ok) { noRecordingFound(); return }
        const data = await resolveRes.json()
        if (cancelled) return
        if (Array.isArray(data.candidates)) setCandidates(data.candidates)
        setArchiveDescription(data.description ?? null)
        if (data.identifier) {
          setSelectedIdentifier(data.identifier)
        } else {
          noRecordingFound()
        }
      } catch {
        noRecordingFound()
      }
    })()
    return () => { cancelled = true }
  }, [date, showDetail?.totalSongs])

  useEffect(() => {
    if (!selectedIdentifier || !showDetail) return
    let cancelled = false
    setArchiveMatch(null)
    ;(async () => {
      try {
        const tracksRes = await fetch('/api/archive/song-tracks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: selectedIdentifier, songTitle: '' }),
        })
        if (cancelled) return
        const { tracks } = tracksRes.ok ? await tracksRes.json() : { tracks: [] }
        const setlistSongs = showDetail.sets.flatMap(s => s.songs)
        const match = matchArchiveTracksToSetlist(tracks as ArchiveTrackPayload[], setlistSongs)
        if (!cancelled) setArchiveMatch(match)
      } catch {
        if (!cancelled) setArchiveMatch({ matched: showDetail.sets.flatMap(s => s.songs).map((song, flatIdx) => ({ song, flatIdx, track: null })), bonus: [] })
      }
    })()
    return () => { cancelled = true }
  }, [selectedIdentifier, showDetail?.totalSongs])

  const handlePlayBonusTrack = useCallback((track: ArchiveTrackPayload) => {
    if (!showDetail) return
    const t = {
      id: track.id, name: formatBonusTrackTitle(track), url: track.url, duration: track.duration,
      showDate: showDetail.date, venue: showDetail.venue, city: showDetail.city, archiveItemId: track.archiveItemId,
    }
    prependToQueue([t])
    selectTrack(t)
  }, [showDetail, prependToQueue, selectTrack])

  const handleAddBonusTrack = useCallback((e: React.MouseEvent, track: ArchiveTrackPayload) => {
    e.stopPropagation()
    if (!showDetail) return
    addToQueue([{
      id: track.id, name: formatBonusTrackTitle(track), url: track.url, duration: track.duration,
      showDate: showDetail.date, venue: showDetail.venue, city: showDetail.city, archiveItemId: track.archiveItemId,
    }])
  }, [showDetail, addToQueue])

  const handleTrackClick = useCallback(async (flatIdx: number) => {
    if (!showDetail) return
    const songs = showDetail.sets.flatMap(s => s.songs)
    try { await playShowTrack({ date: showDetail.date, venue: showDetail.venue, city: showDetail.city }, flatIdx, songs) } catch {}
  }, [showDetail, playShowTrack])

  const handlePlayAll = useCallback(async () => {
    if (!showDetail) return
    const songs = showDetail.sets.flatMap(s => s.songs)
    try {
      await enqueueEntireShow(
        { date: showDetail.date, venue: showDetail.venue, city: showDetail.city, identifier: selectedIdentifier ?? undefined },
        { clearExisting: true, songs }
      )
      onPlayShow()
    } catch {}
  }, [showDetail, selectedIdentifier, enqueueEntireShow, onPlayShow])

  const allSongs = showDetail?.sets.flatMap(s => s.songs) ?? []
  const hasMissingAudio = archiveCoveredIndices !== null && allSongs.some((_, i) => !archiveCoveredIndices.has(i))

  return (
    <>
      <div className="mv-show-hero">
        <div className="mv-show-date-line mv-show-date-big"><ShowDate iso={date} /></div>
        {loading ? (
          <h2 style={{ fontSize: 22, color: 'var(--ink-3)' }}>Loading…</h2>
        ) : showDetail ? (
          <div className="mv-show-venue-row">
            <div className="mv-show-venue-info">
              <h2>{showDetail.venue}</h2>
              <div className="byline">{showDetail.city}{showDetail.state ? `, ${showDetail.state}` : ''} · {showDetail.totalSongs} songs</div>
              {(() => {
                const releases = getOfficialReleasesForDate(date)
                return releases.length > 0 ? (
                  <div style={{ marginTop: 6 }}>
                    <ReleaseBadge releases={releases} />
                  </div>
                ) : null
              })()}
            </div>
            {archiveCoveredIndices === null ? (
              <button className="mv-play-show-btn" disabled style={{ opacity: 0.6, cursor: 'default' }}>
                Loading…
              </button>
            ) : archiveCoveredIndices.size > 0 ? (
              <button className="mv-play-show-btn" onClick={handlePlayAll}>▶ Play Show</button>
            ) : null}
          </div>
        ) : (
          <h2 style={{ fontSize: 22, color: 'var(--ink-3)' }}>Show not found.</h2>
        )}
      </div>

      {candidates.length > 1 && (
        <div className="mv-rec-picker">
          <button className="mv-rec-toggle" onClick={() => setShowRecordingPicker(p => !p)}>
            <span className="mv-rec-label">Recording</span>
            <span className="mv-rec-id">{selectedIdentifier ?? '…'}</span>
            <span className="mv-rec-caret">{showRecordingPicker ? '▲' : '▼'}</span>
          </button>
          {showRecordingPicker && (
            <div className="mv-rec-list">
              {candidates.map(c => (
                <div key={c.identifier} className="mv-rec-opt-row">
                  {c.recordingType && <span className="mv-rec-type">{c.recordingType}</span>}
                  <span className="mv-rec-opt-id">{c.identifier}</span>
                  {c.identifier === selectedIdentifier ? (
                    <span className="mv-rec-active">✓</span>
                  ) : (
                    <button
                      className="mv-rec-switch"
                      onClick={() => { setSelectedIdentifier(c.identifier); setShowRecordingPicker(false) }}
                    >
                      switch →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showDetail && (
        <div className="mv-setlist">
          {hasMissingAudio && (
            <div className="mv-archive-note">
              Some songs from this show don&apos;t have available audio.
              {candidates.length > 1 ? ' Try switching recordings above.' : ''}
            </div>
          )}
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
                  const archiveLoading = archiveCoveredIndices === null
                  const inArchive = !archiveLoading && archiveCoveredIndices!.has(flatIdx)
                  const dur = archiveDurations.get(flatIdx)
                  const songs = showDetail.sets.flatMap(s => s.songs)
                  return (
                    <div
                      key={`${si}-${ti}`}
                      className={`mv-track${isCurrent ? ' current' : ''}${archiveLoading ? ' pending' : !inArchive ? ' unavailable' : ''}`}
                      onClick={inArchive ? () => handleTrackClick(flatIdx) : undefined}
                      role={inArchive ? 'button' : undefined}
                      aria-label={inArchive ? `Play ${song}` : undefined}
                    >
                      <span className="n">{String(flatIdx + 1).padStart(2, '0')}</span>
                      <span className="title">{song}</span>
                      {!archiveLoading && !inArchive ? (
                        <span className="mv-unavail">Audio Unavailable</span>
                      ) : (
                        <span className="dur">{formatDur(dur)}</span>
                      )}
                      {inArchive ? (
                        <button
                          className="mv-addq"
                          aria-label={`Add ${song} to queue`}
                          onClick={e => {
                            e.stopPropagation()
                            void enqueueShowTrack({ date: showDetail.date, venue: showDetail.venue, city: showDetail.city }, flatIdx, songs)
                          }}
                        >+</button>
                      ) : (
                        <span />
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {archiveMatch && archiveMatch.bonus.length > 0 && (
        <div className="mv-setlist" style={{ paddingTop: 0 }}>
          <div className="mv-set-head">
            <span className="name"><span style={{ color: 'var(--rust)', fontFamily: 'var(--mono)', fontSize: 14, marginRight: 6 }}>B.</span>{deriveBonusSectionLabel(archiveMatch.bonus, archiveDescription)}</span>
            <span className="meta">{archiveMatch.bonus.length} tracks</span>
          </div>
          {archiveMatch.bonus.map(track => (
            <div
              key={track.id}
              className="mv-track"
              onClick={() => handlePlayBonusTrack(track)}
              role="button"
              aria-label={`Play ${formatBonusTrackTitle(track)}`}
            >
              <span className="n" style={{ opacity: 0.35 }}>·</span>
              <span className="title" style={{ fontStyle: 'italic' }}>{formatBonusTrackTitle(track)}</span>
              <span className="dur">{formatDur(track.duration)}</span>
              <button
                className="mv-addq"
                onClick={e => handleAddBonusTrack(e, track)}
                aria-label={`Add ${formatBonusTrackTitle(track)} to queue`}
              >+</button>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

/* ============================================================ SHOWS SCREEN */

const DECADES = [
  { label: "The Sixties", range: "'65–'69", years: [1965, 1966, 1967, 1968, 1969] },
  { label: "The Seventies", range: "'70–'79", years: [1970, 1971, 1972, 1973, 1974, 1975, 1976, 1977, 1978, 1979] },
  { label: "The Eighties", range: "'80–'89", years: [1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989] },
  { label: "The Nineties", range: "'90–'95", years: [1990, 1991, 1992, 1993, 1994, 1995] },
]

function ShowsDecadeGrid({ countByYear }: { countByYear: Map<number, number> }) {
  const router = useRouter()
  return (
    <>
      {DECADES.map(decade => (
        <div key={decade.label}>
          <div className="mv-set-head" style={{ margin: '0 18px', paddingTop: 10 }}>
            <span className="name" style={{ fontSize: 18 }}>{decade.label}</span>
            <span className="meta">{decade.range}</span>
          </div>
          <div className="mv-shows-grid">
            {decade.years.map(year => {
              const count = countByYear.get(year) ?? 0
              return (
                <button
                  key={year}
                  className="mv-show-year-card"
                  onClick={() => router.push(`/shows/${year}`)}
                >
                  <span className="yr">{year}</span>
                  <span className="cnt">{count > 0 ? count : '—'}</span>
                  <span className="lbl">shows</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </>
  )
}

function ShowsByYearMobile({ year }: { year: number }) {
  const router = useRouter()
  const [shows, setShows] = useState<Array<{ id: string; date: string; venue: string; city: string; state?: string }>>([])
  const [loading, setLoading] = useState(true)
  const [audioDates, setAudioDates] = useState<Set<string>>(new Set())

  useEffect(() => {
    setLoading(true)
    fetch(`/api/shows?yearFrom=${year}&yearTo=${year}&page=1&perPage=200`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setShows(d.shows ?? []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [year])

  useEffect(() => {
    fetch(`/api/archive/dates-with-audio?year=${year}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setAudioDates(new Set<string>(d.dates ?? [])) })
      .catch(() => {})
  }, [year])

  const prevYear = year > 1965 ? year - 1 : null
  const nextYear = year < 1995 ? year + 1 : null
  const officialReleases = React.useMemo(
    () => getOfficialReleasesForDates(shows.map(s => s.date)),
    [shows]
  )

  return (
    <>
      <div className="mv-year-pager">
        {prevYear ? (
          <Link href={`/shows/${prevYear}`} className="pg">
            <span className="arrow">‹</span>
            <span className="yr">{prevYear}</span>
          </Link>
        ) : (
          <span className="pg muted"><span className="yr">—</span></span>
        )}
        <div className="current">
          <span className="lbl">viewing</span>
          <span className="yr">{year}</span>
        </div>
        {nextYear ? (
          <Link href={`/shows/${nextYear}`} className="pg right">
            <span className="yr">{nextYear}</span>
            <span className="arrow">›</span>
          </Link>
        ) : (
          <span className="pg right muted"><span className="yr">—</span></span>
        )}
      </div>
      <div className="mv-year-count">
        {loading ? 'Loading…' : `${shows.length} shows`}
      </div>
      {loading ? (
        <div className="mv-loading-center">Loading…</div>
      ) : shows.length === 0 ? (
        <div style={{ padding: '24px 18px', color: 'var(--ink-3)', fontStyle: 'italic', fontFamily: 'var(--serif-body)' }}>No shows found for {year}.</div>
      ) : (
        shows.map((s, i) => {
          const [, mon, day] = s.date.split('-')
          const monthDay = `${mon}·${day}`
          const releases = getOfficialReleasesForDate(s.date)
          const hasAudio = audioDates.has(s.date)
          return (
            <div
              key={s.id || i}
              className="mv-show-row"
              onClick={() => router.push(`/show/${s.date}`)}
              role="button"
              aria-label={`Show at ${s.venue}, ${s.date}`}
            >
              <span className="mv-srow-date">{monthDay}</span>
              <span className="mv-srow-venue">
                {s.venue}
                <span className="mv-srow-city">{s.city}{s.state ? `, ${s.state}` : ''}</span>
              </span>
              <span className="mv-srow-indicators">
                {releases.length > 0 && <ReleaseBadge releases={releases} variant="icon" />}
                {hasAudio && <span className="mv-srow-audio">▶ audio</span>}
              </span>
              <span className="mv-srow-arr">›</span>
            </div>
          )
        })
      )}
      {officialReleases.length > 0 && (
        <div className="mv-shows-legend">
          <ReleaseLegend releases={officialReleases} />
        </div>
      )}
    </>
  )
}

function ShowsScreen() {
  const pathname = usePathname()
  const [stats, setStats] = useState<GlobalStats | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setStats(d) })
      .catch(() => {})
  }, [])

  const countByYear = new Map((stats?.showsPerYear ?? []).map(d => [d.year, d.count]))

  const yearMatch = pathname.match(/^\/shows\/(\d{4})$/)
  const year = yearMatch ? parseInt(yearMatch[1]) : null

  if (year) return <ShowsByYearMobile year={year} />
  return <ShowsDecadeGrid countByYear={countByYear} />
}

/* ============================================================= MAIN SHELL */

export function MobileShell() {
  const pathname = usePathname()
  const router = useRouter()
  const { currentTrack } = usePlayer()

  // Tracks whether the player (deck) tab is active.
  // Both Home and Deck live at '/'; this distinguishes them.
  const [deckTabActive, setDeckTabActive] = useState(false)
  // Remember where the user was before opening the deck.
  const [prevPath, setPrevPath] = useState<string>('/')

  // Scroll-to-top state
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showBackToTop, setShowBackToTop] = useState(false)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => setShowBackToTop(el.scrollTop > 120)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // When navigating away from '/', clear deck state
  useEffect(() => {
    if (pathname !== '/') setDeckTabActive(false)
  }, [pathname])

  const isAtRoot    = pathname === '/'
  const isShowDetail = pathname.startsWith('/show/')
  const isSongs     = pathname === '/songs'
  const isSongDetail = pathname.startsWith('/song/')
  const isShows     = pathname.startsWith('/shows')
  const isStats     = pathname === '/stats'
  const isSearch    = pathname.startsWith('/search')

  // Determine visible tab
  const activeTabId: MobileTabId = isAtRoot && deckTabActive ? 'deck'
    : isAtRoot || isShowDetail ? 'home'
    : isSongs || isSongDetail ? 'songs'
    : isShows ? 'shows'
    : isStats ? 'stats'
    : isSearch ? 'search'
    : 'home'

  const navigateToDeck = useCallback(() => {
    setPrevPath(pathname)
    if (pathname !== '/') router.push('/')
    setDeckTabActive(true)
  }, [pathname, router])

  const closeDeck = useCallback(() => {
    setDeckTabActive(false)
    if (prevPath && prevPath !== '/') router.push(prevPath)
  }, [prevPath, router])

  const handleTabClick = useCallback((id: MobileTabId) => {
    switch (id) {
      case 'home':
        if (pathname !== '/') router.push('/')
        setDeckTabActive(false)
        break
      case 'deck':
        if (activeTabId === 'deck') { closeDeck(); return }
        navigateToDeck()
        break
      case 'shows':
        router.push('/shows')
        break
      case 'songs':
        router.push('/songs')
        break
      case 'stats':
        router.push('/stats')
        break
      case 'search':
        router.push('/search')
        break
    }
  }, [pathname, router, navigateToDeck, closeDeck, activeTabId])

  const songSlug  = isSongDetail ? decodeURIComponent(pathname.replace('/song/', '')) : undefined
  const showDate  = isShowDetail ? pathname.replace('/show/', '') : undefined
  const showMast  = activeTabId === 'home' && isAtRoot
  const isDeckTab = activeTabId === 'deck'
  const hasMini = !isDeckTab && !!currentTrack

  return (
    <div className="mv" role="main">
      <div ref={scrollRef} className={`mv-scroll${!hasMini ? ' no-mini' : ''}`}>
        {showMast && <MobileMast />}
        <MobileChapter tabId={activeTabId} pathname={pathname} songTitle={songSlug} />

        {/* Home tab */}
        {activeTabId === 'home' && isAtRoot && <HomeScreen onPlayShow={navigateToDeck} />}
        {activeTabId === 'home' && isShowDetail && showDate && <ShowDetailScreen date={showDate} onPlayShow={navigateToDeck} />}

        {/* Deck tab (player) */}
        {activeTabId === 'deck' && <DeckScreen onClose={closeDeck} />}

        {/* Shows tab */}
        {activeTabId === 'shows' && <ShowsScreen />}

        {/* Songs tab */}
        {activeTabId === 'songs' && isSongs && <SongsScreen />}
        {activeTabId === 'songs' && isSongDetail && songSlug && (
          <SongDetailScreen slug={songSlug} onOpenPlayer={navigateToDeck} />
        )}

        {/* Stats tab */}
        {activeTabId === 'stats' && <StatsScreen />}

        {/* Search tab */}
        {activeTabId === 'search' && <SearchScreen />}
      </div>

      {/* Mini player — shown on all tabs except Deck */}
      {!isDeckTab && <MobileMini onOpen={navigateToDeck} />}

      {/* Back-to-top floating button */}
      {showBackToTop && !isDeckTab && (
        <button
          className="mv-back-to-top"
          aria-label="Back to top"
          onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
        >↑</button>
      )}

      <MobileTabBar activeTabId={activeTabId} onTabClick={handleTabClick} />
    </div>
  )
}
