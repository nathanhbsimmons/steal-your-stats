import { NextRequest, NextResponse } from 'next/server'
import { setlistClientImpl, mapSetlistsToMemberShows } from '@/lib/clients/setlist'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const year = parseInt(searchParams.get('year') || '0')
  const page = parseInt(searchParams.get('page') || '1')

  if (!year) return NextResponse.json({ error: 'year required' }, { status: 400 })

  const client = setlistClientImpl
  const result = await client.searchSetlistsByYear(year, page)
  const shows = mapSetlistsToMemberShows(result.setlists)

  return NextResponse.json(
    {
      shows,
      total: result.total,
      page,
      itemsPerPage: result.itemsPerPage,
    },
    { headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=21600' } }
  )
}
