import { NextRequest, NextResponse } from 'next/server'
import { SITE_URL, INDEXNOW_KEY } from '@/lib/site-config'
import { getSiteEntries } from '@/lib/site-urls'

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

export async function POST(request: NextRequest) {
  const host = new URL(SITE_URL).host
  const keyLocation = `${SITE_URL}/${INDEXNOW_KEY}.txt`

  let urls: string[]
  try {
    const body = await request.json()
    urls = Array.isArray(body?.urls) && body.urls.length > 0 ? body.urls : []
  } catch {
    urls = []
  }

  if (urls.length === 0) {
    const entries = await getSiteEntries()
    urls = entries.map(e => e.url)
  }

  // IndexNow accepts a max of 10,000 URLs per submission.
  urls = urls.slice(0, 10000)

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation, urlList: urls }),
  })

  return NextResponse.json(
    { submitted: urls.length, indexNowStatus: response.status },
    { status: response.ok ? 200 : 502 }
  )
}
