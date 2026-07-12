import { NextRequest, NextResponse } from 'next/server'
import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const yearFrom = parseInt(searchParams.get('yearFrom') || '1965')
  const yearTo = parseInt(searchParams.get('yearTo') || '1995')
  const page = parseInt(searchParams.get('page') || '1')
  const perPage = parseInt(searchParams.get('perPage') || '25')
  const topSongs = searchParams.get('topSongs') === '1'

  if (isNaN(yearFrom) || isNaN(yearTo) || yearFrom > yearTo) {
    return NextResponse.json({ error: 'Invalid year range' }, { status: 400 })
  }

  try {
    const cacheHeaders = { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=21600' }
    if (topSongs) {
      const songs = await realtimeSongFactsService.getTopSongsByYearRange(yearFrom, yearTo, 20)
      return NextResponse.json({ songs }, { headers: cacheHeaders })
    }
    const result = await realtimeSongFactsService.getShowsByYearRange(yearFrom, yearTo, page, perPage)
    return NextResponse.json(result, { headers: cacheHeaders })
  } catch (err) {
    console.error('Error in /api/shows:', err)
    return NextResponse.json({ error: 'Failed to fetch shows' }, { status: 500 })
  }
}
