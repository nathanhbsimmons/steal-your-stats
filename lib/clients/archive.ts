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
}

export interface ArchiveClient {
  searchShows(creator: string, date?: string): Promise<ArchiveShow[]>
  listTracks(identifier: string): Promise<ArchiveTrack[]>
  resolveArchiveShow(params: { date: string; venue?: string; city?: string }): Promise<ArchiveShow | null>
  getSongTracks(itemId: string, normalizedTitle: string, aliases: string[]): Promise<ArchiveTrack[]>
}

export class ArchiveClientImpl implements ArchiveClient {
  private http: HttpClient

  constructor() {
    this.http = new HttpClient('https://archive.org', {
      'User-Agent': HttpClient.USER_AGENT,
    })
  }

  async searchShows(creator: string, date?: string): Promise<ArchiveShow[]> {
    const searchParams = new URLSearchParams({
      q: `creator:${creator}`,
      output: 'json',
      rows: '100', // Get more results to filter by date
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
      console.log(`Filtering shows by date: ${date}`)
      console.log(`Available show dates:`, shows.map(s => s.date))
      
      shows = shows.filter(show => {
        if (!show.date) return false
        
        // Extract just the date part (YYYY-MM-DD) from ISO format
        const showDate = show.date.split('T')[0]
        console.log(`Comparing ${showDate} with ${date}`)
        return showDate === date
      })
      
      console.log(`Filtered shows count: ${shows.length}`)
    }
    
    return shows
  }

  async listTracks(identifier: string): Promise<ArchiveTrack[]> {
    const response = await this.http.get<{
      files: ArchiveTrack[]
    }>(`/metadata/${identifier}`)

    // Filter for audio files only
    const audioFiles = (response.data.files || []).filter(file => 
      file.format && ['FLAC', 'MP3', 'VBR MP3', 'Ogg Vorbis'].includes(file.format)
    )

    return audioFiles
  }

  async resolveArchiveShow(params: { date: string; venue?: string; city?: string }): Promise<ArchiveShow | null> {
    const { date, venue, city } = params
    
    // Search for shows on the specific date
    const shows = await this.searchShows('Grateful Dead', date)
    
    if (shows.length === 0) {
      return null
    }
    
    // If we have venue or city info, try to match by similarity
    if (venue || city) {
      const candidates = shows.map(show => ({
        show,
        score: this.calculateMatchScore(show, { venue, city })
      }))
      
      // Sort by score (highest first) and return the best match
      candidates.sort((a, b) => b.score - a.score)
      
      // Only return if we have a reasonable match (score > 0.3)
      if (candidates[0].score > 0.3) {
        return candidates[0].show
      }
    }
    
    // If no venue/city match or no venue/city provided, return the first show
    return shows[0]
  }

  async getSongTracks(itemId: string, normalizedTitle: string, aliases: string[]): Promise<ArchiveTrack[]> {
    const allTracks = await this.listTracks(itemId)
    
    // Create a set of all possible titles to match against
    const searchTitles = [normalizedTitle, ...aliases].map(title => title.toLowerCase())
    
    // Find tracks that match any of the song titles
    const matchingTracks = allTracks.filter(track => {
      const trackName = track.name.toLowerCase()
      
      // Check for exact matches first
      for (const searchTitle of searchTitles) {
        if (trackName.includes(searchTitle)) {
          return true
        }
      }
      
      // Check for fuzzy matches (handles medleys, segues, etc.)
      for (const searchTitle of searchTitles) {
        if (this.fuzzyMatch(trackName, searchTitle)) {
          return true
        }
      }
      
      return false
    })
    
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
    // Simple Levenshtein distance-based similarity
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
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
}
