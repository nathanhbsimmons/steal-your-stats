import { NextRequest, NextResponse } from 'next/server'
import { getSongCatalog } from '@/lib/ids'
import { getSongHints } from '@/lib/setlist-builder'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').toLowerCase().trim()

  let songs = getSongCatalog()
  if (q) {
    songs = songs.filter(s =>
      s.title.includes(q) || s.aliases.some(a => a.toLowerCase().includes(q))
    )
  }

  const withHints = songs.map(s => ({
    ...s,
    hints: getSongHints(s.title),
  }))

  return NextResponse.json({ songs: withHints, total: withHints.length })
}
