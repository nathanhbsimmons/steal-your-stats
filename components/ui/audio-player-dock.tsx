'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from './button'
import { Card } from './card'

export interface Track {
  id: string
  name: string
  url: string
  duration?: number
  showDate: string
  venue: string
  city: string
  archiveItemId: string
  licenseUrl?: string
  rights?: string
}

export interface AudioPlayerDockProps {
  currentTrack?: Track
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
  onNext: () => void
  onPrevious: () => void
  onTrackSelect?: (track: Track) => void
  onPlayEntireShow?: () => void
  className?: string
}

export function AudioPlayerDock({
  currentTrack,
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onPlayEntireShow,
  className = ''
}: AudioPlayerDockProps) {
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Update current time as audio plays
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration || 0)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
    }
  }, [currentTrack])

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.play().catch(console.error)
    } else {
      audio.pause()
    }
  }, [isPlaying, currentTrack])

  // Handle volume changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = volume
  }, [volume])

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      onPause()
    } else {
      onPlay()
    }
  }, [isPlaying, onPause, onPlay])

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard shortcuts when the audio player is focused or when no other input is focused
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          handlePlayPause()
          break
        case 'ArrowRight':
          e.preventDefault()
          onNext()
          break
        case 'ArrowLeft':
          e.preventDefault()
          onPrevious()
          break
        case 'KeyM':
          e.preventDefault()
          // Toggle mute
          if (audioRef.current) {
            audioRef.current.muted = !audioRef.current.muted
          }
          break
        case 'KeyF':
          e.preventDefault()
          // Toggle fullscreen (if supported)
          if (document.fullscreenElement) {
            document.exitFullscreen()
          } else {
            document.documentElement.requestFullscreen()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handlePlayPause, onNext, onPrevious])

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = parseFloat(e.target.value)
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value))
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!currentTrack) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center text-gray">
          <p className="text-sm">No track selected</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-4 ${className}`}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={currentTrack.url}
        preload="metadata"
        onEnded={onNext}
        onError={(e) => {
          console.error('Audio error:', e)
          onPause()
        }}
      />

      {/* Aria-live region for announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {isPlaying && currentTrack && `Now playing: ${currentTrack.name}`}
      </div>

      {/* Track info and Play Entire Show button */}
      <div className="mb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-ink text-sm truncate" title={currentTrack.name}>
              {currentTrack.name}
            </h3>
            <p className="text-xs text-gray">
              {currentTrack.showDate} • {currentTrack.venue}, {currentTrack.city}
            </p>
          </div>
          {onPlayEntireShow && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPlayEntireShow}
              className="ml-2 flex-shrink-0"
              aria-label="Play entire show"
            >
              Play Entire Show
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 text-xs text-gray">
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 bg-gray rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #111 0%, #111 ${(currentTime / duration) * 100}%, #bfbfb7 ${(currentTime / duration) * 100}%, #bfbfb7 100%)`
            }}
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Transport controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevious}
            disabled={!currentTrack}
            aria-label="Previous track"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handlePlayPause}
            disabled={!currentTrack}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={!currentTrack}
            aria-label="Next track"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </Button>
        </div>

        {/* Volume control */}
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M6.343 6.343a1 1 0 011.414 0L12 10.586l4.243-4.243a1 1 0 111.414 1.414L13.414 12l4.243 4.243a1 1 0 01-1.414 1.414L12 13.414l-4.243 4.243a1 1 0 01-1.414-1.414L10.586 12 6.343 7.757a1 1 0 010-1.414z" />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 bg-gray rounded-lg appearance-none cursor-pointer"
            aria-label="Volume"
          />
        </div>
      </div>

      {/* Keyboard shortcuts help */}
      <div className="text-xs text-gray border-t-2 border-gray pt-2 mb-2">
        <p className="text-center">
          <span className="font-mono">Space</span> Play/Pause • 
          <span className="font-mono">←/→</span> Previous/Next • 
          <span className="font-mono">M</span> Mute • 
          <span className="font-mono">F</span> Fullscreen
        </p>
      </div>

      {/* License/Attribution */}
      {(currentTrack.licenseUrl || currentTrack.rights) && (
        <div className="text-xs text-gray border-t-2 border-gray pt-2">
          <p>
            {currentTrack.rights && (
              <span className="block">{currentTrack.rights}</span>
            )}
            {currentTrack.licenseUrl && (
              <a
                href={currentTrack.licenseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-ink transition-colors"
              >
                View License
              </a>
            )}
          </p>
        </div>
      )}
    </Card>
  )
}
