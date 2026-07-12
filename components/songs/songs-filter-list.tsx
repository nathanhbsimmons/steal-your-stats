'use client'

import React, { useMemo, useState, useRef } from 'react'
import Link from 'next/link'
import type { SongCatalogEntry } from '@/lib/ids'

function groupByLetter(songs: SongCatalogEntry[]): Map<string, SongCatalogEntry[]> {
  const groups = new Map<string, SongCatalogEntry[]>()
  for (const song of songs) {
    const letter = song.title.charAt(0).toUpperCase()
    if (!groups.has(letter)) groups.set(letter, [])
    groups.get(letter)!.push(song)
  }
  return groups
}

export function SongsFilterList({ allSongs }: { allSongs: SongCatalogEntry[] }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const songs = useMemo(() => {
    if (!query) return allSongs
    const q = query.toLowerCase()
    return allSongs.filter(s =>
      s.title.includes(q) || s.aliases.some(a => a.toLowerCase().includes(q))
    )
  }, [allSongs, query])

  const total = songs.length
  const grouped = groupByLetter(songs)
  const letters = Array.from(grouped.keys()).sort()

  return (
    <>
      <div className="page-head">
        <div>
          <div className="kicker">Songs · III</div>
          <h2>The <span className="italic">catalog,</span> indexed.</h2>
          <div className="lede">
            {query
              ? `${total} result${total !== 1 ? 's' : ''} for "${query}".`
              : `${total} unique titles in the catalog. Filter to narrow.`
            }
          </div>
        </div>
        <div className="toolbar">
          <div className="filter-input" style={{ maxWidth: 280 }}>
            <span style={{ color: 'var(--ink-3)' }}>⌕</span>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="filter songs…"
            />
            {query && (
              <span className="clear" onClick={() => { setQuery(''); inputRef.current?.focus() }}>×</span>
            )}
          </div>
        </div>
      </div>

      {songs.length === 0 ? (
        <div style={{ padding: '40px 0', color: 'var(--ink-3)', fontStyle: 'italic' }}>
          No songs match &ldquo;{query}&rdquo;.
        </div>
      ) : query ? (
        <div style={{ marginTop: 8 }}>
          {songs.map(s => (
            <Link
              key={s.title}
              href={`/song/${encodeURIComponent(s.displayTitle)}`}
              style={{
                display: 'grid', gridTemplateColumns: '1fr auto',
                padding: '6px 0', borderBottom: '1px dotted var(--rule-soft)',
                textDecoration: 'none', alignItems: 'baseline',
              }}
            >
              <span style={{ fontFamily: 'var(--serif-display)', fontSize: 18, color: 'var(--ink)' }}>
                {s.displayTitle}
              </span>
              {s.aliases.length > 0 && (
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.04em' }}>
                  {s.aliases[0]}
                </span>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="alpha">
          {letters.map(letter => (
            <div key={letter} className="group">
              <h4>{letter}</h4>
              {(grouped.get(letter) ?? []).map(s => (
                <Link
                  key={s.title}
                  href={`/song/${encodeURIComponent(s.displayTitle)}`}
                  className="song"
                  style={{ textDecoration: 'none' }}
                >
                  <span className="t">
                    {s.displayTitle}
                    {s.aliases.length > 0 && (
                      <span style={{ fontFamily: 'var(--serif-body)', fontStyle: 'italic', fontSize: 12, color: 'var(--ink-3)', paddingLeft: 6 }}>
                        {s.aliases[0]}
                      </span>
                    )}
                  </span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
