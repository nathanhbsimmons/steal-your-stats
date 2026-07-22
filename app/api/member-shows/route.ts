import { NextRequest, NextResponse } from 'next/server'
import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'

const PER_PAGE = 20

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const year = parseInt(searchParams.get('year') || '0')
  const page = parseInt(searchParams.get('page') || '1')

  if (!year) return NextResponse.json({ error: 'year required' }, { status: 400 })

  const result = await realtimeSongFactsService.getShowsByYearRange(year, year, page, PER_PAGE)

  return NextResponse.json(
    {
      shows: result.shows,
      total: result.total,
      page,
      itemsPerPage: PER_PAGE,
    },
    { headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=21600' } }
  )
}
