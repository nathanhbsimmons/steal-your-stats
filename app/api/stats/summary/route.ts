import { NextResponse } from 'next/server'
import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'

export async function GET() {
  try {
    const stats = await realtimeSongFactsService.getSummaryStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching summary stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
