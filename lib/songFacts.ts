import { SetlistClientServer } from './clients/setlist-server'
import { resolveSong } from './ids'
import { GRATEFUL_DEAD_MBID } from './ids'
import { songIndexService } from './song-index'

/**
 * Parse setlist.fm date format (dd-MM-yyyy) to a proper Date object
 */
function parseSetlistDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day) // month is 0-indexed in Date constructor
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

export interface SongFactsInput {
  artistMbid: string
  songTitleOrId: string
}

/**
 * Get first and last performance facts for a song
 */
export async function getFirstLast(input: SongFactsInput): Promise<FirstLastFacts> {
  const { artistMbid, songTitleOrId } = input

  if (!artistMbid || !songTitleOrId) {
    throw new Error('Artist MBID and song title/ID are required')
  }

  // Resolve the song to get normalized title and aliases
  const songResolution = await resolveSong({ title: songTitleOrId })
  const normalizedTitle = songResolution.normalizedTitle
  const aliases = songResolution.aliases

  try {
    // Check if we need to build/rebuild the index
    if (songIndexService.shouldRebuildIndex()) {
      console.log('Building song index...')
      await songIndexService.buildIndex()
    }
    
    // Search for the song in the index
    const songSlug = normalizedTitle.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').trim()
    const songDetails = songIndexService.getSongDetails(songSlug)
    
    if (!songDetails) {
      return {
        first: null,
        last: null,
        totalPerformances: 0,
        songTitle: normalizedTitle,
        aliases,
      }
    }

    // Convert indexed data to ShowRef format
    const first: ShowRef | null = songDetails.firstPerformance ? {
      id: songDetails.firstPerformance.id,
      date: songDetails.firstPerformance.date,
      venue: songDetails.firstPerformance.venue.name,
      city: songDetails.firstPerformance.venue.city,
      state: undefined, // Not stored in index
      country: songDetails.firstPerformance.venue.country,
      url: `https://www.setlist.fm/setlist/${songDetails.firstPerformance.id}`,
      source: 'setlist.fm'
    } : null

    const last: ShowRef | null = songDetails.lastPerformance ? {
      id: songDetails.lastPerformance.id,
      date: songDetails.lastPerformance.date,
      venue: songDetails.lastPerformance.venue.name,
      city: songDetails.lastPerformance.venue.city,
      state: undefined, // Not stored in index
      country: songDetails.lastPerformance.venue.country,
      url: `https://www.setlist.fm/setlist/${songDetails.lastPerformance.id}`,
      source: 'setlist.fm'
    } : null

    return {
      first,
      last,
      totalPerformances: songDetails.totalPerformances,
      songTitle: normalizedTitle,
      aliases,
    }

  } catch (error) {
    console.error('Error fetching song facts:', error)
    throw new Error(`Failed to fetch song facts: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get position facts (opener/closer/encore) for a song
 */
export async function getPositions(input: SongFactsInput): Promise<PositionFacts> {
  const { artistMbid, songTitleOrId } = input

  if (!artistMbid || !songTitleOrId) {
    throw new Error('Artist MBID and song title/ID are required')
  }

  // Resolve the song to get normalized title and aliases
  const songResolution = await resolveSong({ title: songTitleOrId })
  const normalizedTitle = songResolution.normalizedTitle
  const aliases = songResolution.aliases

  try {
    // Check if we need to build/rebuild the index
    if (songIndexService.shouldRebuildIndex()) {
      console.log('Building song index...')
      await songIndexService.buildIndex()
    }
    
    // Search for the song in the index
    const songSlug = normalizedTitle.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').trim()
    const songDetails = songIndexService.getSongDetails(songSlug)
    
    if (!songDetails) {
      return {
        opener: { count: 0, shows: [] },
        closer: { count: 0, shows: [] },
        encore: { count: 0, shows: [] },
        songTitle: normalizedTitle,
        aliases,
      }
    }

    // Convert indexed position data to ShowRef format
    const openerShows: ShowRef[] = songDetails.openerShows.map(show => ({
      id: show.id,
      date: show.date,
      venue: show.venue.name,
      city: show.venue.city,
      state: undefined, // Not stored in index
      country: show.venue.country,
      url: `https://www.setlist.fm/setlist/${show.id}`,
      source: 'setlist.fm'
    }))

    const closerShows: ShowRef[] = songDetails.closerShows.map(show => ({
      id: show.id,
      date: show.date,
      venue: show.venue.name,
      city: show.venue.city,
      state: undefined, // Not stored in index
      country: show.venue.country,
      url: `https://www.setlist.fm/setlist/${show.id}`,
      source: 'setlist.fm'
    }))

    const encoreShows: ShowRef[] = songDetails.encoreShows.map(show => ({
      id: show.id,
      date: show.date,
      venue: show.venue.name,
      city: show.venue.city,
      state: undefined, // Not stored in index
      country: show.venue.country,
      url: `https://www.setlist.fm/setlist/${show.id}`,
      source: 'setlist.fm'
    }))

    return {
      opener: { count: openerShows.length, shows: openerShows },
      closer: { count: closerShows.length, shows: closerShows },
      encore: { count: encoreShows.length, shows: encoreShows },
      songTitle: normalizedTitle,
      aliases,
    }

  } catch (error) {
    console.error('Error fetching position facts:', error)
    throw new Error(`Failed to fetch position facts: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get song facts for Grateful Dead (convenience function)
 */
export async function getGratefulDeadSongFacts(songTitle: string): Promise<FirstLastFacts> {
  return getFirstLast({
    artistMbid: GRATEFUL_DEAD_MBID,
    songTitleOrId: songTitle,
  })
}

/**
 * Get position facts for Grateful Dead (convenience function)
 */
export async function getGratefulDeadPositionFacts(songTitle: string): Promise<PositionFacts> {
  return getPositions({
    artistMbid: GRATEFUL_DEAD_MBID,
    songTitleOrId: songTitle,
  })
}

/**
 * Get paginated position facts for a specific position type
 */
export async function getGratefulDeadPositionFactsPage(
  songTitle: string, 
  positionType: 'opener' | 'closer' | 'encore', 
  page: number = 1
): Promise<{
  shows: ShowRef[]
  hasMore: boolean
  totalCount: number
  page: number
  positionType: string
}> {
  const { artistMbid, songTitleOrId } = {
    artistMbid: GRATEFUL_DEAD_MBID,
    songTitleOrId: songTitle,
  }

  if (!artistMbid || !songTitleOrId) {
    throw new Error('Artist MBID and song title/ID are required')
  }

  // Resolve the song to get normalized title and aliases
  const songResolution = await resolveSong({ title: songTitleOrId })
  const normalizedTitle = songResolution.normalizedTitle

  // Initialize clients
  const setlistClient = new SetlistClientServer()

  try {
    // Search for the song in setlist.fm to get song ID
    const songs = await setlistClient.searchSongs(normalizedTitle)
    
    // Find the best matching song for this artist
    const artistSongs = (songs || []).filter(song => 
      song.artist.id === artistMbid || 
      song.artist.name.toLowerCase().includes('grateful dead')
    )

    if (artistSongs.length === 0) {
      return {
        shows: [],
        hasMore: false,
        totalCount: 0,
        page,
        positionType,
      }
    }

    // Use the first matching song (best match)
    const song = artistSongs[0]
    
    // Get setlists for the specific page
    const setlists = await setlistClient.searchSetlistsBySong(song.name, page)
    
    if (setlists.length === 0) {
      return {
        shows: [],
        hasMore: false,
        totalCount: 0,
        page,
        positionType,
      }
    }

    // Analyze positions in the setlists for the specific position type
    const shows: ShowRef[] = []

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

      // Check if song matches the specific position type
      let matches = false

      for (const set of setlist.sets.set) {
        if (set.song.length === 0) continue


        if (positionType === 'opener') {
          // Check if song is first in any set (opener)
          if (set.song[0]?.name.toLowerCase() === normalizedTitle.toLowerCase()) {
            matches = true
            break
          }
        } else if (positionType === 'closer') {
          // Check if song is last in any set (closer)
          if (set.song[set.song.length - 1]?.name.toLowerCase() === normalizedTitle.toLowerCase()) {
            matches = true
            break
          }
        } else if (positionType === 'encore') {
          // Check if this is an encore set (use the encore field or fallback to name checking)
          const isEncoreSet = set.encore !== undefined || 
                             set.name?.toLowerCase().includes('encore') || 
                             set.name?.toLowerCase().includes('e:') ||
                             set.name?.toLowerCase().includes('e1') ||
                             set.name?.toLowerCase().includes('e2')

          if (isEncoreSet) {
            // Check if song appears in this encore set
            const songInEncore = set.song.some(s => 
              s.name.toLowerCase() === normalizedTitle.toLowerCase()
            )
            if (songInEncore) {
              matches = true
              break
            }
          }
        }
      }

      if (matches) {
        shows.push(showRef)
      }
    }

    // Check if there are more pages by trying to fetch the next page
    const nextPageSetlists = await setlistClient.searchSetlistsBySong(song.name, page + 1)
    const hasMore = nextPageSetlists.length > 0

    return {
      shows,
      hasMore,
      totalCount: shows.length, // This is just for this page, not total
      page,
      positionType,
    }

  } catch (error) {
    console.error('Error fetching position facts page:', error)
    throw new Error(`Failed to fetch position facts page: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
