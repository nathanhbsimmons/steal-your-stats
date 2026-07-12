import { NextResponse } from 'next/server'
import { showOfTheDayService } from '@/lib/services/show-of-the-day'

export async function GET() {
  try {
    const payload = await showOfTheDayService.get()
    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
    })
  } catch (error) {
    console.error('Error building show of the day:', error)
    return NextResponse.json({ error: 'show of the day unavailable' }, { status: 503 })
  }
}
