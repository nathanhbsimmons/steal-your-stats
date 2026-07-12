import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const songName = searchParams.get('songName')
    const page = searchParams.get('page') || '1'
    
    if (!songName) {
      return NextResponse.json({ error: 'songName parameter is required' }, { status: 400 })
    }

    const { env } = await import('@/lib/env')
    const apiKey = env.SETLISTFM_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const response = await fetch(
      `https://api.setlist.fm/rest/1.0/search/setlists?p=${page}&songName=${encodeURIComponent(songName)}&artistMbid=6faa7ca7-0d99-4a5e-bfa6-1fd5037520c6`,
      {
        headers: {
          'x-api-key': apiKey,
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: `API request failed: ${response.status} ${response.statusText}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data.setlist || [], {
      headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=21600' },
    })
  } catch (error) {
    console.error('Error in search-setlists API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

