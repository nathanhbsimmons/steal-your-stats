#!/usr/bin/env node
// Builds .cache/archive-index.json: a persisted show-date → Archive.org
// recording+tracklist catalog, so the app never has to resolve a show against
// Archive.org live. Mirrors the resolution logic in lib/clients/archive.ts —
// keep in sync if that file's matching/scoring changes.
//
// Usage:
//   node scripts/build-archive-index.js                  # only resolve dates missing from the catalog
//   node scripts/build-archive-index.js --refresh-negatives  # also re-check dates with no recording found, if stale
//   node scripts/build-archive-index.js --refresh-all     # re-resolve every date from scratch
//   node scripts/build-archive-index.js --limit 50        # cap how many dates to process (for a test run)
//   node scripts/build-archive-index.js --concurrency 4   # parallel show lookups (default 4)

'use strict'

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const SETLISTS_PATH = path.join(ROOT, '.cache', 'gd-setlists.json')
const INDEX_PATH = path.join(ROOT, '.cache', 'archive-index.json')
const USER_AGENT = 'StealYourStats/1.0 (contact: you@example.com)'
const NEGATIVE_RETRY_MS = 90 * 24 * 60 * 60 * 1000 // 90 days — "someone found an old tape" window

const args = process.argv.slice(2)
const flag = name => args.includes(`--${name}`)
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`)
  return i === -1 ? def : Number(args[i + 1])
}

const REFRESH_NEGATIVES = flag('refresh-negatives') || flag('refresh-all')
const REFRESH_ALL = flag('refresh-all')
const LIMIT = opt('limit', Infinity)
const CONCURRENCY = opt('concurrency', 4)
const SAVE_EVERY = opt('save-every', 25)

// ---------------------------------------------------------------------------
// Mirrors lib/utils.ts fromSetlistDate
// ---------------------------------------------------------------------------
function fromSetlistDate(setlistDate) {
  const parts = setlistDate.split('-')
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`
  }
  return setlistDate
}

// ---------------------------------------------------------------------------
// Mirrors lib/clients/archive.ts scoring/matching helpers
// ---------------------------------------------------------------------------
function levenshteinDistance(str1, str2) {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + indicator)
    }
  }
  return matrix[str2.length][str1.length]
}

function calculateStringSimilarity(str1, str2) {
  const normalize = str => str.toLowerCase().replace(/^(the|a|an)\s+/i, '').replace(/\s+/g, ' ').trim()
  const norm1 = normalize(str1)
  const norm2 = normalize(str2)
  if (norm1 === norm2) return 1.0
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.9
  const longer = norm1.length > norm2.length ? norm1 : norm2
  const shorter = norm1.length > norm2.length ? norm2 : norm1
  if (longer.length === 0) return 1.0
  return (longer.length - levenshteinDistance(longer, shorter)) / longer.length
}

function calculateMatchScore(show, criteria) {
  let score = 0
  if (criteria.venue && show.venue) score += calculateStringSimilarity(show.venue.toLowerCase(), criteria.venue.toLowerCase()) * 0.6
  if (criteria.city && show.city) score += calculateStringSimilarity(show.city.toLowerCase(), criteria.city.toLowerCase()) * 0.4
  return score
}

function detectRecordingType(identifier, title) {
  const text = `${identifier} ${title ?? ''}`.toLowerCase()
  if (/\b(mtx|matrix)\b/.test(text)) return 'matrix'
  if (/\b(sbd|soundboard)\b/.test(text)) return 'sbd'
  if (/\b(aud|audience)\b/.test(text)) return 'aud'
  return 'unknown'
}

