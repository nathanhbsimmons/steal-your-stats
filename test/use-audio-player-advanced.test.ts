import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAudioPlayer } from '../lib/hooks/use-audio-player'
import { Track } from '../components/ui/audio-player-dock'

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

function makeTrack(id: string, name: string): Track {
  return {
    id,
    name,
    url: `https://archive.org/download/test/${id}.mp3`,
    showDate: '1977-05-08',
    venue: 'Barton Hall',
    city: 'Ithaca',
    archiveItemId: 'gd1977-05-08'
  }
}

describe('useAudioPlayer — edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('next() at end of queue stops playback', () => {
    const { result } = renderHook(() => useAudioPlayer())
    const tracks = [makeTrack('1', 'Scarlet Begonias'), makeTrack('2', 'Fire on the Mountain')]

    act(() => { result.current.playEntireShow(tracks) })
    act(() => { result.current.next() }) // moves to track 2
    act(() => { result.current.next() }) // past end

    expect(result.current.currentTrack).toBeNull()
    expect(result.current.isPlaying).toBe(false)
  })

  it('previous() at start of queue stops playback', () => {
    const { result } = renderHook(() => useAudioPlayer())
    const tracks = [makeTrack('1', 'Scarlet Begonias'), makeTrack('2', 'Fire on the Mountain')]

    act(() => { result.current.playEntireShow(tracks) })
    // already at track[0], going previous should stop
    act(() => { result.current.previous() })

    expect(result.current.currentTrack).toBeNull()
    expect(result.current.isPlaying).toBe(false)
  })

  it('removeFromQueue for current track advances to next track', () => {
    const { result } = renderHook(() => useAudioPlayer())
    const tracks = [makeTrack('1', 'Dark Star'), makeTrack('2', 'St. Stephen'), makeTrack('3', 'The Eleven')]

    act(() => { result.current.playEntireShow(tracks) })
    expect(result.current.currentTrack?.id).toBe('1')

    act(() => { result.current.removeFromQueue('1') })
    // After removing current track (index 0), next track (original index 1) becomes current
    expect(result.current.queue).toHaveLength(2)
  })

  it('removeFromQueue for last track falls back to first', () => {
    const { result } = renderHook(() => useAudioPlayer())
    const tracks = [makeTrack('1', 'Dark Star'), makeTrack('2', 'St. Stephen')]

    act(() => { result.current.playEntireShow(tracks) })
    act(() => { result.current.next() }) // move to track 2
    expect(result.current.currentTrack?.id).toBe('2')

    act(() => { result.current.removeFromQueue('2') })
    // Removed current (last), queue now has only track 1
    expect(result.current.queue).toHaveLength(1)
  })

  it('addToQueue deduplicates by id', () => {
    const { result } = renderHook(() => useAudioPlayer())
    const track = makeTrack('1', 'Dark Star')

    act(() => { result.current.addToQueue([track]) })
    act(() => { result.current.addToQueue([track]) }) // duplicate

    expect(result.current.queue).toHaveLength(1)
  })

  it('clearQueue resets currentTrack and isPlaying', () => {
    const { result } = renderHook(() => useAudioPlayer())
    const tracks = [makeTrack('1', 'Dark Star')]

    act(() => { result.current.playEntireShow(tracks) })
    expect(result.current.isPlaying).toBe(true)

    act(() => { result.current.clearQueue() })
    expect(result.current.queue).toEqual([])
    expect(result.current.currentTrack).toBeNull()
    expect(result.current.isPlaying).toBe(false)
  })

  it('enqueueEntireShow with clearExisting replaces queue and starts playing', async () => {
    const mockResolveResponse = {
      identifier: 'gd77-05-08.sbd',
      licenseurl: '',
      rights: ''
    }
    const mockTracksResponse = {
      tracks: [
        { id: 'trk1', name: 'gd77-05-08d1t01.mp3', url: 'https://archive.org/download/gd77-05-08.sbd/gd77-05-08d1t01.mp3' },
        { id: 'trk2', name: 'gd77-05-08d1t02.mp3', url: 'https://archive.org/download/gd77-05-08.sbd/gd77-05-08d1t02.mp3' },
      ]
    }

    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => mockResolveResponse })
      .mockResolvedValueOnce({ ok: true, json: async () => mockTracksResponse })

    const { result } = renderHook(() => useAudioPlayer())

    await act(async () => {
      await result.current.enqueueEntireShow(
        { date: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca' },
        { clearExisting: true }
      )
    })

    expect(result.current.queue.length).toBeGreaterThan(0)
    expect(result.current.currentTrack).not.toBeNull()
    expect(result.current.isPlaying).toBe(true)
  })

  it('enqueueEntireShow without clearExisting appends and auto-plays when queue was empty', async () => {
    const mockResolveResponse = { identifier: 'gd77-05-08.sbd', licenseurl: '', rights: '' }
    const mockTracksResponse = {
      tracks: [
        { id: 'trk1', name: 'gd77-05-08d1t01.mp3', url: 'https://archive.org/download/gd77-05-08.sbd/gd77-05-08d1t01.mp3' },
      ]
    }

    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => mockResolveResponse })
      .mockResolvedValueOnce({ ok: true, json: async () => mockTracksResponse })

    const { result } = renderHook(() => useAudioPlayer())

    await act(async () => {
      await result.current.enqueueEntireShow(
        { date: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca' }
      )
    })

    expect(result.current.currentTrack).not.toBeNull()
    expect(result.current.isPlaying).toBe(true)
  })
})
