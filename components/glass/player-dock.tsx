'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Icon, ICONS } from './icons'
import { Track } from '@/components/ui/audio-player-dock'

interface PlayerDockProps {
  currentTrack?: Track | null
  isPlaying: boolean
  queue: Track[]
  onPlay: () => void
  onPause: () => void
  onNext: () => void
  onPrevious: () => void
  onClearAndPlayEntireShow?: () => void
  onSelectTrack?: (track: Track) => void
  onRemoveFromQueue?: (id: string) => void
  onClearQueue?: () => void
}

function formatTime(secs: number): string {
  if (!isFinite(secs) || isNaN(secs)) return '0:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatQueueDuration(tracks: Track[]): string {
  const total = tracks.reduce((sum, t) => sum + (t.duration || 0), 0)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = Math.floor(total % 60)
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function PlayerDock({
  currentTrack,
  isPlaying,
  queue,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onClearAndPlayEntireShow,
  onSelectTrack,
  onRemoveFromQueue,
  onClearQueue,
}: PlayerDockProps) {
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [queueOpen, setQueueOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const lastVolumeRef = useRef(1)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setCurrentTime(audio.currentTime)
    const onMeta = () => setDuration(audio.duration || 0)
    const onEnd = () => onNext()
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('ended', onEnd)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('ended', onEnd)
    }
  }, [currentTrack, onNext])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    setCurrentTime(0)
    setDuration(0)
    audio.load()
  }, [currentTrack?.url])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.play().catch(err => { if (err.name !== 'AbortError') console.error(err) })
    } else {
      audio.pause()
    }
  }, [isPlaying, currentTrack?.url])

  useEffect(() => {
    const audio = audioRef.current
    if (audio) audio.volume = volume
    if (volume > 0) lastVolumeRef.current = volume
  }, [volume])

  // Global keyboard shortcuts — guarded against input/textarea focus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
      if ((e.target as HTMLElement)?.isContentEditable) return
      switch (e.key) {
        case ' ':
          e.preventDefault()
          if (isPlaying) { onPause() } else { onPlay() }
          break
        case 'ArrowLeft':
          e.preventDefault()
          onPrevious()
          break
        case 'ArrowRight':
          e.preventDefault()
          onNext()
          break
        case 'm':
        case 'M':
          setVolume(v => v > 0 ? 0 : (lastVolumeRef.current || 1))
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isPlaying, onPlay, onPause, onNext, onPrevious])

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value)
    setCurrentTime(t)
    if (audioRef.current) audioRef.current.currentTime = t
  }

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  if (!currentTrack) {
    return (
      <div className="glass" style={{
        margin: '0 28px 22px',
        padding: '12px 18px',
        display: 'flex', alignItems: 'center', gap: 16,
        borderRadius: 'var(--r-lg)',
        flexShrink: 0,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 'var(--r-sm)',
          background: 'var(--glass-bg-faint)',
          border: '1px dashed var(--glass-border-strong)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--fg-4)', flexShrink: 0,
        }}>
          <Icon d={ICONS.music} size={18} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>No track selected</span>
          <span className="t-small">Tap any ▶ in the versions table, or &ldquo;Play longest version&rdquo; above.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="t-eyebrow">Shortcuts</span>
          <span className="kbd">Space</span>
          <span className="kbd">←</span>
          <span className="kbd">→</span>
          <span className="kbd">M</span>
        </div>
      </div>
    )
  }

  const dateFormatted = currentTrack.showDate?.replace(/-/g, '·') ?? ''

  return (
    <div style={{ margin: '0 28px 22px', display: 'flex', flexDirection: 'column', gap: 0, flexShrink: 0, position: 'relative' }}>
      {/* Queue panel — slides in above the dock */}
      {queueOpen && queue.length > 0 && (
        <div className="glass strong" style={{
          borderRadius: 'var(--r-lg) var(--r-lg) 0 0',
          borderBottom: '1px solid var(--glass-border)',
          maxHeight: 320,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Panel header — click anywhere to collapse */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setQueueOpen(false)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setQueueOpen(false) } }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px 10px', flexShrink: 0, cursor: 'pointer', userSelect: 'none' }}
          >
            <span className="t-h3" style={{ fontSize: 13 }}>Queue</span>
            <span className="t-eyebrow">{queue.length} tracks · {formatQueueDuration(queue)}</span>
            <span style={{ flex: 1 }} />
            {onClearQueue && (
              <button
                className="btn"
                style={{ padding: '4px 10px', fontSize: 11 }}
                onClick={e => { e.stopPropagation(); onClearQueue() }}
              >
                Clear all
              </button>
            )}
            <Icon d={ICONS.chevDown} size={14} style={{ color: 'var(--fg-3)', flexShrink: 0 }} />
          </div>
          {/* Track list */}
          <div className="scroll-hide" style={{ overflow: 'auto', flex: 1 }}>
            {queue.map((track, i) => {
              const isCurrent = track.id === currentTrack?.id
              return (
                <div
                  key={track.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '8px 18px',
                    background: isCurrent ? 'var(--accent-soft)' : 'transparent',
                    borderLeft: isCurrent ? '2px solid var(--accent)' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = 'var(--glass-bg)' }}
                  onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'transparent' }}
                  onClick={() => onSelectTrack?.(track)}
                >
                  <span className="t-mono" style={{ fontSize: 10.5, color: isCurrent ? 'var(--accent)' : 'var(--fg-4)', width: 22, flexShrink: 0 }}>
                    {isCurrent ? '▶' : String(i + 1).padStart(2, '0')}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: isCurrent ? 'var(--accent-strong)' : 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {track.name}
                    </div>
                    <div className="t-small t-mono" style={{ fontSize: 10, color: 'var(--fg-4)', marginTop: 1 }}>
                      {track.showDate?.replace(/-/g, '·')}{track.venue ? ` · ${track.venue}` : ''}
                    </div>
                  </div>
                  {track.duration && (
                    <span className="t-mono" style={{ fontSize: 11, color: 'var(--fg-3)', flexShrink: 0 }}>
                      {formatTime(track.duration)}
                    </span>
                  )}
                  {onRemoveFromQueue && (
                    <button
                      className="btn icon"
                      style={{ width: 24, height: 24, flexShrink: 0 }}
                      onClick={e => { e.stopPropagation(); onRemoveFromQueue(track.id) }}
                    >
                      <Icon d={ICONS.close} size={10} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Main dock */}
      <div className="glass strong" style={{
        padding: '14px 18px',
        display: 'flex', flexDirection: 'column', gap: 10,
        borderRadius: queueOpen && queue.length > 0 ? '0 0 var(--r-lg) var(--r-lg)' : 'var(--r-lg)',
        boxShadow: 'var(--shadow-lift), 0 0 0 1px var(--glass-border-strong)',
      }}>
        {currentTrack.url && (
          <audio ref={audioRef} preload="metadata">
            <source src={currentTrack.url} />
          </audio>
        )}

        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          {/* Artwork */}
          <div style={{
            width: 56, height: 56, flex: '0 0 56px',
            borderRadius: 'var(--r-sm)',
            background: 'radial-gradient(circle at 30% 30%, var(--accent), #6b3d12 70%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 18px -4px rgba(240,176,74,0.4)',
            position: 'relative', overflow: 'hidden',
          }}>
            <Icon d={ICONS.bolt} size={26} stroke={1.4} />
          </div>

          {/* Track info */}
          <div style={{ flex: '0 0 240px', display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: 13, color: 'var(--fg)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentTrack.name}
            </span>
            <span className="t-small t-mono">
              {dateFormatted}{currentTrack.venue ? ` · ${currentTrack.venue}` : ''}
            </span>
          </div>

          {/* Transport */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button className="btn icon" onClick={onPrevious}>
              <Icon d={ICONS.prev} size={15} fill="currentColor" stroke={0} />
            </button>
            <button
              className="btn primary icon"
              style={{ width: 44, height: 44 }}
              onClick={isPlaying ? onPause : onPlay}
            >
              <Icon d={isPlaying ? ICONS.pause : ICONS.play} size={15} fill="currentColor" stroke={0} />
            </button>
            <button className="btn icon" onClick={onNext}>
              <Icon d={ICONS.next} size={15} fill="currentColor" stroke={0} />
            </button>
          </div>

          {/* Scrubber */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="t-mono t-small">{formatTime(currentTime)}</span>
            <div style={{ flex: 1, position: 'relative', height: 4 }}>
              <div className="progress" style={{ position: 'absolute', inset: 0 }}>
                <div className="fill" style={{ width: `${pct}%`, position: 'relative' }}>
                  <span style={{
                    position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)',
                    width: 12, height: 12, borderRadius: '50%',
                    background: 'var(--accent-strong)',
                    boxShadow: '0 0 10px var(--accent), 0 0 0 3px rgba(240,176,74,0.2)',
                    pointerEvents: 'none',
                  }} />
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleScrub}
                style={{
                  position: 'absolute', inset: 0,
                  opacity: 0, cursor: 'pointer', width: '100%', height: '100%',
                }}
              />
            </div>
            <span className="t-mono t-small">{formatTime(duration)}</span>
          </div>

          {/* Volume */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 110px' }}>
            <span style={{ color: 'var(--fg-3)' }}>
              <Icon d={ICONS.volume} size={14} />
            </span>
            <div style={{ flex: 1, position: 'relative', height: 4 }}>
              <div className="progress" style={{ position: 'absolute', inset: 0 }}>
                <div className="fill" style={{ width: `${volume * 100}%` }} />
              </div>
              <input
                type="range" min={0} max={1} step={0.01} value={volume}
                onChange={e => setVolume(parseFloat(e.target.value))}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
              />
            </div>
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className="btn icon"
              style={{ color: queueOpen ? 'var(--accent)' : undefined }}
              onClick={() => setQueueOpen(v => !v)}
              title={`${queueOpen ? 'Hide' : 'Show'} queue (${queue.length} tracks)`}
            >
              <Icon d={ICONS.list} size={14} />
              {queue.length > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 7, height: 7, borderRadius: '50%',
                  background: 'var(--accent)', pointerEvents: 'none',
                }} />
              )}
            </button>
            <button className="btn icon" title="Fullscreen (coming soon)">
              <Icon d={ICONS.fullscreen} size={14} />
            </button>
          </div>
        </div>

        {/* Sub-row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 8, borderTop: '1px solid var(--glass-border)' }}>
          <span className="pill accent" style={{ fontSize: 10.5, padding: '3px 9px' }}>
            <span className="dot" />playing entire show
          </span>
          <span className="t-small t-mono">queue · {queue.length} tracks · {formatQueueDuration(queue)} left</span>
          <span style={{ flex: 1 }} />
          {currentTrack.licenseUrl && (
            <span className="t-small">
              CC BY-NC-SA 3.0 · <a href={currentTrack.licenseUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>License ↗</a>
            </span>
          )}
          {onClearAndPlayEntireShow && (
            <button className="btn" style={{ padding: '5px 11px', fontSize: 11.5 }} onClick={onClearAndPlayEntireShow}>
              Clear &amp; play entire show
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
