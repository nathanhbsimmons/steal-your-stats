import { NextRequest, NextResponse } from 'next/server'
import { ArchiveClientImpl } from '@/lib/clients/archive'
import { resolveSong } from '@/lib/ids'

export async function POST(request: NextRequest) {
  try {
    const { itemId, songTitle } = await request.json()

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      )
    }

    const archiveClient = new ArchiveClientImpl()
    
    let tracks
    if (songTitle && songTitle.trim()) {
      // Search for specific song
      const resolution = resolveSong({ title: songTitle })
      tracks = await archiveClient.getSongTracks(
        itemId,
        resolution.normalizedTitle,
        resolution.aliases
      )
    } else {
      // Get all tracks from the show
      tracks = await archiveClient.getAllTracks(itemId)
    }

    // Convert ArchiveTrack to Track format with proper URLs
    const formattedTracks = tracks.map((track, index) => {
      // Create a unique ID by combining itemId, track name, and index
      const uniqueId = `${itemId}-${track.name.replace(/[^a-zA-Z0-9]/g, '_')}-${index}`
      
      return {
        id: uniqueId,
        name: track.name,
        url: `https://archive.org/download/${itemId}/${track.name}`,
        duration: track.length ? parseFloat(track.length) : undefined,
        showDate: '', // Will be filled by caller
        venue: '', // Will be filled by caller
        city: '', // Will be filled by caller
        archiveItemId: itemId,
        licenseUrl: '', // Will be filled by caller
        rights: '' // Will be filled by caller
      }
    })

    return NextResponse.json({ tracks: formattedTracks })
  } catch (error) {
    console.error('Error fetching song tracks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch song tracks' },
      { status: 500 }
    )
  }
}
