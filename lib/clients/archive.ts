import { HttpClient } from '../http'

export type RecordingType = 'sbd' | 'aud' | 'matrix' | 'unknown'

export interface ArchiveShowCandidate {
  identifier: string
  title: string
  recordingType: RecordingType
  score: number
  downloads?: number
}

export interface ArchiveShowMetadata {
  title: string
  creator: string
  date: string
  venue: string
  city: string
  state?: string
  country?: string
  licenseurl: string
  rights: string
  publicdate: string
  description: string | null
  mp3Count: number
}

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
  listArchiveShowCandidates(params: { date: string; venue?: string; city?: string }): Promise<ArchiveShowCandidate[]>
  getSongTracks(itemId: string, normalizedTitle: string, aliases: string[]): Promise<ArchiveTrack[]>
  getAllTracks(itemId: string): Promise<ArchiveTrack[]>
  getItemDescription(identifier: string): Promise<string | null>
  getShowMetadata(identifier: string): Promise<ArchiveShowMetadata>
  selectBestRecording(candidates: ArchiveShowCandidate[], totalSongs: number): Promise<{ identifier: string; mp3Count: number }>
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
    const [year, month, day] = date.split('-')
    const shortYear = year.slice(2)

    // GD identifiers reliably start with gd{YYYY-MM-DD} or gd{YY-MM-DD};
    // try these first before the less-reliable date field.
    const queries = [
      `identifier:gd${year}-${month}-${day}* AND collection:GratefulDead`,
      `identifier:gd${shortYear}-${month}-${day}* AND collection:GratefulDead`,
      `collection:GratefulDead AND date:${date}`,
      `collection:GratefulDead AND date:[${date}T00:00:00Z TO ${date}T23:59:59Z]`,
    ]

    for (const q of queries) {
      try {
        const searchParams = new URLSearchParams({ q, output: 'json', rows: '20', fl: 'identifier,title,creator,date,venue,city,state,country,licenseurl,rights,publicdate' })
        const response = await this.http.get<{
          response: { docs: ArchiveShow[]; numFound: number }
        }>(`/advancedsearch.php?${searchParams.toString()}`, { cache: false })

        const shows = response.data?.response?.docs || []
        if (shows.length === 0) continue
        if (shows.length === 1) return shows[0]

        const scored = shows
          .map(show => ({ show, score: this.calculateMatchScore(show, { venue, city }) }))
          .sort((a, b) => b.score - a.score)

        return scored[0].show
      } catch {
        continue
      }
    }

    return null
  }

  private detectRecordingType(identifier: string, title?: string): RecordingType {
    const text = `${identifier} ${title ?? ''}`.toLowerCase()
    if (/\b(mtx|matrix)\b/.test(text)) return 'matrix'
    if (/\b(sbd|soundboard)\b/.test(text)) return 'sbd'
    if (/\b(aud|audience)\b/.test(text)) return 'aud'
    return 'unknown'
  }

  async listArchiveShowCandidates(params: { date: string; venue?: string; city?: string }): Promise<ArchiveShowCandidate[]> {
    const { date, venue, city } = params
    const [year, month, day] = date.split('-')
    const shortYear = year.slice(2)

    const queries = [
      `identifier:gd${year}-${month}-${day}* AND collection:GratefulDead`,
      `identifier:gd${shortYear}-${month}-${day}* AND collection:GratefulDead`,
    ]

    const seen = new Set<string>()
    const candidates: ArchiveShowCandidate[] = []

    for (const q of queries) {
      try {
        const searchParams = new URLSearchParams({
          q, output: 'json', rows: '20',
          fl: 'identifier,title,creator,date,venue,city,state,country,downloads',
        })
        const response = await this.http.get<{
          response: { docs: Array<ArchiveShow & { downloads?: number }> }
        }>(`/advancedsearch.php?${searchParams.toString()}`, { cache: false })

        for (const show of response.data?.response?.docs ?? []) {
          if (seen.has(show.identifier)) continue
          seen.add(show.identifier)
          candidates.push({
            identifier: show.identifier,
            title: show.title,
            recordingType: this.detectRecordingType(show.identifier, show.title),
            score: this.calculateMatchScore(show, { venue, city }),
            downloads: show.downloads,
          })
        }
      } catch {
        continue
      }
    }

    return candidates.sort((a, b) => b.score - a.score)
  }

  async getSongTracks(itemId: string, normalizedTitle: string, aliases: string[]): Promise<ArchiveTrack[]> {
    const allTracks = await this.listTracks(itemId)
    
    if (allTracks.length === 0) {
      return []
    }
    
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

    // Create a set of all possible titles to match against (raw lowercase + normalized)
    const searchTitlesRaw = [normalizedTitle, ...aliases].map(t => t.toLowerCase())
    const searchTitlesNorm = searchTitlesRaw.map(norm).filter(n => n.length > 0)

    // Find tracks that match any of the song titles (check both filename and title metadata)
    const matchingTracks = allTracks.filter(track => {
      const trackNameRaw = track.name.toLowerCase()
      const trackTitleRaw = (track.title || '').toLowerCase()
      const trackNameNorm = norm(trackNameRaw)
      const trackTitleNorm = norm(trackTitleRaw)

      for (const raw of searchTitlesRaw) {
        if (trackNameRaw.includes(raw) || raw.includes(trackNameRaw)) return true
        if (trackTitleRaw && (trackTitleRaw.includes(raw) || raw.includes(trackTitleRaw))) return true
      }

      // Normalized pass: handles "Love Light" vs "Lovelight", apostrophes, hyphens, etc.
      for (const n of searchTitlesNorm) {
        if (trackNameNorm.includes(n) || n.includes(trackNameNorm)) return true
        if (trackTitleNorm && (trackTitleNorm.includes(n) || n.includes(trackTitleNorm))) return true
      }

      // Fuzzy match on filename and title (raw strings only — fuzzyMatch uses regex)
      for (const searchTitle of searchTitlesRaw) {
        if (this.fuzzyMatch(trackNameRaw, searchTitle) || (trackTitleRaw && this.fuzzyMatch(trackTitleRaw, searchTitle))) {
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

  // Fetches the taper-written description embedded in the Archive.org item metadata.
  // The description typically contains a comma-separated setlist and recording notes.
  async getItemDescription(identifier: string): Promise<string | null> {
    try {
      const response = await this.http.get<{
        metadata?: { description?: string | string[] }
      }>(`/metadata/${identifier}`)
      const desc = response.data?.metadata?.description
      if (!desc) return null
      // Archive.org sometimes stores description as an array of lines
      return Array.isArray(desc) ? desc.join('\n') : desc
    } catch {
      return null
    }
  }

  // Fetches full item metadata including description, venue info, license, and MP3 count
  // in a single /metadata call. Used by the resolve-show route after recording selection.
  async getShowMetadata(identifier: string): Promise<ArchiveShowMetadata> {
    const fallback: ArchiveShowMetadata = {
      title: identifier, creator: '', date: '', venue: '', city: '',
      licenseurl: '', rights: '', publicdate: '', description: null, mp3Count: 0,
    }
    try {
      const response = await this.http.get<{
        metadata?: {
          title?: string | string[]
          creator?: string | string[]
          date?: string
          venue?: string
          city?: string
          state?: string
          country?: string
          licenseurl?: string | string[]
          rights?: string | string[]
          publicdate?: string
          description?: string | string[]
        }
        files?: Array<{ format?: string }>
      }>(`/metadata/${identifier}`)
      const m = response.data?.metadata ?? {}
      const asStr = (v: string | string[] | undefined) => Array.isArray(v) ? v.join('\n') : v ?? ''
      const rawDesc = m.description
      const description = rawDesc ? (Array.isArray(rawDesc) ? rawDesc.join('\n') : rawDesc) : null
      const mp3Count = (response.data?.files ?? [])
        .filter(f => f.format && ['MP3', 'VBR MP3'].includes(f.format)).length
      return {
        title: asStr(m.title), creator: asStr(m.creator), date: m.date ?? '',
        venue: m.venue ?? '', city: m.city ?? '', state: m.state, country: m.country,
        licenseurl: asStr(m.licenseurl), rights: asStr(m.rights),
        publicdate: m.publicdate ?? '', description, mp3Count,
      }
    } catch {
      return fallback
    }
  }

  // Picks the recording with best coverage of the setlist, using downloads as tiebreaker.
  // Fetches track counts for the top 3 candidates in parallel; ranking:
  //   1. Full coverage (mp3Count >= totalSongs) over partial
  //   2. Higher downloads among ties
  //   3. Higher mp3Count as last resort
  async selectBestRecording(
    candidates: ArchiveShowCandidate[],
    totalSongs: number,
  ): Promise<{ identifier: string; mp3Count: number }> {
    if (candidates.length === 0) return { identifier: '', mp3Count: 0 }
    const top = candidates.slice(0, Math.min(3, candidates.length))
    const results = await Promise.all(top.map(async c => {
      try {
        const tracks = await this.listTracks(c.identifier)
        return { identifier: c.identifier, mp3Count: tracks.length, downloads: c.downloads ?? 0 }
      } catch {
        return { identifier: c.identifier, mp3Count: 0, downloads: c.downloads ?? 0 }
      }
    }))
    const sorted = [...results].sort((a, b) => {
      const aFull = a.mp3Count >= totalSongs
      const bFull = b.mp3Count >= totalSongs
      if (aFull !== bFull) return aFull ? -1 : 1
      if (b.downloads !== a.downloads) return b.downloads - a.downloads
      return b.mp3Count - a.mp3Count
    })
    return { identifier: sorted[0].identifier, mp3Count: sorted[0].mp3Count }
  }
}
