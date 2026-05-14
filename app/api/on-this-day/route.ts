import { NextResponse } from 'next/server'
import { SetlistClientImpl } from '@/lib/clients/setlist'
import { fromSetlistDate } from '@/lib/utils'

interface ShowOnThisDay {
  date: string        // YYYY-MM-DD
  year: number
  venue: string
  city: string
  state?: string
  country: string
  songs: string[]
  setlistUrl?: string
}

// Module-level cache: key = "MM-DD", value = { shows, expiresAt }
const dayCache = new Map<string, { shows: ShowOnThisDay[]; expiresAt: number }>()

function extractSongs(setlist: { sets: { set: Array<{ song: Array<{ name: string }> }> } }): string[] {
  const songs: string[] = []
  for (const set of setlist.sets.set) {
    for (const song of set.song) {
      if (song.name) songs.push(song.name)
    }
  }
  return songs
}

export async function GET() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const cacheKey = `${month}-${day}`

  const cached = dayCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ shows: cached.shows, date: `${now.getFullYear()}-${month}-${day}` })
  }

  const client = new SetlistClientImpl()
  const shows: ShowOnThisDay[] = []

  // Fetch years 1965–1995 in small batches to respect rate limits
  const years = Array.from({ length: 31 }, (_, i) => 1965 + i)
  const batchSize = 5
  for (let i = 0; i < years.length; i += batchSize) {
    const batch = years.slice(i, i + batchSize)
    const results = await Promise.all(
      batch.map(year =>
        client.getSetlistsByDate(`${day}-${month}-${year}`)
      )
    )
    for (const setlists of results) {
      for (const setlist of setlists) {
        const isoDate = fromSetlistDate(setlist.eventDate)
        shows.push({
          date: isoDate,
          year: parseInt(isoDate.split('-')[0]),
          venue: setlist.venue.name,
          city: setlist.venue.city.name,
          state: setlist.venue.city.state,
          country: setlist.venue.city.country.name,
          songs: extractSongs(setlist),
          setlistUrl: setlist.url,
        })
      }
    }
    // Small delay between batches to be nice to the API
    if (i + batchSize < years.length) {
      await new Promise(r => setTimeout(r, 300))
    }
  }

  // Sort by year
  shows.sort((a, b) => a.year - b.year)

  // Cache for 24h
  dayCache.set(cacheKey, { shows, expiresAt: Date.now() + 24 * 60 * 60 * 1000 })

  return NextResponse.json({ shows, date: `${now.getFullYear()}-${month}-${day}` })
}
