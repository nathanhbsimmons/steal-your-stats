import { NextRequest, NextResponse } from 'next/server'
import { SetlistClientImpl } from '@/lib/clients/setlist'

interface ShowDetail {
  date: string       // YYYY-MM-DD
  venue: string
  city: string
  state?: string
  country: string
  sets: {
    name: string
    encore: boolean
    songs: string[]
    segues: boolean[]
  }[]
  setlistUrl?: string
  totalSongs: number
}

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

// Module-level cache: key = YYYY-MM-DD, 24h TTL
const showCache = new Map<string, { show: ShowDetail | null; expiresAt: number }>()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')  // YYYY-MM-DD

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date param required (YYYY-MM-DD)' }, { status: 400 })
  }

  const cached = showCache.get(date)
  if (cached && cached.expiresAt > Date.now()) {
    if (!cached.show) return NextResponse.json({ error: 'Show not found' }, { status: 404 })
    return NextResponse.json(cached.show)
  }

  const client = new SetlistClientImpl()
  const setlistDate = toSetlistDate(date)  // DD-MM-YYYY for setlist.fm
  const setlists = await client.getSetlistsByDate(setlistDate)

  if (setlists.length === 0) {
    showCache.set(date, { show: null, expiresAt: Date.now() + 24 * 60 * 60 * 1000 })
    return NextResponse.json({ error: 'Show not found' }, { status: 404 })
  }

  // Pick the first result (GD usually played one show per day)
  const setlist = setlists[0]

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

  const show: ShowDetail = {
    date: fromSetlistDate(setlist.eventDate),
    venue: setlist.venue.name,
    city: setlist.venue.city.name,
    state: setlist.venue.city.state,
    country: setlist.venue.city.country.name,
    sets,
    setlistUrl: setlist.url,
    totalSongs,
  }

  showCache.set(date, { show, expiresAt: Date.now() + 24 * 60 * 60 * 1000 })
  return NextResponse.json(show)
}
