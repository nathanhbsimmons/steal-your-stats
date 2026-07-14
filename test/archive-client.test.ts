import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ArchiveClientImpl } from '../lib/clients/archive'
import { archiveCatalog } from '../lib/services/archive-catalog'

// Mock the HttpClient
vi.mock('../lib/http', () => ({
  HttpClient: vi.fn().mockImplementation(() => ({
    get: vi.fn()
  }))
}))

// Mock the persisted archive catalog — individual tests opt into a hit via
// getByDate/getByIdentifier; default (undefined) means every test below this
// mock is exercising the live-fetch fallback path, same as before the catalog existed.
vi.mock('../lib/services/archive-catalog', () => ({
  archiveCatalog: {
    getByDate: vi.fn(),
    getByIdentifier: vi.fn(),
  },
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
          format: 'MP3',
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

    it('should return empty array when no specific matches found', async () => {
      const mockTracks = [
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

      // When no specific matches are found, return empty — caller shows error rather than wrong tracks
      expect(result).toHaveLength(0)
    })
  })

  describe('archive catalog fast path', () => {
    const catalogTrack = { name: 'gd77-05-08d1t01.mp3', title: 'Dark Star', length: '1200.0' }
    const bestEntry = {
      identifier: 'gd1977-05-08.sbd',
      venue: 'Barton Hall', city: 'Ithaca', state: 'NY', country: 'US',
      licenseurl: 'https://example.org/license', rights: 'Public',
      publicdate: '2005-01-01', description: 'A legendary show.',
      tracks: [catalogTrack],
    }
    const candidates = [{ identifier: 'gd1977-05-08.sbd', title: 'Barton Hall', recordingType: 'sbd' as const, score: 1 }]

    it('resolveArchiveShow returns null for a negative catalog entry without any HTTP call', async () => {
      vi.mocked(archiveCatalog.getByDate).mockReturnValue({ date: '1972-08-27', candidates: [], resolvedAt: 0 })

      const result = await client.resolveArchiveShow({ date: '1972-08-27' })

      expect(result).toBeNull()
      expect(mockHttp.get).not.toHaveBeenCalled()
    })

    it('resolveArchiveShow synthesizes an ArchiveShow from a catalog hit without any HTTP call', async () => {
      vi.mocked(archiveCatalog.getByDate).mockReturnValue({ date: '1977-05-08', candidates, best: bestEntry, resolvedAt: 0 })

      const result = await client.resolveArchiveShow({ date: '1977-05-08' })

      expect(result?.identifier).toBe('gd1977-05-08.sbd')
      expect(result?.venue).toBe('Barton Hall')
      expect(mockHttp.get).not.toHaveBeenCalled()
    })

    it('listArchiveShowCandidates returns the cached candidates without any HTTP call', async () => {
      vi.mocked(archiveCatalog.getByDate).mockReturnValue({ date: '1977-05-08', candidates, best: bestEntry, resolvedAt: 0 })

      const result = await client.listArchiveShowCandidates({ date: '1977-05-08' })

      expect(result).toEqual(candidates)
      expect(mockHttp.get).not.toHaveBeenCalled()
    })

    it('listTracks and getAllTracks return cached tracks without any HTTP call', async () => {
      vi.mocked(archiveCatalog.getByIdentifier).mockReturnValue({ date: '1977-05-08', candidates, best: bestEntry, resolvedAt: 0 })

      const tracks = await client.listTracks('gd1977-05-08.sbd')
      const allTracks = await client.getAllTracks('gd1977-05-08.sbd')

      expect(tracks).toHaveLength(1)
      expect(tracks[0].name).toBe(catalogTrack.name)
      expect(allTracks).toHaveLength(1)
      expect(mockHttp.get).not.toHaveBeenCalled()
    })

    it('getShowMetadata and getItemDescription return cached data without any HTTP call', async () => {
      vi.mocked(archiveCatalog.getByIdentifier).mockReturnValue({ date: '1977-05-08', candidates, best: bestEntry, resolvedAt: 0 })

      const meta = await client.getShowMetadata('gd1977-05-08.sbd')
      const description = await client.getItemDescription('gd1977-05-08.sbd')

      expect(meta.venue).toBe('Barton Hall')
      expect(meta.mp3Count).toBe(1)
      expect(description).toBe('A legendary show.')
      expect(mockHttp.get).not.toHaveBeenCalled()
    })

    it('falls through to a live HTTP call when the catalog has no entry', async () => {
      vi.mocked(archiveCatalog.getByDate).mockReturnValue(undefined)
      mockHttp.get.mockResolvedValue({ data: { response: { docs: [] } } })

      const result = await client.resolveArchiveShow({ date: '2030-01-01' })

      expect(result).toBeNull()
      expect(mockHttp.get).toHaveBeenCalled()
    })
  })
})