// ---------------------------------------------------------------------------
// Archive.org fetch helpers
// ---------------------------------------------------------------------------
// Retries transient failures (timeouts, rate limiting, network blips) so a
// blip under load doesn't get mistaken for "Archive.org has nothing here" —
// callers must be able to trust that a thrown error means "couldn't find out"
// (safe to retry later), never "confirmed empty" (safe to cache as negative).
async function archiveFetch(pathAndQuery, timeoutMs = 15000, retries = 3) {
  let lastErr
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 500 * 2 ** attempt))
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(`https://archive.org${pathAndQuery}`, {
        headers: { 'User-Agent': USER_AGENT },
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      lastErr = err
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastErr
}

async function listArchiveShowCandidates({ date, venue, city }) {
  const [year, month, day] = date.split('-')
  const shortYear = year.slice(2)
  const queries = [
    `identifier:gd${year}-${month}-${day}* AND collection:GratefulDead`,
    `identifier:gd${shortYear}-${month}-${day}* AND collection:GratefulDead`,
  ]

  const seen = new Set()
  const candidates = []

  for (const q of queries) {
    const searchParams = new URLSearchParams({
      q, output: 'json', rows: '20',
      fl: 'identifier,title,creator,date,venue,city,state,country,downloads',
    })
    // No try/catch here on purpose: archiveFetch already retries transient
    // failures, so if it still throws, that's a real failure — let it
    // propagate so this show is skipped (retried next run) instead of
    // silently caching a false "no recording" negative.
    const data = await archiveFetch(`/advancedsearch.php?${searchParams.toString()}`)
    const docs = data?.response?.docs ?? []
    for (const show of docs) {
      if (seen.has(show.identifier)) continue
      seen.add(show.identifier)
      candidates.push({
        identifier: show.identifier,
        title: show.title,
        recordingType: detectRecordingType(show.identifier, show.title),
        score: calculateMatchScore(show, { venue, city }),
        downloads: show.downloads,
      })
    }
  }

  return candidates.sort((a, b) => b.score - a.score)
}

async function listTracks(identifier) {
  const data = await archiveFetch(`/metadata/${identifier}`, 30000)
  const files = data?.files || []
  return files.filter(f => f.format && ['MP3', 'VBR MP3'].includes(f.format))
}

async function getShowMetadata(identifier) {
  const data = await archiveFetch(`/metadata/${identifier}`, 30000)
  const m = data?.metadata ?? {}
  const asStr = v => (Array.isArray(v) ? v.join('\n') : v ?? '')
  const rawDesc = m.description
  const description = rawDesc ? (Array.isArray(rawDesc) ? rawDesc.join('\n') : rawDesc) : null
  return {
    venue: m.venue ?? '', city: m.city ?? '', state: m.state, country: m.country,
    licenseurl: asStr(m.licenseurl), rights: asStr(m.rights),
    publicdate: m.publicdate ?? '', description,
  }
}

// Picks the recording with best setlist coverage, downloads as tiebreaker —
// mirrors ArchiveClientImpl.selectBestRecording.
async function selectBestRecording(candidates, totalSongs) {
  const top = candidates.slice(0, Math.min(3, candidates.length))
  // No try/catch here either — a candidate whose track listing couldn't be
  // fetched (after archiveFetch's retries) must not be silently scored as
  // "0 tracks", or it can win the ranking and get cached with an empty
  // tracklist. Let the failure propagate so the whole show is retried later.
  const results = await Promise.all(top.map(async c => {
    const tracks = await listTracks(c.identifier)
    return { identifier: c.identifier, tracks, downloads: c.downloads ?? 0 }
  }))
  results.sort((a, b) => {
    const aFull = a.tracks.length >= totalSongs
    const bFull = b.tracks.length >= totalSongs
    if (aFull !== bFull) return aFull ? -1 : 1
    if (b.downloads !== a.downloads) return b.downloads - a.downloads
    return b.tracks.length - a.tracks.length
  })
  return results[0]
}

// ---------------------------------------------------------------------------
// Build one catalog entry for a show date
// ---------------------------------------------------------------------------
async function resolveShow(showDate) {
  const candidates = await listArchiveShowCandidates(showDate)
  const entry = { date: showDate.date, candidates, resolvedAt: Date.now() }

  if (candidates.length === 0) return entry

  const winner = await selectBestRecording(candidates, showDate.totalSongs)
  const meta = await getShowMetadata(winner.identifier).catch(() => ({}))

  entry.best = {
    identifier: winner.identifier,
    venue: meta.venue || showDate.venue,
    city: meta.city || showDate.city,
    state: meta.state || showDate.state,
    country: meta.country || showDate.country,
    licenseurl: meta.licenseurl,
    rights: meta.rights,
    publicdate: meta.publicdate,
    description: meta.description ?? null,
    tracks: winner.tracks.map(t => ({ name: t.name, title: t.title, length: t.length })),
  }

  return entry
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  if (!fs.existsSync(SETLISTS_PATH)) {
    console.error(`Setlist cache not found at ${SETLISTS_PATH}. Run the app once to populate it first.`)
    process.exit(1)
  }
  const { setlists } = JSON.parse(fs.readFileSync(SETLISTS_PATH, 'utf8'))

  // Dedupe to one entry per date — GD played at most one dated show.
  const byDate = new Map()
  for (const setlist of setlists) {
    const date = fromSetlistDate(setlist.eventDate)
    if (byDate.has(date)) continue
    const totalSongs = (setlist.sets?.set || []).reduce((n, s) => n + (s.song?.length || 0), 0)
    byDate.set(date, {
      date,
      venue: setlist.venue?.name,
      city: setlist.venue?.city?.name,
      state: setlist.venue?.city?.state,
      country: setlist.venue?.city?.country?.name,
      totalSongs,
    })
  }

  const existing = fs.existsSync(INDEX_PATH) ? JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8')) : []
  const catalog = new Map(existing.map(e => [e.date, e]))

  const now = Date.now()
  const todo = [...byDate.values()].filter(show => {
    const cur = catalog.get(show.date)
    if (!cur) return true
    if (REFRESH_ALL) return true
    if (!cur.best && REFRESH_NEGATIVES) return now - cur.resolvedAt > NEGATIVE_RETRY_MS
    return false
  }).slice(0, LIMIT)

  console.log(`${byDate.size} total show dates, ${catalog.size} already catalogued, ${todo.length} to resolve (concurrency ${CONCURRENCY})`)

  let done = 0
  let found = 0
  let notFound = 0
  let failed = 0

  function save() {
    fs.mkdirSync(path.dirname(INDEX_PATH), { recursive: true })
    fs.writeFileSync(INDEX_PATH, JSON.stringify([...catalog.values()].sort((a, b) => a.date.localeCompare(b.date))))
  }

  let cursor = 0
  async function worker() {
    while (cursor < todo.length) {
      const show = todo[cursor++]
      try {
        const entry = await resolveShow(show)
        catalog.set(show.date, entry)
        entry.best ? found++ : notFound++
      } catch (err) {
        failed++
        console.warn(`  failed ${show.date}: ${err.message}`)
      }
      done++
      if (done % 20 === 0) console.log(`  ${done}/${todo.length} (found ${found}, no recording ${notFound}, failed ${failed})`)
      if (done % SAVE_EVERY === 0) save()
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, todo.length) }, worker))
  save()

  console.log(`\nDone. ${found} found, ${notFound} no recording, ${failed} failed. Catalog now has ${catalog.size} entries at ${INDEX_PATH}`)
  console.log('Review and commit .cache/archive-index.json when ready.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
