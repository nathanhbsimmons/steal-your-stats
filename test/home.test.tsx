import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { PlayerProvider } from '@/lib/contexts/player-context'
import { matchArchiveTracksToSetlist } from '@/lib/archive-track-match'
import Home from '../app/page'

const featuredShow = {
  date: '1977-05-08', year: 1977, venue: 'Barton Hall', city: 'Ithaca',
  state: 'NY', country: 'US', songs: ['Dark Star'],
}
const showDetail = {
  date: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca', state: 'NY', country: 'US',
  sets: [{ name: 'Set 1', encore: false, songs: ['Dark Star', 'St. Stephen'] }],
  totalSongs: 2,
}

function sotdPayload(overrides: Record<string, unknown> = {}) {
  const merged = {
    dateKey: '1977-05-08',
    shows: [featuredShow],
    featured: featuredShow,
    showDetail,
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

function mockFetch(responses: Record<string, unknown>) {
  const sortedKeys = Object.keys(responses).sort((a, b) => b.length - a.length)
  global.fetch = vi.fn((url: string) => {
    const key = sortedKeys.find(k => url.includes(k))
    const body = key ? responses[key] : {}
    return Promise.resolve({ ok: true, json: () => Promise.resolve(body) })
  }) as unknown as typeof fetch
}

function renderHome() {
  return render(
    <PlayerProvider>
      <Home />
    </PlayerProvider>
  )
}

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => sotdPayload({ shows: [], featured: null, showDetail: null }),
    })
  })

  it('renders the On This Day heading', () => {
    renderHome()
    expect(screen.getByText(/On This Day/)).toBeInTheDocument()
  })

  it('renders a loading state initially', () => {
    renderHome()
    const skeletons = document.querySelectorAll('.skeleton-vault')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  describe('"Play entire show" button', () => {
    it('shows the loading skeleton while the show-of-the-day fetch is unresolved', async () => {
      let resolvePayload!: (v: unknown) => void
      const payloadDelay = new Promise(r => { resolvePayload = r })

      global.fetch = vi.fn((url: string) => {
        if (url.includes('/api/show-of-the-day')) {
          return payloadDelay.then(() => ({ ok: true, json: () => Promise.resolve(sotdPayload()) }))
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      }) as unknown as typeof fetch

      renderHome()

      expect(document.querySelectorAll('.skeleton-vault').length).toBeGreaterThan(0)
      expect(screen.queryByRole('button', { name: /play entire show/i })).toBeNull()

      resolvePayload({})

      await waitFor(() => {
        const btn = screen.queryByRole('button', { name: /play entire show/i })
        expect(btn).not.toBeNull()
        expect(btn).not.toBeDisabled()
      }, { timeout: 3000 })
    })

    it('becomes enabled after the payload loads', async () => {
      mockFetch({
        '/api/show-of-the-day': sotdPayload({
          archive: {
            identifier: 'gd77-05-08',
            tracks: [
              { name: 'gd77-05-08d1t01.mp3', title: 'Dark Star', url: 'https://archive.org/download/gd77-05-08/t01.mp3' },
            ],
          },
        }),
        '/api/stats/summary': {},
        '/api/stats': { leaderboard: [] },
      })

      renderHome()

      await waitFor(() => {
        const btn = screen.queryByRole('button', { name: /play entire show/i })
        expect(btn).not.toBeNull()
        expect(btn).not.toBeDisabled()
      }, { timeout: 5000 })
    })
  })

  describe('ancillary tracks', () => {
    it('shows archive-only tracks inline in the setlist after the payload loads', async () => {
      // "banter"/"tuning"-style clips are filler (see isFillerTrack) and are
      // dropped rather than shown as bonus tracks — use a real alternate-take
      // title here so the bonus section actually has something to show.
      mockFetch({
        '/api/show-of-the-day': sotdPayload({
          archive: {
            identifier: 'gd77-05-08',
            tracks: [
              { name: 'gd77-05-08d1t01.mp3', title: 'Dark Star', url: 'https://archive.org/download/gd77-05-08/t01.mp3', duration: 1380 },
              { name: 'gd77-05-08d1t02.mp3', title: 'noodling', url: 'https://archive.org/download/gd77-05-08/t02.mp3', duration: 300 },
              { name: 'gd77-05-08d1t03.mp3', title: 'St. Stephen', url: 'https://archive.org/download/gd77-05-08/t03.mp3', duration: 420 },
            ],
          },
        }),
        '/api/stats/summary': {},
        '/api/stats': { leaderboard: [] },
      })

      renderHome()

      await waitFor(() => {
        expect(screen.getByText(/bonus tracks/i)).toBeInTheDocument()
      }, { timeout: 5000 })
      fireEvent.click(screen.getByText(/bonus tracks/i))

      expect(screen.getByText('Noodling')).toBeInTheDocument()
    })

    it('capitalizes archive track titles for display', async () => {
      mockFetch({
        '/api/show-of-the-day': sotdPayload({
          archive: {
            identifier: 'gd77-05-08',
            tracks: [
              { name: 'gd77-05-08d1t01.mp3', title: 'Dark Star', url: 'https://archive.org/download/gd77-05-08/t01.mp3', duration: 1380 },
              { name: 'gd77-05-08d1t02.mp3', title: 'jam', url: 'https://archive.org/download/gd77-05-08/t02.mp3', duration: 300 },
              { name: 'gd77-05-08d1t03.mp3', title: 'St. Stephen', url: 'https://archive.org/download/gd77-05-08/t03.mp3', duration: 420 },
            ],
          },
        }),
        '/api/stats/summary': {},
        '/api/stats': { leaderboard: [] },
      })

      renderHome()

      await waitFor(() => {
        expect(screen.getByText(/bonus tracks/i)).toBeInTheDocument()
      }, { timeout: 5000 })
      fireEvent.click(screen.getByText(/bonus tracks/i))

      expect(screen.getByText('Jam')).toBeInTheDocument()
      // Should NOT display lowercase version
      expect(screen.queryByText('jam')).not.toBeInTheDocument()
    })

    it('drops filler clips (tuning, banter, short set-break gaps) from the bonus section entirely', async () => {
      mockFetch({
        '/api/show-of-the-day': sotdPayload({
          archive: {
            identifier: 'gd77-05-08',
            tracks: [
              { name: 'gd77-05-08d1t01.mp3', title: 'Dark Star', url: 'https://archive.org/download/gd77-05-08/t01.mp3', duration: 1380 },
              { name: 'gd77-05-08d1t02.mp3', title: 'tuning', url: 'https://archive.org/download/gd77-05-08/t02.mp3', duration: 45 },
              { name: 'gd77-05-08d1t03.mp3', title: 'Encore Break', url: 'https://archive.org/download/gd77-05-08/t03.mp3', duration: 27 },
              { name: 'gd77-05-08d1t04.mp3', title: 'St. Stephen', url: 'https://archive.org/download/gd77-05-08/t04.mp3', duration: 420 },
            ],
          },
        }),
        '/api/stats/summary': {},
        '/api/stats': { leaderboard: [] },
      })

      renderHome()

      await waitFor(() => {
        expect(screen.getByText(/play entire show/i)).toBeInTheDocument()
      })

      expect(screen.queryByText(/bonus tracks/i)).not.toBeInTheDocument()
    })

    it('does not show "Encore: SongName" as an ancillary row (strips prefix in matching)', async () => {
      mockFetch({
        '/api/show-of-the-day': sotdPayload({
          archive: {
            identifier: 'gd77-05-08',
            tracks: [
              { name: 'gd77-05-08d1t01.mp3', title: 'Dark Star', url: 'https://archive.org/download/gd77-05-08/t01.mp3' },
              { name: 'gd77-05-08d1t02.mp3', title: 'Encore: U.S. Blues', url: 'https://archive.org/download/gd77-05-08/t02.mp3' },
            ],
          },
        }),
        '/api/stats/summary': {},
        '/api/stats': { leaderboard: [] },
      })

      renderHome()

      // Wait for page content to appear (songs title appears in opener + setlist)
      await waitFor(() => {
        expect(screen.queryAllByText('Dark Star').length).toBeGreaterThan(0)
      }, { timeout: 5000 })

      // Raw "Encore: U.S. Blues" should never appear — prefix is stripped in both matching and display
      expect(screen.queryByText('Encore: U.S. Blues')).not.toBeInTheDocument()
    })
  })

  describe('also on this day list', () => {
    it('renders correctly when the same venue appears twice on the same date', async () => {
      // 1976 Beacon Theatre has songs → featured. 1968 Fillmore East appears twice → duplicate key bug.
      const beacon = { date: '1976-06-14', year: 1976, venue: 'Beacon Theatre', city: 'New York', state: 'NY', country: 'US', songs: ['Dark Star'] }
      const featuredDetail = {
        date: '1976-06-14', venue: 'Beacon Theatre', city: 'New York', state: 'NY', country: 'US',
        sets: [{ name: 'Set 1', encore: false, songs: ['Dark Star'] }], totalSongs: 1,
      }
      mockFetch({
        '/api/show-of-the-day': sotdPayload({
          shows: [
            { date: '1968-06-14', year: 1968, venue: 'Fillmore East', city: 'New York', state: 'NY', country: 'US', songs: [] },
            { date: '1968-06-14', year: 1968, venue: 'Fillmore East', city: 'New York', state: 'NY', country: 'US', songs: [] },
            beacon,
          ],
          featured: beacon,
          showDetail: featuredDetail,
          archive: { identifier: 'gd76-06-14', tracks: [] },
        }),
        '/api/stats/summary': {},
        '/api/stats': { leaderboard: [] },
      })

      renderHome()

      // "Beacon Theatre" appears in the also-list (nested in <span class="where">);
      // use textContent which includes all descendant text
      await waitFor(() => {
        expect(document.body.textContent).toContain('Beacon Theatre')
      }, { timeout: 3000 })

      // Both 1968 Fillmore East shows should appear as separate <span class="yr"> elements
      const yr68 = screen.getAllByText('1968')
      expect(yr68.length).toBeGreaterThanOrEqual(2)
    })
  })
})
