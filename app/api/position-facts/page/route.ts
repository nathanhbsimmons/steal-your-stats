import { NextRequest, NextResponse } from 'next/server'
import { getGratefulDeadPositionFacts } from '@/lib/songFacts'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const songTitle = searchParams.get('songTitle')
    const positionType = searchParams.get('positionType') // 'opener', 'closer', 'encore'
    
    if (!songTitle) {
      return NextResponse.json({ error: 'songTitle parameter is required' }, { status: 400 })
    }

    if (!positionType) {
      return NextResponse.json({ error: 'positionType parameter is required' }, { status: 400 })
    }

    const facts = await getGratefulDeadPositionFacts(songTitle)
    
    // Filter by position type
    const filteredFacts = {
      ...facts,
      [positionType]: facts[positionType as keyof typeof facts]
    }
    
    return NextResponse.json(filteredFacts)
  } catch (error) {
    console.error('Error in position-facts page API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

