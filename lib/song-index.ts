import { SetlistClientServer } from './clients/setlist-server'
import { GRATEFUL_DEAD_MBID } from './ids'

export interface ShowInfo {
  id: string
  date: string
  venue: {
    id: string
    name: string
    city: string
    country: string
  }
  year: number
  era: string
}

export interface SongIndexEntry {
  title: string
  slug: string
  altTitles: string[]
  shows: ShowInfo[]
  totalPerformances: number
  firstPerformance: ShowInfo | null
  lastPerformance: ShowInfo | null
  openerShows: ShowInfo[]
  closerShows: ShowInfo[]
  encoreShows: ShowInfo[]
}

export interface SongIndex {
  songs: SongIndexEntry[]
  lastUpdated: string
  totalShows: number
}

export class SongIndexService {
  private songIndex: SongIndex | null = null
  private setlistClient: SetlistClientServer

  constructor() {
    this.setlistClient = new SetlistClientServer()
  }

  // Build the complete song index (one-time operation)
  async buildIndex(): Promise<SongIndex> {
    console.log('Building complete song index...')
    
    const songMap = new Map<string, SongIndexEntry>()
    let totalShows = 0
    
    // Fetch setlists from multiple years to get comprehensive data
    const years = [1965, 1966, 1967, 1968, 1969, 1970, 1971, 1972, 1973, 1974, 1975, 1976, 1977, 1978, 1979, 1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995]
    
    for (const year of years) {
      try {
        console.log(`Processing year ${year}...`)
        
        // Get setlists for this year (limit pages to avoid rate limits)
        for (let page = 1; page <= 5; page++) {
          try {
            console.log(`  Searching year ${year}, page ${page}...`)
            
            const setlistsResponse = await this.setlistClient.getArtistSetlists(
              GRATEFUL_DEAD_MBID, 
              page,
              year
            )
            
            if (!setlistsResponse || setlistsResponse.length === 0) {
              console.log(`    No setlists found on page ${page}, moving to next year`)
              break
            }
            
            console.log(`    Found ${setlistsResponse.length} setlists on page ${page}`)
            
            // Process each setlist
            setlistsResponse.forEach((setlist: any) => {
              if (setlist.sets?.set) {
                setlist.sets.set.forEach((set: any, setIndex: number) => {
                  if (set.song) {
                    set.song.forEach((song: any, songIndex: number) => {
                      const songTitle = song.name
                      const songSlug = this.createSlug(songTitle)
                      
                      // Create or update song entry
                      if (!songMap.has(songSlug)) {
                        songMap.set(songSlug, {
                          title: songTitle,
                          slug: songSlug,
                          altTitles: [songTitle],
                          shows: [],
                          totalPerformances: 0,
                          firstPerformance: null,
                          lastPerformance: null,
                          openerShows: [],
                          closerShows: [],
                          encoreShows: []
                        })
                      }
                      
                      const songEntry = songMap.get(songSlug)!
                      
                      // Add show info
                      const showInfo: ShowInfo = {
                        id: setlist.id,
                        date: setlist.eventDate,
                        venue: {
                          id: setlist.venue?.id || '',
                          name: setlist.venue?.name || 'Unknown Venue',
                          city: setlist.venue?.city?.name || 'Unknown City',
                          country: setlist.venue?.city?.country?.name || 'Unknown Country'
                        },
                        year: this.parseYear(setlist.eventDate),
                        era: this.getEraLabel(setlist.eventDate)
                      }
                      
                      songEntry.shows.push(showInfo)
                      songEntry.totalPerformances++
                      
                      // Update first/last performance
                      if (!songEntry.firstPerformance || showInfo.date < songEntry.firstPerformance.date) {
                        songEntry.firstPerformance = showInfo
                      }
                      if (!songEntry.lastPerformance || showInfo.date > songEntry.lastPerformance.date) {
                        songEntry.lastPerformance = showInfo
                      }
                      
                      // Add alt titles if different
                      if (!songEntry.altTitles.includes(songTitle)) {
                        songEntry.altTitles.push(songTitle)
                      }
                      
                      // Track position data
                      const isEncoreSet = set.encore !== undefined || 
                                         set.name?.toLowerCase().includes('encore') || 
                                         set.name?.toLowerCase().includes('e:') ||
                                         set.name?.toLowerCase().includes('e1') ||
                                         set.name?.toLowerCase().includes('e2')
                      
                      const isFirstInSet = songIndex === 0
                      const isLastInSet = songIndex === set.song.length - 1
                      
                      // Check if song is opener (first song in first set)
                      if (isFirstInSet && setIndex === 0 && !isEncoreSet) {
                        songEntry.openerShows.push(showInfo)
                      }
                      
                      // Check if song is closer (last song in any set)
                      if (isLastInSet) {
                        songEntry.closerShows.push(showInfo)
                      }
                      
                      // Check if song is in encore
                      if (isEncoreSet) {
                        songEntry.encoreShows.push(showInfo)
                      }
                    })
                  }
                })
              }
            })
            
            totalShows += setlistsResponse.length
            
            // Conservative rate limiting: wait 2 seconds between requests
            console.log(`    Waiting 2 seconds before next request...`)
            await new Promise(resolve => setTimeout(resolve, 2000))
            
          } catch (pageError: any) {
            console.log(`    Error on page ${page}:`, pageError.message)
            if (pageError.message.includes('429')) {
              console.log('    Rate limited, waiting 10 seconds...')
              await new Promise(resolve => setTimeout(resolve, 10000))
            }
            break
          }
        }
        
        // Conservative rate limiting: wait 5 seconds between years
        console.log(`  Waiting 5 seconds before next year...`)
        await new Promise(resolve => setTimeout(resolve, 5000))
        
      } catch (yearError: any) {
        console.log(`  Error processing year ${year}:`, yearError.message)
      }
    }
    
    // Convert map to array
    const songs = Array.from(songMap.values())
    
    this.songIndex = {
      songs,
      lastUpdated: new Date().toISOString(),
      totalShows
    }
    
    console.log(`Index built successfully! Found ${songs.length} unique songs across ${totalShows} shows`)
    
    return this.songIndex
  }

