'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Track } from '@/components/ui/audio-player-dock'

const QUEUE_STORAGE_KEY = 'steal-your-stats-audio-queue'
export const PLAY_LOG_KEY = 'steal-your-stats-play-log'

export interface PlayLogEntry {
  timestamp: number
  trackName: string
  showDate: string
  venue: string
  city: string
  archiveItemId?: string
  duration?: number
}

function appendPlayLog(entry: PlayLogEntry) {
  try {
    const stored = localStorage.getItem(PLAY_LOG_KEY)
    const log: PlayLogEntry[] = stored ? JSON.parse(stored) : []
    log.unshift(entry)
    localStorage.setItem(PLAY_LOG_KEY, JSON.stringify(log.slice(0, 200)))
  } catch {}
}

export interface ShowRef {
  date: string
  venue: string
  city: string
  identifier?: string  // skip resolve-show when the identifier is already known
}

export interface EnqueueEntireShowOptions {
  preferredFormats?: string[]
  clearExisting?: boolean
  songs?: string[]
  startFrom?: number
  startFromArchiveIdx?: number  // direct archive position, bypasses name-matching
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
  enqueueShowTrack: (showRef: ShowRef, trackIdx: number, songs?: string[]) => Promise<void>
  playShowTrack: (showRef: ShowRef, trackIdx: number, songs?: string[]) => Promise<void>
}

