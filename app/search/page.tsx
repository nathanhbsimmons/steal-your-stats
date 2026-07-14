'use client'

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { usePlayer } from '@/lib/contexts/player-context'
import { CANONICAL_SONG_COUNT } from '@/lib/ids'
import { getOfficialReleasesForDate } from '@/lib/official-releases'
import { ReleaseBadge } from '@/components/ui/release-badge'

interface SongResult {
  title: string
  displayTitle: string
  aliases: string[]
}

interface ShowResult {
  date: string
  venue: string
  city: string
  state?: string
  country: string
  songs: string[]
}

interface VenueSong {
  name: string
  count: number
}

function useDebounce<T>(value: T, ms: number): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [songs, setSongs] = useState<SongResult[]>([])
  const [songTotal, setSongTotal] = useState(0)
  const [songsLoading, setSongsLoading] = useState(false)
  const [shows, setShows] = useState<ShowResult[]>([])
  const [showsLoading, setShowsLoading] = useState(false)
  const [venueShows, setVenueShows] = useState<ShowResult[]>([])
  const [venueShowsLoading, setVenueShowsLoading] = useState(false)
  const [venueLabel, setVenueLabel] = useState('')
  const [venueSongs, setVenueSongs] = useState<VenueSong[]>([])
  const [venueSongsLoading, setVenueSongsLoading] = useState(false)
  const [yearShows, setYearShows] = useState<ShowResult[]>([])
  const [yearShowsLoading, setYearShowsLoading] = useState(false)
  const [yearLabel, setYearLabel] = useState('')
  const dq = useDebounce(query, 250)
  const { playShowTrack } = usePlayer()

  const isYear = (q: string) => /^\d{4}$/.test(q) && parseInt(q) >= 1965 && parseInt(q) <= 1995
  const isDate = (q: string) => /^\d{4}-\d{2}-\d{2}$/.test(q)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '')
  }, [searchParams])

  useEffect(() => {
    if (!dq) {
      setSongs([]); setSongTotal(0)
      setShows([]); setVenueShows([]); setVenueSongs([])
      setYearShows([]); setYearLabel('')
      return
    }

    // Date search: navigate directly to the show page
    if (isDate(dq)) {
      router.push(`/show/${dq}`)
      return
    }

    // Year search: show all GD shows from that year
    if (isYear(dq)) {
      setSongs([]); setSongTotal(0); setShows([])
      setVenueShows([]); setVenueSongs([])
      setYearShowsLoading(true)
      setYearLabel(dq)
      fetch(`/api/shows/by-year?year=${encodeURIComponent(dq)}`)
        .then(r => r.json())
        .then(d => setYearShows((d.shows ?? []).slice(0, 40)))
        .catch(() => setYearShows([]))
        .finally(() => setYearShowsLoading(false))
      return
    }

    setYearShows([]); setYearLabel('')
    setSongsLoading(true)
    fetch(`/api/songs?q=${encodeURIComponent(dq)}`)
      .then(r => r.json())
      .then(d => {
        const found: SongResult[] = d.songs ?? []
        setSongs(found)
        setSongTotal(d.total ?? 0)
        if (found.length > 0) {
          // Song mode: fetch shows featuring the top result
          setVenueShows([]); setVenueSongs([])
          setShowsLoading(true)
          fetch(`/api/search/shows-with-songs?songs[]=${encodeURIComponent(found[0].displayTitle)}`)
            .then(r => r.json())
            .then(d2 => setShows((d2.shows ?? []).slice(0, 10)))
            .catch(() => {})
            .finally(() => setShowsLoading(false))
        } else {
          // Venue mode: no song matched, treat query as venue name
          setShows([])
          setVenueShowsLoading(true)
          setVenueSongsLoading(true)
          setVenueLabel(dq)
          fetch(`/api/shows/by-venue?name=${encodeURIComponent(dq)}`)
            .then(r => r.json())
            .then(d2 => setVenueShows((d2.shows ?? []).slice(0, 12)))
            .catch(() => setVenueShows([]))
            .finally(() => setVenueShowsLoading(false))
          fetch(`/api/venues/songs?venue=${encodeURIComponent(dq)}`)
            .then(r => r.json())
            .then(d2 => setVenueSongs(d2.songs ?? []))
            .catch(() => setVenueSongs([]))
            .finally(() => setVenueSongsLoading(false))
        }
      })
      .catch(() => {})
      .finally(() => setSongsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq])

  const isVenueMode = venueShows.length > 0 || venueShowsLoading
  const isYearMode = yearShows.length > 0 || yearShowsLoading || yearLabel !== ''
  const leaderMax = venueSongs[0]?.count ?? 1

  const handlePlayVenueSong = useCallback(async (songName: string) => {
    const matchingShow = venueShows.find(show =>
      show.songs.some(s => s.toLowerCase() === songName.toLowerCase())
    )
    if (!matchingShow) {
      router.push(`/song/${encodeURIComponent(songName)}?venue=${encodeURIComponent(venueLabel)}`)
      return
    }
    const songIdx = matchingShow.songs.findIndex(s => s.toLowerCase() === songName.toLowerCase())
    try {
      await playShowTrack(
        { date: matchingShow.date, venue: matchingShow.venue, city: matchingShow.city },
        songIdx,
        matchingShow.songs
      )
    } catch {
      router.push(`/song/${encodeURIComponent(songName)}?venue=${encodeURIComponent(venueLabel)}`)
    }
  }, [venueShows, venueLabel, playShowTrack, router])

  return (
    <section className="col">
      <div className="page-head">
        <div>
          <div className="kicker">Search · II</div>
          <h2>The <span className="italic">catalog,</span> at your fingertips.</h2>
          <div className="lede">
            Let inspiration move you brightly across the catalog, the calendar, and the venues.
          </div>
        </div>
      </div>

      <div className="search-big">
        <span style={{ color: 'var(--ink-3)' }}>⌕</span>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`)
          }}
          placeholder="search songs, shows, venues…"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); inputRef.current?.focus() }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 11 }}
          >
            clear
          </button>
        )}
        <span className="kbd">⌘K</span>
      </div>

      {!query && (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-3)', fontFamily: 'var(--serif-body)', fontStyle: 'italic', fontSize: 17 }}>
          Start typing to search the archive — 2,333 shows, {CANONICAL_SONG_COUNT} songs.
        </div>
      )}

      {query && isYearMode && (
        <div className="results-cols">
          <div className="result-col" style={{ gridColumn: '1 / -1' }}>
            <h4>Shows in {yearLabel}</h4>
            {yearShowsLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="skeleton-vault" style={{ height: 40, marginBottom: 4 }} />
                ))
              : yearShows.length === 0
                ? <div style={{ padding: '20px 0', color: 'var(--ink-3)', fontStyle: 'italic' }}>No shows found for {yearLabel}.</div>
                : yearShows.map(s => (
                    <Link
                      key={s.date}
                      href={`/show/${s.date}`}
                      className="row"
                      style={{ textDecoration: 'none' }}
                    >
                      <span className="t">{s.venue}</span>
                      <span className="s">{s.date} · {s.city}{s.state ? `, ${s.state}` : ''}</span>
                    </Link>
                  ))
            }
          </div>
        </div>
      )}

      {query && !isYearMode && (
        <div className="results-cols">
          {/* Songs column */}
          <div className="result-col">
            {isVenueMode ? (
              <>
                <h4>Songs · {venueLabel}</h4>
                {venueSongsLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="skeleton-vault" style={{ height: 36, marginBottom: 4 }} />
                    ))
                  : venueSongs.length === 0
                    ? <div style={{ padding: '20px 0', color: 'var(--ink-3)', fontStyle: 'italic' }}>No song data for this venue.</div>
                    : (
                      <ul className="toptable">
                        {venueSongs.map((entry, i) => (
                          <li key={entry.name}>
                            <div
                              style={{ textDecoration: 'none', display: 'block', cursor: 'pointer' }}
                              onClick={() => handlePlayVenueSong(entry.name)}
                            >
                              <div className="row1">
                                <span className="rank">{i + 1}.</span>
                                <span style={{ fontFamily: 'var(--serif-display)', fontSize: 16 }}>{entry.name}</span>
                                <span className="plays">{entry.count}</span>
                                <Link
                                  href={`/song/${encodeURIComponent(entry.name)}?venue=${encodeURIComponent(venueLabel)}`}
                                  onClick={e => e.stopPropagation()}
                                  style={{ textDecoration: 'none', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.04em', padding: '0 2px', whiteSpace: 'nowrap' }}
                                  onMouseOver={e => (e.currentTarget.style.color = 'var(--rust)')}
                                  onMouseOut={e => (e.currentTarget.style.color = 'var(--ink-3)')}
                                >go to song ↗</Link>
                              </div>
                              <div className="bar">
                                <div className="fill" style={{ width: `${(entry.count / leaderMax) * 100}%` }} />
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )
                }
              </>
            ) : (
              <>
                <h4>Songs {songTotal > 0 ? `· ${songTotal}` : ''}</h4>
                {songsLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="skeleton-vault" style={{ height: 40, marginBottom: 4 }} />
                    ))
                  : songs.length === 0
                    ? <div style={{ padding: '20px 0', color: 'var(--ink-3)', fontStyle: 'italic' }}>No songs found.</div>
                    : songs.slice(0, 12).map((s) => (
                        <Link
                          key={s.title}
                          href={`/song/${encodeURIComponent(s.displayTitle)}`}
                          className="row"
                          style={{ textDecoration: 'none' }}
                        >
                          <span className="t">{s.displayTitle}</span>
                          {s.aliases.length > 0 && (
                            <span className="s">{s.aliases.slice(0, 1).join(', ')}</span>
                          )}
                        </Link>
                      ))
                }
              </>
            )}
          </div>

          {/* Shows column */}
          <div className="result-col">
            {isVenueMode ? (
              <>
                <h4>Shows at {venueLabel}</h4>
                {venueShowsLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="skeleton-vault" style={{ height: 40, marginBottom: 4 }} />
                    ))
                  : venueShows.length === 0
                    ? <div style={{ padding: '20px 0', color: 'var(--ink-3)', fontStyle: 'italic' }}>No shows found at this venue.</div>
                    : venueShows.map(s => {
                        const releases = getOfficialReleasesForDate(s.date)
                        return (
                          <Link
                            key={s.date}
                            href={`/show/${s.date}`}
                            className="row"
                            style={{ textDecoration: 'none' }}
                          >
                            <span className="t" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {s.venue}
                              {releases.length > 0 && <ReleaseBadge releases={releases} size="xs" />}
                            </span>
                            <span className="s">{s.date} · {s.city}{s.state ? `, ${s.state}` : ''}</span>
                          </Link>
                        )
                      })
                }
              </>
            ) : (
              <>
                <h4>Shows {shows.length > 0 ? `featuring ${songs[0]?.displayTitle ?? ''}` : ''}</h4>
                {showsLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="skeleton-vault" style={{ height: 40, marginBottom: 4 }} />
                    ))
                  : shows.length === 0
                    ? <div style={{ padding: '20px 0', color: 'var(--ink-3)', fontStyle: 'italic' }}>
                        {songs.length === 0 ? 'Search for a song to find shows.' : 'No shows found.'}
                      </div>
                    : shows.map(s => (
                        <Link
                          key={s.date}
                          href={`/show/${s.date}`}
                          className="row"
                          style={{ textDecoration: 'none' }}
                        >
                          <span className="t">{s.venue}</span>
                          <span className="s">{s.date} · {s.city}{s.state ? `, ${s.state}` : ''}</span>
                        </Link>
                      ))
                }
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<section className="col" style={{ color: 'var(--ink-3)', fontStyle: 'italic', paddingTop: 40 }}>Loading…</section>}>
      <SearchContent />
    </Suspense>
  )
}
