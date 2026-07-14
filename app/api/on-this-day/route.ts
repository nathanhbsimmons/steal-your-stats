import { NextResponse } from 'next/server'
import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'
import { localDateKey } from '@/lib/services/show-of-the-day'

// Route-level cache keyed by "MM-DD", valid for 24h
const dayCache = new Map<string, { shows: unknown[]; expiresAt: number }>()

export async function GET() {
  const [year, month, day] = localDateKey().split('-')
  const cacheKey = `${month}-${day}`

  const cached = dayCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ shows: cached.shows, date: `${year}-${month}-${day}` })
  }

  const shows = await realtimeSongFactsService.getShowsOnDate(month, day)
  dayCache.set(cacheKey, { shows, expiresAt: Date.now() + 24 * 60 * 60 * 1000 })

  return NextResponse.json({ shows, date: `${year}-${month}-${day}` })
}
