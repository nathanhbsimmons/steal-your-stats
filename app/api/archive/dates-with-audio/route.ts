import { NextRequest, NextResponse } from 'next/server'
import { getDatesWithAudioForYear } from '@/lib/clients/archive-dates'

export async function GET(request: NextRequest) {
  const year = request.nextUrl.searchParams.get('year')
  if (!year || !/^\d{4}$/.test(year)) {
    return NextResponse.json({ error: 'year required (YYYY)' }, { status: 400 })
  }

  const dates = await getDatesWithAudioForYear(year)

  return NextResponse.json(
    { dates },
    { headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600' } }
  )
}
