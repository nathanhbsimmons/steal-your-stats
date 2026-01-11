import { NextResponse } from 'next/server'
import { songIndexer } from '@/lib/indexer'

export async function POST() {
  try {
    console.log('Starting index rebuild...')
    
    // Rebuild the index with real data from setlist.fm
    const stats = await songIndexer.rebuild()
    
    console.log('Index rebuild completed:', stats)
    
    return NextResponse.json({
      success: true,
      message: 'Index rebuilt successfully',
      stats
    })
  } catch (error) {
    console.error('Error rebuilding index:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to rebuild index',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const stats = songIndexer.getStats()
    return NextResponse.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('Error getting index stats:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get index stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
