'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { TopBar } from '@/components/glass/topbar'
import { Icon, ICONS } from '@/components/glass/icons'
import { toTitleCase } from '@/lib/utils'

interface SongEntry {
  title: string
  displayTitle: string
  aliases: string[]
}

function groupByLetter(songs: SongEntry[]): Map<string, SongEntry[]> {
  const groups = new Map<string, SongEntry[]>()
  for (const song of songs) {
    const letter = song.title.charAt(0).toUpperCase()
    if (!groups.has(letter)) groups.set(letter, [])
    groups.get(letter)!.push(song)
  }
  return groups
}

export default function SongsPage() {
  const [songs, setSongs] = useState<SongEntry[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLoading(true)
    const params = query ? `?q=${encodeURIComponent(query)}` : ''
    fetch(`/api/songs${params}`)
      .then(r => r.json())
      .then(data => {
        setSongs(data.songs || [])
        setTotal(data.total || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [query])

  const grouped = groupByLetter(songs)
  const letters = Array.from(grouped.keys()).sort()

  return (
    <>
      <TopBar eyebrow="Browse" title="Song Catalog">
        <span className="t-mono" style={{ fontSize: 12, color: 'var(--fg-3)' }}>
          {loading ? '…' : `${total} songs`}
        </span>
      </TopBar>

      <div className="scroll-hide" style={{ flex: 1, overflow: 'auto', padding: '0 28px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Search bar */}
        <div style={{ position: 'relative' }}>
          <Icon
            d={ICONS.search}
            size={14}
            style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--fg-4)', pointerEvents: 'none',
            }}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Filter songs…"
            style={{
              width: '100%',
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--r-md)',
              padding: '10px 14px 10px 38px',
              fontSize: 13,
              color: 'var(--fg)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--glass-border)')}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-4)',
                padding: 4, lineHeight: 1,
              }}
            >
              <Icon d={ICONS.close} size={13} />
            </button>
          )}
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <div className="skeleton" style={{ height: 18, width: 32, marginBottom: 10, borderRadius: 4 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {Array.from({ length: 4 + (i % 3) }).map((_, j) => (
                    <div key={j} className="skeleton" style={{ height: 38, borderRadius: 'var(--r-md)' }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && songs.length === 0 && (
          <div className="glass" style={{ padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            <Icon d={ICONS.search} size={28} />
            <span className="t-h3">No songs match</span>
            <span className="t-small">Try a different search term</span>
            <button className="btn" style={{ marginTop: 8 }} onClick={() => setQuery('')}>
              Clear filter
            </button>
          </div>
        )}

        {/* Alphabetical groups */}
        {!loading && letters.map(letter => (
          <section key={letter}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 8, paddingBottom: 6,
              borderBottom: '1px solid var(--glass-border)',
            }}>
              <span className="t-mono" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>{letter}</span>
              <span className="t-mono" style={{ fontSize: 10.5, color: 'var(--fg-4)' }}>
                {grouped.get(letter)!.length}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {grouped.get(letter)!.map(song => {
                const display = toTitleCase(song.displayTitle)
                return (
                  <Link
                    key={song.title}
                    href={`/song/${encodeURIComponent(display)}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '9px 14px',
                      borderRadius: 'var(--r-md)',
                      textDecoration: 'none',
                      transition: 'background 120ms',
                    }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--glass-bg)')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                  >
                    <span style={{ flex: 1, fontSize: 13.5, color: 'var(--fg)' }}>{display}</span>
                    {song.aliases.length > 0 && (
                      <span className="t-mono" style={{ fontSize: 10.5, color: 'var(--fg-4)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        aka {song.aliases.map(a => toTitleCase(a)).join(', ')}
                      </span>
                    )}
                    <Icon d={ICONS.arrowR} size={12} style={{ color: 'var(--fg-4)', flexShrink: 0 }} />
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
