import { SetlistClientImpl } from './clients/setlist'
import { resolveSong } from './ids'
import { GRATEFUL_DEAD_MBID } from './ids'

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

  // Initialize clients
  const setlistClient = new SetlistClientImpl()

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
        first: null,
        last: null,
        totalPerformances: 0,
        songTitle: normalizedTitle,
        aliases,
      }
    }

    // Use the first matching song (best match)
    const song = artistSongs[0]
    
    // Get all setlists for this song
    const allSetlists = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const setlists = await setlistClient.searchSetlistsBySong(song.id, page)
      if (setlists.length === 0) {
        hasMore = false
      } else {
        allSetlists.push(...setlists)
        page++
        // Limit to prevent infinite loops
        if (page > 50) {
          hasMore = false
        }
      }
    }

    if (allSetlists.length === 0) {
      return {
        first: null,
        last: null,
        totalPerformances: 0,
        songTitle: normalizedTitle,
        aliases,
      }
    }

    // Sort setlists by date to find first and last
    const sortedSetlists = allSetlists.sort((a, b) => 
      new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
    )

    const firstSetlist = sortedSetlists[0]
    const lastSetlist = sortedSetlists[sortedSetlists.length - 1]

    const first: ShowRef | null = firstSetlist ? {
      id: firstSetlist.id,
      date: firstSetlist.eventDate,
      venue: firstSetlist.venue.name,
      city: firstSetlist.venue.city.name,
      state: firstSetlist.venue.city.state,
      country: firstSetlist.venue.city.country.name,
      url: `https://www.setlist.fm/setlist/${firstSetlist.id}`,
      source: 'setlist.fm'
    } : null

    const last: ShowRef | null = lastSetlist ? {
      id: lastSetlist.id,
      date: lastSetlist.eventDate,
      venue: lastSetlist.venue.name,
      city: lastSetlist.venue.city.name,
      state: lastSetlist.venue.city.state,
      country: lastSetlist.venue.city.country.name,
      url: `https://www.setlist.fm/setlist/${lastSetlist.id}`,
      source: 'setlist.fm'
    } : null

    return {
      first,
      last,
      totalPerformances: allSetlists.length,
      songTitle: normalizedTitle,
      aliases,
    }

  } catch (error) {
    console.error('Error fetching song facts:', error)
    throw new Error(`Failed to fetch song facts: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
