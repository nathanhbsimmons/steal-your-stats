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

  it('removeFromQueue for last track clears queue', () => {
    const { result } = renderHook(() => useAudioPlayer())
    const tracks = [makeTrack('1', 'Dark Star'), makeTrack('2', 'St. Stephen')]

    act(() => { result.current.playEntireShow(tracks) })
    // next() pops track '1' from the queue and advances to '2'
    act(() => { result.current.next() })
    expect(result.current.currentTrack?.id).toBe('2')
    expect(result.current.queue).toHaveLength(1) // only '2' remains

    act(() => { result.current.removeFromQueue('2') })
    // Removed the only remaining track; queue is now empty
    expect(result.current.queue).toHaveLength(0)
  })

  it('addToQueue deduplicates by id', () => {
    const { result } = renderHook(() => useAudioPlayer())
    const track = makeTrack('1', 'Dark Star')

    act(() => { result.current.addToQueue([track]) })
    act(() => { result.current.addToQueue([track]) }) // duplicate

    expect(result.current.queue).toHaveLength(1)
  })

  it('prependToQueue adds tracks at the front of an existing queue', () => {
    const { result } = renderHook(() => useAudioPlayer())
    const existing = makeTrack('1', 'Dark Star')
    const newTrack = makeTrack('2', 'St. Stephen')

    act(() => { result.current.addToQueue([existing]) })
    act(() => { result.current.prependToQueue([newTrack]) })

    expect(result.current.queue.map(t => t.id)).toEqual(['2', '1'])
  })

  it('prependToQueue deduplicates by id', () => {
    const { result } = renderHook(() => useAudioPlayer())
    const track = makeTrack('1', 'Dark Star')

    act(() => { result.current.addToQueue([track]) })
    act(() => { result.current.prependToQueue([track]) }) // same id — should not duplicate

    expect(result.current.queue).toHaveLength(1)
  })

  it('prependToQueue preserves order of multiple prepended tracks', () => {
    const { result } = renderHook(() => useAudioPlayer())
    const existing = makeTrack('3', 'Deal')
    const newTracks = [makeTrack('1', 'Dark Star'), makeTrack('2', 'St. Stephen')]

    act(() => { result.current.addToQueue([existing]) })
    act(() => { result.current.prependToQueue(newTracks) })

    expect(result.current.queue.map(t => t.id)).toEqual(['1', '2', '3'])
  })

  it('prependToQueue into empty queue populates queue in order', () => {
    const { result } = renderHook(() => useAudioPlayer())
    const tracks = [makeTrack('1', 'Dark Star'), makeTrack('2', 'St. Stephen')]

    act(() => { result.current.prependToQueue(tracks) })

    expect(result.current.queue.map(t => t.id)).toEqual(['1', '2'])
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

  it('enqueueEntireShow with songs excludes bonus/soundcheck tracks from the queue', async () => {
    const mockResolveResponse = { identifier: 'gd76-07-12.sbd', licenseurl: '', rights: '' }
    const mockTracksResponse = {
      tracks: [
        { id: 'trk1', name: '01 Dark Star.mp3', title: 'Dark Star', url: 'https://archive.org/download/gd76/01.mp3' },
        { id: 'trk2', name: '02 Soundcheck.mp3', title: 'Set III: Soundcheck', url: 'https://archive.org/download/gd76/02.mp3' },
        { id: 'trk3', name: '03 Soundcheck.mp3', title: 'Set III: Soundcheck', url: 'https://archive.org/download/gd76/03.mp3' },
      ]
    }

    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => mockResolveResponse })
      .mockResolvedValueOnce({ ok: true, json: async () => mockTracksResponse })

    const { result } = renderHook(() => useAudioPlayer())

    await act(async () => {
      await result.current.enqueueEntireShow(
        { date: '1976-07-12', venue: 'Orpheum Theatre', city: 'San Francisco' },
        { clearExisting: true, songs: ['Dark Star'] }
      )
    })

    expect(result.current.queue).toHaveLength(1)
    expect(result.current.queue[0].name).toBe('Dark Star')
  })

  it('enqueueEntireShow with startFromArchiveIdx keeps every track, including bonus material', async () => {
    const mockResolveResponse = { identifier: 'gd76-07-12.sbd', licenseurl: '', rights: '' }
    const mockTracksResponse = {
      tracks: [
        { id: 'trk1', name: '01 Dark Star.mp3', title: 'Dark Star', url: 'https://archive.org/download/gd76/01.mp3' },
        { id: 'trk2', name: '02 Soundcheck.mp3', title: 'Set III: Soundcheck', url: 'https://archive.org/download/gd76/02.mp3' },
      ]
    }

    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => mockResolveResponse })
      .mockResolvedValueOnce({ ok: true, json: async () => mockTracksResponse })

    const { result } = renderHook(() => useAudioPlayer())

    await act(async () => {
      await result.current.enqueueEntireShow(
        { date: '1976-07-12', venue: 'Orpheum Theatre', city: 'San Francisco' },
        { clearExisting: true, songs: ['Dark Star'], startFromArchiveIdx: 0 }
      )
    })

    expect(result.current.queue).toHaveLength(2)
  })

  // Versions carrying a direct URL resolve without any network round-trip.
  const makeVersion = (showDate: string) => ({
    showDate,
    venue: 'Venue',
    city: 'City',
    url: `https://archive.org/${showDate}.mp3`,
    archiveItemId: `gd${showDate}`,
    durationSec: 600,
  })

  it('enqueueSongVersions (replace) sorts chronologically, plays first, queues all', async () => {
    const { result } = renderHook(() => useAudioPlayer())
    const versions = [makeVersion('1989-07-07'), makeVersion('1977-05-08'), makeVersion('1972-08-27')]

    await act(async () => {
      await result.current.enqueueSongVersions('Sugaree', versions, { mode: 'replace' })
    })

    expect(result.current.queue.map(t => t.showDate)).toEqual(['1972-08-27', '1977-05-08', '1989-07-07'])
    expect(result.current.currentTrack?.showDate).toBe('1972-08-27')
    expect(result.current.isPlaying).toBe(true)
  })

  it('enqueueSongVersions respects the cap', async () => {
    const { result } = renderHook(() => useAudioPlayer())
    const versions = Array.from({ length: 40 }, (_, i) => makeVersion(`19${70 + i}-01-01`))

    await act(async () => {
      await result.current.enqueueSongVersions('Sugaree', versions, { mode: 'replace', cap: 25 })
    })

    expect(result.current.queue.length).toBe(25)
  })

  it('enqueueSongVersions (append) keeps the existing track playing', async () => {
    const { result } = renderHook(() => useAudioPlayer())

    act(() => { result.current.playEntireShow([makeTrack('existing', 'Playing Now')]) })
    expect(result.current.currentTrack?.id).toBe('existing')

    await act(async () => {
      await result.current.enqueueSongVersions('Sugaree', [makeVersion('1977-05-08')], { mode: 'append' })
    })

    expect(result.current.currentTrack?.id).toBe('existing')
    expect(result.current.queue.length).toBe(2)
  })
})
