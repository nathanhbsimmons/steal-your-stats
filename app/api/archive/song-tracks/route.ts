import { NextRequest, NextResponse } from 'next/server'
import { ArchiveClientImpl } from '@/lib/clients/archive'
import { resolveSong } from '@/lib/ids'

export async function POST(request: NextRequest) {
  try {
    const { itemId, songTitle } = await request.json()

    if (!itemId || !songTitle) {
      return NextResponse.json(
        { error: 'Item ID and song title are required' },
        { status: 400 }
      )
    }

    const archiveClient = new ArchiveClientImpl()
    const resolution = resolveSong({ title: songTitle })
    
    const tracks = await archiveClient.getSongTracks(
      itemId,
      resolution.normalizedTitle,
      resolution.aliases
    )

    // Convert ArchiveTrack to Track format with proper URLs
    const formattedTracks = tracks.map((track, index) => ({
      id: `${itemId}-${index}`,
      name: track.name,
      url: `https://archive.org/download/${itemId}/${track.name}`,
      duration: track.length ? parseFloat(track.length) : undefined,
      showDate: '', // Will be filled by caller
      venue: '', // Will be filled by caller
      city: '', // Will be filled by caller
      archiveItemId: itemId,
      licenseUrl: '', // Will be filled by caller
      rights: '' // Will be filled by caller
    }))

    return NextResponse.json({ tracks: formattedTracks })
  } catch (error) {
    console.error('Error fetching song tracks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch song tracks' },
      { status: 500 }
    )
  }
}
