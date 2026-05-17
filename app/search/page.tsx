'use client'

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Icon, ICONS } from '@/components/glass/icons'
import { ShowRow } from '@/components/glass/primitives'

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

function highlight(text: string, match: string) {
  if (!match) return <>{text}</>
  const idx = text.toLowerCase().indexOf(match.toLowerCase())
  if (idx < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'var(--accent-soft)', color: 'var(--accent-strong)', padding: '0 2px', borderRadius: 3 }}>
        {text.slice(idx, idx + match.length)}
      </mark>
      {text.slice(idx + match.length)}
    </>
  )
}

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [activeFilter, setActiveFilter] = useState<'songs' | 'shows'>('songs')

  const [songs, setSongs] = useState<SongResult[]>([])
  const [songTotal, setSongTotal] = useState(0)
  const [songsLoading, setSongsLoading] = useState(false)

  const [shows, setShows] = useState<ShowResult[]>([])
  const [showsLoading, setShowsLoading] = useState(false)

  const debouncedQuery = useDebounce(query, 250)

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus() }, [])

  // Escape to blur
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') inputRef.current?.blur() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Fetch songs whenever debounced query changes
  useEffect(() => {
    if (!debouncedQuery) {
      setSongs([])
      setSongTotal(0)
      return
    }
    setSongsLoading(true)
    fetch(`/api/songs?q=${encodeURIComponent(debouncedQuery)}`)
      .then(r => r.json())
      .then(data => {
        setSongs(data.songs || [])
        setSongTotal(data.total || 0)
      })
      .catch(() => {})
      .finally(() => setSongsLoading(false))
  }, [debouncedQuery])

  // Fetch shows for the top song match
  const fetchShows = useCallback((songTitle: string) => {
    setShowsLoading(true)
    setShows([])
    fetch(`/api/search/shows-with-songs?songs[]=${encodeURIComponent(songTitle)}`)
      .then(r => r.json())
      .then(data => setShows((data.shows || []).slice(0, 8)))
      .catch(() => {})
      .finally(() => setShowsLoading(false))
  }, [])

  // When songs load, auto-fetch shows for the first result
  useEffect(() => {
    if (songs.length > 0) {
      fetchShows(songs[0].displayTitle)
    } else {
      setShows([])
    }
  }, [songs, fetchShows])

  return (
    <>
      {/* Header */}
      <div style={{ padding: '20px 28px 0', flexShrink: 0 }}>
        <span className="t-eyebrow">Search</span>
        <h1 className="t-display t-h2" style={{ marginTop: 4 }}>Find any song, show, or jam.</h1>
      </div>

      <div className="scroll-hide" style={{ flex: 1, overflow: 'auto', padding: '18px 28px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Hero input */}
        <div className="glass strong" style={{
          padding: '14px 22px',
          display: 'flex', alignItems: 'center', gap: 14,
          borderRadius: 'var(--r-xl)',
        }}>
          <span style={{ color: 'var(--fg-3)' }}>
            <Icon d={ICONS.search} size={20} stroke={1.8} />
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && query) router.push(`/search?q=${encodeURIComponent(query)}`)
            }}
            style={{ flex: 1, background: 'transparent', border: 0, outline: 'none', color: 'var(--fg)', fontSize: 18 }}
            placeholder="Songs, venues, dates…"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-4)', padding: 4 }}
            >
              <Icon d={ICONS.close} size={16} />
            </button>
          ) : (
            <span className="kbd">Esc</span>
          )}
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span
            className={`pill${activeFilter === 'songs' ? ' accent' : ''}`}
            style={{ cursor: 'pointer' }}
            onClick={() => setActiveFilter('songs')}
          >
            <Icon d={ICONS.music} size={11} /> Songs{songTotal > 0 ? ` · ${songTotal}` : ''}
          </span>
          <span
            className={`pill${activeFilter === 'shows' ? ' accent' : ''}`}
            style={{ cursor: 'pointer' }}
            onClick={() => setActiveFilter('shows')}
          >
            Shows{shows.length > 0 ? ` · ${shows.length}` : ''}
          </span>
        </div>

        {/* Empty prompt */}
        {!query && (
          <div className="glass" style={{ padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', color: 'var(--fg-3)' }}>
            <Icon d={ICONS.search} size={32} />
            <span className="t-h3">Start typing to search</span>
            <span className="t-small">Search by song name, venue, or year</span>
          </div>
        )}

        {/* Results grid */}
        {query && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

            {/* Songs panel */}
            <section className="glass" style={{ padding: 4, display: 'flex', flexDirection: 'column' }}>
              <header style={{ padding: '14px 18px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 className="t-h3">Songs</h3>
                {!songsLoading && (
                  <span className="t-eyebrow">{songTotal} result{songTotal !== 1 ? 's' : ''}</span>
                )}
              </header>
              <div style={{ display: 'flex', flexDirection: 'column', padding: '4px 4px 8px' }}>
                {songsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 52, margin: '3px 8px', borderRadius: 'var(--r-md)' }} />
                  ))
                ) : songs.length === 0 ? (
                  <div style={{ padding: '20px 18px', color: 'var(--fg-4)', fontSize: 13 }}>No songs found.</div>
                ) : (
                  songs.slice(0, 8).map((s, i) => {
                    const display = s.displayTitle
                    return (
                      <Link
                        key={s.title}
                        href={`/song/${encodeURIComponent(display)}`}
                        className="nav-item"
                        style={{
                          padding: '12px 14px',
                          background: i === 0 ? 'var(--glass-bg-strong)' : 'transparent',
                        }}
                      >
                        <span className="nav-icon" style={{ color: i === 0 ? 'var(--accent)' : 'var(--fg-4)' }}>
                          <Icon d={ICONS.music} size={15} />
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25, flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 13.5, color: 'var(--fg)' }}>
                            {highlight(display, query)}
                          </span>
                          {s.aliases.length > 0 && (
                            <span className="t-small" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              aka {s.aliases.slice(0, 2).join(', ')}
                            </span>
                          )}
                        </div>
                        {i === 0 && <span className="kbd" style={{ color: 'var(--accent)' }}>↵</span>}
                      </Link>
                    )
                  })
                )}
              </div>
            </section>

            {/* Shows panel */}
            <section className="glass" style={{ padding: 4, display: 'flex', flexDirection: 'column' }}>
              <header style={{ padding: '14px 18px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 className="t-h3">Shows</h3>
                {!showsLoading && shows.length > 0 && (
                  <span className="t-eyebrow">featuring {songs[0]?.displayTitle}</span>
                )}
              </header>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {showsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 48, margin: '3px 8px', borderRadius: 'var(--r-md)' }} />
                  ))
                ) : shows.length === 0 && !showsLoading ? (
                  <div style={{ padding: '20px 18px', color: 'var(--fg-4)', fontSize: 13 }}>
                    {songs.length === 0 ? 'Search for a song to find shows.' : 'No shows found.'}
                  </div>
                ) : (
                  shows.map(s => (
                    <ShowRow
                      key={s.date}
                      date={s.date}
                      venue={s.venue}
                      city={`${s.city}${s.state ? `, ${s.state}` : ''}`}
                      country={s.country}
                      badge={s.date.split('-')[0]}
                    />
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* Tip */}
        <div className="glass faint" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14, fontSize: 12.5, color: 'var(--fg-3)' }}>
          <Icon d={ICONS.bolt} size={14} />
          <span>
            Tip — try searching for{' '}
            <code className="t-mono" style={{ color: 'var(--accent)' }}>Dark Star</code>,{' '}
            <code className="t-mono" style={{ color: 'var(--accent)' }}>Scarlet</code>, or{' '}
            <code className="t-mono" style={{ color: 'var(--accent)' }}>Althea</code>.
          </span>
        </div>
      </div>
    </>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-3)' }}>Loading…</div>}>
      <SearchContent />
    </Suspense>
  )
}
