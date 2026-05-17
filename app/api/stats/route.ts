import { NextResponse } from 'next/server'
import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'

export async function GET() {
  try {
    const stats = await realtimeSongFactsService.getGlobalStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching global stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
