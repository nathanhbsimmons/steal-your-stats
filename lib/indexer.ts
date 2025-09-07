import { FileSongIndexRepository } from './repositories/file-song-index-repository'
import { SetlistClientImpl } from './clients/setlist'
import { GRATEFUL_DEAD_MBID } from './ids'

export interface IndexerStats {
  totalSongs: number
  totalShows: number
  lastUpdated: string
}

export class SongIndexer {
  private repository = new FileSongIndexRepository()
  private setlistClient = new SetlistClientImpl()
  private stats: IndexerStats = {
    totalSongs: 0,
    totalShows: 0,
    lastUpdated: new Date().toISOString()
  }

  /**
   * Rebuild the entire song index from setlist.fm
   */
  async rebuild(): Promise<IndexerStats> {
    console.log('Starting full index rebuild...')
    
    const years = [1965, 1966, 1967, 1968, 1969, 1970, 1971, 1972, 1973, 1974, 1975, 1976, 1977, 1978, 1979, 1980, 1981, 1982, 1983, 1984, 1985, 1986, 1987, 1988, 1989, 1990, 1991, 1992, 1993, 1994, 1995]
    let totalShows = 0
    
    for (const year of years) {
      try {
        console.log(`Processing year ${year}...`)
        
        // Get setlists for this year (limit pages to avoid rate limits)
        for (let page = 1; page <= 5; page++) {
          try {
            console.log(`  Searching year ${year}, page ${page}...`)
            
            const setlists = await this.setlistClient.getSetlistsByArtist(GRATEFUL_DEAD_MBID, page)
            
            if (setlists.length === 0) {
              console.log(`    No setlists found on page ${page}, moving to next year`)
              break
            }
            
            console.log(`    Found ${setlists.length} setlists on page ${page}`)
            
            // Process each setlist
            for (const setlist of setlists) {
              await this.upsertShow(setlist.id, setlist)
              totalShows++
            }
            
            // Conservative rate limiting: wait 2 seconds between requests
            console.log(`    Waiting 2 seconds before next request...`)
            await new Promise(resolve => setTimeout(resolve, 2000))
            
          } catch (pageError: unknown) {
            const error = pageError as Error
            console.log(`    Error on page ${page}:`, error.message)
            if (error.message.includes('429')) {
              console.log('    Rate limited, waiting 10 seconds...')
              await new Promise(resolve => setTimeout(resolve, 10000))
            }
            break
          }
        }
        
        // Conservative rate limiting: wait 5 seconds between years
        console.log(`  Waiting 5 seconds before next year...`)
        await new Promise(resolve => setTimeout(resolve, 5000))
        
      } catch (yearError: unknown) {
        const error = yearError as Error
        console.log(`  Error processing year ${year}:`, error.message)
      }
    }
    
    this.stats = {
      totalSongs: this.repository['songs'].size,
      totalShows,
      lastUpdated: new Date().toISOString()
    }
    
    console.log(`Index rebuild completed! Found ${this.stats.totalSongs} unique songs across ${this.stats.totalShows} shows`)
    
    return this.stats
  }

  /**
   * Upsert a single show into the index
   */
  async upsertShow(setlistId: string, rawSetlist: unknown): Promise<void> {
    await this.repository.upsertFromSetlist(setlistId, rawSetlist)
  }

  /**
   * Get the repository instance for querying
   */
  getRepository(): FileSongIndexRepository {
    return this.repository
  }

  /**
   * Get current index statistics
   */
  getStats(): IndexerStats {
    return this.stats
  }
}

// Export singleton instance
export const songIndexer = new SongIndexer()
