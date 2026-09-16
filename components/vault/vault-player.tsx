'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePlayer } from '@/lib/contexts/player-context'
import { getOfficialReleasesForDate } from '@/lib/official-releases'
import { ReleaseBadge } from '@/components/ui/release-badge'

function formatTime(secs: number): string {
  if (!isFinite(secs) || isNaN(secs) || secs < 0) return '0:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Survives a same-tab reload (sessionStorage), dies on real tab close/new session —
// so it only kicks in for the involuntary hard-reload Next.js does when a tab's
// build manifest goes stale after a fresh deploy, never for a genuine fresh visit.
const RESUME_KEY = 'steal-your-stats-resume-playback'

function formatQueueTime(tracks: Array<{ duration?: number }>): string {
  const total = tracks.reduce((s, t) => s + (t.duration ?? 0), 0)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = Math.floor(total % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
  return `${m}:${s.toString().padStart(2,'0')}`
}

export function VaultPlayer() {
  const { currentTrack, isPlaying, queue, play, pause, next, previous } = usePlayer()
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.72)
  const [showQueue, setShowQueue] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const pathname = usePathname()
  const queueToggleRef = useRef<HTMLButtonElement>(null)

  // Load new src when track URL changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    setCurrentTime(0)
    setDuration(0)
    audio.src = currentTrack?.url ?? ''
    if (currentTrack?.url) audio.load()
  }, [currentTrack?.url])

  // Snapshot playback position right before an unload. Only matters for the
  // involuntary reload Next.js triggers on a stale build after a deploy — a
  // real navigation-away doesn't need this since the audio just keeps playing.
  useEffect(() => {
    const handleUnload = () => {
      const audio = audioRef.current
      if (!audio || !isPlaying || !currentTrack) return
      try {
        sessionStorage.setItem(RESUME_KEY, JSON.stringify({
          trackId: currentTrack.id, time: audio.currentTime, ts: Date.now(),
        }))
      } catch {}
    }
    window.addEventListener('pagehide', handleUnload)
    window.addEventListener('beforeunload', handleUnload)
    return () => {
      window.removeEventListener('pagehide', handleUnload)
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [isPlaying, currentTrack])

  // Resume across that reload: restore position and continue playing if the
  // snapshot is fresh and still points at the same track.
  const resumedRef = useRef(false)
  useEffect(() => {
    if (resumedRef.current || !currentTrack) return
    const audio = audioRef.current
    if (!audio) return
    let raw: string | null
    try {
      raw = sessionStorage.getItem(RESUME_KEY)
    } catch { return }
    if (!raw) return
    resumedRef.current = true
    try { sessionStorage.removeItem(RESUME_KEY) } catch {}
    const { trackId, time, ts } = JSON.parse(raw)
    if (trackId !== currentTrack.id || Date.now() - ts > 15000) return
    const onLoaded = () => {
      audio.currentTime = time
      play()
      audio.removeEventListener('loadedmetadata', onLoaded)
    }
    audio.addEventListener('loadedmetadata', onLoaded)
  }, [currentTrack, play])

  // Attach time/duration/ended listeners (stable — ref never changes)
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => {
      setCurrentTime(audio.currentTime)
      window.dispatchEvent(new CustomEvent('vault-time-update', {
        detail: { currentTime: audio.currentTime, duration: audio.duration || 0 }
      }))
    }
    const onDur  = () => {
      setDuration(audio.duration || 0)
      window.dispatchEvent(new CustomEvent('vault-time-update', {
        detail: { currentTime: audio.currentTime, duration: audio.duration || 0 }
      }))
    }
    const onEnd  = () => next()
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('durationchange', onDur)
    audio.addEventListener('loadedmetadata', onDur)
    audio.addEventListener('ended', onEnd)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('durationchange', onDur)
      audio.removeEventListener('loadedmetadata', onDur)
      audio.removeEventListener('ended', onEnd)
    }
  }, [next])

  // Sync isPlaying → audio.play() / audio.pause()
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying && currentTrack?.url) {
      audio.play().catch(err => { if (err.name !== 'AbortError') console.error('[VaultPlayer]', err) })
    } else {
      audio.pause()
    }
  }, [isPlaying, currentTrack?.url])

  useEffect(() => {
    const audio = audioRef.current
    if (audio) audio.volume = volume
  }, [volume])

  // Media Session API — gives iOS/Android native controls proper metadata
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.name,
      artist: 'Grateful Dead',
      album: `${currentTrack.showDate ?? ''}${currentTrack.venue ? ` · ${currentTrack.venue}` : ''}`,
      artwork: [{ src: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
    })
  }, [currentTrack])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.setActionHandler('play', play)
    navigator.mediaSession.setActionHandler('pause', pause)
    navigator.mediaSession.setActionHandler('nexttrack', next)
    navigator.mediaSession.setActionHandler('previoustrack', previous)
    return () => {
      navigator.mediaSession.setActionHandler('play', null)
      navigator.mediaSession.setActionHandler('pause', null)
      navigator.mediaSession.setActionHandler('nexttrack', null)
      navigator.mediaSession.setActionHandler('previoustrack', null)
    }
  }, [play, pause, next, previous])

  useEffect(() => {
    const seekByHandler = (e: Event) => {
      const { seconds } = (e as CustomEvent<{ seconds: number }>).detail
      const audio = audioRef.current
      if (audio) audio.currentTime = Math.max(0, audio.currentTime + seconds)
    }
    const seekToHandler = (e: Event) => {
      const { fraction } = (e as CustomEvent<{ fraction: number }>).detail
      const audio = audioRef.current
      if (audio && audio.duration > 0) audio.currentTime = fraction * audio.duration
    }
    window.addEventListener('vault-seek-by', seekByHandler)
    window.addEventListener('vault-seek-to-fraction', seekToHandler)
    return () => {
      window.removeEventListener('vault-seek-by', seekByHandler)
      window.removeEventListener('vault-seek-to-fraction', seekToHandler)
    }
  }, [])

  // Close queue on navigation — no refocus; focus should follow the navigation, not
  // jump back to a toggle button that may no longer be relevant on the new page.
  useEffect(() => { setShowQueue(false) }, [pathname])

  // Explicit dismiss (Escape / close button): close and return focus to the toggle.
  // Distinct from the outside-click and navigation closes below, which just hide the
  // drawer without stealing focus from whatever the user was interacting with.
  const closeQueueAndRefocus = () => {
    setShowQueue(false)
    queueToggleRef.current?.focus()
  }

  // Close queue on click outside (exclude the player bar, queue drawer, play/add-queue buttons)
  useEffect(() => {
    if (!showQueue) return
    const handleMouseDown = (e: MouseEvent) => {
      let el = e.target as Element | null
      while (el) {
        if (
          el.classList.contains('vault-queue') ||
          el.classList.contains('vault-player') ||
          el.classList.contains('tbl-play') ||
          el.classList.contains('add-q') ||
          el.getAttribute('data-queue-safe') === 'true'
        ) return
        el = el.parentElement
      }
      setShowQueue(false)
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [showQueue])

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  const onSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const t = parseFloat(e.target.value)
    audio.currentTime = t
    setCurrentTime(t)
  }

  const releases = useMemo(
    () => currentTrack?.showDate ? getOfficialReleasesForDate(currentTrack.showDate) : [],
    [currentTrack?.showDate]
  )

  return (
    <>
      {/* Hidden audio element — controlled via audioRef. Instrumental/live
          concert audio with no dialogue track, so no caption track applies. */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} preload="metadata" style={{ display: 'none' }} />
      <div className="vault-player">
        <div className="inner">
          {/* Now playing */}
          <div className="now">
            <div className="meta">
              <div className="title">
                {currentTrack
                  ? currentTrack.name
                  : <span style={{ color: 'var(--ink-3)', fontStyle: 'italic', fontSize: 16 }}>nothing in the deck</span>
                }
              </div>
              <div className="sub" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {currentTrack &&
                  <span className="sub-text">{currentTrack.showDate} · {currentTrack.venue}</span>
                }
                {releases.length > 0 &&
                  <span style={{ flexShrink: 0, display: 'inline-flex' }}>
                    <ReleaseBadge releases={releases} size="xs" variant="icon" />
                  </span>
                }
              </div>
              {currentTrack && (
                <Link
                  href={`/show/${currentTrack.showDate}`}
                  style={{
                    fontFamily: 'var(--mono)', fontSize: '10px', letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: 'var(--rust)', textDecoration: 'none',
                    display: 'block', marginTop: 2,
                  }}
                >
                  go to show ↗
                </Link>
              )}
            </div>
          </div>

          {/* Transport */}
          <div className="transport">
            <div className="ctrls">
              <button className="iconbtn" onClick={previous} aria-label="Previous">◀◀</button>
              <button
                className="iconbtn play"
                onClick={isPlaying ? pause : play}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? '❚❚' : '▶'}
              </button>
              <button className="iconbtn" onClick={next} aria-label="Next">▶▶</button>
            </div>
            <div className="progress">
              <span className="time">{formatTime(currentTime)}</span>
              <div className="bar">
                <div className="track-rule" />
                <div className="ticks">
                  {Array.from({ length: 11 }).map((_, i) => <span key={i} />)}
                </div>
                <div className="fill" style={{ width: `${pct}%` }} />
                <input
                  type="range"
                  className="bar-input"
                  min={0}
                  max={duration || 0}
                  step={1}
                  value={currentTime}
                  onChange={onSeekChange}
                  aria-label="Seek"
                  aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
                />
              </div>
              <span className="time right">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right controls */}
          <div className="right-ctrls">
            <div className="vol">
              <span className="vol-label">VOL</span>
              <div className="slider">
                <div className="rule" />
                <div className="fill" style={{ width: `${volume * 100}%` }} />
                <input
                  type="range"
                  className="vol-input"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={e => setVolume(parseFloat(e.target.value))}
                  aria-label="Volume"
                  aria-valuetext={`${Math.round(volume * 100)}%`}
                />
              </div>
            </div>
            <button
              ref={queueToggleRef}
              className={`toggleq${showQueue ? ' active' : ''}`}
              onClick={() => setShowQueue(s => !s)}
              aria-expanded={showQueue}
              aria-controls="vault-queue-drawer"
            >
              Queue <span className="badge">{queue.length}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Queue drawer (conditionally shown) */}
      {showQueue && <VaultQueueDrawer onClose={closeQueueAndRefocus} />}
    </>
  )
}

