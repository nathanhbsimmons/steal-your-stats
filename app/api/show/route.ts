import { NextRequest, NextResponse } from 'next/server'
import { fetchShowDetail } from '@/lib/services/show-detail'
import type { ShowDetail } from '@/lib/show-of-the-day-types'

// Module-level cache: key = YYYY-MM-DD, 24h TTL
const showCache = new Map<string, { show: ShowDetail | null; expiresAt: number }>()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')  // YYYY-MM-DD

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date param required (YYYY-MM-DD)' }, { status: 400 })
  }

  const cached = showCache.get(date)
  if (cached && cached.expiresAt > Date.now()) {
    if (!cached.show) return NextResponse.json({ error: 'Show not found' }, { status: 404 })
    return NextResponse.json(cached.show)
  }

  const show = await fetchShowDetail(date)
  showCache.set(date, { show, expiresAt: Date.now() + 24 * 60 * 60 * 1000 })

  if (!show) return NextResponse.json({ error: 'Show not found' }, { status: 404 })
  return NextResponse.json(show)
}
