import { createHash } from 'crypto'
import type { ArchiveTrack } from '@/lib/clients/archive'
import { parseArchiveDuration, formatArchiveTrackName } from '@/lib/utils'
import type { ArchiveTrackPayload } from '@/lib/show-of-the-day-types'

// Ids are deterministic (no time/random salt) so cached payloads stay stable.
export function formatArchiveTracks(itemId: string, tracks: ArchiveTrack[]): ArchiveTrackPayload[] {
  return tracks.map((track, index) => {
    const trackHash = createHash('md5')
      .update(`${itemId}-${track.name}-${index}`)
      .digest('hex')
      .substring(0, 8)
    const uniqueId = `${itemId}-${track.name.replace(/[^a-zA-Z0-9]/g, '_')}-${index}-${trackHash}`

    return {
      id: uniqueId,
      name: track.name,
      // Some Archive.org recordings have no per-track ID3 title tag — fall
      // back to the filename so downstream title-matching still works.
      title: track.title || formatArchiveTrackName(track.name.replace(/\.mp3$/i, '')),
      url: `https://archive.org/download/${itemId}/${track.name}`,
      duration: track.length ? parseArchiveDuration(track.length) : undefined,
      archiveItemId: itemId,
    }
  })
}
