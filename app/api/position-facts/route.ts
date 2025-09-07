import { NextRequest, NextResponse } from 'next/server'
import { getGratefulDeadPositionFacts } from '../../../lib/songFacts'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const songTitle = searchParams.get('songTitle')
    
    console.log(`[DEBUG] Position facts API called with songTitle: ${songTitle}`)
    
    if (!songTitle) {
      return NextResponse.json({ error: 'songTitle parameter is required' }, { status: 400 })
    }

    const facts = await getGratefulDeadPositionFacts(songTitle)
    console.log(`[DEBUG] Position facts result:`, facts)
    return NextResponse.json(facts)
  } catch (error) {
    console.error('Error in position-facts API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

