'use client'

import { useState, useCallback, useEffect } from 'react'
import { Track } from '@/components/ui/audio-player-dock'

const QUEUE_STORAGE_KEY = 'steal-your-stats-audio-queue'

export interface UseAudioPlayerReturn {
  currentTrack: Track | null
  isPlaying: boolean
  queue: Track[]
  play: () => void
  pause: () => void
  next: () => void
  previous: () => void
  selectTrack: (track: Track) => void
  addToQueue: (tracks: Track[]) => void
  removeFromQueue: (trackId: string) => void
  clearQueue: () => void
  playEntireShow: (tracks: Track[]) => void
}

export function useAudioPlayer(): UseAudioPlayerReturn {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [queue, setQueue] = useState<Track[]>([])

  // Load queue from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY)
      if (stored) {
        const parsedQueue = JSON.parse(stored)
        if (Array.isArray(parsedQueue)) {
          setQueue(parsedQueue)
        }
      }
    } catch (error) {
      console.error('Failed to load queue from localStorage:', error)
    }
  }, [])

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue))
    } catch (error) {
      console.error('Failed to save queue to localStorage:', error)
    }
  }, [queue])

  const play = useCallback(() => {
    if (currentTrack) {
      setIsPlaying(true)
    }
  }, [currentTrack])

  const pause = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const next = useCallback(() => {
    if (queue.length === 0) {
      setCurrentTrack(null)
      setIsPlaying(false)
      return
    }

    const currentIndex = currentTrack ? queue.findIndex(track => track.id === currentTrack.id) : -1
    const nextIndex = currentIndex + 1

    if (nextIndex < queue.length) {
      setCurrentTrack(queue[nextIndex])
      setIsPlaying(true)
    } else {
      setCurrentTrack(null)
      setIsPlaying(false)
    }
  }, [currentTrack, queue])

  const previous = useCallback(() => {
    if (queue.length === 0) {
      setCurrentTrack(null)
      setIsPlaying(false)
      return
    }

    const currentIndex = currentTrack ? queue.findIndex(track => track.id === currentTrack.id) : -1
    const prevIndex = currentIndex - 1

    if (prevIndex >= 0) {
      setCurrentTrack(queue[prevIndex])
      setIsPlaying(true)
    } else {
      setCurrentTrack(null)
      setIsPlaying(false)
    }
  }, [currentTrack, queue])

  const selectTrack = useCallback((track: Track) => {
    setCurrentTrack(track)
    setIsPlaying(true)
  }, [])

  const addToQueue = useCallback((tracks: Track[]) => {
    setQueue(prev => [...prev, ...tracks])
  }, [])

  const removeFromQueue = useCallback((trackId: string) => {
    setQueue(prev => {
      const newQueue = prev.filter(track => track.id !== trackId)
      
      // If we removed the current track, move to next or stop
      if (currentTrack?.id === trackId) {
        const currentIndex = prev.findIndex(track => track.id === trackId)
        if (currentIndex < newQueue.length) {
          setCurrentTrack(newQueue[currentIndex])
        } else if (newQueue.length > 0) {
          setCurrentTrack(newQueue[0])
        } else {
          setCurrentTrack(null)
          setIsPlaying(false)
        }
      }
      
      return newQueue
    })
  }, [currentTrack])

  const clearQueue = useCallback(() => {
    setQueue([])
    setCurrentTrack(null)
    setIsPlaying(false)
  }, [])

  const playEntireShow = useCallback((tracks: Track[]) => {
    setQueue(tracks)
    if (tracks.length > 0) {
      setCurrentTrack(tracks[0])
      setIsPlaying(true)
    }
  }, [])

  return {
    currentTrack,
    isPlaying,
    queue,
    play,
    pause,
    next,
    previous,
    selectTrack,
    addToQueue,
    removeFromQueue,
    clearQueue,
    playEntireShow
  }
}
