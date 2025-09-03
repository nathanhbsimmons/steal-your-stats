import { HttpClient } from '../http'

export interface ArchiveItem {
  identifier: string
  title: string
  description?: string
  date?: string
  creator?: string
  venue?: string
  location?: string
  'publicdate': string
  'item_size': number
  'downloads': number
  'item_count': number
  'avg_rating': number
  'num_reviews': number
  'collection': string[]
  'format': string[]
  'mediatype': string
  'metadata': Record<string, string[]>
}

export interface ArchiveTrack {
  name: string
  title: string
  length: string
  format: string
  original: string
  'track': string
  'creator': string
  'album': string
  'date': string
}

export interface ArchiveClient {
  searchShows(query: string, page?: number): Promise<ArchiveItem[]>
  listTracks(itemId: string): Promise<ArchiveTrack[]>
  getStreamingUrl(itemId: string, filename: string): string
}

export class ArchiveClientImpl implements ArchiveClient {
  private http: HttpClient

  constructor() {
    this.http = new HttpClient('https://archive.org', {
      'Accept': 'application/json',
    })
  }

  async searchShows(query: string, page: number = 1): Promise<ArchiveItem[]> {
    const response = await this.http.get<{
      response: {
        docs: ArchiveItem[]
        numFound: number
        start: number
      }
    }>(`/advancedsearch.php?q=${encodeURIComponent(query)}&output=json&rows=50&page=${page}`)

    return response.data.response.docs || []
  }

  async listTracks(itemId: string): Promise<ArchiveTrack[]> {
    const response = await this.http.get<{
      files: Record<string, ArchiveTrack>
    }>(`/metadata/${itemId}`)

    // Filter for audio files and convert to array
    const tracks: ArchiveTrack[] = []
    for (const [filename, file] of Object.entries(response.data.files)) {
      if (file.format && (
        file.format.includes('VBR MP3') || 
        file.format.includes('MP3') || 
        file.format.includes('Flac') ||
        file.format.includes('Ogg Vorbis')
      )) {
        tracks.push({
          ...file,
          name: filename,
        })
      }
    }

    return tracks.sort((a, b) => {
      // Sort by track number if available, otherwise by filename
      const trackA = parseInt(a.track || '0')
      const trackB = parseInt(b.track || '0')
      if (trackA && trackB) {
        return trackA - trackB
      }
      return a.name.localeCompare(b.name)
    })
  }

  getStreamingUrl(itemId: string, filename: string): string {
    return `https://archive.org/download/${itemId}/${filename}`
  }
}