export function useAudioPlayer(): UseAudioPlayerReturn {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [queue, setQueue] = useState<Track[]>([])

  // Ref so stable callbacks can read the latest queue without stale closures
  const queueRef = useRef<Track[]>([])
  useEffect(() => {
    queueRef.current = queue
  }, [queue])

  // Log to play history whenever a new track starts
  const prevTrackIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (currentTrack && isPlaying && currentTrack.id !== prevTrackIdRef.current) {
      appendPlayLog({
        timestamp: Date.now(),
        trackName: currentTrack.name,
        showDate: currentTrack.showDate || '',
        venue: currentTrack.venue || '',
        city: currentTrack.city || '',
        archiveItemId: currentTrack.archiveItemId,
        duration: currentTrack.duration,
      })
    }
    if (currentTrack) prevTrackIdRef.current = currentTrack.id
  }, [currentTrack, isPlaying])

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
    setQueue(prev => {
      // Filter out tracks that already exist in the queue to prevent duplicates
      const existingIds = new Set(prev.map(track => track.id))
      const newTracks = tracks.filter(track => !existingIds.has(track.id))
      return [...prev, ...newTracks]
    })
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
    const { preferredFormats = ['mp3'], clearExisting = false } = options
    
    try {
      // When the caller already knows the identifier (e.g., show page selected a recording),
      // skip the resolve-show round-trip and go straight to fetching tracks.
      let archiveShow: { identifier: string; licenseurl?: string; rights?: string } & Record<string, unknown>
      if (showRef.identifier) {
        archiveShow = { identifier: showRef.identifier }
      } else {
        const resolveResponse = await fetch('/api/archive/resolve-show', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: showRef.date, venue: showRef.venue, city: showRef.city }),
        })
        if (!resolveResponse.ok) {
          throw new Error(`Failed to resolve show: ${resolveResponse.status}`)
        }
        archiveShow = await resolveResponse.json()
      }

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
      const processedTracks = processTracksForEnqueue(tracks, preferredFormats, archiveShow, showRef, options.songs)
      
      if (clearExisting) {
        setQueue(processedTracks)
        if (processedTracks.length > 0) {
          let startIdx: number
          if (options.startFromArchiveIdx !== undefined) {
            // User clicked a track in the archive section — use direct position.
            startIdx = Math.min(options.startFromArchiveIdx, processedTracks.length - 1)
          } else if (options.startFrom !== undefined) {
            // User clicked a setlist.fm track — match by name so the right
            // archive track plays even when recording order differs.
            // Falls back to 0 when the song isn't in this archive item.
            startIdx = findTrackByName(processedTracks, options.songs?.[options.startFrom])
          } else {
            startIdx = 0
          }
          setCurrentTrack(processedTracks[startIdx])
          setIsPlaying(true)
        }
      } else {
        const wasEmpty = queueRef.current.length === 0
        setQueue(prev => [...prev, ...processedTracks])
        if (wasEmpty && processedTracks.length > 0) {
          setCurrentTrack(processedTracks[0])
          setIsPlaying(true)
        }
      }
      
      // Announce via aria-live (this will be handled by the component)
      // The component will handle aria-live announcements for track changes
      
    } catch (error) {
      console.error('Failed to enqueue entire show:', error)
      throw error
    }
  }, [])

  // Append a single track from a show to the end of the queue (duplicates allowed).
  const enqueueShowTrack = useCallback(async (showRef: ShowRef, trackIdx: number, songs?: string[]) => {
    try {
      const targetSong = songs?.[trackIdx]

      // If the show is already loaded in the queue, try to find the track by name and clone it.
      // Only use this shortcut when we find an actual match — never fall back to index 0,
      // because the queue might only contain a single previously-played track from this show.
      const existingShowTracks = queueRef.current.filter(t => t.showDate === showRef.date)
      if (existingShowTracks.length > 0 && targetSong) {
        const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
        const targetNorm = norm(targetSong)
        const exactIdx = existingShowTracks.findIndex(t => {
          const nameNorm = norm(t.name)
          return nameNorm.includes(targetNorm) || targetNorm.includes(nameNorm)
        })
        if (exactIdx !== -1) {
          const src = existingShowTracks[exactIdx]
          setQueue(prev => [...prev, { ...src, id: `${src.id}-q${Date.now()}` }])
          return
        }
        // No match found — fall through to fetch from Archive.org
      }

      // Otherwise fetch from Archive.org
      let archiveShow: { identifier: string } & Record<string, unknown>
      if (showRef.identifier) {
        archiveShow = { identifier: showRef.identifier }
      } else {
        const resolveResponse = await fetch('/api/archive/resolve-show', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: showRef.date, venue: showRef.venue, city: showRef.city }),
        })
        if (!resolveResponse.ok) throw new Error(`resolve: ${resolveResponse.status}`)
        archiveShow = await resolveResponse.json()
      }

      const tracksResponse = await fetch('/api/archive/song-tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: archiveShow.identifier, songTitle: '' }),
      })
      if (!tracksResponse.ok) throw new Error(`tracks: ${tracksResponse.status}`)
      const { tracks } = await tracksResponse.json()

      const processed = processTracksForEnqueue(tracks, ['mp3'], archiveShow, showRef, songs)
      const resolvedIdx = findTrackByName(processed, targetSong)
      const track = processed[resolvedIdx]
      if (track) {
        setQueue(prev => [...prev, { ...track, id: `${track.id}-q${Date.now()}` }])
      }
    } catch (error) {
      console.error('Failed to enqueue track:', error)
      throw error
    }
  }, [])

  // Play a single track from a show, replacing the current queue.
  const playShowTrack = useCallback(async (showRef: ShowRef, trackIdx: number, songs?: string[]) => {
    try {
      let archiveShow: { identifier: string } & Record<string, unknown>
      if (showRef.identifier) {
        archiveShow = { identifier: showRef.identifier }
      } else {
        const resolveResponse = await fetch('/api/archive/resolve-show', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: showRef.date, venue: showRef.venue, city: showRef.city }),
        })
        if (!resolveResponse.ok) throw new Error(`resolve: ${resolveResponse.status}`)
        archiveShow = await resolveResponse.json()
      }

      const tracksResponse = await fetch('/api/archive/song-tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: archiveShow.identifier, songTitle: '' }),
      })
      if (!tracksResponse.ok) throw new Error(`tracks: ${tracksResponse.status}`)
      const { tracks } = await tracksResponse.json()

      const processed = processTracksForEnqueue(tracks, ['mp3'], archiveShow, showRef, songs)
      const resolvedIdx = findTrackByName(processed, songs?.[trackIdx])
      const track = processed[resolvedIdx]
      if (track) {
        const uniqueTrack = { ...track, id: `${track.id}-single${Date.now()}` }
        setQueue([uniqueTrack])
        setCurrentTrack(uniqueTrack)
        setIsPlaying(true)
      }
    } catch (error) {
      console.error('Failed to play show track:', error)
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
    enqueueEntireShow,
    enqueueShowTrack,
    playShowTrack,
  }
}

