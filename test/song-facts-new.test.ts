import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getFirstLast, getPositions, getPositionPage, getGratefulDeadSongFacts, getGratefulDeadPositionFacts, getGratefulDeadPositionPage } from '../lib/songFacts'
import { songIndexer } from '../lib/indexer'

// Mock the indexer
vi.mock('../lib/indexer', () => ({
  songIndexer: {
    getRepository: vi.fn(),
    initializeWithSampleData: vi.fn().mockResolvedValue(undefined)
  }
}))

describe('songFacts (new repository-based)', () => {
  const mockRepository = {
    getSongByTitle: vi.fn(),
    getPositions: vi.fn(),
    getPositionPage: vi.fn(),
    searchSongs: vi.fn(),
    upsertFromSetlist: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(songIndexer.getRepository).mockReturnValue(mockRepository as unknown as ReturnType<typeof songIndexer.getRepository>)
  })

  describe('getFirstLast', () => {
    it('should return song facts when song exists', async () => {
      const mockSong = {
        id: 'dark-star',
        title: 'Dark Star',
        normalizedTitle: 'dark star',
        aliases: ['Dark Star', 'darkstar'],
        totalPerformances: 100,
        firstPerformance: {
          id: 'show-1',
          date: '1972-08-27',
          venue: 'Venue 1',
          city: 'City 1',
          country: 'Country 1',
          url: 'https://www.setlist.fm/setlist/show-1',
          source: 'setlist.fm' as const
        },
        lastPerformance: {
          id: 'show-2',
          date: '1995-07-09',
          venue: 'Venue 2',
          city: 'City 2',
          country: 'Country 2',
          url: 'https://www.setlist.fm/setlist/show-2',
          source: 'setlist.fm' as const
        },
        openerCount: 5,
        closerCount: 10,
        encoreCount: 15
      }

      mockRepository.getSongByTitle.mockResolvedValue(mockSong)

      const result = await getFirstLast('Dark Star')

      expect(result).toEqual({
        first: mockSong.firstPerformance,
        last: mockSong.lastPerformance,
        totalPerformances: 100,
        songTitle: 'Dark Star',
        aliases: ['Dark Star', 'darkstar']
      })
    })

    it('should return empty facts when song does not exist', async () => {
      mockRepository.getSongByTitle.mockResolvedValue(null)

      const result = await getFirstLast('Unknown Song')

      expect(result).toEqual({
        first: null,
        last: null,
        totalPerformances: 0,
        songTitle: 'Unknown Song',
        aliases: []
      })
    })

    it('should throw error when songId is empty', async () => {
      await expect(getFirstLast('')).rejects.toThrow('Song ID is required')
    })

    it('should handle repository errors', async () => {
      mockRepository.getSongByTitle.mockRejectedValue(new Error('Repository error'))

      await expect(getFirstLast('Dark Star')).rejects.toThrow('Failed to fetch song facts: Repository error')
    })
  })

  describe('getPositions', () => {
    it('should return position facts when song exists', async () => {
      const mockSong = {
        id: 'dark-star',
        title: 'Dark Star',
        normalizedTitle: 'dark star',
        aliases: ['Dark Star', 'darkstar'],
        totalPerformances: 100,
        openerCount: 5,
        closerCount: 10,
        encoreCount: 15
      }

      const mockPositionFacts = {
        opener: {
          count: 5,
          shows: []
        },
        closer: {
          count: 10,
          shows: []
        },
        encore: {
          count: 15,
          shows: []
        }
      }

      mockRepository.getSongByTitle.mockResolvedValue(mockSong)
      mockRepository.getPositions.mockResolvedValue(mockPositionFacts)

      const result = await getPositions('Dark Star')

      expect(result).toEqual({
        opener: mockPositionFacts.opener,
        closer: mockPositionFacts.closer,
        encore: mockPositionFacts.encore,
        set1Closer: { count: 0, shows: [] },
        set2Opener: { count: 0, shows: [] },
        songTitle: 'Dark Star',
        aliases: ['Dark Star', 'darkstar']
      })
    })

    it('should return empty facts when song does not exist', async () => {
      mockRepository.getSongByTitle.mockResolvedValue(null)

      const result = await getPositions('Unknown Song')

      expect(result).toEqual({
        opener: { count: 0, shows: [] },
        closer: { count: 0, shows: [] },
        encore: { count: 0, shows: [] },
        set1Closer: { count: 0, shows: [] },
        set2Opener: { count: 0, shows: [] },
        songTitle: 'Unknown Song',
        aliases: []
      })
    })

    it('should return empty facts when position facts are null', async () => {
      const mockSong = {
        id: 'dark-star',
        title: 'Dark Star',
        normalizedTitle: 'dark star',
        aliases: ['Dark Star'],
        totalPerformances: 100,
        openerCount: 0,
        closerCount: 0,
        encoreCount: 0
      }

      mockRepository.getSongByTitle.mockResolvedValue(mockSong)
      mockRepository.getPositions.mockResolvedValue(null)

      const result = await getPositions('Dark Star')

      expect(result).toEqual({
        opener: { count: 0, shows: [] },
        closer: { count: 0, shows: [] },
        encore: { count: 0, shows: [] },
        set1Closer: { count: 0, shows: [] },
        set2Opener: { count: 0, shows: [] },
        songTitle: 'Dark Star',
        aliases: ['Dark Star']
      })
    })

    it('should throw error when songId is empty', async () => {
      await expect(getPositions('')).rejects.toThrow('Song ID is required')
    })
  })

  describe('getPositionPage', () => {
    it('should return paginated position data when song exists', async () => {
      const mockSong = {
        id: 'dark-star',
        title: 'Dark Star',
        normalizedTitle: 'dark star',
        aliases: ['Dark Star', 'darkstar'],
        totalPerformances: 100,
        openerCount: 5,
        closerCount: 10,
        encoreCount: 15
      }

      const mockPageData = {
        items: [
          {
            id: 'show-1',
            date: '1972-08-27',
            venue: 'Venue 1',
            city: 'City 1',
            country: 'Country 1',
            url: 'https://www.setlist.fm/setlist/show-1',
            source: 'setlist.fm' as const
          },
          {
            id: 'show-2',
            date: '1972-08-28',
            venue: 'Venue 2',
            city: 'City 2',
            country: 'Country 2',
            url: 'https://www.setlist.fm/setlist/show-2',
            source: 'setlist.fm' as const
          }
        ],
        hasMore: true,
        totalCount: 5,
        nextCursor: '1'
      }

      mockRepository.getSongByTitle.mockResolvedValue(mockSong)
      mockRepository.getPositionPage.mockResolvedValue(mockPageData)

      const result = await getPositionPage({
        songId: 'dark-star',
        positionType: 'opener',
        pageSize: 2
      })

      expect(result).toEqual(mockPageData)
      expect(mockRepository.getPositionPage).toHaveBeenCalledWith({
        songId: 'dark-star',
        positionType: 'opener',
        pageSize: 2
      })
    })

    it('should throw error when songId is empty', async () => {
      await expect(getPositionPage({
        songId: '',
        positionType: 'opener'
      })).rejects.toThrow('Song ID is required')
    })

    it('should handle repository errors', async () => {
      mockRepository.getPositionPage.mockRejectedValue(new Error('Repository error'))

      await expect(getPositionPage({
        songId: 'dark-star',
        positionType: 'opener'
      })).rejects.toThrow('Failed to fetch position page: Repository error')
    })
  })

  describe('convenience functions', () => {
    it('should call getFirstLast for getGratefulDeadSongFacts', async () => {
      const mockSong = {
        id: 'dark-star',
        title: 'Dark Star',
        normalizedTitle: 'dark star',
        aliases: ['Dark Star'],
        totalPerformances: 100,
        firstPerformance: null,
        lastPerformance: null,
        openerCount: 0,
        closerCount: 0,
        encoreCount: 0
      }

      mockRepository.getSongByTitle.mockResolvedValue(mockSong)

      const result = await getGratefulDeadSongFacts('Dark Star')

      expect(result).toEqual({
        first: null,
        last: null,
        totalPerformances: 100,
        songTitle: 'Dark Star',
        aliases: ['Dark Star']
      })
    })

    it('should call getPositions for getGratefulDeadPositionFacts', async () => {
      const mockSong = {
        id: 'dark-star',
        title: 'Dark Star',
        normalizedTitle: 'dark star',
        aliases: ['Dark Star'],
        totalPerformances: 100,
        openerCount: 0,
        closerCount: 0,
        encoreCount: 0
      }

      const mockPositionFacts = {
        opener: { count: 0, shows: [] },
        closer: { count: 0, shows: [] },
        encore: { count: 0, shows: [] }
      }

      mockRepository.getSongByTitle.mockResolvedValue(mockSong)
      mockRepository.getPositions.mockResolvedValue(mockPositionFacts)

      const result = await getGratefulDeadPositionFacts('Dark Star')

      expect(result).toEqual({
        opener: { count: 0, shows: [] },
        closer: { count: 0, shows: [] },
        encore: { count: 0, shows: [] },
        set1Closer: { count: 0, shows: [] },
        set2Opener: { count: 0, shows: [] },
        songTitle: 'Dark Star',
        aliases: ['Dark Star']
      })
    })

    it('should call getPositionPage for getGratefulDeadPositionPage', async () => {
      const mockPageData = {
        items: [],
        hasMore: false,
        totalCount: 0
      }

      mockRepository.getPositionPage.mockResolvedValue(mockPageData)

      const result = await getGratefulDeadPositionPage({
        songId: 'dark-star',
        positionType: 'opener'
      })

      expect(result).toEqual(mockPageData)
    })
  })
})
