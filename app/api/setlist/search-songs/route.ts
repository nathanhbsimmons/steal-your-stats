import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    const { env } = await import('@/lib/env')
    const apiKey = env.SETLISTFM_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const response = await fetch(
      `https://api.setlist.fm/rest/1.0/search/setlists?p=1&songName=${encodeURIComponent(query)}&artistMbid=6faa7ca7-0d99-4a5e-bfa6-1fd5037520c6`,
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
    
    // Extract unique songs from the setlists
    const songs = new Map()
    
    for (const setlist of data.setlist || []) {
      for (const set of setlist.sets.set) {
        for (const song of set.song) {
          if (song.name.toLowerCase().includes(query.toLowerCase())) {
            songs.set(song.name, {
              id: `${setlist.id}-${song.name}`,
              name: song.name,
              artist: {
                id: '6faa7ca7-0d99-4a5e-bfa6-1fd5037520c6',
                name: 'Grateful Dead'
              }
            })
          }
        }
      }
    }

    return NextResponse.json(Array.from(songs.values()), {
      headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=21600' },
    })
  } catch (error) {
    console.error('Error in search-songs API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

