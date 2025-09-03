import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPositions } from '@/lib/songFacts'
import { SetlistClientImpl } from '@/lib/clients/setlist'
import { resolveSong } from '@/lib/ids'

// Mock environment variables
vi.mock('@/lib/env', () => ({
  env: {
    SETLISTFM_API_KEY: 'test-api-key'
  }
}))

// Mock the dependencies
vi.mock('@/lib/clients/setlist')
vi.mock('@/lib/ids')

const mockSetlistClient = {
  searchSongs: vi.fn(),
  searchSetlistsBySong: vi.fn(),
  getSetlistsByArtist: vi.fn(),
}

const mockResolveSong = vi.mocked(resolveSong)

describe('getPositions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(SetlistClientImpl).mockImplementation(() => mockSetlistClient as any)
  })

  it('returns empty results when no songs found', async () => {
    mockResolveSong.mockResolvedValue({
      normalizedTitle: 'Test Song',
      aliases: ['Test Song'],
      mbid: undefined,
      confidence: 1.0
    })

    mockSetlistClient.searchSongs.mockResolvedValue([])

    const result = await getPositions({
      artistMbid: 'test-artist-id',
      songTitleOrId: 'Test Song'
    })

    expect(result).toEqual({
      opener: { count: 0, shows: [] },
      closer: { count: 0, shows: [] },
      encore: { count: 0, shows: [] },
      songTitle: 'Test Song',
      aliases: ['Test Song']
    })
  })

  it('returns empty results when no setlists found', async () => {
    mockResolveSong.mockResolvedValue({
      normalizedTitle: 'Test Song',
      aliases: ['Test Song'],
      mbid: undefined,
      confidence: 1.0
    })

    mockSetlistClient.searchSongs.mockResolvedValue([{
      id: 'song-1',
      name: 'Test Song',
      artist: { id: 'test-artist-id', name: 'Test Artist' }
    }])

    mockSetlistClient.searchSetlistsBySong.mockResolvedValue([])

    const result = await getPositions({
      artistMbid: 'test-artist-id',
      songTitleOrId: 'Test Song'
    })

    expect(result).toEqual({
      opener: { count: 0, shows: [] },
      closer: { count: 0, shows: [] },
      encore: { count: 0, shows: [] },
      songTitle: 'Test Song',
      aliases: ['Test Song']
    })
  })

  it('correctly identifies opener, closer, and encore positions', async () => {
    mockResolveSong.mockResolvedValue({
      normalizedTitle: 'Test Song',
      aliases: ['Test Song'],
      mbid: undefined,
      confidence: 1.0
    })

    const mockClient = {
      searchSongs: vi.fn().mockResolvedValue([{
        id: 'song-1',
        name: 'Test Song',
        artist: { id: 'test-artist-id', name: 'Test Artist' }
      }]),
      searchSetlistsBySong: vi.fn()
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(SetlistClientImpl).mockImplementation(() => mockClient as any)

    const mockSetlists = [
      {
        id: 'setlist-1',
        eventDate: '1970-01-01',
        venue: {
          id: 'venue-1',
          name: 'Test Venue 1',
          city: {
            id: 'city-1',
            name: 'Test City 1',
            state: 'CA',
            country: { code: 'US', name: 'USA' }
          }
        },
        sets: {
          set: [
            {
              name: 'Set 1',
              song: [
                { name: 'Test Song' }, // Opener
                { name: 'Other Song' }
              ]
            }
          ]
        }
      },
      {
        id: 'setlist-2',
        eventDate: '1970-01-02',
        venue: {
          id: 'venue-2',
          name: 'Test Venue 2',
          city: {
            id: 'city-2',
            name: 'Test City 2',
            state: 'NY',
            country: { code: 'US', name: 'USA' }
          }
        },
        sets: {
          set: [
            {
              name: 'Set 1',
              song: [
                { name: 'Other Song' },
                { name: 'Test Song' } // Closer
              ]
            }
          ]
        }
      },
      {
        id: 'setlist-3',
        eventDate: '1970-01-03',
        venue: {
          id: 'venue-3',
          name: 'Test Venue 3',
          city: {
            id: 'city-3',
            name: 'Test City 3',
            country: { code: 'US', name: 'USA' }
          }
        },
        sets: {
          set: [
            {
              name: 'Set 1',
              song: [
                { name: 'Other Song' }
              ]
            },
            {
              name: 'Encore',
              song: [
                { name: 'Other Song' },
                { name: 'Test Song' } // Encore
              ]
            }
          ]
        }
      }
    ]

    mockClient.searchSetlistsBySong
      .mockResolvedValueOnce(mockSetlists)
      .mockResolvedValueOnce([]) // No more pages

    const result = await getPositions({
      artistMbid: 'test-artist-id',
      songTitleOrId: 'Test Song'
    })

    expect(result.opener.count).toBe(1)
    expect(result.closer.count).toBe(2)
    expect(result.encore.count).toBe(1)
    expect(result.opener.shows).toHaveLength(1)
    expect(result.closer.shows).toHaveLength(2)
    expect(result.encore.shows).toHaveLength(1)
    expect(result.songTitle).toBe('Test Song')
  })

  it('handles encore set variations', async () => {
    mockResolveSong.mockResolvedValue({
      normalizedTitle: 'Test Song',
      aliases: ['Test Song'],
      mbid: undefined,
      confidence: 1.0
    })

    mockSetlistClient.searchSongs.mockResolvedValue([{
      id: 'song-1',
      name: 'Test Song',
      artist: { id: 'test-artist-id', name: 'Test Artist' }
    }])

    const mockSetlists = [
      {
        id: 'setlist-1',
        eventDate: '1970-01-01',
        venue: {
          id: 'venue-1',
          name: 'Test Venue 1',
          city: {
            id: 'city-1',
            name: 'Test City 1',
            country: { code: 'US', name: 'USA' }
          }
        },
        sets: {
          set: [
            {
              name: 'E:',
              song: [
                { name: 'Test Song' } // Encore with E: format
              ]
            }
          ]
        }
      },
      {
        id: 'setlist-2',
        eventDate: '1970-01-02',
        venue: {
          id: 'venue-2',
          name: 'Test Venue 2',
          city: {
            id: 'city-2',
            name: 'Test City 2',
            country: { code: 'US', name: 'USA' }
          }
        },
        sets: {
          set: [
            {
              name: 'E1',
              song: [
                { name: 'Test Song' } // Encore with E1 format
              ]
            }
          ]
        }
      }
    ]

    mockSetlistClient.searchSetlistsBySong
      .mockResolvedValueOnce(mockSetlists)
      .mockResolvedValueOnce([]) // No more pages

    const result = await getPositions({
      artistMbid: 'test-artist-id',
      songTitleOrId: 'Test Song'
    })

    expect(result.encore.count).toBe(2)
    expect(result.encore.shows).toHaveLength(2)
  })

  it('throws error when required parameters are missing', async () => {
    await expect(getPositions({
      artistMbid: '',
      songTitleOrId: 'Test Song'
    })).rejects.toThrow('Artist MBID and song title/ID are required')

    await expect(getPositions({
      artistMbid: 'test-artist-id',
      songTitleOrId: ''
    })).rejects.toThrow('Artist MBID and song title/ID are required')
  })

  it('handles API errors gracefully', async () => {
    mockResolveSong.mockResolvedValue({
      normalizedTitle: 'Test Song',
      aliases: ['Test Song'],
      mbid: undefined,
      confidence: 1.0
    })

    mockSetlistClient.searchSongs.mockRejectedValue(new Error('API Error'))

    await expect(getPositions({
      artistMbid: 'test-artist-id',
      songTitleOrId: 'Test Song'
    })).rejects.toThrow('Failed to fetch position facts: API Error')
  })
})