// Finds the best matching track index by song name rather than raw position.
// Falls back to 0 (start of recording) when the song isn't in this archive item —
// which is always better than playing a random wrong track.
function findTrackByName(tracks: Track[], targetSong: string | undefined): number {
  if (!targetSong || tracks.length === 0) return 0
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const targetNorm = norm(targetSong)
  const idx = tracks.findIndex(t => {
    const nameNorm = norm(t.name)
    return nameNorm.includes(targetNorm) || targetNorm.includes(nameNorm)
  })
  return idx !== -1 ? idx : 0
}

// Converts raw Archive.org filenames (e.g. "gd1993-09-09d1t01") into readable labels
export function formatArchiveTrackName(filename: string): string {
  // disc-based: gd74-05-14d1t01 → "Track 1", d2t03 → "Track 3 (Disc 2)"
  const dtMatch = filename.match(/d(\d+)t(\d+)/i)
  if (dtMatch) {
    const disc = parseInt(dtMatch[1])
    const track = parseInt(dtMatch[2])
    return disc > 1 ? `Track ${track} (Disc ${disc})` : `Track ${track}`
  }
  // set-based: gd75-04-14.s1t01 → "Track 1", s2t03 → "Track 3 (Set 2)"
  const stMatch = filename.match(/s(\d+)t(\d+)/i)
  if (stMatch) {
    const set = parseInt(stMatch[1])
    const track = parseInt(stMatch[2])
    return set > 1 ? `Track ${track} (Set ${set})` : `Track ${track}`
  }
  // strip leading date prefix (2 or 4 digit year) then clean separators
  const cleaned = filename
    .replace(/^[a-z]+\d{2,4}[-_.]\d{2}[-_.]\d{2}[-_.]+/i, '')
    .replace(/[-_.]+/g, ' ')
    .trim()
  return cleaned || filename
}

function isTuningTrack(filename: string, title?: string): boolean {
  const lc = filename.toLowerCase()
  const titleLc = (title || '').toLowerCase().trim()
  return lc.includes('tuning') || titleLc === 'tuning' || titleLc.includes('tuning')
}

// Helper function to process tracks with format preferences and deduplication
function processTracksForEnqueue(
  tracks: Array<{ id: string; name: string; title?: string; url: string; duration?: number }>,
  preferredFormats: string[],
  archiveShow: { identifier: string; licenseurl?: string; rights?: string },
  showRef: ShowRef,
  songs?: string[]
): Track[] {
  // Filter to only MP3 files
  const mp3Tracks = tracks.filter(track =>
    track.name.toLowerCase().endsWith('.mp3')
  )
  
  // Group tracks by logical track (remove format suffix)
  const trackGroups = new Map<string, Array<{ id: string; name: string; title?: string; url: string; duration?: number }>>()

  mp3Tracks.forEach(track => {
    const logicalName = track.name.replace(/\.mp3$/i, '')
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
  let setlistIdx = 0

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

    const trackTitle = trackVariants[0].title
    const tuning = songs && isTuningTrack(logicalName, trackTitle)

    let songName: string
    if (tuning) {
      // Don't consume a setlist index — label with the archive title or generic fallback
      songName = trackTitle || 'Tuning'
    } else if (trackTitle && trackTitle.trim()) {
      // Archive.org taper metadata is ground truth for what audio is actually playing.
      // Only advance the setlist pointer so caller-side counts stay consistent.
      songName = trackTitle
      if (songs) setlistIdx++
    } else if (songs && songs[setlistIdx]) {
      songName = songs[setlistIdx++]
    } else {
      songName = formatArchiveTrackName(logicalName)
      if (songs) setlistIdx++
    }

    // Convert to Track format
    const track: Track = {
      id: `${archiveShow.identifier}-${logicalName.replace(/[^a-zA-Z0-9]/g, '_')}-${processedTracks.length}`,
      name: songName,
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
