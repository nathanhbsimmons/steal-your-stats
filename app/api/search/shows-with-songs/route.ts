import { NextRequest, NextResponse } from 'next/server'
import { SetlistClientImpl, Setlist } from '@/lib/clients/setlist'

function fromSetlistDate(d: string): string {
  const parts = d.split('-')
  if (parts.length === 3 && parts[2].length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`
  return d
}

interface ShowResult {
  date: string       // YYYY-MM-DD
  venue: string
  city: string
  state?: string
  country: string
  songs: string[]
  setlistUrl?: string
}

function setlistToResult(s: Setlist): ShowResult {
  const allSongs: string[] = []
  for (const set of s.sets.set) {
    for (const song of set.song) {
      if (song.name) allSongs.push(song.name)
    }
  }
  return {
    date: fromSetlistDate(s.eventDate),
    venue: s.venue.name,
    city: s.venue.city.name,
    state: s.venue.city.state,
    country: s.venue.city.country.name,
    songs: allSongs,
    setlistUrl: s.url,
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const songsParam = searchParams.getAll('songs[]')

  if (songsParam.length === 0) {
    return NextResponse.json({ error: 'Provide at least one songs[] param' }, { status: 400 })
  }

  const client = new SetlistClientImpl()

  if (songsParam.length === 1) {
    // Single song: return all shows containing it (up to 5 pages)
    const results: ShowResult[] = []
    for (let page = 1; page <= 5; page++) {
      const setlists = await client.searchSetlistsBySong(songsParam[0], page)
      if (setlists.length === 0) break
      results.push(...setlists.map(setlistToResult))
      await new Promise(r => setTimeout(r, 200))
    }
    results.sort((a, b) => a.date.localeCompare(b.date))
    return NextResponse.json({ shows: results, query: songsParam })
  }

  // Two songs: fetch each and intersect by show date
  const [sets1, sets2] = await Promise.all([
    (async () => {
      const all: Setlist[] = []
      for (let p = 1; p <= 5; p++) {
        const page = await client.searchSetlistsBySong(songsParam[0], p)
        if (page.length === 0) break
        all.push(...page)
        await new Promise(r => setTimeout(r, 200))
      }
      return all
    })(),
    (async () => {
      const all: Setlist[] = []
      for (let p = 1; p <= 5; p++) {
        const page = await client.searchSetlistsBySong(songsParam[1], p)
        if (page.length === 0) break
        all.push(...page)
        await new Promise(r => setTimeout(r, 200))
      }
      return all
    })(),
  ])

  const dates1 = new Set(sets1.map(s => s.eventDate))
  const intersection = sets2.filter(s => dates1.has(s.eventDate))

  const results = intersection.map(setlistToResult)
  results.sort((a, b) => a.date.localeCompare(b.date))

  return NextResponse.json({ shows: results, query: songsParam })
}
