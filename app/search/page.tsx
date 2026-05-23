'use client'

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

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
  const dq = useDebounce(query, 250)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (!dq) { setSongs([]); setSongTotal(0); return }
    setSongsLoading(true)
    fetch(`/api/songs?q=${encodeURIComponent(dq)}`)
      .then(r => r.json())
      .then(d => { setSongs(d.songs ?? []); setSongTotal(d.total ?? 0) })
      .catch(() => {})
      .finally(() => setSongsLoading(false))
  }, [dq])

  const fetchShows = useCallback((title: string) => {
    setShowsLoading(true)
    fetch(`/api/search/shows-with-songs?songs[]=${encodeURIComponent(title)}`)
      .then(r => r.json())
      .then(d => setShows((d.shows ?? []).slice(0, 10)))
      .catch(() => {})
      .finally(() => setShowsLoading(false))
  }, [])

  // Venue fallback: when no songs match, search for shows at a venue with the query name
  const fetchVenueShows = useCallback((name: string) => {
    setVenueShowsLoading(true)
    setVenueLabel(name)
    fetch(`/api/shows/by-venue?name=${encodeURIComponent(name)}`)
      .then(r => r.json())
      .then(d => setVenueShows((d.shows ?? []).slice(0, 12)))
      .catch(() => setVenueShows([]))
      .finally(() => setVenueShowsLoading(false))
  }, [])

  useEffect(() => {
    if (songsLoading) return
    if (songs.length > 0) {
      fetchShows(songs[0].displayTitle)
      setVenueShows([])
    } else if (dq) {
      setShows([])
      fetchVenueShows(dq)
    } else {
      setShows([])
      setVenueShows([])
    }
  }, [songs, songsLoading, dq, fetchShows, fetchVenueShows])

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
          Start typing to search the archive — 2,333 shows, 442 songs.
        </div>
      )}

      {query && (
        <div className="results-cols">
          <div className="result-col">
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
          </div>

          <div className="result-col">
            {venueShows.length > 0 || venueShowsLoading ? (
              <>
                <h4>Shows at {venueLabel}</h4>
                {venueShowsLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="skeleton-vault" style={{ height: 40, marginBottom: 4 }} />
                    ))
                  : venueShows.length === 0
                    ? <div style={{ padding: '20px 0', color: 'var(--ink-3)', fontStyle: 'italic' }}>No shows found at this venue.</div>
                    : venueShows.map(s => (
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
