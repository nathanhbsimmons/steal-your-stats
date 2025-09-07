'use client'

import { useState, useCallback, useEffect } from 'react'
import { Track } from '@/components/ui/audio-player-dock'

const QUEUE_STORAGE_KEY = 'steal-your-stats-audio-queue'

export interface ShowRef {
  date: string
  venue: string
  city: string
}

export interface EnqueueEntireShowOptions {
  preferredFormats?: string[]
  clearExisting?: boolean
}

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
  enqueueEntireShow: (showRef: ShowRef, options?: EnqueueEntireShowOptions) => Promise<void>
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

  const enqueueEntireShow = useCallback(async (showRef: ShowRef, options: EnqueueEntireShowOptions = {}) => {
    const { preferredFormats = ['mp3', 'ogg', 'flac'], clearExisting = false } = options
    
    try {
      // Resolve the Archive.org show
      const resolveResponse = await fetch('/api/archive/resolve-show', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(showRef)
      })
      
      if (!resolveResponse.ok) {
        throw new Error(`Failed to resolve show: ${resolveResponse.status}`)
      }
      
      const archiveShow = await resolveResponse.json()
      
      // Get all tracks from the show
      const tracksResponse = await fetch('/api/archive/song-tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: archiveShow.identifier,
          songTitle: '' // Empty to get all tracks
        })
      })
      
      if (!tracksResponse.ok) {
        throw new Error(`Failed to fetch tracks: ${tracksResponse.status}`)
      }
      
      const { tracks } = await tracksResponse.json()
      
      // Process and deduplicate tracks
      const processedTracks = processTracksForEnqueue(tracks, preferredFormats, archiveShow, showRef)
      
      if (clearExisting) {
        setQueue(processedTracks)
        if (processedTracks.length > 0) {
          setCurrentTrack(processedTracks[0])
          setIsPlaying(true)
        }
      } else {
        setQueue(prev => {
          const newQueue = [...prev, ...processedTracks]
          // If queue was empty, start playing
          if (prev.length === 0 && newQueue.length > 0) {
            setCurrentTrack(newQueue[0])
            setIsPlaying(true)
          }
          return newQueue
        })
      }
      
      // Announce via aria-live (this will be handled by the component)
      // The component will handle aria-live announcements for track changes
      
    } catch (error) {
      console.error('Failed to enqueue entire show:', error)
      throw error
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
    playEntireShow,
    enqueueEntireShow
  }
}

// Helper function to process tracks with format preferences and deduplication
function processTracksForEnqueue(
  tracks: Array<{ id: string; name: string; url: string; duration?: number }>,
  preferredFormats: string[],
  archiveShow: { identifier: string; licenseurl?: string; rights?: string },
  showRef: ShowRef
): Track[] {
  // Group tracks by logical track (remove format suffix)
  const trackGroups = new Map<string, Array<{ id: string; name: string; url: string; duration?: number }>>()
  
  tracks.forEach(track => {
    const logicalName = track.name.replace(/\.(mp3|ogg|flac|wav)$/i, '')
    if (!trackGroups.has(logicalName)) {
      trackGroups.set(logicalName, [])
    }
    trackGroups.get(logicalName)!.push(track)
  })
  
  // Sort tracks by disc and track number
  const sortedGroups = Array.from(trackGroups.entries()).sort((a, b) => {
    const [nameA] = a
    const [nameB] = b
    
    // Extract disc and track numbers from filename patterns like "gd1993-09-09d1t01"
    const matchA = nameA.match(/d(\d+)t(\d+)/)
    const matchB = nameB.match(/d(\d+)t(\d+)/)
    
    if (matchA && matchB) {
      const discA = parseInt(matchA[1])
      const trackA = parseInt(matchA[2])
      const discB = parseInt(matchB[1])
      const trackB = parseInt(matchB[2])
      
      if (discA !== discB) return discA - discB
      return trackA - trackB
    }
    
    // Fallback to alphabetical sorting
    return nameA.localeCompare(nameB)
  })
  
  // Select preferred format for each track
  const processedTracks: Track[] = []
  
  sortedGroups.forEach(([logicalName, trackVariants]) => {
    // Find the best format match
    let selectedTrack = trackVariants[0] // fallback
    
    for (const format of preferredFormats) {
      const match = trackVariants.find(t => 
        t.name.toLowerCase().endsWith(`.${format.toLowerCase()}`)
      )
      if (match) {
        selectedTrack = match
        break
      }
    }
    
    // Convert to Track format
    const track: Track = {
      id: `${archiveShow.identifier}-${logicalName.replace(/[^a-zA-Z0-9]/g, '_')}-${processedTracks.length}`,
      name: logicalName, // Use logical name without format
      url: selectedTrack.url,
      duration: selectedTrack.duration,
      showDate: showRef.date,
      venue: showRef.venue,
      city: showRef.city,
      archiveItemId: archiveShow.identifier,
      licenseUrl: archiveShow.licenseurl,
      rights: archiveShow.rights
    }
    
    processedTracks.push(track)
  })
  
  return processedTracks
}
