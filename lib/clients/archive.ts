import { HttpClient } from '../http'

export interface ArchiveShow {
  identifier: string
  title: string
  creator: string
  date: string
  description?: string
  venue?: string
  city?: string
  state?: string
  country?: string
  'publicdate': string
  'addeddate': string
  'updatedate': string
  'mediatype': string
  'collection': string[]
  'subject': string[]
  'language': string[]
  'licenseurl': string
  'rights': string
  'format': string[]
  'type': string
  'files': Array<{
    name: string
    source: string
    format: string
    length: string
    md5: string
    mtime: string
    size: string
    crc32: string
    sha1: string
  }>
}

export interface ArchiveTrack {
  name: string
  source: string
  format: string
  length: string
  md5: string
  mtime: string
  size: string
  crc32: string
  sha1: string
  title?: string
  track?: string
  creator?: string
  album?: string
}

export interface ArchiveClient {
  searchShows(creator: string, date?: string): Promise<ArchiveShow[]>
  listTracks(identifier: string): Promise<ArchiveTrack[]>
  resolveArchiveShow(params: { date: string; venue?: string; city?: string }): Promise<ArchiveShow | null>
  getSongTracks(itemId: string, normalizedTitle: string, aliases: string[]): Promise<ArchiveTrack[]>
  getAllTracks(itemId: string): Promise<ArchiveTrack[]>
}

export class ArchiveClientImpl implements ArchiveClient {
  private http: HttpClient

  constructor() {
    this.http = new HttpClient('https://archive.org', {
      'User-Agent': HttpClient.USER_AGENT,
    })
  }

  async searchShows(creator: string, date?: string): Promise<ArchiveShow[]> {
    // Archive.org GD shows live in the GratefulDead collection
    const searchParams = new URLSearchParams({
      q: `collection:GratefulDead AND mediatype:etree`,
      output: 'json',
      rows: '100',
    })

    const response = await this.http.get<{
      responseHeader: {
        status: number
        QTime: number
        params: Record<string, unknown>
      }
      response: {
        docs: ArchiveShow[]
        numFound: number
        start: number
      }
    }>(`/advancedsearch.php?${searchParams.toString()}`)

    if (!response.data || !response.data.response) {
      return []
    }
    
    let shows = response.data.response.docs || []
    
    // Filter by date if provided
    if (date) {
      shows = shows.filter(show => {
        if (!show.date) return false
        
        // Extract just the date part (YYYY-MM-DD) from ISO format
        const showDate = show.date.split('T')[0]
        return showDate === date
      })
    }
    
    return shows
  }

  async listTracks(identifier: string): Promise<ArchiveTrack[]> {
    const response = await this.http.get<{
      files: ArchiveTrack[]
    }>(`/metadata/${identifier}`)

    // Filter for MP3 files only
    const audioFiles = (response.data.files || []).filter(file => 
      file.format && ['MP3', 'VBR MP3'].includes(file.format)
    )

    return audioFiles
  }

  async resolveArchiveShow(params: { date: string; venue?: string; city?: string }): Promise<ArchiveShow | null> {
    const { date, venue, city } = params

    const searchParams = new URLSearchParams({
      q: `collection:GratefulDead AND date:${date} AND mediatype:etree`,
      output: 'json',
      rows: '20',
    })

    try {
      const response = await this.http.get<{
        responseHeader: { status: number; QTime: number; params: Record<string, unknown> }
        response: { docs: ArchiveShow[]; numFound: number; start: number }
      }>(`/advancedsearch.php?${searchParams.toString()}`)

      if (!response.data?.response) return null

      const shows = response.data.response.docs || []

      if (shows.length === 0) return null
      if (shows.length === 1) return shows[0]

      // Score results by venue/city match and return best match
      const scored = shows
        .map(show => ({ show, score: this.calculateMatchScore(show, { venue, city }) }))
        .sort((a, b) => b.score - a.score)

      return scored[0].show
    } catch {
      return null
    }
  }

