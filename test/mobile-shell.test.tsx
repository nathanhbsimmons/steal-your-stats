import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { usePathname, useRouter } from 'next/navigation'
import { usePlayer } from '@/lib/contexts/player-context'
import { MobileShell } from '@/components/mobile/mobile-shell'
import { matchArchiveTracksToSetlist } from '@/lib/archive-track-match'

/* ---------------------------------------------------------------- hoisted mocks */

const { mockPush, mockBack } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockBack: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
  useRouter: vi.fn(() => ({ push: mockPush, back: mockBack })),
}))

vi.mock('@/lib/contexts/player-context', () => ({
  usePlayer: vi.fn(),
}))

/* ---------------------------------------------------------------- player factory */

const mockPlay = vi.fn()
const mockPause = vi.fn()
const mockNext = vi.fn()
const mockPrevious = vi.fn()
const mockSelectTrack = vi.fn()
const mockAddToQueue = vi.fn()
const mockPrependToQueue = vi.fn()
const mockRemoveFromQueue = vi.fn()
const mockClearQueue = vi.fn()
const mockPlayEntireShow = vi.fn()
const mockEnqueueEntireShow = vi.fn().mockResolvedValue(undefined)
const mockEnqueueShowTrack = vi.fn().mockResolvedValue(undefined)
const mockPlayShowTrack = vi.fn().mockResolvedValue(undefined)
const mockEnqueueSongVersions = vi.fn().mockResolvedValue(undefined)

const mockTrack = {
  id: 'track-1',
  name: 'Dark Star',
  url: 'https://archive.org/dark-star.mp3',
  showDate: '1977-05-08',
  venue: 'Barton Hall',
  city: 'Ithaca',
  archiveItemId: 'gd77-05-08',
}

function makePlayer(overrides: Record<string, unknown> = {}) {
  return {
    currentTrack: null,
    isPlaying: false,
    queue: [] as typeof mockTrack[],
    play: mockPlay,
    pause: mockPause,
    next: mockNext,
    previous: mockPrevious,
    selectTrack: mockSelectTrack,
    addToQueue: mockAddToQueue,
    prependToQueue: mockPrependToQueue,
    removeFromQueue: mockRemoveFromQueue,
    clearQueue: mockClearQueue,
    playEntireShow: mockPlayEntireShow,
    enqueueEntireShow: mockEnqueueEntireShow,
    enqueueShowTrack: mockEnqueueShowTrack,
    playShowTrack: mockPlayShowTrack,
    enqueueSongVersions: mockEnqueueSongVersions,
    ...overrides,
  }
}

/* ---------------------------------------------------------------- helpers */

function setPathname(path: string) {
  vi.mocked(usePathname).mockReturnValue(path)
}

function setPlayer(overrides: Record<string, unknown> = {}) {
  vi.mocked(usePlayer).mockReturnValue(makePlayer(overrides) as ReturnType<typeof usePlayer>)
}

function mockFetch(responses: Record<string, unknown>) {
  // Sort keys longest-first so that `/api/shows/by-venue` matches before `/api/show`
  const sortedKeys = Object.keys(responses).sort((a, b) => b.length - a.length)
  global.fetch = vi.fn((url: string) => {
    const key = sortedKeys.find(k => url.includes(k))
    const body = key ? responses[key] : {}
    return Promise.resolve({ ok: true, json: () => Promise.resolve(body) })
  }) as unknown as typeof fetch
}

function sotdPayload(overrides: Record<string, unknown> = {}) {
  const merged = {
    dateKey: '1977-05-08',
    shows: [] as unknown[],
    featured: null,
    showDetail: null as { sets: Array<{ songs: string[] }> } | null,
    archive: null as { identifier: string; tracks: Array<{ title?: string; url: string; duration?: number; id: string; name: string; archiveItemId: string }> } | null,
    complete: true,
    computedAt: Date.now(),
    ...overrides,
  }
  const archiveMatch = merged.archive && merged.showDetail
    ? matchArchiveTracksToSetlist(merged.archive.tracks, merged.showDetail.sets.flatMap(s => s.songs))
    : null
  return { ...merged, archiveMatch }
}

const defaultFetch: Record<string, unknown> = {
  '/api/show-of-the-day': sotdPayload(),
  '/api/show': {
    date: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca', state: 'NY', country: 'US',
    sets: [], totalSongs: 0,
  },
  '/api/songs': { songs: [] },
  '/api/stats': { leaderboard: [], showsPerYear: [] },
  '/api/stats/summary': { totalShows: 2333, uniqueSongs: 442, hoursArchived: 6422 },
  '/api/song-facts': { totalPerformances: 0, first: null, last: null },
  '/api/versions': { tracks: [], songTitle: 'Dark Star' },
  '/api/search/shows-with-songs': { shows: [] },
  '/api/shows/by-venue': { shows: [] },
  '/api/shows': { shows: [], total: 0 },
  '/api/archive/resolve-show': { identifier: 'gd77-05-08' },
  '/api/archive/song-tracks': { tracks: [] },
  '/api/weather': { temp: null, label: null },
  '/api/position-facts': { songTitle: 'Dark Star', opener: { count: 14 }, closer: { count: 6 }, encore: { count: 2 } },
}

/* ================================================================ tests */

