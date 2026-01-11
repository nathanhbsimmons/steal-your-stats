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
    
    if (versionsFacts.tracks.length === 0) {
      return NextResponse.json({
        tracks: [],
        extremes: undefined,
        songTitle: versionsFacts.songTitle
      })
    }

    // For now, return tracks without duration data to make the API faster
    // Archive.org integration can be added later as an enhancement
    const allTracks = versionsFacts.tracks.map(track => ({
      ...track,
      archiveItemId: undefined,
      durationSec: undefined,
      url: undefined
    }))

    // No extremes data without duration information
    const extremes = undefined

    return NextResponse.json({
      tracks: allTracks,
      extremes,
      songTitle: versionsFacts.songTitle
    })
  } catch (error) {
    console.error('Error fetching versions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    )
  }
}
