import { SetlistClientImpl } from '../clients/setlist'
import { resolveSong } from '../ids'

export interface Song {
  id: string
  title: string
  normalizedTitle: string
  aliases: string[]
  totalPerformances: number
  firstPerformance?: ShowRef
  lastPerformance?: ShowRef
  openerCount: number
  closerCount: number
  encoreCount: number
}

export interface ShowRef {
  id: string
  date: string
  venue: string
  city: string
  state?: string
  country: string
  url: string
  source: 'setlist.fm'
}

export interface PositionFacts {
  opener: {
    count: number
    shows: ShowRef[]
  }
  closer: {
    count: number
    shows: ShowRef[]
  }
  encore: {
    count: number
    shows: ShowRef[]
  }
}

export interface SongIndexRepository {
  searchSongs(query: string, limit?: number): Promise<Song[]>
  getSongByTitle(title: string): Promise<Song | null>
  getPositions(songId: string): Promise<PositionFacts | null>
  upsertFromSetlist(setlistId: string, rawSetlist: unknown): Promise<void>
}

export class FileSongIndexRepository implements SongIndexRepository {
  private songs = new Map<string, Song>()
  private setlistClient = new SetlistClientImpl()

  async searchSongs(query: string, limit: number = 20): Promise<Song[]> {
    const searchTerm = query.toLowerCase().trim()
    if (!searchTerm) return []
    
    const results = Array.from(this.songs.values()).filter(song => {
      return song.title.toLowerCase().includes(searchTerm) ||
             song.aliases.some(alias => alias.toLowerCase().includes(searchTerm))
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

  async getSongByTitle(title: string): Promise<Song | null> {
    const resolution = resolveSong({ title })
    return this.songs.get(resolution.normalizedTitle) || null
  }

  async getPositions(songId: string): Promise<PositionFacts | null> {
    const song = this.songs.get(songId)
    if (!song) return null

    // This is a simplified implementation
    // In a real implementation, you'd have separate maps for positions
    return {
      opener: {
        count: song.openerCount,
        shows: [] // Would be populated from position maps
      },
      closer: {
        count: song.closerCount,
        shows: [] // Would be populated from position maps
      },
      encore: {
        count: song.encoreCount,
        shows: [] // Would be populated from position maps
      }
    }
  }

  async upsertFromSetlist(setlistId: string, rawSetlist: unknown): Promise<void> {
    // Type guard to ensure rawSetlist has the expected structure
    if (!rawSetlist || typeof rawSetlist !== 'object') return
    
    const setlist = rawSetlist as {
      eventDate?: string
      venue?: {
        name?: string
        city?: {
          name?: string
          state?: string
          country?: {
            name?: string
          }
        }
      }
      url?: string
      sets?: {
        set?: Array<{
          encore?: number
          name?: string
          song?: Array<{
            name: string
          }>
        }>
      }
    }

    if (!setlist.sets?.set) return

    for (const set of setlist.sets.set) {
      if (!set.song) continue

      for (let i = 0; i < set.song.length; i++) {
        const songData = set.song[i]
        const resolution = resolveSong({ title: songData.name })
        
        // Get or create song
        let song = this.songs.get(resolution.normalizedTitle)
        if (!song) {
          song = {
            id: resolution.normalizedTitle,
            title: songData.name,
            normalizedTitle: resolution.normalizedTitle,
            aliases: resolution.aliases,
            totalPerformances: 0,
            openerCount: 0,
            closerCount: 0,
            encoreCount: 0
          }
          this.songs.set(resolution.normalizedTitle, song)
        }

        // Update performance count
        song.totalPerformances++

        // Create show reference
        const showRef: ShowRef = {
          id: setlistId,
          date: setlist.eventDate || 'Unknown Date',
          venue: setlist.venue?.name || 'Unknown Venue',
          city: setlist.venue?.city?.name || 'Unknown City',
          state: setlist.venue?.city?.state,
          country: setlist.venue?.city?.country?.name || 'Unknown Country',
          url: setlist.url || `https://www.setlist.fm/setlist/${setlistId}`,
          source: 'setlist.fm'
        }

        // Update first/last performance
        if (!song.firstPerformance || showRef.date < song.firstPerformance.date) {
          song.firstPerformance = showRef
        }
        if (!song.lastPerformance || showRef.date > song.lastPerformance.date) {
          song.lastPerformance = showRef
        }

        // Track positions
        const isEncoreSet = set.encore !== undefined || 
                           set.name?.toLowerCase().includes('encore') || 
                           set.name?.toLowerCase().includes('e:') ||
                           set.name?.toLowerCase().includes('e1') ||
                           set.name?.toLowerCase().includes('e2')
        
        const isFirstInSet = i === 0
        const isLastInSet = i === set.song.length - 1

        // Check if song is opener (first song in first set)
        if (isFirstInSet && set === setlist.sets.set[0] && !isEncoreSet) {
          song.openerCount++
        }

        // Check if song is closer (last song in any set)
        if (isLastInSet) {
          song.closerCount++
        }

        // Check if song is in encore
        if (isEncoreSet) {
          song.encoreCount++
        }
      }
    }
  }
}