  // Search songs in the local index
  searchSongs(query: string, limit: number = 20): SongIndexEntry[] {
    if (!this.songIndex) {
      console.log('No index available, returning empty results')
      return []
    }
    
    const searchTerm = query.toLowerCase().trim()
    if (!searchTerm) return []
    
    // Simple text search through song titles and alt titles
    const results = this.songIndex.songs.filter(song => {
      return song.title.toLowerCase().includes(searchTerm) ||
             song.altTitles.some(alt => alt.toLowerCase().includes(searchTerm))
    })
    
    // Sort by relevance (exact matches first, then by performance count)
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase() === searchTerm
      const bExact = b.title.toLowerCase() === searchTerm
      
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      
      return b.totalPerformances - a.totalPerformances
    })
    
    return results.slice(0, limit)
  }

  // Get song details by slug
  getSongDetails(slug: string): SongIndexEntry | null {
    if (!this.songIndex) return null
    
    return this.songIndex.songs.find(song => song.slug === slug) || null
  }

  // Get index stats
  getIndexStats() {
    if (!this.songIndex) return null
    
    return {
      totalSongs: this.songIndex.songs.length,
      totalShows: this.songIndex.totalShows,
      lastUpdated: this.songIndex.lastUpdated
    }
  }

  // Check if index needs rebuilding
  shouldRebuildIndex(): boolean {
    if (!this.songIndex) return true
    
    const lastUpdate = new Date(this.songIndex.lastUpdated)
    const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
    
    // Rebuild if older than 7 days
    return daysSinceUpdate > 7
  }

  // Helper methods
  private createSlug(title: string): string {
    return title.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim()
  }

  private parseYear(dateString: string): number {
    try {
      const [day, month, year] = dateString.split('-')
      return parseInt(year)
    } catch {
      return new Date().getFullYear()
    }
  }

  private getEraLabel(dateString: string): string {
    const year = this.parseYear(dateString)
    
    if (year >= 1965 && year <= 1967) return 'Primal Era'
    if (year >= 1968 && year <= 1970) return 'Pigpen Peak Era'
    if (year >= 1971 && year <= 1972) return 'Europe \'72 Era'
    if (year >= 1973 && year <= 1974) return 'Wall of Sound Era'
    if (year >= 1975 && year <= 1975) return 'Hiatus'
    if (year >= 1976 && year <= 1978) return 'Return + \'77 Era'
    if (year >= 1979 && year <= 1986) return 'Brent Early Era'
    if (year >= 1987 && year <= 1990) return 'Brent Late Era'
    if (year >= 1991 && year <= 1995) return 'Vince Era'
    
    return 'Unknown Era'
  }
}

// Export singleton instance
export const songIndexService = new SongIndexService()
