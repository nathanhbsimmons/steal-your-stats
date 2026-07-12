import { NextResponse } from 'next/server'
import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'

export const revalidate = 86400

export async function GET() {
  try {
    const venues = await realtimeSongFactsService.getVenueStats()
    return NextResponse.json({ venues, total: venues.length })
  } catch (error) {
    console.error('Error fetching venue stats:', error)
    return NextResponse.json({ error: 'Failed to fetch venues' }, { status: 500 })
  }
}
