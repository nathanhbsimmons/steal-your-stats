'use client'

import React, { useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import useSWR from 'swr'
import { Icon, ICONS } from '@/components/glass/icons'
import { AttributionFooter, GlassSkeleton } from '@/components/glass/primitives'
import { PlayerDock } from '@/components/glass/player-dock'
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
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatDateDots(isoDate: string): string {
  return isoDate.replace(/-/g, '·')
}

export default function ShowPage() {
  const params = useParams()
  const router = useRouter()
  const date = params.date as string

  const { data, error, isLoading } = useSWR(
    date ? `show-${date}` : null,
    () => fetchShow(date),
    { revalidateOnFocus: false, revalidateOnReconnect: false, dedupingInterval: 24 * 60 * 60 * 1000 }
  )

  const {
    currentTrack, isPlaying, queue,
    play, pause, next, previous,
    selectTrack, removeFromQueue, clearQueue, enqueueEntireShow,
  } = useAudioPlayer()

  const handlePlayShow = async () => {
    if (!data) return
    try {
      const songs = data.sets.flatMap(s => s.songs)
      await enqueueEntireShow({ date, venue: data.venue, city: data.city }, { clearExisting: true, songs })
    } catch {
      // Archive.org may not have a recording for every show
    }
  }

  const handleClearAndPlay = async () => {
    clearQueue()
    await handlePlayShow()
  }

  // Auto-play when navigated here with ?autoplay=1 (e.g. from "Play the show" on home)
  const autoplayedRef = useRef(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const autoplay = new URLSearchParams(window.location.search).get('autoplay') === '1'
    if (autoplay && data && !autoplayedRef.current) {
      autoplayedRef.current = true
      void handlePlayShow()
    }
  // handlePlayShow is stable per render cycle; data is the trigger
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const venue = data?.venue ?? ''
  const location = data
    ? `${data.city}${data.state ? `, ${data.state}` : ''} · ${data.country}`
    : ''

  return (
    <>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 28px 0', flexShrink: 0 }}>
        <button className="btn icon" style={{ width: 32, height: 32 }} onClick={() => router.back()}>
          <Icon d={ICONS.chevLeft} size={14} />
        </button>
        <span className="t-eyebrow" style={{ fontSize: 10.5 }}>
          SHOWS / {date}
        </span>
        <span style={{ flex: 1 }} />
        {data?.setlistUrl && (
          <a href={data.setlistUrl} target="_blank" rel="noopener noreferrer" className="btn" style={{ fontSize: 12 }}>
            setlist.fm <Icon d={ICONS.external} size={12} />
          </a>
        )}
      </div>

      {/* Show header */}
      <header style={{ padding: '20px 28px 18px', display: 'flex', alignItems: 'flex-end', gap: 24, flexShrink: 0 }}>
        <div style={{
          width: 92, height: 92, flex: '0 0 92px',
          borderRadius: 'var(--r-lg)',
          background: 'radial-gradient(circle at 30% 30%, rgba(240,176,74,0.6), rgba(107,61,18,0.8) 70%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 12px 30px -10px rgba(240,176,74,0.3)',
        }}>
          <Icon d={ICONS.calendar} size={36} />
        </div>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="t-eyebrow">Show · Grateful Dead</span>
          <h1 className="t-display" style={{ fontSize: 38, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
            {isLoading ? formatDateDots(date) : data ? formatDate(data.date) : date}
          </h1>
          {data && (
            <span className="t-small">{venue} · {location}</span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <button className="btn primary lg" onClick={handlePlayShow}>
            <Icon d={ICONS.play} size={14} fill="currentColor" stroke={0} /> Play entire show
          </button>
          {data && (
            <span className="t-small">{data.totalSongs} songs</span>
          )}
        </div>
      </header>

      {/* Scrollable content */}
      <div className="scroll-hide" style={{ flex: 1, overflow: 'auto', padding: '0 28px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <GlassSkeleton height={44} />
            <GlassSkeleton height={200} />
            <GlassSkeleton height={160} />
          </div>
        )}

        {error && (
          <div className="glass" style={{ padding: '28px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <Icon d={ICONS.calendar} size={28} />
            <span className="t-h3">Show not found</span>
            <span className="t-small">No setlist data available for {date}</span>
            <button className="btn" style={{ marginTop: 8 }} onClick={() => router.back()}>
              <Icon d={ICONS.chevLeft} size={13} /> Go back
            </button>
          </div>
        )}

        {data && (
          <>
            {/* Sets */}
            {data.sets.map((set, si) => (
              <section key={si} className="glass" style={{ display: 'flex', flexDirection: 'column' }}>
                <header style={{ padding: '14px 20px 10px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--glass-border)' }}>
                  <span className="t-eyebrow" style={{ color: set.encore ? 'var(--accent-strong)' : 'var(--fg-3)' }}>
                    {set.encore ? 'Encore' : set.name}
                  </span>
                  <span className="t-mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>
                    {set.songs.length} songs
                  </span>
                </header>
                <ol style={{ padding: '8px 0 12px', display: 'flex', flexDirection: 'column' }}>
                  {set.songs.map((song, ji) => (
                    <li key={ji} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 20px' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-bg)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span className="t-mono" style={{ fontSize: 11, color: 'var(--fg-4)', width: 24, flexShrink: 0 }}>
                        {String(ji + 1).padStart(2, '0')}
                      </span>
                      <Link
                        href={`/song/${encodeURIComponent(song)}`}
                        style={{ flex: 1, fontSize: 14, color: 'var(--fg)', textDecoration: 'none' }}
                        onMouseEnter={e => ((e.target as HTMLElement).style.color = 'var(--accent)')}
                        onMouseLeave={e => ((e.target as HTMLElement).style.color = 'var(--fg)')}
                      >
                        {song}
                      </Link>
                      <Icon d={ICONS.arrowR} size={13} />
                    </li>
                  ))}
                </ol>
              </section>
            ))}

            <AttributionFooter />
          </>
        )}
      </div>

      <PlayerDock
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        queue={queue}
        onPlay={play}
        onPause={pause}
        onNext={next}
        onPrevious={previous}
        onSelectTrack={selectTrack}
        onRemoveFromQueue={removeFromQueue}
        onClearQueue={clearQueue}
        onClearAndPlayEntireShow={handleClearAndPlay}
      />
    </>
  )
}
