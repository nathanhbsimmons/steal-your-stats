#!/usr/bin/env node
// Refreshes .cache/gd-setlists.json from setlist.fm — the same disk cache
// lib/services/realtime-song-facts.ts reads at runtime. Serverless deploys
// can't reliably self-heal this file (see git history), so it's kept fresh
// by re-running this script on a schedule and committing the result.
//
// Usage:
//   SETLISTFM_API_KEY=xxx node scripts/refresh-setlists.js

'use strict'

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const OUT_PATH = path.join(ROOT, '.cache', 'gd-setlists.json')
const GRATEFUL_DEAD_MBID = '6faa7ca7-0d99-4a5e-bfa6-1fd5037520c6'
const RATE_LIMIT_DELAY = 800

const apiKey = process.env.SETLISTFM_API_KEY
if (!apiKey) {
  console.error('SETLISTFM_API_KEY is required')
  process.exit(1)
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function fetchPage(page, attempt = 1) {
  const res = await fetch(`https://api.setlist.fm/rest/1.0/artist/${GRATEFUL_DEAD_MBID}/setlists?p=${page}`, {
    headers: { Accept: 'application/json', 'x-api-key': apiKey },
  })
  if (res.status === 429) {
    if (attempt > 4) throw new Error(`Rate limited on page ${page} after ${attempt} attempts`)
    const backoff = 10_000 * attempt
    console.warn(`  Rate limited on page ${page}, waiting ${backoff}ms...`)
    await sleep(backoff)
    return fetchPage(page, attempt + 1)
  }
  if (!res.ok) throw new Error(`setlist.fm request failed: ${res.status} ${res.statusText} (page ${page})`)
  const data = await res.json()
  return { setlists: data.setlist || [], total: data.total || 0, itemsPerPage: data.itemsPerPage || 20 }
}

async function main() {
  console.log('Fetching page 1...')
  const page1 = await fetchPage(1)
  const totalPages = page1.total > 0 ? Math.ceil(page1.total / page1.itemsPerPage) : 120
  console.log(`  ${page1.total} total setlists across ${totalPages} pages`)

  const all = [...page1.setlists]
  for (let page = 2; page <= totalPages; page++) {
    await sleep(RATE_LIMIT_DELAY)
    console.log(`Fetching page ${page}/${totalPages}...`)
    const result = await fetchPage(page)
    all.push(...result.setlists)
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
  fs.writeFileSync(OUT_PATH, JSON.stringify({ setlists: all, cachedAt: Date.now() }))
  console.log(`Saved ${all.length} setlists to ${path.relative(ROOT, OUT_PATH)}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
