import { NextRequest, NextResponse } from 'next/server'
import { SetlistClientImpl } from '@/lib/clients/setlist'

function setlistDateToISO(ddmmyyyy: string): string {
  const [dd, mm, yyyy] = ddmmyyyy.split('-')
  return `${yyyy}-${mm}-${dd}`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const year = parseInt(searchParams.get('year') || '0')
  const page = parseInt(searchParams.get('page') || '1')

  if (!year) return NextResponse.json({ error: 'year required' }, { status: 400 })

  const client = new SetlistClientImpl()
  const result = await client.searchSetlistsByYear(year, page)

  const shows = result.setlists
    .map(s => ({
      date: setlistDateToISO(s.eventDate),
      venue: s.venue.name,
      city: s.venue.city.name,
      state: s.venue.city.state,
      country: s.venue.city.country.name,
      songCount: s.sets.set.reduce((n, set) => n + set.song.length, 0),
      url: s.url,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return NextResponse.json({
    shows,
    total: result.total,
    page,
    itemsPerPage: result.itemsPerPage,
  })
}
