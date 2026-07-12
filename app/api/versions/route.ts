import { NextRequest, NextResponse } from 'next/server'
import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const songTitle = searchParams.get('songTitle')

    if (!songTitle) {
      return NextResponse.json(
        { error: 'Song title is required' },
        { status: 400 }
      )
    }

    console.log(`Fetching real-time versions for: ${songTitle}`)
    
    // Get versions from real-time service
    const versionsFacts = await realtimeSongFactsService.getVersions(songTitle)
    
    return NextResponse.json(
      {
        tracks: versionsFacts.tracks,
        extremes: versionsFacts.extremes,
        songTitle: versionsFacts.songTitle
      },
      { headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=21600' } }
    )
  } catch (error) {
    console.error('Error fetching versions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    )
  }
}
