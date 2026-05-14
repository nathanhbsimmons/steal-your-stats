'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Window, WindowHeader, WindowBody } from '@/components/ui/window'
import { Card } from '@/components/ui/card'

type Mode = 'single' | 'pair'

interface ShowResult {
  date: string
  venue: string
  city: string
  state?: string
  country: string
  songs: string[]
  setlistUrl?: string
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

export default function SearchPage() {
  const [mode, setMode] = useState<Mode>('single')
  const [song1, setSong1] = useState('')
  const [song2, setSong2] = useState('')
  const [results, setResults] = useState<ShowResult[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    const songs = mode === 'single' ? [song1] : [song1, song2]
    if (!song1.trim()) return
    if (mode === 'pair' && !song2.trim()) return

    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const params = songs.map(s => `songs[]=${encodeURIComponent(s.trim())}`).join('&')
      const r = await fetch(`/api/search/shows-with-songs?${params}`)
      if (!r.ok) throw new Error('Search failed')
      const data = await r.json()
      setResults(data.shows || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <Window>
      <WindowHeader>
        <h1 className="text-lg font-serif font-bold">Search</h1>
      </WindowHeader>
      <WindowBody>
        <div className="space-y-6">
          {/* Mode toggle */}
          <div className="flex border-2 border-ink inline-flex">
            <button
              onClick={() => { setMode('single'); setResults(null) }}
              className={`px-4 py-2 text-sm font-mono transition-colors ${
                mode === 'single' ? 'bg-ink text-paper' : 'bg-paper text-ink hover:bg-gray/20'
              }`}
            >
              Song in Show
            </button>
            <button
              onClick={() => { setMode('pair'); setResults(null) }}
              className={`px-4 py-2 text-sm font-mono transition-colors border-l-2 border-ink ${
                mode === 'pair' ? 'bg-ink text-paper' : 'bg-paper text-ink hover:bg-gray/20'
              }`}
            >
              Songs Played Together
            </button>
          </div>

          {/* Inputs */}
          <div className="space-y-3">
            <input
              type="text"
              value={song1}
              onChange={e => setSong1(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mode === 'single' ? 'Song name…' : 'First song…'}
              className="w-full border-2 border-ink rounded-radius-md px-3 py-2 font-sans text-sm bg-paper text-ink placeholder:text-gray focus:outline-none focus:ring-2 focus:ring-ink"
            />
            {mode === 'pair' && (
              <input
                type="text"
                value={song2}
                onChange={e => setSong2(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Second song…"
                className="w-full border-2 border-ink rounded-radius-md px-3 py-2 font-sans text-sm bg-paper text-ink placeholder:text-gray focus:outline-none focus:ring-2 focus:ring-ink"
              />
            )}
            <button
              onClick={handleSearch}
              disabled={loading || !song1.trim() || (mode === 'pair' && !song2.trim())}
              className="px-4 py-2 bg-ink text-paper border-2 border-ink text-sm font-mono hover:bg-paper hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching…' : 'Search'}
            </button>
          </div>

          {/* Helper text */}
          {!results && !loading && (
            <p className="text-sm text-gray font-mono">
              {mode === 'single'
                ? 'Find every show where a song appeared in the setlist.'
                : 'Find shows where both songs appeared on the same night.'}
            </p>
          )}

          {/* Error */}
          {error && (
            <Card className="p-4 text-center">
              <p className="text-sm text-gray">{error}</p>
            </Card>
          )}

          {/* Loading */}
          {loading && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray/20 animate-pulse rounded border-2 border-gray" />
              ))}
              <p className="text-xs text-gray font-mono text-center">Searching setlist.fm…</p>
            </div>
          )}

          {/* Results */}
          {results !== null && !loading && (
            <>
              <p className="text-sm font-mono text-gray">
                {results.length === 0
                  ? 'No shows found.'
                  : `${results.length} show${results.length !== 1 ? 's' : ''} found`}
              </p>
              <div className="space-y-2">
                {results.map((show, i) => (
                  <Card key={i} className="p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-sm font-bold text-ink">
                            {formatDate(show.date)}
                          </span>
                          <span className="text-xs text-gray truncate">
                            {show.venue}, {show.city}
                            {show.state ? `, ${show.state}` : ''}
                          </span>
                        </div>
                        {show.songs.length > 0 && (
                          <p className="text-xs text-gray font-mono mt-1 truncate">
                            {show.songs.slice(0, 6).join(' → ')}
                            {show.songs.length > 6 ? ` +${show.songs.length - 6}` : ''}
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/show/${show.date}`}
                        className="flex-shrink-0 text-xs font-mono border-2 border-gray px-2 py-1 hover:border-ink hover:bg-ink hover:text-paper transition-colors"
                      >
                        View →
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </WindowBody>
    </Window>
  )
}
