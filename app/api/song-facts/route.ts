import { NextRequest, NextResponse } from 'next/server'
import { getGratefulDeadSongFacts } from '@/lib/songFacts'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const songTitle = searchParams.get('songTitle')
    
    if (!songTitle) {
      return NextResponse.json({ error: 'songTitle parameter is required' }, { status: 400 })
    }

    const facts = await getGratefulDeadSongFacts(songTitle)
    return NextResponse.json(facts)
  } catch (error) {
    console.error('Error in song-facts API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

