import { NextRequest, NextResponse } from 'next/server'
import { getGratefulDeadPositionFactsPage } from '@/lib/songFacts'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const songTitle = searchParams.get('songTitle')
    const page = searchParams.get('page') || '1'
    const positionType = searchParams.get('positionType') // 'opener', 'closer', 'encore'
    
    if (!songTitle) {
      return NextResponse.json({ error: 'songTitle parameter is required' }, { status: 400 })
    }

    if (!positionType) {
      return NextResponse.json({ error: 'positionType parameter is required' }, { status: 400 })
    }

    const pageNumber = parseInt(page, 10)
    if (isNaN(pageNumber) || pageNumber < 1) {
      return NextResponse.json({ error: 'page must be a positive integer' }, { status: 400 })
    }

    const facts = await getGratefulDeadPositionFactsPage(songTitle, positionType as 'opener' | 'closer' | 'encore', pageNumber)
    return NextResponse.json(facts)
  } catch (error) {
    console.error('Error in position-facts page API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

