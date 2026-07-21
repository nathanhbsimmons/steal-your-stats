import { cache } from 'react'
import { setlistClientImpl, type Setlist } from '@/lib/clients/setlist'
import type { ShowDetail } from '@/lib/show-of-the-day-types'

function fromSetlistDate(d: string): string {
  const parts = d.split('-')
  if (parts.length === 3 && parts[2].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`
  return d
}

function toSetlistDate(d: string): string {
  const parts = d.split('-')
  if (parts.length === 3 && parts[0].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`
  return d
}

export function mapSetlistToShowDetail(setlist: Setlist): ShowDetail {
  const sets = setlist.sets.set.map((set, i) => {
    const filteredSongs = set.song.filter(s => s.name)
    return {
      name: set.name || (set.encore ? 'Encore' : `Set ${i + 1}`),
      encore: !!set.encore,
      songs: filteredSongs.map(s => s.name),
      // setlist.fm uses info ending with '>' to indicate a segue into the next song
      segues: filteredSongs.map(s => !!s.info?.trim().endsWith('>')),
    }
  })

  const totalSongs = sets.reduce((sum, s) => sum + s.songs.length, 0)

  return {
    date: fromSetlistDate(setlist.eventDate),
    venue: setlist.venue.name,
    city: setlist.venue.city.name,
    state: setlist.venue.city.state,
    country: setlist.venue.city.country.name,
    sets,
    setlistUrl: setlist.url,
    totalSongs,
  }
}

// Live fallback — only hit when the date isn't in the cached full-catalog
// setlist dump (lib/services/realtime-song-facts.ts getSetlistForDate).
export const fetchShowDetail = cache(async function fetchShowDetail(date: string): Promise<ShowDetail | null> {
  const setlists = await setlistClientImpl.getSetlistsByDate(toSetlistDate(date))

  if (setlists.length === 0) return null

  // Pick the first result (GD usually played one show per day)
  return mapSetlistToShowDetail(setlists[0])
})
