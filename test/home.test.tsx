import { render, screen, waitFor } from '@testing-library/react'
import { PlayerProvider } from '@/lib/contexts/player-context'
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
      json: async () => ({ shows: [], date: '1977-05-08' }),
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
    it('is disabled (shows Loading…) while archive is pending', async () => {
      let resolveArchive!: (v: unknown) => void
      const archiveDelay = new Promise(r => { resolveArchive = r })

      global.fetch = vi.fn((url: string) => {
        if (url.includes('/api/on-this-day')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ shows: [featuredShow] }) })
        }
        if (url.includes('/api/show?')) {
          return Promise.resolve({ ok: true, json: () => Promise.resolve(showDetail) })
        }
        if (url.includes('/api/archive/resolve-show')) {
          return archiveDelay.then(() => ({ ok: true, json: () => Promise.resolve({ identifier: 'gd77-05-08' }) }))
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
      }) as unknown as typeof fetch

      renderHome()

      await waitFor(() => {
        const btn = screen.queryByRole('button', { name: /loading/i })
        expect(btn).not.toBeNull()
        expect(btn).toBeDisabled()
      }, { timeout: 3000 })

      resolveArchive({})
    })

    it('becomes enabled after archive finishes loading', async () => {
      mockFetch({
        '/api/on-this-day': { shows: [featuredShow] },
        '/api/show': showDetail,
        '/api/stats/summary': {},
        '/api/stats': { leaderboard: [] },
        '/api/archive/resolve-show': { identifier: 'gd77-05-08' },
        '/api/archive/song-tracks': {
          tracks: [
            { name: 'gd77-05-08d1t01.mp3', title: 'Dark Star', url: 'https://archive.org/download/gd77-05-08/t01.mp3' },
          ]
        },
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
    it('shows archive-only tracks inline in the setlist after archive loads', async () => {
      mockFetch({
        '/api/on-this-day': { shows: [featuredShow] },
        '/api/show': showDetail,
        '/api/stats/summary': {},
        '/api/stats': { leaderboard: [] },
        '/api/archive/resolve-show': { identifier: 'gd77-05-08' },
        '/api/archive/song-tracks': {
          tracks: [
            { name: 'gd77-05-08d1t01.mp3', title: 'Dark Star', url: 'https://archive.org/download/gd77-05-08/t01.mp3', duration: 1380 },
            { name: 'gd77-05-08d1t02.mp3', title: 'banter', url: 'https://archive.org/download/gd77-05-08/t02.mp3', duration: 60 },
            { name: 'gd77-05-08d1t03.mp3', title: 'St. Stephen', url: 'https://archive.org/download/gd77-05-08/t03.mp3', duration: 420 },
          ]
        },
      })

      renderHome()

      await waitFor(() => {
        expect(screen.getByText('Banter')).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('capitalizes archive track titles for display', async () => {
      mockFetch({
        '/api/on-this-day': { shows: [featuredShow] },
        '/api/show': showDetail,
        '/api/stats/summary': {},
        '/api/stats': { leaderboard: [] },
        '/api/archive/resolve-show': { identifier: 'gd77-05-08' },
        '/api/archive/song-tracks': {
          tracks: [
            { name: 'gd77-05-08d1t01.mp3', title: 'Dark Star', url: 'https://archive.org/download/gd77-05-08/t01.mp3' },
            { name: 'gd77-05-08d1t02.mp3', title: 'tuning', url: 'https://archive.org/download/gd77-05-08/t02.mp3' },
            { name: 'gd77-05-08d1t03.mp3', title: 'St. Stephen', url: 'https://archive.org/download/gd77-05-08/t03.mp3' },
          ]
        },
      })

      renderHome()

      await waitFor(() => {
        expect(screen.getByText('Tuning')).toBeInTheDocument()
        // Should NOT display lowercase version
        expect(screen.queryByText('tuning')).not.toBeInTheDocument()
      }, { timeout: 5000 })
    })

    it('does not show "Encore: SongName" as an ancillary row (strips prefix in matching)', async () => {
      mockFetch({
        '/api/archive/song-tracks': {
          tracks: [
            { name: 'gd77-05-08d1t01.mp3', title: 'Dark Star', url: 'https://archive.org/download/gd77-05-08/t01.mp3' },
            { name: 'gd77-05-08d1t02.mp3', title: 'Encore: U.S. Blues', url: 'https://archive.org/download/gd77-05-08/t02.mp3' },
          ]
        },
        '/api/archive/resolve-show': { identifier: 'gd77-05-08' },
        '/api/stats/summary': {},
        '/api/stats': { leaderboard: [] },
        '/api/show': showDetail,
        '/api/on-this-day': { shows: [featuredShow] },
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
      const featuredDetail = {
        date: '1976-06-14', venue: 'Beacon Theatre', city: 'New York', state: 'NY', country: 'US',
        sets: [{ name: 'Set 1', encore: false, songs: ['Dark Star'] }], totalSongs: 1,
      }
      mockFetch({
        '/api/archive/song-tracks': { tracks: [] },
        '/api/archive/resolve-show': { identifier: 'gd76-06-14' },
        '/api/stats/summary': {},
        '/api/stats': { leaderboard: [] },
        '/api/show': featuredDetail,
        '/api/on-this-day': {
          shows: [
            { date: '1968-06-14', year: 1968, venue: 'Fillmore East', city: 'New York', state: 'NY', country: 'US', songs: [] },
            { date: '1968-06-14', year: 1968, venue: 'Fillmore East', city: 'New York', state: 'NY', country: 'US', songs: [] },
            { date: '1976-06-14', year: 1976, venue: 'Beacon Theatre', city: 'New York', state: 'NY', country: 'US', songs: ['Dark Star'] },
          ]
        },
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