describe('MobileShell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setPathname('/')
    setPlayer()
    mockFetch(defaultFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /* ---------------------------------------------------------------- tab bar */

  describe('MobileTabBar', () => {
    it('renders all six navigation tabs', () => {
      render(<MobileShell />)
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Deck')).toBeInTheDocument()
      expect(screen.getByText('Shows')).toBeInTheDocument()
      expect(screen.getByText('Songs')).toBeInTheDocument()
      expect(screen.getByText('Stats')).toBeInTheDocument()
      expect(screen.getByText('Search')).toBeInTheDocument()
    })

    it('marks the Home tab active on "/"', () => {
      render(<MobileShell />)
      const btn = screen.getByText('Home').closest('button')!
      expect(btn).toHaveClass('active')
    })

    it('marks Deck tab active after clicking it', () => {
      render(<MobileShell />)
      fireEvent.click(screen.getByText('Deck'))
      const btn = screen.getByText('Deck').closest('button')!
      expect(btn).toHaveClass('active')
    })

    it('marks Songs tab active on "/songs"', () => {
      setPathname('/songs')
      render(<MobileShell />)
      const btn = screen.getByText('Songs').closest('button')!
      expect(btn).toHaveClass('active')
    })

    it('marks Shows tab active on "/shows"', () => {
      setPathname('/shows')
      render(<MobileShell />)
      const btn = screen.getByText('Shows').closest('button')!
      expect(btn).toHaveClass('active')
    })

    it('marks Search tab active on "/search"', () => {
      setPathname('/search')
      render(<MobileShell />)
      const btn = screen.getByText('Search').closest('button')!
      expect(btn).toHaveClass('active')
    })

    it('marks Stats tab active on "/stats"', () => {
      setPathname('/stats')
      render(<MobileShell />)
      const btn = screen.getByText('Stats').closest('button')!
      expect(btn).toHaveClass('active')
    })

    it('navigates to /stats when Stats tab is clicked', () => {
      render(<MobileShell />)
      fireEvent.click(screen.getByText('Stats'))
      expect(mockPush).toHaveBeenCalledWith('/stats')
    })

    it('shows roman numeral V for the Stats tab', () => {
      render(<MobileShell />)
      const btn = screen.getByText('Stats').closest('button')!
      expect(btn.querySelector('.num')?.textContent).toBe('V')
    })

    it('navigates to /songs when Songs tab is clicked', () => {
      render(<MobileShell />)
      fireEvent.click(screen.getByText('Songs'))
      expect(mockPush).toHaveBeenCalledWith('/songs')
    })

    it('navigates to /shows when Shows tab is clicked', () => {
      render(<MobileShell />)
      fireEvent.click(screen.getByText('Shows'))
      expect(mockPush).toHaveBeenCalledWith('/shows')
    })

    it('shows roman numeral IV for the Songs tab', () => {
      render(<MobileShell />)
      const btn = screen.getByText('Songs').closest('button')!
      expect(btn.querySelector('.num')?.textContent).toBe('IV')
    })

    it('shows roman numeral II for the Deck tab', () => {
      render(<MobileShell />)
      const btn = screen.getByText('Deck').closest('button')!
      expect(btn.querySelector('.num')?.textContent).toBe('II')
    })

    it('marks songs/song/* routes as Songs tab active', () => {
      setPathname('/song/Dark Star')
      render(<MobileShell />)
      const btn = screen.getByText('Songs').closest('button')!
      expect(btn).toHaveClass('active')
    })

    it('marks shows/* routes as Shows tab active', () => {
      setPathname('/shows/1977')
      render(<MobileShell />)
      const btn = screen.getByText('Shows').closest('button')!
      expect(btn).toHaveClass('active')
    })
  })

  /* ---------------------------------------------------------------- chapter strip */

  describe('MobileChapter', () => {
    it('shows HOME chapter on "/"', () => {
      render(<MobileShell />)
      expect(screen.getByText(/HOME · ON THIS DAY/i)).toBeInTheDocument()
    })

    it('shows DECK chapter when deck tab is active', () => {
      render(<MobileShell />)
      fireEvent.click(screen.getByText('Deck'))
      expect(screen.getByText(/DECK · NOW PLAYING/i)).toBeInTheDocument()
    })

    it('shows SONGS chapter on "/songs"', () => {
      setPathname('/songs')
      render(<MobileShell />)
      expect(screen.getByText(/SONGS · CATALOG/i)).toBeInTheDocument()
    })

    it('shows SEARCH chapter on "/search"', () => {
      setPathname('/search')
      render(<MobileShell />)
      expect(screen.getByText(/SEARCH · CATALOG/i)).toBeInTheDocument()
    })

    it('shows STATS chapter on "/stats"', () => {
      setPathname('/stats')
      render(<MobileShell />)
      expect(screen.getByText(/STATS · BY THE NUMBERS/i)).toBeInTheDocument()
    })

    it('shows back button on a song detail page', () => {
      setPathname('/song/Dark Star')
      render(<MobileShell />)
      expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument()
    })

    it('shows back button on a show detail page', () => {
      setPathname('/show/1977-05-08')
      render(<MobileShell />)
      expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument()
    })

    it('calls router.back() when back button is clicked', () => {
      setPathname('/show/1977-05-08')
      render(<MobileShell />)
      fireEvent.click(screen.getByRole('button', { name: 'Go back' }))
      expect(mockBack).toHaveBeenCalled()
    })

    it('does not show back button on top-level pages', () => {
      setPathname('/')
      render(<MobileShell />)
      expect(screen.queryByRole('button', { name: 'Go back' })).not.toBeInTheDocument()
    })
  })

  /* ---------------------------------------------------------------- masthead */

  describe('MobileMast', () => {
    it('renders the masthead on the home screen', () => {
      render(<MobileShell />)
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    it('does not render the masthead on non-home pages', () => {
      setPathname('/songs')
      render(<MobileShell />)
      expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
    })

    it('does not render the masthead when deck tab is active', () => {
      render(<MobileShell />)
      fireEvent.click(screen.getByText('Deck'))
      expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
    })

    it('renders "Grateful Dead" in the masthead subtitle', () => {
      render(<MobileShell />)
      expect(screen.getByText(/Grateful Dead/i)).toBeInTheDocument()
    })

    it('renders "compiled by hand, played through the deck" in the masthead subtitle', () => {
      render(<MobileShell />)
      expect(screen.getByText(/compiled by hand, played through the deck/i)).toBeInTheDocument()
    })
  })

  /* ---------------------------------------------------------------- mini player */

  describe('MobileMini', () => {
    it('does not render the mini player when no track is playing', () => {
      setPathname('/songs')
      render(<MobileShell />)
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('renders the mini player when a track is playing', () => {
      setPathname('/songs')
      setPlayer({ currentTrack: mockTrack, isPlaying: true })
      render(<MobileShell />)
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText('Dark Star')).toBeInTheDocument()
    })

    it('calls next() when the skip button is clicked', () => {
      setPathname('/songs')
      setPlayer({ currentTrack: mockTrack, isPlaying: true })
      render(<MobileShell />)
      fireEvent.click(screen.getByLabelText('Skip to next track'))
      expect(mockNext).toHaveBeenCalled()
    })

    it('calls pause() when pause button is clicked while playing', () => {
      setPathname('/songs')
      setPlayer({ currentTrack: mockTrack, isPlaying: true })
      render(<MobileShell />)
      fireEvent.click(screen.getByLabelText('Pause'))
      expect(mockPause).toHaveBeenCalled()
    })

    it('calls play() when play button is clicked while paused', () => {
      setPathname('/songs')
      setPlayer({ currentTrack: mockTrack, isPlaying: false })
      render(<MobileShell />)
      fireEvent.click(screen.getByLabelText('Play'))
      expect(mockPlay).toHaveBeenCalled()
    })

    it('shows mini player on the home route when a track is playing', () => {
      setPathname('/')
      setPlayer({ currentTrack: mockTrack, isPlaying: true })
      render(<MobileShell />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('hides mini player when deck tab is active', () => {
      setPathname('/')
      setPlayer({ currentTrack: mockTrack, isPlaying: true })
      render(<MobileShell />)
      fireEvent.click(screen.getByText('Deck'))
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })
  })

  /* ---------------------------------------------------------------- deck screen */

  describe('DeckScreen', () => {
    // Helper: activate deck tab
    function activateDeck() {
      fireEvent.click(screen.getByText('Deck'))
    }

    it('renders the reel player element when deck tab is active', () => {
      setPlayer({ currentTrack: mockTrack, queue: [mockTrack], isPlaying: true })
      render(<MobileShell />)
      activateDeck()
      expect(screen.getByLabelText('Reel-to-reel player')).toBeInTheDocument()
    })

    it('renders transport controls when deck tab is active', () => {
      setPlayer({ currentTrack: mockTrack, queue: [mockTrack], isPlaying: true })
      render(<MobileShell />)
      activateDeck()
      expect(screen.getByLabelText('Previous track')).toBeInTheDocument()
      expect(screen.getByLabelText(/^(Play|Pause)$/)).toBeInTheDocument()
      expect(screen.getByLabelText('Next track')).toBeInTheDocument()
    })

    it('shows "standby · no queue" when nothing is queued', () => {
      setPlayer({ isPlaying: false, queue: [], currentTrack: mockTrack })
      render(<MobileShell />)
      activateDeck()
      expect(screen.getByText(/standby · no queue/i)).toBeInTheDocument()
    })

    it('shows "cued · N tracks" when paused with multiple tracks queued', () => {
      const queue = [mockTrack, { ...mockTrack, id: 'track-2', name: 'Truckin' }]
      setPlayer({ isPlaying: false, queue, currentTrack: mockTrack })
      render(<MobileShell />)
      activateDeck()
      expect(screen.getByText(/cued · 2 archive tracks/i)).toBeInTheDocument()
    })

    it('shows "playing · 1 track" when a single track is in the queue', () => {
      setPlayer({ isPlaying: true, queue: [mockTrack], currentTrack: mockTrack })
      render(<MobileShell />)
      activateDeck()
      expect(screen.getByText(/playing · 1 track/i)).toBeInTheDocument()
    })

    it('does not say "entire show" when only one track is playing', () => {
      setPlayer({ isPlaying: true, queue: [mockTrack], currentTrack: mockTrack })
      render(<MobileShell />)
      activateDeck()
      expect(screen.queryByText(/entire show/i)).not.toBeInTheDocument()
    })

    it('shows "playing entire show · N tracks" when multiple tracks are queued', () => {
      const queue = [mockTrack, { ...mockTrack, id: 'track-2', name: 'Truckin' }]
      setPlayer({ isPlaying: true, queue, currentTrack: mockTrack })
      render(<MobileShell />)
      activateDeck()
      expect(screen.getByText(/playing entire show · 2 tracks/i)).toBeInTheDocument()
    })

    it('renders the seek slider', () => {
      setPlayer({ currentTrack: mockTrack, queue: [mockTrack], isPlaying: false })
      render(<MobileShell />)
      activateDeck()
      const slider = screen.getByRole('slider', { name: 'Seek' })
      expect(slider).toBeInTheDocument()
      expect(slider).toHaveAttribute('aria-valuenow')
      expect(slider).toHaveAttribute('aria-valuemin', '0')
    })

    it('dispatches vault-seek-to-fraction on click at the midpoint', () => {
      setPlayer({ currentTrack: mockTrack, queue: [mockTrack], isPlaying: false })
      render(<MobileShell />)
      activateDeck()
      const bar = screen.getByRole('slider', { name: 'Seek' })
      const events: CustomEvent[] = []
      window.addEventListener('vault-seek-to-fraction', e => events.push(e as CustomEvent))
      Object.defineProperty(bar, 'getBoundingClientRect', {
        value: () => ({ left: 0, width: 200, top: 0, bottom: 20, right: 200, height: 20 }),
        configurable: true,
      })
      fireEvent.click(bar, { clientX: 100 })
      expect(events).toHaveLength(1)
      expect(events[0].detail.fraction).toBeCloseTo(0.5, 1)
    })

    it('dispatches vault-seek-to-fraction: fraction clamps to 0..1', () => {
      setPlayer({ currentTrack: mockTrack, queue: [mockTrack], isPlaying: false })
      render(<MobileShell />)
      activateDeck()
      const bar = screen.getByRole('slider', { name: 'Seek' })
      const events: CustomEvent[] = []
      window.addEventListener('vault-seek-to-fraction', e => events.push(e as CustomEvent))
      Object.defineProperty(bar, 'getBoundingClientRect', {
        value: () => ({ left: 0, width: 200, top: 0, bottom: 20, right: 200, height: 20 }),
        configurable: true,
      })
      fireEvent.click(bar, { clientX: 999 })
      expect(events[0].detail.fraction).toBe(1)
      fireEvent.click(bar, { clientX: -50 })
      expect(events[1].detail.fraction).toBe(0)
    })

    it('dispatches vault-seek-by with -10 seconds when skip back is clicked', () => {
      setPlayer({ currentTrack: mockTrack, queue: [mockTrack], isPlaying: false })
      render(<MobileShell />)
      activateDeck()
      const events: CustomEvent[] = []
      window.addEventListener('vault-seek-by', e => events.push(e as CustomEvent))
      fireEvent.click(screen.getByLabelText('Skip back 10 seconds'))
      expect(events[0].detail.seconds).toBe(-10)
    })

    it('dispatches vault-seek-by with +10 seconds when skip forward is clicked', () => {
      setPlayer({ currentTrack: mockTrack, queue: [mockTrack], isPlaying: false })
      render(<MobileShell />)
      activateDeck()
      const events: CustomEvent[] = []
      window.addEventListener('vault-seek-by', e => events.push(e as CustomEvent))
      fireEvent.click(screen.getByLabelText('Skip forward 10 seconds'))
      expect(events[0].detail.seconds).toBe(10)
    })

    it('shows "The deck is empty" when deck tab active but no current track', () => {
      setPlayer({ currentTrack: null, queue: [], isPlaying: false })
      render(<MobileShell />)
      activateDeck()
      expect(screen.getByText(/The deck is empty/i)).toBeInTheDocument()
    })

    it('shows the current track name when deck tab is active and track is playing', async () => {
      setPlayer({ currentTrack: mockTrack, isPlaying: true, queue: [mockTrack] })
      render(<MobileShell />)
      activateDeck()
      await waitFor(() => expect(screen.getAllByText('Dark Star').length).toBeGreaterThan(0))
    })

    it('updates the current-time display from vault-time-update events', () => {
      setPlayer({ currentTrack: mockTrack, queue: [mockTrack], isPlaying: true })
      render(<MobileShell />)
      activateDeck()
      act(() => {
        window.dispatchEvent(new CustomEvent('vault-time-update', {
          detail: { currentTime: 90, duration: 300 },
        }))
      })
      expect(screen.getByText('1:30')).toBeInTheDocument()
    })

    it('renders a close deck button when deck tab is active', () => {
      render(<MobileShell />)
      activateDeck()
      expect(screen.getByRole('button', { name: 'Close deck' })).toBeInTheDocument()
    })

    it('deactivates the deck when close deck button is clicked', () => {
      render(<MobileShell />)
      activateDeck()
      fireEvent.click(screen.getByRole('button', { name: 'Close deck' }))
      const btn = screen.getByText('Deck').closest('button')!
      expect(btn).not.toHaveClass('active')
    })

    it('closes the deck when Deck tab is clicked while already active', () => {
      render(<MobileShell />)
      activateDeck()
      expect(screen.getByText('Deck').closest('button')).toHaveClass('active')
      fireEvent.click(screen.getByText('Deck'))
      expect(screen.getByText('Deck').closest('button')).not.toHaveClass('active')
    })
  })

  /* ---------------------------------------------------------------- home screen */

  describe('HomeScreen', () => {
    const barton = { date: '1977-05-08', year: 1977, venue: 'Barton Hall', city: 'Ithaca', state: 'NY', country: 'US', songs: ['Dark Star'] }
    const bartonDetail = {
      date: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca', state: 'NY', country: 'US', totalSongs: 1,
      sets: [{ name: 'Set I', encore: false, songs: ['Dark Star'] }],
    }

    it('shows "No show for today\'s date" when the payload has no shows', async () => {
      mockFetch({ ...defaultFetch, '/api/show-of-the-day': sotdPayload() })
      render(<MobileShell />)
      await waitFor(() => expect(screen.queryByText(/Loading/)).not.toBeInTheDocument())
      expect(screen.getByText(/No show for today/i)).toBeInTheDocument()
    })

    it('renders setlist entries when show detail is available', async () => {
      mockFetch({
        ...defaultFetch,
        '/api/show-of-the-day': sotdPayload({
          shows: [barton],
          featured: barton,
          showDetail: bartonDetail,
          archive: {
            identifier: 'gd77-05-08',
            tracks: [{ name: 'gd77t01.mp3', title: 'Dark Star', url: 'https://archive.org/download/gd77/t01.mp3' }],
          },
        }),
      })
      render(<MobileShell />)
      await waitFor(() => expect(screen.getByLabelText('Play Dark Star')).toBeInTheDocument())
    })

    it('calls playShowTrack when a setlist track is clicked', async () => {
      setPlayer({ currentTrack: null })
      mockFetch({
        ...defaultFetch,
        '/api/show-of-the-day': sotdPayload({
          shows: [barton],
          featured: barton,
          showDetail: bartonDetail,
          archive: {
            identifier: 'gd77-05-08',
            tracks: [{ name: 'gd77t01.mp3', title: 'Dark Star', url: 'https://archive.org/download/gd77/t01.mp3' }],
          },
        }),
      })
      render(<MobileShell />)
      await waitFor(() => expect(screen.getByLabelText('Play Dark Star')).toBeInTheDocument())
      fireEvent.click(screen.getByLabelText('Play Dark Star'))
      await waitFor(() => expect(mockPlayShowTrack).toHaveBeenCalled())
    })

    it('renders "Also on this day" when multiple shows exist', async () => {
      const greek = { date: '1982-05-08', year: 1982, venue: 'Greek Theatre', city: 'Berkeley', state: 'CA', country: 'US', songs: [] }
      mockFetch({
        ...defaultFetch,
        '/api/show-of-the-day': sotdPayload({ shows: [barton, greek], featured: barton, showDetail: bartonDetail }),
      })
      render(<MobileShell />)
      await waitFor(() => expect(screen.getByText(/Also on this day/i)).toBeInTheDocument())
      expect(screen.getByText('Greek Theatre')).toBeInTheDocument()
    })

    it('does not render home content when deck tab is active', async () => {
      mockFetch({ ...defaultFetch, '/api/show-of-the-day': sotdPayload() })
      render(<MobileShell />)
      await waitFor(() => expect(screen.queryByText(/Loading/)).not.toBeInTheDocument())
      fireEvent.click(screen.getByText('Deck'))
      // HomeScreen content should not be visible
      expect(screen.queryByText(/No show for today/i)).not.toBeInTheDocument()
    })
  })

  /* ---------------------------------------------------------------- songs screen */

  describe('SongsScreen', () => {
    beforeEach(() => setPathname('/songs'))

    it('renders the song search input', () => {
      render(<MobileShell />)
      expect(screen.getByLabelText('Search songs')).toBeInTheDocument()
    })

    it('shows alphabetical group headers when not searching', async () => {
      mockFetch({
        ...defaultFetch,
        '/api/songs': { songs: [{ title: 'dark star', displayTitle: 'Dark Star', aliases: [] }] },
      })
      render(<MobileShell />)
      await waitFor(() => expect(screen.getByText('D')).toBeInTheDocument())
    })

    it('renders song links in alphabetical groups', async () => {
      mockFetch({
        ...defaultFetch,
        '/api/songs': { songs: [{ title: 'dark star', displayTitle: 'Dark Star', aliases: [] }] },
      })
      render(<MobileShell />)
      await waitFor(() => expect(screen.getByText('Dark Star')).toBeInTheDocument())
    })

    it('shows a flat song list when searching', async () => {
      mockFetch({
        ...defaultFetch,
        '/api/songs': { songs: [{ title: 'dark star', displayTitle: 'Dark Star', aliases: [] }] },
      })
      render(<MobileShell />)
      const input = screen.getByLabelText('Search songs')
      fireEvent.change(input, { target: { value: 'dark' } })
      await waitFor(() => {
        expect(screen.getByText('Dark Star')).toBeInTheDocument()
      })
    })

    it('shows the song count badge', async () => {
      mockFetch({
        ...defaultFetch,
        '/api/songs': { songs: [{ title: 'dark star', displayTitle: 'Dark Star', aliases: [] }] },
      })
      render(<MobileShell />)
      await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument())
    })
  })

  /* ---------------------------------------------------------------- shows screen */

  describe('ShowsScreen', () => {
    beforeEach(() => {
      setPathname('/shows')
      mockFetch({
        ...defaultFetch,
        '/api/stats': { leaderboard: [], showsPerYear: [{ year: 1977, count: 86 }] },
      })
    })

    it('renders decade sections', async () => {
      render(<MobileShell />)
      await waitFor(() => expect(screen.getByText('The Seventies')).toBeInTheDocument())
      expect(screen.getByText('The Sixties')).toBeInTheDocument()
      expect(screen.getByText('The Eighties')).toBeInTheDocument()
      expect(screen.getByText('The Nineties')).toBeInTheDocument()
    })

    it('renders year cards in the decade grid', async () => {
      render(<MobileShell />)
      await waitFor(() => expect(screen.getByText('1977')).toBeInTheDocument())
    })

    it('renders show count on year card', async () => {
      render(<MobileShell />)
      await waitFor(() => expect(screen.getByText('86')).toBeInTheDocument())
    })

    it('navigates to the year page when a year card is clicked', async () => {
      render(<MobileShell />)
      await waitFor(() => expect(screen.getByText('1977')).toBeInTheDocument())
      fireEvent.click(screen.getByText('1977').closest('button')!)
      expect(mockPush).toHaveBeenCalledWith('/shows/1977')
    })
  })

  describe('ShowsByYearMobile', () => {
    beforeEach(() => {
      setPathname('/shows/1977')
      mockFetch({
        ...defaultFetch,
        '/api/shows': {
          shows: [
            { id: 's1', date: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca', state: 'NY', country: 'US' },
          ],
          total: 1,
        },
      })
    })

    it('renders the year as a heading', async () => {
      render(<MobileShell />)
      await waitFor(() => expect(screen.getAllByText('1977').length).toBeGreaterThan(0))
    })

    it('renders shows for the selected year', async () => {
      render(<MobileShell />)
      await waitFor(() => expect(screen.getByText('Barton Hall')).toBeInTheDocument())
    })

    it('renders an add-to-queue button for each show row', async () => {
      render(<MobileShell />)
      await waitFor(() => expect(screen.getByText('Barton Hall')).toBeInTheDocument())
      expect(screen.getByLabelText(/add.*queue/i) || screen.getAllByRole('button').find(b => b.textContent === '+')).toBeTruthy()
    })

    it('calls enqueueEntireShow when the + button is clicked', async () => {
      render(<MobileShell />)
      await waitFor(() => expect(screen.getByText('Barton Hall')).toBeInTheDocument())
      fireEvent.click(screen.getByLabelText('Add Barton Hall show to queue'))
      await waitFor(() => expect(mockEnqueueEntireShow).toHaveBeenCalledWith(
        expect.objectContaining({ date: '1977-05-08' }),
      ))
    })
  })

  /* ---------------------------------------------------------------- stats screen */

  describe('StatsScreen', () => {
    beforeEach(() => {
      setPathname('/stats')
      mockFetch({
        ...defaultFetch,
        '/api/stats/summary': { totalShows: 2333, uniqueSongs: 442, hoursArchived: 6422 },
        '/api/stats': { leaderboard: [], showsPerYear: [] },
      })
    })

    it('renders the total shows figure', async () => {
      render(<MobileShell />)
      await waitFor(() => expect(screen.getByText('2,333')).toBeInTheDocument())
    })

    it('renders the Unique Songs KPI', async () => {
      render(<MobileShell />)
      await waitFor(() => expect(screen.getByText('Unique Songs')).toBeInTheDocument())
    })

    it('renders the position breakdown section with a search input', () => {
      render(<MobileShell />)
      expect(screen.getByLabelText('Search songs for position breakdown')).toBeInTheDocument()
    })

    it('defaults to showing Dark Star in the position breakdown label', () => {
      render(<MobileShell />)
      expect(screen.getByText('DARK STAR')).toBeInTheDocument()
    })
  })

  /* ---------------------------------------------------------------- search screen */

  describe('SearchScreen', () => {
    beforeEach(() => {
      setPathname('/search')
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    async function typeAndFlush(query: string) {
      fireEvent.change(screen.getByLabelText('Search the catalog'), { target: { value: query } })
      await act(async () => { await vi.runAllTimersAsync() })
    }

    it('renders the search input', () => {
      render(<MobileShell />)
      expect(screen.getByLabelText('Search the catalog')).toBeInTheDocument()
    })

    it('shows placeholder text when no query is entered', () => {
      render(<MobileShell />)
      expect(screen.getByText(/Start typing to search/i)).toBeInTheDocument()
    })

    it('fetches songs when a query is typed', async () => {
      render(<MobileShell />)
      await typeAndFlush('dark')
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/songs'))
    })

    it('fetches venues when a query is typed', async () => {
      render(<MobileShell />)
      await typeAndFlush('Barton')
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/shows/by-venue'))
    })

    it('renders "Shows at venue" section when venue API returns results', async () => {
      mockFetch({
        ...defaultFetch,
        '/api/songs': { songs: [] },
        '/api/shows/by-venue': {
          shows: [{ date: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca', state: 'NY', songs: [] }],
        },
      })
      render(<MobileShell />)
      await typeAndFlush('Barton')
      expect(screen.getByText('Shows at venue')).toBeInTheDocument()
      expect(screen.getByText('Barton Hall')).toBeInTheDocument()
    })

    it('renders a link to the show page for each venue result', async () => {
      mockFetch({
        ...defaultFetch,
        '/api/songs': { songs: [] },
        '/api/shows/by-venue': {
          shows: [{ date: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca', state: 'NY', songs: [] }],
        },
      })
      render(<MobileShell />)
      await typeAndFlush('Barton')
      expect(screen.getByText('Barton Hall')).toBeInTheDocument()
      const link = screen.getByText('Barton Hall').closest('a')!
      expect(link).toHaveAttribute('href', '/show/1977-05-08')
    })

    it('does NOT render the venue section when venue API returns no results', async () => {
      mockFetch({ ...defaultFetch, '/api/songs': { songs: [] }, '/api/shows/by-venue': { shows: [] } })
      render(<MobileShell />)
      await typeAndFlush('xyz')
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/shows/by-venue'))
      expect(screen.queryByText('Shows at venue')).not.toBeInTheDocument()
    })

    it('shows the Songs results section when songs are found', async () => {
      mockFetch({
        ...defaultFetch,
        '/api/songs': { songs: [{ title: 'dark star', displayTitle: 'Dark Star', aliases: [] }] },
      })
      render(<MobileShell />)
      await typeAndFlush('dark')
      expect(screen.getByText('Dark Star')).toBeInTheDocument()
      expect(screen.getAllByText('Songs').length).toBeGreaterThanOrEqual(1)
    })

    it('shows a clear button when there is a query', () => {
      render(<MobileShell />)
      fireEvent.change(screen.getByLabelText('Search the catalog'), { target: { value: 'test' } })
      expect(screen.getByText('clear')).toBeInTheDocument()
    })

    it('clears the query when the clear button is clicked', () => {
      render(<MobileShell />)
      const input = screen.getByLabelText('Search the catalog')
      fireEvent.change(input, { target: { value: 'test' } })
      fireEvent.click(screen.getByText('clear'))
      expect((input as HTMLInputElement).value).toBe('')
    })
  })

  /* ---------------------------------------------------------------- show detail screen */

  describe('ShowDetailScreen', () => {
    beforeEach(() => setPathname('/show/1977-05-08'))

    it('renders the show date as a header kicker', () => {
      render(<MobileShell />)
      expect(screen.getByText('1977')).toBeInTheDocument()
    })

    it('shows "Loading…" initially', () => {
      render(<MobileShell />)
      expect(screen.getByText('Loading…')).toBeInTheDocument()
    })

    it('renders the venue name after data loads', async () => {
      mockFetch({
        ...defaultFetch,
        '/api/show': {
          date: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca', state: 'NY', country: 'US', totalSongs: 2,
          sets: [{ name: 'Set I', encore: false, songs: ['Dark Star', 'Truckin'] }],
        },
      })
      render(<MobileShell />)
      await waitFor(() =>
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Barton Hall')
      )
    })

    it('renders all songs in the setlist', async () => {
      mockFetch({
        ...defaultFetch,
        '/api/show': {
          date: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca', state: 'NY', country: 'US', totalSongs: 2,
          sets: [{ name: 'Set I', encore: false, songs: ['Dark Star', 'Truckin'] }],
        },
      })
      render(<MobileShell />)
      await waitFor(() => {
        expect(screen.getByText('Dark Star')).toBeInTheDocument()
        expect(screen.getByText('Truckin')).toBeInTheDocument()
      })
    })

    it('calls playShowTrack when a track is clicked', async () => {
      setPlayer({ currentTrack: null, queue: [] })
      mockFetch({
        ...defaultFetch,
        '/api/show': {
          date: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca', state: 'NY', country: 'US', totalSongs: 1,
          sets: [{ name: 'Set I', encore: false, songs: ['Dark Star'] }],
        },
        '/api/archive/song-tracks': {
          tracks: [{ name: 'gd77t01.mp3', title: 'Dark Star', url: 'https://archive.org/download/gd77/t01.mp3' }],
        },
      })
      render(<MobileShell />)
      await waitFor(() => expect(screen.getByLabelText('Play Dark Star')).toBeInTheDocument())
      fireEvent.click(screen.getByLabelText('Play Dark Star'))
      await waitFor(() => expect(mockPlayShowTrack).toHaveBeenCalled())
    })

    it('highlights the currently-playing track', async () => {
      setPlayer({ currentTrack: { ...mockTrack, name: 'Dark Star' }, isPlaying: true, queue: [mockTrack] })
      mockFetch({
        ...defaultFetch,
        '/api/show': {
          date: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca', state: 'NY', country: 'US', totalSongs: 1,
          sets: [{ name: 'Set I', encore: false, songs: ['Dark Star'] }],
        },
        '/api/archive/song-tracks': {
          tracks: [{ name: 'gd77t01.mp3', title: 'Dark Star', url: 'https://archive.org/download/gd77/t01.mp3' }],
        },
      })
      render(<MobileShell />)
      await waitFor(() => expect(screen.getByLabelText('Play Dark Star')).toBeInTheDocument())
      expect(screen.getByLabelText('Play Dark Star')).toHaveClass('current')
    })

    it('renders "Show not found" when API returns no data', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({ ok: false, json: () => Promise.resolve(null) })
      ) as unknown as typeof fetch
      render(<MobileShell />)
      await waitFor(() => expect(screen.getByText('Show not found.')).toBeInTheDocument())
    })

    it('renders a per-track add-to-queue button for archive tracks', async () => {
      mockFetch({
        ...defaultFetch,
        '/api/show': {
          date: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca', state: 'NY', country: 'US', totalSongs: 1,
          sets: [{ name: 'Set I', encore: false, songs: ['Dark Star'] }],
        },
        '/api/archive/resolve-show': { identifier: 'gd77-05-08.sbd' },
        '/api/archive/song-tracks': {
          tracks: [{ name: 'gd77t01.mp3', title: 'Dark Star', url: 'https://archive.org/download/gd77/t01.mp3' }],
        },
      })
      render(<MobileShell />)
      await waitFor(() =>
        expect(screen.getByLabelText('Add Dark Star to queue')).toBeInTheDocument()
      )
    })

    it('calls enqueueShowTrack when a per-track + button is clicked', async () => {
      mockFetch({
        ...defaultFetch,
        '/api/show': {
          date: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca', state: 'NY', country: 'US', totalSongs: 1,
          sets: [{ name: 'Set I', encore: false, songs: ['Dark Star'] }],
        },
        '/api/archive/resolve-show': { identifier: 'gd77-05-08.sbd' },
        '/api/archive/song-tracks': {
          tracks: [{ name: 'gd77t01.mp3', title: 'Dark Star', url: 'https://archive.org/download/gd77/t01.mp3' }],
        },
      })
      render(<MobileShell />)
      await waitFor(() =>
        expect(screen.getByLabelText('Add Dark Star to queue')).toBeInTheDocument()
      )
      fireEvent.click(screen.getByLabelText('Add Dark Star to queue'))
      await waitFor(() => expect(mockEnqueueShowTrack).toHaveBeenCalled())
    })
  })

  /* ---------------------------------------------------------------- song detail screen */

  describe('SongDetailScreen', () => {
    beforeEach(() => setPathname('/song/Dark Star'))

    it('renders the song title as an h2', () => {
      render(<MobileShell />)
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Dark Star')
    })

    it('renders performance count after loading', async () => {
      mockFetch({
        ...defaultFetch,
        '/api/song-facts': {
          totalPerformances: 320,
          first: { date: '1968-01-17', venue: 'Fillmore', city: 'San Francisco' },
          last: null,
        },
        '/api/versions': { tracks: [], songTitle: 'Dark Star' },
      })
      render(<MobileShell />)
      await waitFor(() => expect(screen.getByText('320')).toBeInTheDocument())
    })

    it('renders "No performance data found" when facts have no first play', async () => {
      mockFetch({
        ...defaultFetch,
        '/api/song-facts': { totalPerformances: 0, first: null, last: null },
        '/api/versions': { tracks: [], songTitle: 'Dark Star' },
      })
      render(<MobileShell />)
      await waitFor(() => expect(screen.getByText(/No performance data/i)).toBeInTheDocument())
    })

    it('renders Versions section when tracks exist', async () => {
      mockFetch({
        ...defaultFetch,
        '/api/song-facts': { totalPerformances: 2, first: null, last: null },
        '/api/versions': {
          songTitle: 'Dark Star',
          tracks: [
            { id: 'v1', showDate: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca', durationSec: 420 },
          ],
        },
      })
      render(<MobileShell />)
      await waitFor(() => expect(screen.getByText('Barton Hall')).toBeInTheDocument())
    })

    it('shows "Show all N versions" button when > 12 versions exist', async () => {
      const tracks = Array.from({ length: 14 }, (_, i) => ({
        id: `v${i}`, showDate: `1977-0${String((i % 9) + 1).padStart(2, '0')}-08`,
        venue: 'Barton Hall', city: 'Ithaca', durationSec: 300 + i * 10,
      }))
      mockFetch({
        ...defaultFetch,
        '/api/song-facts': { totalPerformances: 14, first: null, last: null },
        '/api/versions': { songTitle: 'Dark Star', tracks },
      })
      render(<MobileShell />)
      await waitFor(() => expect(screen.getByText(/Show all 14 versions/i)).toBeInTheDocument())
    })

    it('reveals all versions when the load-more button is clicked', async () => {
      const tracks = Array.from({ length: 14 }, (_, i) => ({
        id: `v${i}`, showDate: `1977-0${String((i % 9) + 1).padStart(2, '0')}-08`,
        venue: 'Barton Hall', city: 'Ithaca', durationSec: 300 + i * 10,
      }))
      mockFetch({
        ...defaultFetch,
        '/api/song-facts': { totalPerformances: 14, first: null, last: null },
        '/api/versions': { songTitle: 'Dark Star', tracks },
      })
      render(<MobileShell />)
      await waitFor(() => expect(screen.getByText(/Show all 14 versions/i)).toBeInTheDocument())
      fireEvent.click(screen.getByText(/Show all 14 versions/i))
      expect(screen.queryByText(/Show all/i)).not.toBeInTheDocument()
    })

    it('renders Shortest and Longest extremes when provided', async () => {
      mockFetch({
        ...defaultFetch,
        '/api/song-facts': { totalPerformances: 2, first: null, last: null },
        '/api/versions': {
          songTitle: 'Dark Star',
          tracks: [{ id: 'v1', showDate: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca', durationSec: 420 }],
          extremes: {
            shortest: { id: 'v1', showDate: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca', durationSec: 420 },
            longest: { id: 'v2', showDate: '1969-02-11', venue: 'Fillmore', city: 'San Francisco', durationSec: 1200 },
          },
        },
      })
      render(<MobileShell />)
      await waitFor(() => {
        expect(screen.getByText('Shortest')).toBeInTheDocument()
        expect(screen.getByText('Longest')).toBeInTheDocument()
      })
    })
  })

  /* ---------------------------------------------------------------- routing */

  describe('MobileShell routing', () => {
    it('renders HomeScreen (song-of-day content) on "/"', async () => {
      setPathname('/')
      mockFetch({ ...defaultFetch, '/api/show-of-the-day': sotdPayload() })
      render(<MobileShell />)
      await waitFor(() => expect(screen.queryByText(/Loading/)).not.toBeInTheDocument())
      // HomeScreen renders, not DeckScreen - no reel player by default
      expect(screen.queryByLabelText('Reel-to-reel player')).not.toBeInTheDocument()
    })

    it('renders DeckScreen (reel) when Deck tab is clicked', () => {
      setPathname('/')
      setPlayer({ currentTrack: mockTrack, queue: [mockTrack], isPlaying: true })
      render(<MobileShell />)
      fireEvent.click(screen.getByText('Deck'))
      expect(screen.getByLabelText('Reel-to-reel player')).toBeInTheDocument()
    })

    it('renders SongsScreen (song search) on "/songs"', () => {
      setPathname('/songs')
      render(<MobileShell />)
      expect(screen.getByLabelText('Search songs')).toBeInTheDocument()
    })

    it('renders ShowsScreen (decade grid) on "/shows"', async () => {
      setPathname('/shows')
      render(<MobileShell />)
      await waitFor(() => expect(screen.getByText('The Seventies')).toBeInTheDocument())
    })

    it('renders SearchScreen (catalog search) on "/search"', () => {
      setPathname('/search')
      render(<MobileShell />)
      expect(screen.getByLabelText('Search the catalog')).toBeInTheDocument()
    })

    it('renders StatsScreen (stats page) on "/stats"', async () => {
      setPathname('/stats')
      mockFetch({
        ...defaultFetch,
        '/api/stats/summary': { totalShows: 2333, uniqueSongs: 442, hoursArchived: 6422 },
        '/api/stats': { leaderboard: [], showsPerYear: [] },
      })
      render(<MobileShell />)
      await waitFor(() => expect(screen.getByText('2,333')).toBeInTheDocument())
    })

    it('renders ShowDetailScreen on "/show/1977-05-08"', () => {
      setPathname('/show/1977-05-08')
      render(<MobileShell />)
      expect(screen.getByText('Loading…')).toBeInTheDocument()
    })

    it('renders SongDetailScreen on "/song/Dark Star"', () => {
      setPathname('/song/Dark Star')
      render(<MobileShell />)
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Dark Star')
    })

    it('shows the mini player on non-home routes when a track is playing', () => {
      setPathname('/songs')
      setPlayer({ currentTrack: mockTrack, isPlaying: true })
      render(<MobileShell />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('shows the mini player on home route when a track is playing', () => {
      setPathname('/')
      setPlayer({ currentTrack: mockTrack, isPlaying: true })
      render(<MobileShell />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('hides the mini player when deck tab is active', () => {
      setPathname('/')
      setPlayer({ currentTrack: mockTrack, isPlaying: true })
      render(<MobileShell />)
      fireEvent.click(screen.getByText('Deck'))
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('renders tab bar on every route', () => {
      const routes = ['/', '/songs', '/shows', '/search', '/show/1977-05-08', '/song/Dark Star']
      for (const route of routes) {
        setPathname(route)
        const { unmount } = render(<MobileShell />)
        expect(screen.getByText('Home')).toBeInTheDocument()
        expect(screen.getByText('Deck')).toBeInTheDocument()
        unmount()
      }
    })
  })
})
