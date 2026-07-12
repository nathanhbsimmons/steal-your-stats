import { NextRequest, NextResponse } from 'next/server'
import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const venue = searchParams.get('venue')
  if (!venue) return NextResponse.json({ error: 'venue param required' }, { status: 400 })

  try {
    const songs = await realtimeSongFactsService.getTopSongsByVenue(venue)
    return NextResponse.json({ songs }, {
      headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=21600' },
    })
  } catch (error) {
    console.error('Error fetching venue songs:', error)
    return NextResponse.json({ error: 'Failed to fetch venue songs' }, { status: 500 })
  }
}
