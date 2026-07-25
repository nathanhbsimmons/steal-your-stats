import { render, screen } from '@testing-library/react'
import { PlayerProvider } from '@/lib/contexts/player-context'
import { matchArchiveTracksToSetlist } from '@/lib/archive-track-match'
import { HomeClient } from '@/components/home/home-client'
import type { ShowOfTheDayPayload } from '@/lib/show-of-the-day-types'

const featuredShow = {
  date: '1977-05-08', year: 1977, venue: 'Barton Hall', city: 'Ithaca',
  state: 'NY', country: 'US', songs: ['Dark Star'],
}
const showDetail = {
  date: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca', state: 'NY', country: 'US',
  sets: [{ name: 'Set 1', encore: false, songs: ['Dark Star', 'St. Stephen'], segues: [false, false] }],
  totalSongs: 2,
}

function sotdPayload(overrides: Partial<ShowOfTheDayPayload> = {}): ShowOfTheDayPayload {
  const merged = {
    dateKey: '1977-05-08',
    shows: [featuredShow],
    featured: featuredShow,
    showDetail,
    archive: null as ShowOfTheDayPayload['archive'],
    complete: true,
    computedAt: Date.now(),
    ...overrides,
  }
  const archiveMatch = merged.archive && merged.showDetail
    ? matchArchiveTracksToSetlist(merged.archive.tracks, merged.showDetail.sets.flatMap(s => s.songs))
    : null
  return { ...merged, archiveMatch } as ShowOfTheDayPayload
}

// HomeClient receives its data as props precomputed server-side (see
// showOfTheDayService) — no client-side fetch/loading state to mock anymore.
function renderHome(dayPayload: ShowOfTheDayPayload | null = sotdPayload()) {
  return render(
    <PlayerProvider>
      <HomeClient initialKpi={null} initialStats={null} initialDayPayload={dayPayload} />
    </PlayerProvider>
  )
}

