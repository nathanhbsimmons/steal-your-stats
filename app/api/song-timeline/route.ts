import { NextRequest, NextResponse } from 'next/server'
import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const songTitle = searchParams.get('songTitle')

  if (!songTitle) {
    return NextResponse.json({ error: 'songTitle parameter is required' }, { status: 400 })
  }

  try {
    const result = await realtimeSongFactsService.getAllPerformances(songTitle)
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=21600' },
    })
  } catch (error) {
    console.error('Error in song-timeline API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
