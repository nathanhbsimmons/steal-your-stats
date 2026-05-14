'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import useSWR from 'swr'
import { Window, WindowHeader, WindowBody } from '@/components/ui/window'
import { Card } from '@/components/ui/card'
import { AudioPlayerDock } from '@/components/ui/audio-player-dock'
import { Queue } from '@/components/ui/queue'
import { useAudioPlayer } from '@/lib/hooks/use-audio-player'

interface ShowSet {
  name: string
  encore: boolean
  songs: string[]
}

interface ShowDetail {
  date: string
  venue: string
  city: string
  state?: string
  country: string
  sets: ShowSet[]
  setlistUrl?: string
  totalSongs: number
}

async function fetchShow(date: string): Promise<ShowDetail> {
  const r = await fetch(`/api/show?date=${date}`)
  if (!r.ok) throw new Error('Show not found')
  return r.json()
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
}

export default function ShowPage() {
  const params = useParams()
  const date = params.date as string

  const { data, error, isLoading } = useSWR(
    date ? `show-${date}` : null,
    () => fetchShow(date),
    { revalidateOnFocus: false, revalidateOnReconnect: false, dedupingInterval: 24 * 60 * 60 * 1000 }
  )

  const {
    currentTrack,
    isPlaying,
    queue,
    play,
    pause,
    next,
    previous,
    selectTrack,
    removeFromQueue,
    clearQueue,
    enqueueEntireShow,
  } = useAudioPlayer()

  const handlePlayShow = async () => {
    if (!data) return
    try {
      await enqueueEntireShow({ date, venue: data.venue, city: data.city }, { clearExisting: true })
    } catch {
      // ignore
    }
  }

  return (
    <Window>
      <WindowHeader>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-serif font-bold">
              {data ? formatDate(data.date) : date}
            </h1>
            {data && (
              <p className="text-xs font-mono text-gray mt-0.5">
                {data.venue} • {data.city}{data.state ? `, ${data.state}` : ''} • {data.country}
              </p>
            )}
          </div>
          <Link
            href="/"
            className="text-xs font-mono border-2 border-gray px-2 py-1 hover:border-ink hover:bg-ink hover:text-paper transition-colors"
          >
            ← Back
          </Link>
        </div>
      </WindowHeader>
      <WindowBody>
        <div className="space-y-6">
          {isLoading && (
            <div className="space-y-3">
              <div className="h-6 w-32 bg-gray/30 animate-pulse rounded" />
              <div className="h-32 bg-gray/30 animate-pulse rounded border-2 border-gray" />
            </div>
          )}

          {error && (
            <Card className="p-6 text-center">
              <p className="text-sm text-gray">Show not found. No setlist data available for this date.</p>
            </Card>
          )}

          {data && (
            <>
              {/* Play show button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePlayShow}
                  className="px-4 py-2 bg-ink text-paper border-2 border-ink text-sm font-mono hover:bg-paper hover:text-ink transition-colors"
                >
                  ▶ Play Entire Show
                </button>
                {data.setlistUrl && (
                  <a
                    href={data.setlistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono border-2 border-gray px-2 py-1 hover:border-ink transition-colors text-gray hover:text-ink"
                  >
                    View on setlist.fm ↗
                  </a>
                )}
              </div>

              {/* Setlist */}
              <div className="space-y-4">
                {data.sets.map((set, i) => (
                  <Card key={i} className="p-4">
                    <h2 className="text-sm font-mono font-bold text-ink mb-3 border-b-2 border-gray pb-2">
                      {set.name}
                    </h2>
                    <ol className="space-y-1">
                      {set.songs.map((song, j) => (
                        <li key={j} className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray w-5 text-right flex-shrink-0">
                            {j + 1}.
                          </span>
                          <Link
                            href={`/song/${encodeURIComponent(song)}`}
                            className="text-sm text-ink hover:underline"
                          >
                            {song}
                          </Link>
                        </li>
                      ))}
                    </ol>
                  </Card>
                ))}
              </div>

              <p className="text-xs font-mono text-gray">
                {data.totalSongs} songs total
              </p>
            </>
          )}

          {/* Audio Player */}
          <div className="space-y-3">
            <h2 className="text-sm font-mono font-bold text-ink">Audio Player</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AudioPlayerDock
                currentTrack={currentTrack || undefined}
                isPlaying={isPlaying}
                onPlay={play}
                onPause={pause}
                onNext={next}
                onPrevious={previous}
                onPlayEntireShow={data ? handlePlayShow : undefined}
              />
              <Queue
                tracks={queue}
                currentTrackId={currentTrack?.id}
                onTrackSelect={selectTrack}
                onTrackRemove={removeFromQueue}
                onClearQueue={clearQueue}
                onClearAndPlayEntireShow={data ? handlePlayShow : undefined}
              />
            </div>
          </div>
        </div>
      </WindowBody>
    </Window>
  )
}
