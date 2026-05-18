import { NextRequest, NextResponse } from 'next/server'
import { getSongCatalog } from '@/lib/ids'
import { getSongHints } from '@/lib/setlist-builder'
import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').toLowerCase().trim()

  let songs = getSongCatalog()
  if (q) {
    songs = songs.filter(s =>
      s.title.includes(q) || s.aliases.some(a => a.toLowerCase().includes(q))
    )
  }

  const withHints = await Promise.all(songs.map(async s => {
    const hints = getSongHints(s.title)
    try {
      hints.topSuccessors = await realtimeSongFactsService.getSongPairings(s.title, 3)
    } catch {
      // setlist cache not ready — static hints still shown
    }
    return { ...s, hints }
  }))

  return NextResponse.json({ songs: withHints, total: withHints.length })
}
