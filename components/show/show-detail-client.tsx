'use client'

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { usePlayer } from '@/lib/contexts/player-context'
import { TimelineStrip } from '@/components/ui/timeline-strip'
import { formatArchiveTrackName } from '@/lib/hooks/use-audio-player'
import { formatDuration } from '@/lib/utils'
import { matchArchiveTracksToSetlist, formatBonusTrackTitle, deriveBonusSectionLabel } from '@/lib/archive-track-match'
import type { ArchiveTrackPayload, ArchiveSetlistMatch, ShowDetail } from '@/lib/show-of-the-day-types'

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

export function ShowDetailClient({ date, initialShow }: { date: string; initialShow: ShowDetail }) {
  const show = initialShow

  const { enqueueEntireShow, enqueueShowTrack, playShowTrack, pause, currentTrack, isPlaying, prependToQueue, selectTrack, addToQueue } = usePlayer()

  const [queuedSet, setQueuedSet] = useState<Set<number>>(new Set())
  const [flashIdx, setFlashIdx] = useState<number | null>(null)
  const [isEnqueuing, setIsEnqueuing] = useState(false)
  const [showBonus, setShowBonus] = useState(false)

  interface ArchiveRecording {
    identifier: string
    archiveTitle?: string
    description?: string | null
    tracks: ArchiveTrackPayload[]
  }
  interface RecordingCandidate { identifier: string; title: string; recordingType: string; score: number }
  const [archiveRecording, setArchiveRecording] = useState<ArchiveRecording | null>(null)
  const [archiveLoaded, setArchiveLoaded] = useState(false)
  const [candidates, setCandidates] = useState<RecordingCandidate[]>([])
  const [switchingRecording, setSwitchingRecording] = useState(false)
  const [showRecording, setShowRecording] = useState(false)

  // Matches archive tracks against the setlist. null = archive not yet loaded
  // (show pending shimmer). Tracks that don't match any song (banter, tuning,
  // a bundled soundcheck, etc.) end up in `bonus` instead of the setlist.
  const archiveMatch = useMemo((): ArchiveSetlistMatch | null => {
    if (!archiveLoaded) return null
    const setlistSongs = show.sets.flatMap(s => s.songs)
    if (!archiveRecording) return { matched: setlistSongs.map((song, flatIdx) => ({ song, flatIdx, track: null })), bonus: [] }
    return matchArchiveTracksToSetlist(archiveRecording.tracks, setlistSongs)
  }, [archiveLoaded, archiveRecording, show])

  const archiveCoveredIndices = useMemo((): Set<number> | null => {
    if (!archiveMatch) return null
    return new Set(archiveMatch.matched.filter(m => m.track).map(m => m.flatIdx))
  }, [archiveMatch])

  const archiveSegueIndices = useMemo((): Set<number> => {
    if (!archiveMatch) return new Set()
    return new Set(archiveMatch.matched.filter(m => m.track?.title?.trim().endsWith('>')).map(m => m.flatIdx))
  }, [archiveMatch])

  const archiveDurations = useMemo((): Map<number, number> => {
    if (!archiveMatch) return new Map()
    return new Map(archiveMatch.matched.filter(m => m.track?.duration).map(m => [m.flatIdx, m.track!.duration!]))
  }, [archiveMatch])

  // Background fetch: resolve archive.org item + load tracks for display and comparison.
  // Runs after mount; does not block the UI. Skipped below the 767px breakpoint
  // where this route is CSS-hidden behind MobileShell, which does its own
  // equivalent fetch — avoids firing the same archive.org round trip twice.
  useEffect(() => {
    if (typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 767px)').matches) {
      setArchiveLoaded(true)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const resolveRes = await fetch('/api/archive/resolve-show', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date, venue: show.venue, city: show.city, totalSongs: show.totalSongs }),
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
          description: archiveData.description ?? null,
          tracks: (tracks as ArchiveTrackPayload[]).filter(t => t.url),
        }
        setArchiveRecording(recording)
        if (Array.isArray(archiveData.candidates)) {
          setCandidates(archiveData.candidates)
        }
        // Auto-expand when the recording has significantly fewer tracks than the setlist
        if (recording.tracks.length > 0 && Math.abs(recording.tracks.length - show.totalSongs) > 2) {
          setShowRecording(true)
        }
      } catch {} finally {
        if (!cancelled) setArchiveLoaded(true)
      }
    })()
    return () => { cancelled = true }
  }, [show, date])

  const handlePlayShow = async (startFrom?: number) => {
    setIsEnqueuing(true)
    try {
      const songs = show.sets.flatMap(s => s.songs)
      await enqueueEntireShow(
        { date, venue: show.venue, city: show.city, identifier: archiveRecording?.identifier },
        { clearExisting: true, songs, startFrom },
      )
    } catch {
      // Archive.org may not have a recording for every show
    } finally {
      setIsEnqueuing(false)
    }
  }

  const handlePlaySingleSong = useCallback(async (flatIdx: number) => {
    const songs = show.sets.flatMap(s => s.songs)
    try {
      await playShowTrack(
        { date, venue: show.venue, city: show.city, identifier: archiveRecording?.identifier },
        flatIdx,
        songs,
      )
    } catch {}
  }, [show, date, archiveRecording, playShowTrack])

  const handlePlayArchiveTrack = useCallback(async (archiveIdx: number) => {
    try {
      await enqueueEntireShow(
        { date, venue: show.venue, city: show.city, identifier: archiveRecording?.identifier },
        { clearExisting: true, startFromArchiveIdx: archiveIdx },
      )
    } catch {}
  }, [show, date, archiveRecording, enqueueEntireShow])

  const handlePlayBonusTrack = useCallback((archiveTrack: ArchiveTrackPayload) => {
    const track = {
      id: archiveTrack.id,
      name: formatBonusTrackTitle(archiveTrack),
      url: archiveTrack.url,
      duration: archiveTrack.duration,
      showDate: date,
      venue: show.venue,
      city: show.city,
      archiveItemId: archiveTrack.archiveItemId,
    }
    prependToQueue([track])
    selectTrack(track)
  }, [show, date, prependToQueue, selectTrack])

  const handleAddBonusTrack = useCallback((e: React.MouseEvent, archiveTrack: ArchiveTrackPayload) => {
    e.stopPropagation()
    addToQueue([{
      id: archiveTrack.id,
      name: formatBonusTrackTitle(archiveTrack),
      url: archiveTrack.url,
      duration: archiveTrack.duration,
      showDate: date,
      venue: show.venue,
      city: show.city,
      archiveItemId: archiveTrack.archiveItemId,
    }])
  }, [show, date, addToQueue])

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
        tracks: (tracks as ArchiveTrackPayload[]).filter(t => t.url),
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
    setFlashIdx(flatIdx)
    setQueuedSet(prev => new Set([...prev, flatIdx]))
    setTimeout(() => setFlashIdx(null), 700)
    try {
      const songs = show.sets.flatMap(s => s.songs)
      await enqueueShowTrack(
        { date, venue: show.venue, city: show.city, identifier: archiveRecording?.identifier },
        flatIdx,
        songs,
      )
    } catch {}
  }, [show, date, archiveRecording, enqueueShowTrack])

  const autoplayedRef = useRef(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const autoplay = new URLSearchParams(window.location.search).get('autoplay') === '1'
    if (autoplay && !autoplayedRef.current) {
      autoplayedRef.current = true
      void handlePlayShow()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const location = `${show.city}${show.state ? `, ${show.state}` : ''}, ${show.country}`

  let setIndex = 0

  return (
    <section className="col">
      {/* Breadcrumbs */}
      <div className="crumbs">
        <Link href="/">Home</Link>
        <span className="sep">/</span>
        <span className="cur">{date}</span>
        {show.setlistUrl && (
          <>
            <span className="sep" style={{ marginLeft: 'auto' }} />
            <a href={show.setlistUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto' }}>
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
            {formatDateLong(show.date)}
          </h2>
          <div className="lede" style={{ marginTop: 4 }}>
            <strong style={{ fontStyle: 'normal', color: 'var(--ink)' }}>{show.venue}</strong>
            {' · '}{location}
          </div>
        </div>
        <div className="toolbar">
          <span>{show.totalSongs} songs</span>
          <button className="btn primary" onClick={() => handlePlayShow()} disabled={isEnqueuing || !archiveLoaded} style={(isEnqueuing || !archiveLoaded) ? { opacity: 0.7 } : undefined}>
            <span className="play-tri">{isEnqueuing ? '…' : '▶'}</span> {isEnqueuing ? 'Loading…' : !archiveLoaded ? 'Loading…' : 'Play entire show'}
          </button>
        </div>
      </div>

      {/* Recording mismatch warning — only when setlist songs are actually
          missing from the tape, not when the tape just has extra bonus
          material (handled by the bonus section below). */}
      {archiveMatch && archiveMatch.matched.filter(m => !m.track).length > 2 && (
        <div className="margin-note" style={{ marginTop: 8, borderColor: 'var(--rust)' }}>
          <span className="head" style={{ color: 'var(--rust)' }}>Recording note</span>
          {archiveMatch.matched.filter(m => !m.track).length} of {archiveMatch.matched.length} songs
          couldn&apos;t be matched to a track on this recording — see the recording
          section below for actual track titles.
        </div>
      )}

      {/* Timeline strip */}
      {show.sets.length > 0 && (
        <TimelineStrip
          sets={show.sets}
          showDate={date}
          onPlayFrom={handlePlayShow}
        />
      )}

      {/* Setlist */}
      {(() => {
        let flatOffset = 0
        return (
          <div className="setlist">
            {show.sets.map((set, si) => {
              const isEncore = set.encore
              const romanIdx = isEncore ? si : setIndex++
              const roman = isEncore ? 'E.' : SET_ROMANS[romanIdx] ?? String(romanIdx + 1)
              const setOffset = flatOffset
              flatOffset += set.songs.length
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
                    const songFlatIdx = setOffset + ji
                    const isCurrentSong = currentTrack?.name?.toLowerCase().includes(song.toLowerCase())
                    const pending = archiveCoveredIndices === null
                    const inArchive = !pending && archiveCoveredIndices!.has(songFlatIdx)
                    const hasSegue = set.segues?.[ji] === true || archiveSegueIndices.has(songFlatIdx)
                    return (
                      <div
                        key={`s${ji}`}
                        className={`track${isCurrentSong && isPlaying ? ' playing' : ''}${pending ? ' pending' : ''}`}
                        onClick={inArchive ? () => { if (isCurrentSong && isPlaying) { pause() } else { void handlePlaySingleSong(songFlatIdx) } } : undefined}
                        style={!inArchive && !pending && archiveRecording !== null ? { cursor: 'default', opacity: 0.4 } : undefined}
                        data-queue-safe={inArchive ? 'true' : undefined}
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
            })}
          </div>
        )
      })()}

      {/* Bonus tracks (soundcheck, banter, etc.) bundled in the recording but not part of the setlist */}
      {archiveMatch && archiveMatch.bonus.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <button
            onClick={() => setShowBonus(s => !s)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',
              background: 'none', border: '2px solid var(--gray)', borderRadius: 12, padding: '10px 14px',
              cursor: 'pointer', font: 'inherit', fontSize: 14,
            }}
          >
            <span>+ {deriveBonusSectionLabel(archiveMatch.bonus, archiveRecording?.description)} ({archiveMatch.bonus.length} tracks)</span>
            <span>{showBonus ? '▲' : '▼'}</span>
          </button>
          {showBonus && (
            <div className="setlist" style={{ marginTop: 4 }}>
              <div className="set-block">
                {archiveMatch.bonus.map(track => {
                  const displayName = formatBonusTrackTitle(track)
                  const isCurrentBonus = currentTrack?.url === track.url
                  return (
                    <div
                      key={track.id}
                      className={`track${isCurrentBonus && isPlaying ? ' playing' : ''}`}
                      onClick={() => { if (isCurrentBonus && isPlaying) { pause() } else { handlePlayBonusTrack(track) } }}
                      data-queue-safe="true"
                    >
                      <span className="num" style={{ opacity: 0.35, fontSize: 13 }}>·</span>
                      <span className="play-dot">{isCurrentBonus && isPlaying ? '❚❚' : '▶'}</span>
                      <span className="title" style={{ fontStyle: 'italic', display: 'block' }}>{displayName}</span>
                      <span className="chev" />
                      <span className="dur">{track.duration ? formatDuration(track.duration) : ''}</span>
                      <button
                        className="add-q"
                        title="Add to queue"
                        onClick={e => handleAddBonusTrack(e, track)}
                      >+</button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

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
        {show.setlistUrl && (
          <a href={show.setlistUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rust)' }}>
            View on setlist.fm ↗
          </a>
        )}
      </div>
    </section>
  )
}
