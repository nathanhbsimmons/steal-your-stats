import { cache } from 'react'
import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'
import type { FirstLastFacts, PositionFacts, VersionsFacts, ShowRef } from '@/lib/services/realtime-song-facts'

export interface SongPageData {
  facts: FirstLastFacts
  positions: PositionFacts
  versions: VersionsFacts
  timeline: { performances: ShowRef[]; songTitle: string }
}

export const getSongPageData = cache(async function getSongPageData(songTitle: string): Promise<SongPageData> {
  const [facts, positions, versions, timeline] = await Promise.all([
    realtimeSongFactsService.getFirstLast(songTitle).catch(() => ({
      first: null, last: null, totalPerformances: 0, songTitle, aliases: [],
    })),
    realtimeSongFactsService.getPositions(songTitle).catch(() => ({
      opener: { count: 0, shows: [] },
      closer: { count: 0, shows: [] },
      encore: { count: 0, shows: [] },
      set1Closer: { count: 0, shows: [] },
      set2Opener: { count: 0, shows: [] },
      songTitle, aliases: [],
    })),
    realtimeSongFactsService.getVersions(songTitle).catch(() => ({ tracks: [], songTitle })),
    realtimeSongFactsService.getAllPerformances(songTitle).catch(() => ({ performances: [], songTitle })),
  ])

  return { facts, positions, versions, timeline }
})