function VaultQueueDrawer({ onClose }: { onClose: () => void }) {
  const { queue, currentTrack, selectTrack, removeFromQueue, clearQueue } = usePlayer()
  const currentIdx = currentTrack ? queue.findIndex(t => t.id === currentTrack.id) : -1
  const drawerRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  // Move focus into the drawer on open
  useEffect(() => {
    closeBtnRef.current?.focus()
  }, [])

  // Escape closes the drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div id="vault-queue-drawer" className="vault-queue" ref={drawerRef} role="region" aria-label="Play queue">
      <header>
        <div>
          <h4>Queue{' '}
            <span className="sub">{queue.length} TRACKS · {formatQueueTime(queue)}</span>
          </h4>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            ref={closeBtnRef}
            type="button"
            className="close-btn queue-dismiss-btn"
            onClick={onClose}
            aria-label="Close queue"
          >×</button>
        </div>
      </header>
      <div className="list">
        {queue.length === 0 && (
          <div style={{ padding: '22px 16px', textAlign: 'center', color: 'var(--ink-3)', fontStyle: 'italic' }}>
            The deck is empty. Cue a track to begin.
          </div>
        )}
        {queue.map((t, i) => (
          <div
            key={t.id + i}
            className={`qrow${i === currentIdx ? ' current' : ''}`}
          >
            <button
              type="button"
              className="qrow-btn"
              onClick={() => selectTrack(t)}
              aria-label={`Play track ${i + 1}: ${t.name}`}
              aria-current={i === currentIdx ? 'true' : undefined}
            >
              <span className="qnum">{String(i + 1).padStart(2, '0')}</span>
              <span>
                <div className="qtitle">{t.name}</div>
                <div className="qsub">{t.showDate} · {t.venue}</div>
              </span>
              <span className="qdur">{t.duration ? formatTime(t.duration) : '—'}</span>
            </button>
            <button
              type="button"
              className="qx"
              onClick={e => { e.stopPropagation(); removeFromQueue(t.id) }}
              aria-label={`Remove ${t.name} from queue`}
            >×</button>
          </div>
        ))}
      </div>
      <footer>
        <span>{queue.length} cued</span>
        <button onClick={() => clearQueue()}>Clear queue</button>
      </footer>
    </div>
  )
}
