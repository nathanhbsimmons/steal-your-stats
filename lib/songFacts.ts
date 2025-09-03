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
        opener: { count: 0, shows: [] },
        closer: { count: 0, shows: [] },
        encore: { count: 0, shows: [] },
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
        opener: { count: 0, shows: [] },
        closer: { count: 0, shows: [] },
        encore: { count: 0, shows: [] },
        songTitle: normalizedTitle,
        aliases,
      }
    }

    // Analyze positions in each setlist
    const openerShows: ShowRef[] = []
    const closerShows: ShowRef[] = []
    const encoreShows: ShowRef[] = []

    for (const setlist of allSetlists) {
      const showRef: ShowRef = {
        id: setlist.id,
        date: setlist.eventDate,
        venue: setlist.venue.name,
        city: setlist.venue.city.name,
        state: setlist.venue.city.state,
        country: setlist.venue.city.country.name,
        url: `https://www.setlist.fm/setlist/${setlist.id}`,
        source: 'setlist.fm'
      }

      // Check if song was opener, closer, or in encore
      let isOpener = false
      let isCloser = false
      let isEncore = false

      for (const set of setlist.sets.set) {
        if (set.song.length === 0) continue

        // Check if song is first in any set (opener)
        if (set.song[0]?.name.toLowerCase() === normalizedTitle.toLowerCase()) {
          isOpener = true
        }

        // Check if song is last in any set (closer)
        if (set.song[set.song.length - 1]?.name.toLowerCase() === normalizedTitle.toLowerCase()) {
          isCloser = true
        }

        // Check if this is an encore set
        const isEncoreSet = set.name?.toLowerCase().includes('encore') || 
                           set.name?.toLowerCase().includes('e:') ||
                           set.name?.toLowerCase().includes('e1') ||
                           set.name?.toLowerCase().includes('e2')

        if (isEncoreSet) {
          // Check if song appears in this encore set
          const songInEncore = set.song.some(s => 
            s.name.toLowerCase() === normalizedTitle.toLowerCase()
          )
          if (songInEncore) {
            isEncore = true
          }
        }
      }

      if (isOpener) openerShows.push(showRef)
      if (isCloser) closerShows.push(showRef)
      if (isEncore) encoreShows.push(showRef)
    }

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
