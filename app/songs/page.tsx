'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Window, WindowHeader, WindowBody } from '@/components/ui/window'
import { Card } from '@/components/ui/card'
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

  useEffect(() => {
    setLoading(true)
    const params = query ? `?q=${encodeURIComponent(query)}` : ''
    fetch(`/api/songs${params}`)
      .then(r => r.json())
      .then(data => {
        setSongs(data.songs || [])
        setTotal(data.total || 0)
      })
      .finally(() => setLoading(false))
  }, [query])

  const grouped = groupByLetter(songs)
  const letters = Array.from(grouped.keys()).sort()

  return (
    <Window>
      <WindowHeader>
        <h1 className="text-lg font-serif font-bold">Song Catalog</h1>
      </WindowHeader>
      <WindowBody>
        <div className="space-y-6">
          {/* Search */}
          <div>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Filter songs..."
              className="w-full border-2 border-ink rounded-radius-md px-3 py-2 font-sans text-sm bg-paper text-ink placeholder:text-gray focus:outline-none focus:ring-2 focus:ring-ink"
            />
          </div>

          {/* Stats */}
          <p className="text-sm text-gray font-mono">
            {loading ? 'Loading...' : `${total} song${total !== 1 ? 's' : ''} in catalog`}
          </p>

          {/* Song list */}
          {!loading && songs.length === 0 && (
            <Card className="p-6 text-center text-gray">
              <p>No songs match your search.</p>
            </Card>
          )}

          {!loading && letters.map(letter => (
            <div key={letter}>
              <div className="border-b-2 border-ink mb-3">
                <span className="font-mono text-sm font-bold text-ink">{letter}</span>
              </div>
              <div className="space-y-1">
                {grouped.get(letter)!.map(song => {
                  const display = toTitleCase(song.displayTitle)
                  return (
                    <Link
                      key={song.title}
                      href={`/song/${encodeURIComponent(display)}`}
                      className="flex items-center justify-between py-2 px-3 border-2 border-transparent hover:border-ink hover:bg-gray/10 rounded-radius-md transition-colors group"
                    >
                      <span className="font-serif font-medium text-ink group-hover:underline">
                        {display}
                      </span>
                      {song.aliases.length > 0 && (
                        <span className="text-xs text-gray font-mono truncate ml-4 max-w-48">
                          aka: {song.aliases.map(a => toTitleCase(a)).join(', ')}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </WindowBody>
    </Window>
  )
}
