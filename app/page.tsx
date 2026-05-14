'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Window, WindowHeader, WindowBody } from '@/components/ui/window'
import { Card } from '@/components/ui/card'

interface ShowOnThisDay {
  date: string
  year: number
  venue: string
  city: string
  state?: string
  country: string
  songs: string[]
  setlistUrl?: string
}

function formatMonthDay(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

export default function Home() {
  const [shows, setShows] = useState<ShowOnThisDay[]>([])
  const [currentDate, setCurrentDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/on-this-day')
      .then(r => {
        if (!r.ok) throw new Error('Failed to load')
        return r.json()
      })
      .then(data => {
        setShows(data.shows || [])
        setCurrentDate(data.date || '')
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const displayDate = currentDate ? formatMonthDay(currentDate) : ''

  return (
    <Window>
      <WindowHeader>
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-serif font-bold">On This Day</h1>
          {displayDate && (
            <span className="text-sm font-mono text-gray">{displayDate}</span>
          )}
        </div>
      </WindowHeader>
      <WindowBody>
        <div className="space-y-4">
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray/30 animate-pulse rounded border-2 border-gray" />
              ))}
              <p className="text-xs text-gray font-mono text-center">Searching {new Date().getFullYear() - 1965} years of shows…</p>
            </div>
          )}

          {error && (
            <Card className="p-6 text-center">
              <p className="text-sm text-gray">Could not load shows. Check your API key.</p>
            </Card>
          )}

          {!loading && !error && shows.length === 0 && (
            <Card className="p-6 text-center">
              <p className="font-serif text-lg text-ink">No shows on {displayDate}</p>
              <p className="text-sm text-gray mt-1">The Grateful Dead didn&apos;t play on this date.</p>
            </Card>
          )}

          {!loading && shows.map(show => (
            <Card key={show.date} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-mono text-lg font-bold text-ink">{show.year}</span>
                    <span className="text-sm text-gray">
                      {show.venue}, {show.city}
                      {show.state ? `, ${show.state}` : ''}
                    </span>
                  </div>

                  {show.songs.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {show.songs.slice(0, 8).map((song, i) => (
                        <Link
                          key={i}
                          href={`/song/${encodeURIComponent(song)}`}
                          className="text-xs font-mono border border-gray px-1.5 py-0.5 rounded hover:border-ink hover:bg-ink hover:text-paper transition-colors"
                        >
                          {song}
                        </Link>
                      ))}
                      {show.songs.length > 8 && (
                        <span className="text-xs font-mono text-gray px-1.5 py-0.5">
                          +{show.songs.length - 8} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <Link
                  href={`/show/${show.date}`}
                  className="flex-shrink-0 text-xs font-mono border-2 border-ink px-2 py-1 hover:bg-ink hover:text-paper transition-colors"
                >
                  Full Show →
                </Link>
              </div>
            </Card>
          ))}

          {!loading && shows.length > 0 && (
            <p className="text-xs text-gray font-mono text-center">
              {shows.length} show{shows.length !== 1 ? 's' : ''} on {displayDate} • Data from setlist.fm
            </p>
          )}
        </div>
      </WindowBody>
    </Window>
  )
}