  async getSongTracks(itemId: string, normalizedTitle: string, aliases: string[]): Promise<ArchiveTrack[]> {
    const allTracks = await this.listTracks(itemId)
    
    if (allTracks.length === 0) {
      return []
    }
    
    // Create a set of all possible titles to match against
    const searchTitles = [normalizedTitle, ...aliases].map(title => title.toLowerCase())
    
    // Find tracks that match any of the song titles (check both filename and title metadata)
    const matchingTracks = allTracks.filter(track => {
      const trackName = track.name.toLowerCase()
      const trackTitle = (track.title || '').toLowerCase()

      for (const searchTitle of searchTitles) {
        if (trackName.includes(searchTitle) || trackTitle.includes(searchTitle)) {
          return true
        }
      }

      // Fuzzy match on filename and title
      for (const searchTitle of searchTitles) {
        if (this.fuzzyMatch(trackName, searchTitle) || (trackTitle && this.fuzzyMatch(trackTitle, searchTitle))) {
          return true
        }
      }

      return false
    })
    
    // If no specific matches found, return all tracks (common for Archive.org shows with generic track names)
    if (matchingTracks.length === 0) {
      return allTracks
    }
    
    return matchingTracks
  }

  private calculateMatchScore(show: ArchiveShow, criteria: { venue?: string; city?: string }): number {
    let score = 0
    
    if (criteria.venue && show.venue) {
      const venueMatch = this.calculateStringSimilarity(
        show.venue.toLowerCase(),
        criteria.venue.toLowerCase()
      )
      score += venueMatch * 0.6 // Venue is weighted more heavily
    }
    
    if (criteria.city && show.city) {
      const cityMatch = this.calculateStringSimilarity(
        show.city.toLowerCase(),
        criteria.city.toLowerCase()
      )
      score += cityMatch * 0.4
    }
    
    return score
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Normalize strings by removing common prefixes and extra spaces
    const normalize = (str: string) => str
      .toLowerCase()
      .replace(/^(the|a|an)\s+/i, '') // Remove common articles
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
    
    const norm1 = normalize(str1)
    const norm2 = normalize(str2)
    
    // Check for exact match after normalization
    if (norm1 === norm2) return 1.0
    
    // Check for substring matches
    if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.9
    
    // Use Levenshtein distance for remaining cases
    const longer = norm1.length > norm2.length ? norm1 : norm2
    const shorter = norm1.length > norm2.length ? norm2 : norm1
    
    if (longer.length === 0) return 1.0
    
    const distance = this.levenshteinDistance(longer, shorter)
    return (longer.length - distance) / longer.length
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        )
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  private fuzzyMatch(trackName: string, searchTitle: string): boolean {
    // Handle common patterns in Grateful Dead track names
    const patterns = [
      // Medley patterns: "Song > Song" or "Song -> Song"
      new RegExp(`\\b${searchTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[>->]`, 'i'),
      // Segue patterns: "Song >" or "Song ->"
      new RegExp(`\\b${searchTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[>->]\\s*$`, 'i'),
      // Jam patterns: "Song Jam" or "Song (Jam)"
      new RegExp(`\\b${searchTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(jam|jam\\))`, 'i'),
      // Live patterns: "Song (Live)" or "Song - Live"
      new RegExp(`\\b${searchTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[-(]\\s*live`, 'i'),
    ]
    
    return patterns.some(pattern => pattern.test(trackName))
  }

  async getAllTracks(itemId: string): Promise<ArchiveTrack[]> {
    try {
      const response = await this.http.get<{ files?: ArchiveTrack[] }>(`/metadata/${itemId}`)
      const files = response.data?.files || []
      return files.filter(file =>
        file.name?.match(/\.mp3$/i) && file.format !== 'Metadata'
      )
    } catch (error) {
      console.error('Error fetching all tracks:', error)
      return []
    }
  }
}
