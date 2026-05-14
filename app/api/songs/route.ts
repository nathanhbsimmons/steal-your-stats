import { NextRequest, NextResponse } from 'next/server'
import { getSongCatalog } from '@/lib/ids'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').toLowerCase().trim()

  let songs = getSongCatalog()
  if (q) {
    songs = songs.filter(s =>
      s.title.includes(q) || s.aliases.some(a => a.toLowerCase().includes(q))
    )
  }

  return NextResponse.json({ songs, total: songs.length })
}
