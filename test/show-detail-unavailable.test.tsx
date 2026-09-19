import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { usePlayer } from '@/lib/contexts/player-context'
import { ShowDetailClient } from '@/components/show/show-detail-client'
import type { ShowDetail } from '@/lib/show-of-the-day-types'

vi.mock('@/lib/contexts/player-context', () => ({
  usePlayer: vi.fn(),
}))

function makePlayer(overrides: Record<string, unknown> = {}) {
  return {
    currentTrack: null,
    isPlaying: false,
    queue: [] as unknown[],
    enqueueEntireShow: vi.fn().mockResolvedValue(undefined),
    enqueueShowTrack: vi.fn().mockResolvedValue(undefined),
    playShowTrack: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    prependToQueue: vi.fn(),
    selectTrack: vi.fn(),
    addToQueue: vi.fn(),
    ...overrides,
  }
}

function mockFetch(responses: Record<string, unknown>) {
  const sortedKeys = Object.keys(responses).sort((a, b) => b.length - a.length)
  global.fetch = vi.fn((url: string) => {
    const key = sortedKeys.find(k => url.includes(k))
    const body = key ? responses[key] : {}
    return Promise.resolve({ ok: true, json: () => Promise.resolve(body) })
  }) as unknown as typeof fetch
}

const showDetail: ShowDetail = {
  date: '1987-09-16',
  venue: 'Madison Square Garden',
  city: 'New York',
  state: 'NY',
  country: 'US',
  totalSongs: 3,
  sets: [
    {
      name: 'Set One',
      encore: false,
      songs: ['Cold Rain And Snow', "Franklin's Tower", 'The Little Red Rooster'],
      segues: [false, false, false],
    },
  ],
}

describe('ShowDetailClient unavailable audio', () => {
  beforeEach(() => {
    vi.mocked(usePlayer).mockReturnValue(makePlayer() as unknown as ReturnType<typeof usePlayer>)
    // jsdom has no matchMedia; the component treats that as "not mobile" and
    // runs its desktop archive-resolution fetch chain.
    mockFetch({
      '/api/archive/resolve-show': {
        identifier: 'gd87-09-16.sbd',
        title: 'Grateful Dead Live at Madison Square Garden',
        description: null,
        candidates: [
          { identifier: 'gd87-09-16.sbd', title: 'SBD', recordingType: 'sbd', score: 10 },
        ],
      },
      '/api/archive/song-tracks': {
        tracks: [
          { id: 't1', name: 'cold-rain.mp3', title: 'Cold Rain And Snow', url: 'https://archive.org/t1.mp3', duration: 300, archiveItemId: 'gd87-09-16.sbd' },
          { id: 't2', name: 'franklins.mp3', title: "Franklin's Tower", url: 'https://archive.org/t2.mp3', duration: 400, archiveItemId: 'gd87-09-16.sbd' },
        ],
      },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('labels the missing song, drops its dead link, and shows the banner', async () => {
    render(
      <ShowDetailClient
        date="1987-09-16"
        initialShow={showDetail}
        officialReleases={[]}
        adjacentShows={{ prev: null, next: null }}
      />
    )

    await waitFor(() => expect(screen.getByText('Audio Unavailable')).toBeInTheDocument())

    // The unavailable row: title present, no redundant "go to song" link.
    const unavailLabel = screen.getByText('Audio Unavailable')
    const unavailRow = unavailLabel.closest('.track') as HTMLElement
    expect(unavailRow).toHaveClass('unavailable')
    expect(unavailRow.querySelector('a.chev')).toBeNull()
    within(unavailRow).getByText('The Little Red Rooster')

    // The two covered rows keep their "go to song" link and are not marked unavailable.
    expect(screen.queryAllByText('go to song ↗')).toHaveLength(2)
    expect(screen.queryAllByText('go to song ↗').every(el => !el.closest('.track')!.classList.contains('unavailable'))).toBe(true)

    // Banner supersedes the old ">2 missing songs" threshold — one missing song is enough.
    expect(screen.getByText(/don't have available audio/)).toBeInTheDocument()
  })
})
