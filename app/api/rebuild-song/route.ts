import { NextRequest, NextResponse } from 'next/server'
import { songIndexer } from '@/lib/indexer'
import { setlistClientImpl } from '@/lib/clients/setlist'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const songTitle = searchParams.get('songTitle')
    
    if (!songTitle) {
      return NextResponse.json({ error: 'songTitle parameter is required' }, { status: 400 })
    }

    console.log(`Starting targeted rebuild for song: ${songTitle}`)
    
    const setlistClient = setlistClientImpl
    let totalShows = 0
    let page = 1
    const maxPages = 10 // Limit to avoid too many API calls
    
    // Fetch setlists containing this song
    while (page <= maxPages) {
      try {
        console.log(`Fetching page ${page} for ${songTitle}...`)
        
        const setlists = await setlistClient.searchSetlistsBySong(songTitle, page)
        
        if (setlists.length === 0) {
          console.log(`No more setlists found on page ${page}`)
          break
        }
        
        console.log(`Found ${setlists.length} setlists on page ${page}`)
        
        // Process each setlist
        for (const setlist of setlists) {
          await songIndexer.upsertShow(setlist.id, setlist)
          totalShows++
        }
        
        // Rate limiting: wait 1 second between pages
        if (page < maxPages) {
          console.log(`Waiting 1 second before next page...`)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
        page++
        
      } catch (pageError: unknown) {
        const error = pageError as Error
        console.log(`Error on page ${page}:`, error.message)
        if (error.message.includes('429')) {
          console.log('Rate limited, waiting 5 seconds...')
          await new Promise(resolve => setTimeout(resolve, 5000))
        }
        break
      }
    }
    
    const stats = songIndexer.getStats()
    
    console.log(`Targeted rebuild completed for ${songTitle}: ${totalShows} shows processed`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully rebuilt data for ${songTitle}`,
      showsProcessed: totalShows,
      stats
    })
  } catch (error) {
    console.error('Error in targeted rebuild:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to rebuild song data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
