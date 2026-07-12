import { NextRequest, NextResponse } from 'next/server'
import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const songTitle = searchParams.get('songTitle')
    
    if (!songTitle) {
      return NextResponse.json({ error: 'songTitle parameter is required' }, { status: 400 })
    }

    console.log(`Fetching real-time song facts for: ${songTitle}`)
    const facts = await realtimeSongFactsService.getFirstLast(songTitle)
    return NextResponse.json(facts, {
      headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=21600' },
    })
  } catch (error) {
    console.error('Error in song-facts API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

