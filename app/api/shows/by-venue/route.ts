import { NextRequest, NextResponse } from 'next/server'
import { SetlistClientImpl, Setlist } from '@/lib/clients/setlist'

function fromSetlistDate(d: string): string {
  const parts = d.split('-')
  if (parts.length === 3 && parts[2].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`
  return d
}

function setlistToResult(s: Setlist) {
  return {
    date: fromSetlistDate(s.eventDate),
    venue: s.venue.name,
    city: s.venue.city.name,
    state: s.venue.city.state,
    country: s.venue.city.country.name,
    songs: s.sets.set.flatMap(set => set.song.map(song => song.name)).filter(Boolean),
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const name = (searchParams.get('name') || '').trim()

  if (!name) return NextResponse.json({ shows: [], total: 0 })

  try {
    const client = new SetlistClientImpl()
    const setlists = await client.searchSetlistsByVenue(name)
    const shows = setlists
      .map(setlistToResult)
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json(
      { shows, total: shows.length, venue: name },
      { headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=21600' } }
    )
  } catch {
    return NextResponse.json({ shows: [], total: 0 })
  }
}
