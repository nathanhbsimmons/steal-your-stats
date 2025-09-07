import { songIndexer } from './indexer'


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


/**
 * Get first and last performance facts for a song
 */
export async function getFirstLast(songId: string): Promise<FirstLastFacts> {
  if (!songId) {
    throw new Error('Song ID is required')
  }

  try {
    // Initialize with sample data if not already done
    await songIndexer.initializeWithSampleData()
    
    const repository = songIndexer.getRepository()
    const song = await repository.getSongByTitle(songId)
    
    if (!song) {
      return {
        first: null,
        last: null,
        totalPerformances: 0,
        songTitle: songId,
        aliases: [],
      }
    }

    return {
      first: song.firstPerformance || null,
      last: song.lastPerformance || null,
      totalPerformances: song.totalPerformances,
      songTitle: song.title,
      aliases: song.aliases,
    }

  } catch (error) {
    console.error('Error fetching song facts:', error)
    throw new Error(`Failed to fetch song facts: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get position facts (opener/closer/encore) for a song
 */
export async function getPositions(songId: string): Promise<PositionFacts> {
  if (!songId) {
    throw new Error('Song ID is required')
  }

  try {
    // Initialize with sample data if not already done
    await songIndexer.initializeWithSampleData()
    
    const repository = songIndexer.getRepository()
    const song = await repository.getSongByTitle(songId)
    
    if (!song) {
      return {
        opener: { count: 0, shows: [] },
        closer: { count: 0, shows: [] },
        encore: { count: 0, shows: [] },
        songTitle: songId,
        aliases: [],
      }
    }

    const positionFacts = await repository.getPositions(song.id)
    
    if (!positionFacts) {
      return {
        opener: { count: 0, shows: [] },
        closer: { count: 0, shows: [] },
        encore: { count: 0, shows: [] },
        songTitle: song.title,
        aliases: song.aliases,
      }
    }

    return {
      opener: positionFacts.opener,
      closer: positionFacts.closer,
      encore: positionFacts.encore,
      songTitle: song.title,
      aliases: song.aliases,
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
  return getFirstLast(songTitle)
}

/**
 * Get position facts for Grateful Dead (convenience function)
 */
export async function getGratefulDeadPositionFacts(songTitle: string): Promise<PositionFacts> {
  return getPositions(songTitle)
}

