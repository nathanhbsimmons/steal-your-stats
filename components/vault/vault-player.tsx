'use client'

import React, { useState, useEffect, useRef } from 'react'
import { usePlayer } from '@/lib/contexts/player-context'

function formatTime(secs: number): string {
  if (!isFinite(secs) || isNaN(secs) || secs < 0) return '0:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

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
  const barRef = useRef<HTMLDivElement>(null)
  const volRef = useRef<HTMLDivElement>(null)

  // Load new src when track URL changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    setCurrentTime(0)
    setDuration(0)
    audio.src = currentTrack?.url ?? ''
    if (currentTrack?.url) audio.load()
  }, [currentTrack?.url])

  // Attach time/duration/ended listeners (stable — ref never changes)
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setCurrentTime(audio.currentTime)
    const onDur  = () => setDuration(audio.duration || 0)
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

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  const onBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const fraction = (e.clientX - rect.left) / rect.width
    const audio = audioRef.current
    if (audio && duration > 0) audio.currentTime = fraction * duration
  }

  const onVolClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const v = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setVolume(v)
  }

  const queueIndex = currentTrack ? queue.findIndex(t => t.id === currentTrack.id) : -1

  return (
    <>
      {/* Hidden audio element — controlled via audioRef */}
      <audio ref={audioRef} preload="metadata" style={{ display: 'none' }} />
      <div className="vault-player">
        <div className="inner">
          {/* Now playing */}
          <div className="now">
            <div className={`stamp${isPlaying ? ' spinning' : ''}`}>
              <div className="ring" />
            </div>
            <div className="meta">
              <div className="title">
                {currentTrack
                  ? currentTrack.name
                  : <span style={{ color: 'var(--ink-3)', fontStyle: 'italic', fontSize: 16 }}>nothing in the deck</span>
                }
              </div>
              <div className="sub">
                {currentTrack
                  ? <>{currentTrack.showDate} · {currentTrack.venue} · <span className="live">REEL TO REEL</span></>
                  : <>cue a show to begin · <span style={{ color: 'var(--rust)' }}>play the featured tape</span></>
                }
              </div>
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
              <div className="bar" ref={barRef} onClick={onBarClick}>
                <div className="track-rule" />
                <div className="ticks">
                  {Array.from({ length: 11 }).map((_, i) => <span key={i} />)}
                </div>
                <div className="fill" style={{ width: `${pct}%` }} />
                <div className="needle" style={{ left: `${pct}%` }} />
              </div>
              <span className="time right">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right controls */}
          <div className="right-ctrls">
            <div className="vol">
              <span className="vol-label">VOL</span>
              <div className="slider" ref={volRef} onClick={onVolClick}>
                <div className="rule" />
                <div className="fill" style={{ width: `${volume * 100}%` }} />
                <div className="knob" style={{ left: `${volume * 100}%` }} />
              </div>
            </div>
            <button
              className={`toggleq${showQueue ? ' active' : ''}`}
              onClick={() => setShowQueue(s => !s)}
            >
              Queue <span className="badge">{queue.length}</span>
            </button>
          </div>
        </div>

        {/* Status row */}
        <div className="status-row">
          <span>
            {queue.length > 0
              ? isPlaying
                ? <><span className="lit"><span className="dot" />playing</span> · {queue.length} track{queue.length !== 1 ? 's' : ''} · {formatQueueTime(queue.slice(queueIndex + 1))} left</>
                : <>cued · {queue.length} track{queue.length !== 1 ? 's' : ''}</>
              : <>standby · no queue · click a setlist track to begin</>
            }
          </span>
          <span>
            {currentTrack
              ? `Track ${queueIndex + 1} / ${queue.length} · ${Math.round(volume * 100)} dB`
              : '—'
            }
          </span>
        </div>
      </div>

      {/* Queue drawer (conditionally shown) */}
      {showQueue && <VaultQueueDrawer onClose={() => setShowQueue(false)} />}
    </>
  )
}

function VaultQueueDrawer({ onClose }: { onClose: () => void }) {
  const { queue, currentTrack, selectTrack, removeFromQueue, clearQueue } = usePlayer()
  const currentIdx = currentTrack ? queue.findIndex(t => t.id === currentTrack.id) : -1

  return (
    <div className="vault-queue">
      <header>
        <div>
          <h4>Queue{' '}
            <span className="sub">{queue.length} TRACKS · {formatQueueTime(queue)}</span>
          </h4>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="close-btn queue-dismiss-btn" onClick={onClose}>×</button>
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
            onClick={() => selectTrack(t)}
          >
            <span className="qnum">{String(i + 1).padStart(2, '0')}</span>
            <span>
              <div className="qtitle">{t.name}</div>
              <div className="qsub">{t.showDate} · {t.venue}</div>
            </span>
            <span className="qdur">{t.duration ? formatTime(t.duration) : '—'}</span>
            <span
              className="qx"
              onClick={e => { e.stopPropagation(); removeFromQueue(t.id) }}
            >×</span>
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
