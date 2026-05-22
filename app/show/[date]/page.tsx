'use client'

import React, { useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import useSWR from 'swr'
import { usePlayer } from '@/lib/contexts/player-context'

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

function formatDateLong(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

const SET_ROMANS = ['I', 'II', 'III', 'IV']

export default function ShowPage() {
  const params = useParams()
  const router = useRouter()
  const date = params.date as string

  const { data, error, isLoading } = useSWR(
    date ? `show-${date}` : null,
    () => fetchShow(date),
    { revalidateOnFocus: false, revalidateOnReconnect: false, dedupingInterval: 24 * 60 * 60 * 1000 }
  )

  const { enqueueEntireShow, currentTrack, isPlaying } = usePlayer()

  const handlePlayShow = async () => {
    if (!data) return
    try {
      const songs = data.sets.flatMap(s => s.songs)
      await enqueueEntireShow({ date, venue: data.venue, city: data.city }, { clearExisting: true, songs })
    } catch {
      // Archive.org may not have a recording for every show
    }
  }

  const autoplayedRef = useRef(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const autoplay = new URLSearchParams(window.location.search).get('autoplay') === '1'
    if (autoplay && data && !autoplayedRef.current) {
      autoplayedRef.current = true
      void handlePlayShow()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  const location = data
    ? `${data.city}${data.state ? `, ${data.state}` : ''}, ${data.country}`
    : ''

  let setIndex = 0

  return (
    <section className="col">
      {/* Breadcrumbs */}
      <div className="crumbs">
        <Link href="/">Home</Link>
        <span className="sep">/</span>
        <span className="cur">{date}</span>
        {data?.setlistUrl && (
          <>
            <span className="sep" style={{ marginLeft: 'auto' }} />
            <a href={data.setlistUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto' }}>
              setlist.fm ↗
            </a>
          </>
        )}
      </div>

      {/* Page head */}
      <div className="page-head">
        <div>
          <div className="kicker">Show · Grateful Dead</div>
          <h2 style={{ fontSize: 40, lineHeight: 1.05 }}>
            {isLoading ? date.replace(/-/g, ' · ') : data ? formatDateLong(data.date) : date}
          </h2>
          {data && (
            <div className="lede" style={{ marginTop: 4 }}>
              <strong style={{ fontStyle: 'normal', color: 'var(--ink)' }}>{data.venue}</strong>
              {' · '}{location}
            </div>
          )}
        </div>
        <div className="toolbar">
          {data && (
            <>
              <span>{data.totalSongs} songs</span>
              <button className="btn primary" onClick={handlePlayShow}>
                <span className="play-tri">▶</span> Play entire show
              </button>
            </>
          )}
        </div>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton-vault" style={{ height: i === 0 ? 180 : 140 }} />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: 'var(--serif-body)', fontStyle: 'italic', color: 'var(--ink-3)' }}>
          <div style={{ fontFamily: 'var(--serif-display)', fontSize: 28, color: 'var(--ink)', marginBottom: 8 }}>
            Show not found
          </div>
          No setlist data available for {date}.{' '}
          <button
            onClick={() => router.back()}
            style={{ background: 'none', border: 0, cursor: 'pointer', color: 'var(--rust)', fontFamily: 'inherit', fontStyle: 'italic', fontSize: 'inherit', textDecoration: 'underline' }}
          >
            Go back
          </button>
        </div>
      )}

      {/* Setlist */}
      {data && (
        <>
          <div className="setlist">
            {data.sets.map((set, si) => {
              const isEncore = set.encore
              const romanIdx = isEncore ? si : setIndex++
              const roman = isEncore ? 'E.' : SET_ROMANS[romanIdx] ?? String(romanIdx + 1)
              return (
                <div key={si} className={`set-block${si % 2 === 1 ? ' alt' : ''}`}>
                  <div className="set-head">
                    <h3>
                      <span className="roman">{roman}</span>
                      {isEncore ? 'Encore' : set.name}
                    </h3>
                    <div className="duration">{set.songs.length} songs</div>
                  </div>
                  {set.songs.map((song, ji) => {
                    const isCurrentSong = currentTrack?.name?.toLowerCase().includes(song.toLowerCase())
                    return (
                      <div
                        key={ji}
                        className={`track${isCurrentSong && isPlaying ? ' playing' : ''}`}
                        onClick={handlePlayShow}
                      >
                        <span className="num">{String(ji + 1).padStart(2, '0')}</span>
                        <span className="play-dot">{isCurrentSong && isPlaying ? '❚❚' : '▶'}</span>
                        <Link
                          href={`/song/${encodeURIComponent(song)}`}
                          className="title"
                          onClick={e => e.stopPropagation()}
                          style={{ textDecoration: 'none', display: 'block' }}
                        >
                          {song}
                        </Link>
                        <span className="chev">→</span>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          <div className="margin-note" style={{ marginTop: 18 }}>
            <span className="head">Provenance</span>
            Performance data sourced from setlist.fm. Audio recordings via Archive.org — community-contributed soundboard and audience tapes.{' '}
            {data.setlistUrl && (
              <a href={data.setlistUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rust)' }}>
                View on setlist.fm ↗
              </a>
            )}
          </div>
        </>
      )}
    </section>
  )
}