describe('Home', () => {
  it('renders the On This Day heading', () => {
    renderHome()
    expect(screen.getByText(/On This Day/)).toBeInTheDocument()
  })

  it('renders a fallback message when there is no featured show for today', () => {
    renderHome(sotdPayload({ shows: [], featured: null, showDetail: null }))
    expect(screen.queryByRole('button', { name: /play entire show/i })).toBeNull()
  })

  describe('"Play entire show" button', () => {
    it('renders enabled as soon as a featured show is present', () => {
      renderHome(sotdPayload())
      const btn = screen.getByRole('button', { name: /play entire show/i })
      expect(btn).not.toBeDisabled()
    })

    it('stays enabled once an archive recording is resolved', () => {
      renderHome(sotdPayload({
        archive: {
          identifier: 'gd77-05-08',
          description: null,
          tracks: [
            { id: 't1', name: 'gd77-05-08d1t01.mp3', title: 'Dark Star', url: 'https://archive.org/download/gd77-05-08/t01.mp3', archiveItemId: 'gd77-05-08' },
          ],
        },
      }))
      const btn = screen.getByRole('button', { name: /play entire show/i })
      expect(btn).not.toBeDisabled()
    })
  })

  describe('ancillary tracks', () => {
    it('shows archive-only tracks inline in the bonus section', () => {
      // "banter"/"tuning"-style clips are filler (see isFillerTrack) and are
      // dropped rather than shown as bonus tracks — use a real alternate-take
      // title here so the bonus section actually has something to show.
      renderHome(sotdPayload({
        archive: {
          identifier: 'gd77-05-08',
          description: null,
          tracks: [
            { id: 't1', name: 'gd77-05-08d1t01.mp3', title: 'Dark Star', url: 'https://archive.org/download/gd77-05-08/t01.mp3', duration: 1380, archiveItemId: 'gd77-05-08' },
            { id: 't2', name: 'gd77-05-08d1t02.mp3', title: 'noodling', url: 'https://archive.org/download/gd77-05-08/t02.mp3', duration: 300, archiveItemId: 'gd77-05-08' },
            { id: 't3', name: 'gd77-05-08d1t03.mp3', title: 'St. Stephen', url: 'https://archive.org/download/gd77-05-08/t03.mp3', duration: 420, archiveItemId: 'gd77-05-08' },
          ],
        },
      }))

      expect(screen.getByText(/bonus tracks/i)).toBeInTheDocument()
      expect(screen.getByText('Noodling')).toBeInTheDocument()
    })

    it('capitalizes archive track titles for display', () => {
      renderHome(sotdPayload({
        archive: {
          identifier: 'gd77-05-08',
          description: null,
          tracks: [
            { id: 't1', name: 'gd77-05-08d1t01.mp3', title: 'Dark Star', url: 'https://archive.org/download/gd77-05-08/t01.mp3', duration: 1380, archiveItemId: 'gd77-05-08' },
            { id: 't2', name: 'gd77-05-08d1t02.mp3', title: 'jam', url: 'https://archive.org/download/gd77-05-08/t02.mp3', duration: 300, archiveItemId: 'gd77-05-08' },
            { id: 't3', name: 'gd77-05-08d1t03.mp3', title: 'St. Stephen', url: 'https://archive.org/download/gd77-05-08/t03.mp3', duration: 420, archiveItemId: 'gd77-05-08' },
          ],
        },
      }))

      expect(screen.getByText('Jam')).toBeInTheDocument()
      // Should NOT display lowercase version
      expect(screen.queryByText('jam')).not.toBeInTheDocument()
    })

    it('drops filler clips (tuning, banter, short set-break gaps) from the bonus section entirely', () => {
      renderHome(sotdPayload({
        archive: {
          identifier: 'gd77-05-08',
          description: null,
          tracks: [
            { id: 't1', name: 'gd77-05-08d1t01.mp3', title: 'Dark Star', url: 'https://archive.org/download/gd77-05-08/t01.mp3', duration: 1380, archiveItemId: 'gd77-05-08' },
            { id: 't2', name: 'gd77-05-08d1t02.mp3', title: 'tuning', url: 'https://archive.org/download/gd77-05-08/t02.mp3', duration: 45, archiveItemId: 'gd77-05-08' },
            { id: 't3', name: 'gd77-05-08d1t03.mp3', title: 'Encore Break', url: 'https://archive.org/download/gd77-05-08/t03.mp3', duration: 27, archiveItemId: 'gd77-05-08' },
            { id: 't4', name: 'gd77-05-08d1t04.mp3', title: 'St. Stephen', url: 'https://archive.org/download/gd77-05-08/t04.mp3', duration: 420, archiveItemId: 'gd77-05-08' },
          ],
        },
      }))

      expect(screen.getByText(/play entire show/i)).toBeInTheDocument()
      expect(screen.queryByText(/bonus tracks/i)).not.toBeInTheDocument()
    })

    it('does not show "Encore: SongName" as an ancillary row (strips prefix in matching)', () => {
      renderHome(sotdPayload({
        archive: {
          identifier: 'gd77-05-08',
          description: null,
          tracks: [
            { id: 't1', name: 'gd77-05-08d1t01.mp3', title: 'Dark Star', url: 'https://archive.org/download/gd77-05-08/t01.mp3', archiveItemId: 'gd77-05-08' },
            { id: 't2', name: 'gd77-05-08d1t02.mp3', title: 'Encore: U.S. Blues', url: 'https://archive.org/download/gd77-05-08/t02.mp3', archiveItemId: 'gd77-05-08' },
          ],
        },
      }))

      expect(screen.queryAllByText('Dark Star').length).toBeGreaterThan(0)
      // Raw "Encore: U.S. Blues" should never appear — prefix is stripped in both matching and display
      expect(screen.queryByText('Encore: U.S. Blues')).not.toBeInTheDocument()
    })
  })

  describe('also on this day list', () => {
    it('renders correctly when the same venue appears twice on the same date', () => {
      // 1976 Beacon Theatre has songs → featured. 1968 Fillmore East appears twice → duplicate key bug.
      const beacon = { date: '1976-06-14', year: 1976, venue: 'Beacon Theatre', city: 'New York', state: 'NY', country: 'US', songs: ['Dark Star'] }
      const featuredDetail = {
        date: '1976-06-14', venue: 'Beacon Theatre', city: 'New York', state: 'NY', country: 'US',
        sets: [{ name: 'Set 1', encore: false, songs: ['Dark Star'], segues: [false] }], totalSongs: 1,
      }
      renderHome(sotdPayload({
        shows: [
          { date: '1968-06-14', year: 1968, venue: 'Fillmore East', city: 'New York', state: 'NY', country: 'US', songs: [] },
          { date: '1968-06-14', year: 1968, venue: 'Fillmore East', city: 'New York', state: 'NY', country: 'US', songs: [] },
          beacon,
        ],
        featured: beacon,
        showDetail: featuredDetail,
        archive: { identifier: 'gd76-06-14', description: null, tracks: [] },
      }))

      // "Beacon Theatre" appears in the also-list (nested in <span class="where">);
      // use textContent which includes all descendant text
      expect(document.body.textContent).toContain('Beacon Theatre')

      // Both 1968 Fillmore East shows should appear as separate <span class="yr"> elements
      const yr68 = screen.getAllByText('1968')
      expect(yr68.length).toBeGreaterThanOrEqual(2)
    })
  })
})
