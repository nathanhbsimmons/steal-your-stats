'use client'

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import useSWR from 'swr'
import { usePlayer } from '@/lib/contexts/player-context'
import { TimelineStrip } from '@/components/ui/timeline-strip'
import { formatArchiveTrackName } from '@/lib/hooks/use-audio-player'
import { formatDuration } from '@/lib/utils'

interface ShowSet {
  name: string
  encore: boolean
  songs: string[]
  segues?: boolean[]
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

function recordingTypeLabel(type: string): string {
  if (type === 'sbd') return 'SBD'
  if (type === 'aud') return 'AUD'
  if (type === 'matrix') return 'Matrix'
  return '?'
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

  const { enqueueEntireShow, enqueueShowTrack, playShowTrack, pause, currentTrack, isPlaying } = usePlayer()

  const [queuedSet, setQueuedSet] = useState<Set<number>>(new Set())
  const [flashIdx, setFlashIdx] = useState<number | null>(null)
  const [isEnqueuing, setIsEnqueuing] = useState(false)

  interface ArchiveTrackInfo { name: string; title?: string; duration?: number; url: string }
  interface ArchiveRecording {
    identifier: string
    archiveTitle?: string
    tracks: ArchiveTrackInfo[]
  }
  interface RecordingCandidate { identifier: string; title: string; recordingType: string; score: number }
  const [archiveRecording, setArchiveRecording] = useState<ArchiveRecording | null>(null)
  const [archiveLoaded, setArchiveLoaded] = useState(false)
  const [candidates, setCandidates] = useState<RecordingCandidate[]>([])
  const [switchingRecording, setSwitchingRecording] = useState(false)
  const [showRecording, setShowRecording] = useState(false)

  // Which setlist.fm flat indices have a matching title in the archive recording.
  // null = archive not yet loaded (show pending shimmer).
  // Empty set = archive loaded but no title matches found.
  const archiveCoveredIndices = useMemo((): Set<number> | null => {
    if (!archiveLoaded || !data) return null
    if (!archiveRecording) return new Set<number>()
    const titledTracks = archiveRecording.tracks.filter(t => t.title)
    if (titledTracks.length === 0) return new Set<number>()
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
    const covered = new Set<number>()
    let i = 0
    for (const set of data.sets) {
      for (const song of set.songs) {
        const songNorm = norm(song)
        const found = titledTracks.some(t => {
          const titleNorm = norm(t.title!)
          return titleNorm.includes(songNorm) || songNorm.includes(titleNorm)
        })
        if (found) covered.add(i)
        i++
      }
    }
    return covered
  }, [archiveRecording, archiveLoaded, data])

  // Supplement setlist.fm segue markers with segues detected from Archive.org track titles.
  // Tapers often encode segues as "Song Name ->" which setlist.fm may not have recorded.
  const archiveSegueIndices = useMemo((): Set<number> => {
    if (!archiveRecording || !data) return new Set()
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
    const titledTracks = archiveRecording.tracks.filter(t => t.title)
    const segued = new Set<number>()
    let i = 0
    for (const set of data.sets) {
      for (const song of set.songs) {
        const songNorm = norm(song)
        const matched = titledTracks.find(t => {
          const titleNorm = norm(t.title!)
          return titleNorm.includes(songNorm) || songNorm.includes(titleNorm)
        })
        if (matched?.title?.trim().endsWith('>')) segued.add(i)
        i++
      }
    }
    return segued
  }, [archiveRecording, data])

  // Maps each flat song index to its matched archive track's duration (seconds).
  const archiveDurations = useMemo((): Map<number, number> => {
    if (!archiveRecording || !data) return new Map()
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
    const titledTracks = archiveRecording.tracks.filter(t => t.title && t.duration)
    const durations = new Map<number, number>()
    let i = 0
    for (const set of data.sets) {
      for (const song of set.songs) {
        const songNorm = norm(song)
        const matched = titledTracks.find(t => {
          const titleNorm = norm(t.title!)
          return titleNorm.includes(songNorm) || songNorm.includes(titleNorm)
        })
        if (matched?.duration) durations.set(i, matched.duration)
        i++
      }
    }
    return durations
  }, [archiveRecording, data])

  // Background fetch: resolve archive.org item + load tracks for display and comparison.
  // Runs after setlist.fm data loads; does not block the UI.
  useEffect(() => {
    if (!data) return
    let cancelled = false
    ;(async () => {
      try {
        const resolveRes = await fetch('/api/archive/resolve-show', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, venue: data.venue, city: data.city, totalSongs: data.totalSongs }),
        })
        if (!resolveRes.ok || cancelled) return
        const archiveData = await resolveRes.json()

        const tracksRes = await fetch('/api/archive/song-tracks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: archiveData.identifier, songTitle: '' }),
        })
        if (cancelled) return
        const { tracks } = tracksRes.ok ? await tracksRes.json() : { tracks: [] }

        const recording: ArchiveRecording = {
          identifier: archiveData.identifier,
          archiveTitle: archiveData.title,
          tracks: (tracks as ArchiveTrackInfo[]).filter(t => t.url),
        }
        setArchiveRecording(recording)
        if (Array.isArray(archiveData.candidates)) {
          setCandidates(archiveData.candidates)
        }
        // Auto-expand when the recording has significantly fewer tracks than the setlist
        if (recording.tracks.length > 0 && Math.abs(recording.tracks.length - data.totalSongs) > 2) {
          setShowRecording(true)
        }
      } catch {} finally {
        if (!cancelled) setArchiveLoaded(true)
      }
    })()
    return () => { cancelled = true }
  }, [data, date])

  const handlePlayShow = async (startFrom?: number) => {
    if (!data) return
    setIsEnqueuing(true)
    try {
      const songs = data.sets.flatMap(s => s.songs)
      await enqueueEntireShow(
        { date, venue: data.venue, city: data.city, identifier: archiveRecording?.identifier },
        { clearExisting: true, songs, startFrom },
      )
    } catch {
      // Archive.org may not have a recording for every show
    } finally {
      setIsEnqueuing(false)
    }
  }

  const handlePlaySingleSong = useCallback(async (flatIdx: number) => {
    if (!data) return
    const songs = data.sets.flatMap(s => s.songs)
    try {
      await playShowTrack(
        { date, venue: data.venue, city: data.city, identifier: archiveRecording?.identifier },
        flatIdx,
        songs,
      )
    } catch {}
  }, [data, date, archiveRecording, playShowTrack])

  const handlePlayArchiveTrack = useCallback(async (archiveIdx: number) => {
    if (!data) return
    try {
      await enqueueEntireShow(
        { date, venue: data.venue, city: data.city, identifier: archiveRecording?.identifier },
        { clearExisting: true, startFromArchiveIdx: archiveIdx },
      )
    } catch {}
  }, [data, date, archiveRecording, enqueueEntireShow])

  const handleSwitchRecording = useCallback(async (identifier: string) => {
    if (identifier === archiveRecording?.identifier || switchingRecording) return
    setSwitchingRecording(true)
    try {
      const tracksRes = await fetch('/api/archive/song-tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: identifier, songTitle: '' }),
      })
      const { tracks } = tracksRes.ok ? await tracksRes.json() : { tracks: [] }
      const cand = candidates.find(c => c.identifier === identifier)
      setArchiveRecording({
        identifier,
        archiveTitle: cand?.title,
        tracks: (tracks as ArchiveTrackInfo[]).filter(t => t.url),
      })
      setShowRecording(true)
    } catch {
      // leave archiveRecording unchanged
    } finally {
      setSwitchingRecording(false)
    }
  }, [archiveRecording?.identifier, candidates, switchingRecording])

  const handleAddToQueue = useCallback(async (e: React.MouseEvent, flatIdx: number) => {
    e.stopPropagation()
    if (!data) return
    setFlashIdx(flatIdx)
    setQueuedSet(prev => new Set([...prev, flatIdx]))
    setTimeout(() => setFlashIdx(null), 700)
    try {
      const songs = data.sets.flatMap(s => s.songs)
      await enqueueShowTrack(
        { date, venue: data.venue, city: data.city, identifier: archiveRecording?.identifier },
        flatIdx,
        songs,
      )
    } catch {}
  }, [data, date, archiveRecording, enqueueShowTrack])

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
              <button className="btn primary" onClick={() => handlePlayShow()} disabled={isEnqueuing} style={isEnqueuing ? { opacity: 0.7 } : undefined}>
                <span className="play-tri">{isEnqueuing ? '…' : '▶'}</span> {isEnqueuing ? 'Loading…' : 'Play entire show'}
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

      {/* Recording mismatch warning */}
      {data && archiveRecording !== null && archiveRecording.tracks.length > 0 &&
        Math.abs(archiveRecording.tracks.length - data.totalSongs) > 2 && (
        <div className="margin-note" style={{ marginTop: 8, borderColor: 'var(--rust)' }}>
          <span className="head" style={{ color: 'var(--rust)' }}>Recording note</span>
          Archive.org lists {archiveRecording.tracks.length} tracks; setlist.fm shows {data.totalSongs}.
          The audio recording may not match this setlist exactly — see the recording
          section below for actual track titles.
        </div>
      )}

      {/* Timeline strip */}
      {data && data.sets.length > 0 && (
        <TimelineStrip
          sets={data.sets}
          showDate={date}
          onPlayFrom={handlePlayShow}
        />
      )}

      {/* Setlist */}
      {data && (
        <>
          <div className="setlist">
            {(() => {
              let flatIdx = 0
              return data.sets.map((set, si) => {
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
                    const songFlatIdx = flatIdx++
                    const isCurrentSong = currentTrack?.name?.toLowerCase().includes(song.toLowerCase())
                    const pending = archiveCoveredIndices === null
                    const inArchive = !pending && archiveCoveredIndices!.has(songFlatIdx)
                    const hasSegue = set.segues?.[ji] === true || archiveSegueIndices.has(songFlatIdx)
                    return (
                      <div
                        key={ji}
                        className={`track${isCurrentSong && isPlaying ? ' playing' : ''}${pending ? ' pending' : ''}`}
                        onClick={inArchive ? () => { if (isCurrentSong && isPlaying) { pause() } else { void handlePlaySingleSong(songFlatIdx) } } : undefined}
                        style={!inArchive && !pending ? { cursor: 'default', opacity: 0.4 } : undefined}
                      >
                        <span className="num">{String(ji + 1).padStart(2, '0')}</span>
                        <span
                          className="play-dot"
                          style={!inArchive && !pending ? { visibility: 'hidden' } : undefined}
                        >
                          {isCurrentSong && isPlaying ? '❚❚' : '▶'}
                        </span>
                        <Link
                          href={`/song/${encodeURIComponent(song)}`}
                          className="title"
                          onClick={e => e.stopPropagation()}
                          style={{ textDecoration: 'none', display: 'block' }}
                        >
                          {song}{hasSegue && <span style={{ fontFamily: 'var(--mono)', fontSize: 16, color: 'var(--rust)', marginLeft: 8, fontWeight: 500 }}>→</span>}
                        </Link>
                        <Link
                          href={`/song/${encodeURIComponent(song)}`}
                          className="chev"
                          onClick={e => e.stopPropagation()}
                        >go to song ↗</Link>
                        <span className="dur">
                          {archiveDurations.has(songFlatIdx) ? formatDuration(archiveDurations.get(songFlatIdx)!) : ''}
                        </span>
                        {inArchive ? (
                          <button
                            className={`add-q${flashIdx === songFlatIdx ? ' flash' : queuedSet.has(songFlatIdx) ? ' queued' : ''}`}
                            title="Add to queue"
                            onClick={e => handleAddToQueue(e, songFlatIdx)}
                          >+</button>
                        ) : (
                          <span style={{ width: 26, display: 'inline-block' }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })
            })()}
          </div>

          {/* Archive.org recording section */}
          {archiveRecording && (() => {
            const currentCandidate = candidates.find(c => c.identifier === archiveRecording.identifier)
            const altCandidates = candidates.filter(c => c.identifier !== archiveRecording.identifier)
            const typeLabel = currentCandidate ? recordingTypeLabel(currentCandidate.recordingType) : null
            return (
              <div style={{ marginTop: 16, border: '2px solid var(--gray)', borderRadius: 12, overflow: 'hidden' }}>
                <button
                  onClick={() => setShowRecording(s => !s)}
                  style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '10px 14px', background: 'none',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    borderBottom: showRecording ? '2px solid var(--gray)' : 'none',
                  }}
                >
                  <div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>
                      Archive.org Recording
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink)', marginTop: 2 }}>
                      {archiveRecording.identifier}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0, marginLeft: 12 }}>
                    {typeLabel && (
                      <span style={{ border: '1px solid var(--gray)', borderRadius: 4, padding: '1px 5px', fontSize: 10, fontWeight: 600, color: 'var(--ink)' }}>
                        {typeLabel}
                      </span>
                    )}
                    {altCandidates.length > 0 && (
                      <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                        +{altCandidates.length} more
                      </span>
                    )}
                    <span>{archiveRecording.tracks.length} tracks</span>
                    <span>{showRecording ? '▲' : '▼'}</span>
                  </div>
                </button>

                {showRecording && (
                  <div>
                    {/* Recording picker — shown when multiple recordings exist for this date */}
                    {altCandidates.length > 0 && (
                      <div style={{ padding: '8px 14px 10px', borderBottom: '1px solid var(--gray)', background: 'var(--paper)' }}>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.08em', color: 'var(--ink-3)', textTransform: 'uppercase', marginBottom: 6 }}>
                          Switch recording
                        </div>
                        {altCandidates.map(c => (
                          <div key={c.identifier} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, border: '1px solid var(--gray)', borderRadius: 4, padding: '1px 5px', flexShrink: 0, color: 'var(--ink)' }}>
                              {recordingTypeLabel(c.recordingType)}
                            </span>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                              {c.identifier}
                            </span>
                            <button
                              onClick={() => handleSwitchRecording(c.identifier)}
                              disabled={switchingRecording}
                              style={{ fontFamily: 'var(--mono)', fontSize: 10, color: switchingRecording ? 'var(--ink-3)' : 'var(--rust)', background: 'none', border: 'none', cursor: switchingRecording ? 'default' : 'pointer', flexShrink: 0, padding: '2px 0' }}
                            >
                              {switchingRecording ? '...' : 'switch →'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {archiveRecording.tracks.map((track, i) => {
                      const displayName = track.title
                        || formatArchiveTrackName(track.name.replace(/\.mp3$/i, ''))
                      const isCurrentArchiveTrack = currentTrack?.url === track.url
                      return (
                        <div
                          key={i}
                          className={`track${isCurrentArchiveTrack && isPlaying ? ' playing' : ''}`}
                          onClick={() => handlePlayArchiveTrack(i)}
                          style={{ opacity: 0.9 }}
                        >
                          <span className="num">{String(i + 1).padStart(2, '0')}</span>
                          <span className="play-dot">{isCurrentArchiveTrack && isPlaying ? '❚❚' : '▶'}</span>
                          <span className="title" style={{ fontStyle: track.title ? 'normal' : 'italic' }}>
                            {displayName}
                          </span>
                          <span className="chev" style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
                            {track.duration ? formatDuration(track.duration) : '—'}
                          </span>
                        </div>
                      )
                    })}
                    <div style={{ padding: '8px 14px', fontSize: 11, fontFamily: 'var(--mono)', textAlign: 'right', borderTop: '1px solid var(--gray)' }}>
                      <a
                        href={`https://archive.org/details/${archiveRecording.identifier}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--rust)' }}
                      >
                        View on Archive.org ↗
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          <div className="margin-note" style={{ marginTop: 18 }}>
            <span className="head">Provenance</span>
            Performance data sourced from setlist.fm. Audio recordings from Archive.org from community-contributed soundboard and audience tapes.{' '}
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
