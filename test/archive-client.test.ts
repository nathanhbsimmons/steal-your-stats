import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ArchiveClientImpl } from '../lib/clients/archive'

// Mock the HttpClient
vi.mock('../lib/http', () => ({
  HttpClient: vi.fn().mockImplementation(() => ({
    get: vi.fn()
  }))
}))

describe('ArchiveClientImpl', () => {
  let client: ArchiveClientImpl
  let mockHttp: { get: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    vi.clearAllMocks()
    client = new ArchiveClientImpl()
    mockHttp = (client as unknown as { http: { get: ReturnType<typeof vi.fn> } }).http
  })

  describe('resolveArchiveShow', () => {
    it('should return null when no shows found', async () => {
      mockHttp.get.mockResolvedValue({
        data: {
          response: {
            docs: []
          }
        }
      })

      const result = await client.resolveArchiveShow({
        date: '1970-01-01',
        venue: 'Test Venue',
        city: 'Test City'
      })

      expect(result).toBeNull()
    })

    it('should return first show when no venue/city provided', async () => {
      const mockShows = [
        {
          identifier: 'gd1970-01-01',
          title: 'Grateful Dead 1970-01-01',
          date: '1970-01-01',
          venue: 'Test Venue',
          city: 'Test City'
        }
      ]

      mockHttp.get.mockResolvedValue({
        data: {
          response: {
            docs: mockShows
          }
        }
      })

      const result = await client.resolveArchiveShow({
        date: '1970-01-01'
      })

      expect(result).toEqual(mockShows[0])
    })

    it('should return best matching show when venue/city provided', async () => {
      const mockShows = [
        {
          identifier: 'gd1970-01-01',
          title: 'Grateful Dead 1970-01-01',
          date: '1970-01-01',
          venue: 'Exact Venue Match',
          city: 'Exact City Match'
        },
        {
          identifier: 'gd1970-01-02',
          title: 'Grateful Dead 1970-01-02',
          date: '1970-01-01',
          venue: 'Different Venue',
          city: 'Different City'
        }
      ]

      mockHttp.get.mockResolvedValue({
        data: {
          response: {
            docs: mockShows
          }
        }
      })

      const result = await client.resolveArchiveShow({
        date: '1970-01-01',
        venue: 'Exact Venue Match',
        city: 'Exact City Match'
      })

      expect(result).toEqual(mockShows[0])
    })
  })

  describe('getSongTracks', () => {
    it('should return matching tracks for exact title match', async () => {
      const mockTracks = [
        {
          name: 'Dark Star',
          format: 'FLAC',
          length: '300.5'
        },
        {
          name: 'Sugar Magnolia',
          format: 'MP3',
          length: '240.0'
        }
      ]

      mockHttp.get.mockResolvedValue({
        data: {
          files: mockTracks
        }
      })

      const result = await client.getSongTracks(
        'gd1970-01-01',
        'dark star',
        ['dark star', 'darkstar']
      )

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Dark Star')
    })

    it('should return empty array when no tracks match', async () => {
      const mockTracks = [
        {
          name: 'Sugar Magnolia',
          format: 'FLAC',
          length: '240.0'
        }
      ]

      mockHttp.get.mockResolvedValue({
        data: {
          files: mockTracks
        }
      })

      const result = await client.getSongTracks(
        'gd1970-01-01',
        'dark star',
        ['dark star', 'darkstar']
      )

      expect(result).toHaveLength(0)
    })
  })
})
