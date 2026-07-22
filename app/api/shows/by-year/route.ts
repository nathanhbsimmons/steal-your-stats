import { NextRequest, NextResponse } from 'next/server'
import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const yearStr = searchParams.get('year')
  const year = yearStr ? parseInt(yearStr) : NaN

  if (isNaN(year) || year < 1965 || year > 1995) {
    return NextResponse.json({ shows: [], total: 0 })
  }

  try {
    const shows = await realtimeSongFactsService.getShowsWithSongsForYear(year)

    return NextResponse.json(
      { shows, total: shows.length, year },
      { headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=21600' } }
    )
  } catch {
    return NextResponse.json({ shows: [], total: 0 })
  }
}
