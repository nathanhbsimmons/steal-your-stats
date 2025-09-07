import { describe, it, expect, vi } from 'vitest'
import { GRATEFUL_DEAD_MBID } from '../lib/ids'

// Mock the clients before importing songFacts
const mockSearchSongs = vi.fn()
const mockSearchSetlistsBySong = vi.fn()

vi.mock('../lib/clients/setlist-server', () => ({
  SetlistClientServer: vi.fn().mockImplementation(() => ({
    searchSongs: mockSearchSongs,
    searchSetlistsBySong: mockSearchSetlistsBySong,
  })),
}))

vi.mock('../lib/clients/musicbrainz', () => ({
  MusicBrainzClientImpl: vi.fn().mockImplementation(() => ({
    searchWorkByTitle: vi.fn(),
    lookupRecordingAliases: vi.fn(),
  })),
}))

vi.mock('../lib/ids', async () => {
  const actual = await vi.importActual('../lib/ids')
  return {
    ...actual,
    resolveSong: vi.fn(),
  }
})

// Import after mocks are set up
import { getFirstLast, getGratefulDeadSongFacts } from '../lib/songFacts'

describe('songFacts', () => {
  describe('getFirstLast', () => {
    it('should throw error when artistMbid is missing', async () => {
      await expect(getFirstLast({ artistMbid: '', songTitleOrId: 'test' })).rejects.toThrow(
        'Artist MBID and song title/ID are required'
      )
    })

    it('should throw error when songTitleOrId is missing', async () => {
      await expect(getFirstLast({ artistMbid: 'test', songTitleOrId: '' })).rejects.toThrow(
        'Artist MBID and song title/ID are required'
      )
    })

    it('should return empty facts when no songs found', async () => {
      const { resolveSong } = await import('../lib/ids')
      
      vi.mocked(resolveSong).mockResolvedValue({
        normalizedTitle: 'Test Song',
        aliases: ['Test Song', 'test song'],
        confidence: 1.0,
      })
      
      mockSearchSongs.mockResolvedValue([])

      const result = await getFirstLast({
        artistMbid: GRATEFUL_DEAD_MBID,
        songTitleOrId: 'Test Song',
      })

      expect(result).toEqual({
        first: null,
        last: null,
        totalPerformances: 0,
        songTitle: 'Test Song',
        aliases: ['Test Song', 'test song'],
      })
    })

    it('should return facts when setlists are found', async () => {
      const mockSetlists = [
        {
          id: 'setlist1',
          eventDate: '1965-05-05',
          venue: {
            id: 'venue1',
            name: 'Fillmore Auditorium',
            city: { 
              id: 'city1',
              name: 'San Francisco', 
              state: 'CA', 
              country: { code: 'US', name: 'USA' } 
            },
          },
          sets: { 
            set: [
              {
                name: 'Set 1',
                song: [
                  { name: 'Dark Star' },
                  { name: 'Other Song' }
                ]
              }
            ]
          },
        },
        {
          id: 'setlist2',
          eventDate: '1995-07-09',
          venue: {
            id: 'venue2',
            name: 'Soldier Field',
            city: { 
              id: 'city2',
              name: 'Chicago', 
              state: 'IL', 
              country: { code: 'US', name: 'USA' } 
            },
          },
          sets: { 
            set: [
              {
                name: 'Set 1',
                song: [
                  { name: 'Other Song' },
                  { name: 'Dark Star' }
                ]
              }
            ]
          },
        },
      ]

      const { resolveSong } = await import('../lib/ids')
      
      vi.mocked(resolveSong).mockResolvedValue({
        normalizedTitle: 'Dark Star',
        aliases: ['Dark Star', 'dark star'],
        confidence: 1.0,
      })

      mockSearchSongs.mockResolvedValue([
        {
          id: 'song1',
          name: 'Dark Star',
          artist: { id: GRATEFUL_DEAD_MBID, name: 'Grateful Dead' },
        },
      ])
      
      mockSearchSetlistsBySong
        .mockResolvedValueOnce(mockSetlists)
        .mockResolvedValueOnce([]) // No more pages

      const result = await getFirstLast({
        artistMbid: GRATEFUL_DEAD_MBID,
        songTitleOrId: 'Dark Star',
      })

      expect(result.first).toEqual({
        id: 'setlist1',
        date: '1965-05-05',
        venue: 'Fillmore Auditorium',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        url: 'https://www.setlist.fm/setlist/setlist1',
        source: 'setlist.fm',
      })

      expect(result.last).toEqual({
        id: 'setlist2',
        date: '1995-07-09',
        venue: 'Soldier Field',
        city: 'Chicago',
        state: 'IL',
        country: 'USA',
        url: 'https://www.setlist.fm/setlist/setlist2',
        source: 'setlist.fm',
      })

      expect(result.totalPerformances).toBe(2)
      expect(result.songTitle).toBe('Dark Star')
    })
  })

  describe('getGratefulDeadSongFacts', () => {
    it('should call getFirstLast with correct parameters', async () => {
      const { resolveSong } = await import('../lib/ids')
      
      vi.mocked(resolveSong).mockResolvedValue({
        normalizedTitle: 'Test Song',
        aliases: ['Test Song'],
        confidence: 1.0,
      })

      mockSearchSongs.mockResolvedValue([])

      const result = await getGratefulDeadSongFacts('Test Song')

      expect(result).toEqual({
        first: null,
        last: null,
        totalPerformances: 0,
        songTitle: 'Test Song',
        aliases: ['Test Song'],
      })
    })
  })
})