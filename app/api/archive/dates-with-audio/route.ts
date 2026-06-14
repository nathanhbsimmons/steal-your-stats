import { NextRequest, NextResponse } from 'next/server'

const USER_AGENT = 'StealYourStats/1.0 (contact: you@example.com)'

// Regex to pull a YYYY-MM-DD date out of a GD Archive.org identifier.
// Handles both 4-digit (gd1977-05-08) and 2-digit (gd77-05-08) year prefixes.
const ID_DATE_RE = /^gd(?:19)?(\d{2})-(\d{2})-(\d{2})/

function identifierToDate(identifier: string): string | null {
  const m = identifier.match(ID_DATE_RE)
  if (!m) return null
  return `19${m[1]}-${m[2]}-${m[3]}`
}

export async function GET(request: NextRequest) {
  const year = request.nextUrl.searchParams.get('year')
  if (!year || !/^\d{4}$/.test(year)) {
    return NextResponse.json({ error: 'year required (YYYY)' }, { status: 400 })
  }

  const shortYear = year.slice(2) // "1977" → "77"
  // One search covers all recordings for the year — both identifier formats
  const q = `(identifier:gd${year}-* OR identifier:gd${shortYear}-*) AND collection:GratefulDead AND mediatype:etree`
  const params = new URLSearchParams({ q, output: 'json', rows: '500', fl: 'identifier' })

  try {
    const res = await fetch(
      `https://archive.org/advancedsearch.php?${params.toString()}`,
      {
        headers: { 'User-Agent': USER_AGENT },
        // Cache for 24 h in Next.js data cache — no per-request re-fetch
        next: { revalidate: 86400 },
      }
    )
    if (!res.ok) return NextResponse.json({ dates: [] })

    const data = await res.json()
    const docs: Array<{ identifier: string }> = data?.response?.docs ?? []

    const dates = new Set<string>()
    for (const doc of docs) {
      const d = identifierToDate(doc.identifier ?? '')
      if (d) dates.add(d)
    }

    return NextResponse.json(
      { dates: [...dates] },
      { headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600' } }
    )
  } catch {
    return NextResponse.json({ dates: [] })
  }
}
