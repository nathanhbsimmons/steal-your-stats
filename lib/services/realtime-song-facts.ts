import { SetlistClientImpl } from '../clients/setlist'
import { resolveSong } from '../ids'

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

export interface FirstLastFacts {
  first: ShowRef | null
  last: ShowRef | null
  totalPerformances: number
  songTitle: string
  aliases: string[]
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
  songTitle: string
  aliases: string[]
}

export interface VersionTrack {
  id: string
  showDate: string
  venue: string
  city: string
  state?: string
  country: string
  archiveItemId?: string
  durationSec?: number
  url?: string
}

export interface VersionsFacts {
  tracks: VersionTrack[]
  extremes?: {
    longest?: VersionTrack
    shortest?: VersionTrack
  }
  songTitle: string
}

export class RealtimeSongFactsService {
  private setlistClient: SetlistClientImpl
  private readonly GRATEFUL_DEAD_MBID = '6faa7ca7-0d99-4a5e-bfa6-1fd5037520c6'

  constructor() {
    this.setlistClient = new SetlistClientImpl()
  }

  async getFirstLast(songTitle: string): Promise<FirstLastFacts> {
    const resolution = resolveSong({ title: songTitle })
    const allShows = await this.getAllShowsForSong(songTitle)
    
    if (allShows.length === 0) {
      return {
        first: null,
        last: null,
        totalPerformances: 0,
        songTitle: resolution.normalizedTitle,
        aliases: resolution.aliases
      }
    }

    // Sort by date to find first and last (parse dates for proper sorting)
    const sortedShows = allShows.sort((a, b) => {
      // Parse DD-MM-YYYY format from setlist.fm
      const parseDate = (dateStr: string) => {
        const [day, month, year] = dateStr.split('-')
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      }
      
      const dateA = parseDate(a.date)
      const dateB = parseDate(b.date)
      return dateA.getTime() - dateB.getTime()
    })
    
    return {
      first: sortedShows[0],
      last: sortedShows[sortedShows.length - 1],
      totalPerformances: allShows.length,
      songTitle: resolution.normalizedTitle,
      aliases: resolution.aliases
    }
  }

  async getPositions(songTitle: string): Promise<PositionFacts> {
    const resolution = resolveSong({ title: songTitle })
    const allShows = await this.getAllShowsForSong(songTitle)
    
    const openerShows: ShowRef[] = []
    const closerShows: ShowRef[] = []
    const encoreShows: ShowRef[] = []

    // TODO: Fetch full setlist data to determine positions
    // For MVP, we'll return empty arrays and note this limitation
    void allShows

    return {
      opener: { count: openerShows.length, shows: openerShows.slice(0, 10) },
      closer: { count: closerShows.length, shows: closerShows.slice(0, 10) },
      encore: { count: encoreShows.length, shows: encoreShows.slice(0, 10) },
      songTitle: resolution.normalizedTitle,
      aliases: resolution.aliases
    }
  }

  async getVersions(songTitle: string): Promise<VersionsFacts> {
    const resolution = resolveSong({ title: songTitle })
    const allShows = await this.getAllShowsForSong(songTitle)
    
    // Convert shows to version tracks
    const tracks: VersionTrack[] = allShows.map((show, index) => ({
      id: `${resolution.normalizedTitle}-${show.id}-${index}`,
      showDate: show.date,
      venue: show.venue,
      city: show.city,
      state: show.state,
      country: show.country,
      archiveItemId: undefined,
      durationSec: undefined,
      url: undefined
    }))

    // For now, we can't get duration data from setlist.fm directly
    // This would require integration with Archive.org API
    
    return {
      tracks,
      songTitle: resolution.normalizedTitle
    }
  }

  private async getAllShowsForSong(songTitle: string): Promise<ShowRef[]> {
    const allShows: ShowRef[] = []
    let page = 1
    const maxPages = 5 // Reduced limit for faster initial load
    
    while (page <= maxPages) {
      try {
        console.log(`Fetching page ${page} for ${songTitle}...`)
        
        const setlists = await this.setlistClient.searchSetlistsBySong(songTitle, page)
        
        if (setlists.length === 0) {
          console.log(`No more setlists found on page ${page}`)
          break
        }
        
        // Convert setlists to ShowRef format
        for (const setlist of setlists) {
          const showRef: ShowRef = {
            id: setlist.id,
            date: setlist.eventDate,
            venue: setlist.venue.name,
            city: setlist.venue.city.name,
            state: setlist.venue.city.state,
            country: setlist.venue.city.country.name,
            url: setlist.url || `https://www.setlist.fm/setlist/${setlist.id}`,
            source: 'setlist.fm'
          }
          allShows.push(showRef)
        }
        
        // Rate limiting: wait 500ms between pages
        if (page < maxPages) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        
        page++
        
      } catch (error) {
        console.error(`Error fetching page ${page}:`, error)
        if (error instanceof Error && error.message.includes('429')) {
          console.log('Rate limited, waiting 5 seconds...')
          await new Promise(resolve => setTimeout(resolve, 5000))
        }
        break
      }
    }
    
    return allShows
  }
}

// Export singleton instance
export const realtimeSongFactsService = new RealtimeSongFactsService()
