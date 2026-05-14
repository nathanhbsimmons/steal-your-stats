import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { VersionTrack } from "./songFacts"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Duration caching utilities
const DURATION_CACHE_KEY = 'steal-your-stats-durations'
const DURATION_CACHE_TTL = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds

interface CachedDuration {
  duration: number
  timestamp: number
}

export function getCachedDuration(trackId: string): number | null {
  if (typeof window === 'undefined') return null
  
  try {
    const cached = localStorage.getItem(DURATION_CACHE_KEY)
    if (!cached) return null
    
    const cache: Record<string, CachedDuration> = JSON.parse(cached)
    const entry = cache[trackId]
    
    if (!entry) return null
    
    // Check if cache entry is still valid
    if (Date.now() - entry.timestamp > DURATION_CACHE_TTL) {
      delete cache[trackId]
      localStorage.setItem(DURATION_CACHE_KEY, JSON.stringify(cache))
      return null
    }
    
    return entry.duration
  } catch (error) {
    console.error('Error reading duration cache:', error)
    return null
  }
}

export function setCachedDuration(trackId: string, duration: number): void {
  if (typeof window === 'undefined') return
  
  try {
    const cached = localStorage.getItem(DURATION_CACHE_KEY)
    const cache: Record<string, CachedDuration> = cached ? JSON.parse(cached) : {}
    
    cache[trackId] = {
      duration,
      timestamp: Date.now()
    }
    
    localStorage.setItem(DURATION_CACHE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.error('Error writing duration cache:', error)
  }
}

// Extreme calculation utilities
export function computeExtremes(
  tracks: VersionTrack[], 
  includeOutliers: boolean = false
): { longest?: VersionTrack; shortest?: VersionTrack } {
  const tracksWithDuration = tracks.filter(track => track.durationSec !== undefined)
  
  if (tracksWithDuration.length === 0) {
    return { longest: undefined, shortest: undefined }
  }
  
  let filteredTracks = tracksWithDuration
  
  if (!includeOutliers && tracksWithDuration.length > 2) {
    // Calculate mean and standard deviation
    const durations = tracksWithDuration.map(track => track.durationSec!)
    const mean = durations.reduce((sum, d) => sum + d, 0) / durations.length
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length
    const stdDev = Math.sqrt(variance)
    
    // Filter out outliers beyond 2 standard deviations
    filteredTracks = tracksWithDuration.filter(track => {
      const duration = track.durationSec!
      return Math.abs(duration - mean) <= 2 * stdDev
    })
  }
  
  if (filteredTracks.length === 0) {
    return { longest: undefined, shortest: undefined }
  }
  
  const sortedByDuration = [...filteredTracks].sort((a, b) => (a.durationSec || 0) - (b.durationSec || 0))
  
  return {
    shortest: sortedByDuration[0],
    longest: sortedByDuration[sortedByDuration.length - 1]
  }
}

// Format duration utility
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Parse duration from Archive.org length field
export function parseArchiveDuration(lengthStr: string): number | undefined {
  const trimmed = lengthStr.trim()

  // Check if it's in HH:MM:SS format
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':')
    if (parts.length === 3) {
      // HH:MM:SS format
      const hours = parseInt(parts[0], 10)
      const minutes = parseInt(parts[1], 10)
      const seconds = parseInt(parts[2], 10)
      return hours * 3600 + minutes * 60 + seconds
    } else if (parts.length === 2) {
      // MM:SS format
      const minutes = parseInt(parts[0], 10)
      const seconds = parseInt(parts[1], 10)
      return minutes * 60 + seconds
    }
  }

  // Try to parse as a number (seconds)
  const parsed = parseFloat(trimmed)
  return isNaN(parsed) ? undefined : parsed
}

// Date format conversion utilities
// setlist.fm uses DD-MM-YYYY; we store as YYYY-MM-DD internally

export function fromSetlistDate(setlistDate: string): string {
  const parts = setlistDate.split('-')
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`
  }
  return setlistDate
}

export function toSetlistDate(isoDate: string): string {
  const parts = isoDate.split('-')
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`
  }
  return isoDate
}

export function formatShowDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
}

export function toTitleCase(str: string): string {
  const minor = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'on', 'at', 'to', 'by', 'in', 'of', 'up'])
  return str.split(' ').map((word, i) => {
    if (i === 0 || !minor.has(word.toLowerCase())) {
      return word.charAt(0).toUpperCase() + word.slice(1)
    }
    return word.toLowerCase()
  }).join(' ')
}
