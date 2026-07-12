import { NextRequest, NextResponse } from 'next/server'
import { getGratefulDeadPositionPage } from '@/lib/songFacts'
import { songIndexer } from '@/lib/indexer'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const songTitle = searchParams.get('songTitle')
    const positionType = searchParams.get('positionType') // 'opener', 'closer', 'encore'
    const page = searchParams.get('page')
    const pageSize = searchParams.get('pageSize')
    
    if (!songTitle) {
      return NextResponse.json({ error: 'songTitle parameter is required' }, { status: 400 })
    }

    if (!positionType) {
      return NextResponse.json({ error: 'positionType parameter is required' }, { status: 400 })
    }

    // Initialize with sample data if not already done
    await songIndexer.initializeWithSampleData()
    
    // Get song by title to get the song ID
    const repository = songIndexer.getRepository()
    const song = await repository.getSongByTitle(songTitle)
    
    if (!song) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 })
    }

    // Get paginated position data
    const result = await getGratefulDeadPositionPage({
      songId: song.id,
      positionType: positionType as 'opener' | 'closer' | 'encore',
      cursor: page || undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20
    })
    
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=21600' },
    })
  } catch (error) {
    console.error('Error in position-facts page API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

