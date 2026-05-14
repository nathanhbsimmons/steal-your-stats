import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAudioPlayer } from '../lib/hooks/use-audio-player'
import { Track } from '../components/ui/audio-player-dock'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('useAudioPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useAudioPlayer())

    expect(result.current.currentTrack).toBeNull()
    expect(result.current.isPlaying).toBe(false)
    expect(result.current.queue).toEqual([])
  })

  it('should load queue from localStorage on mount', () => {
    const mockQueue: Track[] = [
      {
        id: '1',
        name: 'Dark Star',
        url: 'https://example.com/dark-star.mp3',
        showDate: '1970-01-01',
        venue: 'Test Venue',
        city: 'Test City',
        archiveItemId: 'gd1970-01-01'
      }
    ]

    localStorageMock.getItem.mockReturnValue(JSON.stringify(mockQueue))

    const { result } = renderHook(() => useAudioPlayer())

    expect(result.current.queue).toEqual(mockQueue)
  })

  it('should select and play a track', () => {
    const { result } = renderHook(() => useAudioPlayer())

    const track: Track = {
      id: '1',
      name: 'Dark Star',
      url: 'https://example.com/dark-star.mp3',
      showDate: '1970-01-01',
      venue: 'Test Venue',
      city: 'Test City',
      archiveItemId: 'gd1970-01-01'
    }

    act(() => {
      result.current.selectTrack(track)
    })

    expect(result.current.currentTrack).toEqual(track)
    expect(result.current.isPlaying).toBe(true)
  })

  it('should add tracks to queue', () => {
    const { result } = renderHook(() => useAudioPlayer())

    const tracks: Track[] = [
      {
        id: '1',
        name: 'Dark Star',
        url: 'https://example.com/dark-star.mp3',
        showDate: '1970-01-01',
        venue: 'Test Venue',
        city: 'Test City',
        archiveItemId: 'gd1970-01-01'
      },
      {
        id: '2',
        name: 'Sugar Magnolia',
        url: 'https://example.com/sugar-magnolia.mp3',
        showDate: '1970-01-01',
        venue: 'Test Venue',
        city: 'Test City',
        archiveItemId: 'gd1970-01-01'
      }
    ]

    act(() => {
      result.current.addToQueue(tracks)
    })

    expect(result.current.queue).toEqual(tracks)
  })

  it('should remove tracks from queue', () => {
    const { result } = renderHook(() => useAudioPlayer())

    const tracks: Track[] = [
      {
        id: '1',
        name: 'Dark Star',
        url: 'https://example.com/dark-star.mp3',
        showDate: '1970-01-01',
        venue: 'Test Venue',
        city: 'Test City',
        archiveItemId: 'gd1970-01-01'
      },
      {
        id: '2',
        name: 'Sugar Magnolia',
        url: 'https://example.com/sugar-magnolia.mp3',
        showDate: '1970-01-01',
        venue: 'Test Venue',
        city: 'Test City',
        archiveItemId: 'gd1970-01-01'
      }
    ]

    act(() => {
      result.current.addToQueue(tracks)
      result.current.removeFromQueue('1')
    })

    expect(result.current.queue).toHaveLength(1)
    expect(result.current.queue[0].id).toBe('2')
  })

  it('should clear queue', () => {
    const { result } = renderHook(() => useAudioPlayer())

    const tracks: Track[] = [
      {
        id: '1',
        name: 'Dark Star',
        url: 'https://example.com/dark-star.mp3',
        showDate: '1970-01-01',
        venue: 'Test Venue',
        city: 'Test City',
        archiveItemId: 'gd1970-01-01'
      }
    ]

    act(() => {
      result.current.addToQueue(tracks)
      result.current.clearQueue()
    })

    expect(result.current.queue).toEqual([])
    expect(result.current.currentTrack).toBeNull()
    expect(result.current.isPlaying).toBe(false)
  })

  it('should play entire show', () => {
    const { result } = renderHook(() => useAudioPlayer())

    const tracks: Track[] = [
      {
        id: '1',
        name: 'Dark Star',
        url: 'https://example.com/dark-star.mp3',
        showDate: '1970-01-01',
        venue: 'Test Venue',
        city: 'Test City',
        archiveItemId: 'gd1970-01-01'
      },
      {
        id: '2',
        name: 'Sugar Magnolia',
        url: 'https://example.com/sugar-magnolia.mp3',
        showDate: '1970-01-01',
        venue: 'Test Venue',
        city: 'Test City',
        archiveItemId: 'gd1970-01-01'
      }
    ]

    act(() => {
      result.current.playEntireShow(tracks)
    })

    expect(result.current.queue).toEqual(tracks)
    expect(result.current.currentTrack).toEqual(tracks[0])
    expect(result.current.isPlaying).toBe(true)
  })

  it('should advance to next track', () => {
    const { result } = renderHook(() => useAudioPlayer())

    const tracks: Track[] = [
      {
        id: '1',
        name: 'Dark Star',
        url: 'https://example.com/dark-star.mp3',
        showDate: '1970-01-01',
        venue: 'Test Venue',
        city: 'Test City',
        archiveItemId: 'gd1970-01-01'
      },
      {
        id: '2',
        name: 'Sugar Magnolia',
        url: 'https://example.com/sugar-magnolia.mp3',
        showDate: '1970-01-01',
        venue: 'Test Venue',
        city: 'Test City',
        archiveItemId: 'gd1970-01-01'
      }
    ]

    act(() => {
      result.current.addToQueue(tracks)
    })

    act(() => {
      result.current.selectTrack(tracks[0])
    })

    act(() => {
      result.current.next()
    })

    expect(result.current.currentTrack).toEqual(tracks[1])
    expect(result.current.isPlaying).toBe(true)
  })

  it('should go to previous track', () => {
    const { result } = renderHook(() => useAudioPlayer())

    const tracks: Track[] = [
      {
        id: '1',
        name: 'Dark Star',
        url: 'https://example.com/dark-star.mp3',
        showDate: '1970-01-01',
        venue: 'Test Venue',
        city: 'Test City',
        archiveItemId: 'gd1970-01-01'
      },
      {
        id: '2',
        name: 'Sugar Magnolia',
        url: 'https://example.com/sugar-magnolia.mp3',
        showDate: '1970-01-01',
        venue: 'Test Venue',
        city: 'Test City',
        archiveItemId: 'gd1970-01-01'
      }
    ]

    act(() => {
      result.current.addToQueue(tracks)
    })

    act(() => {
      result.current.selectTrack(tracks[1])
    })

    act(() => {
      result.current.previous()
    })

    expect(result.current.currentTrack).toEqual(tracks[0])
    expect(result.current.isPlaying).toBe(true)
  })
})
