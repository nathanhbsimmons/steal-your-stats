#!/usr/bin/env node
// Audit script: compares every song name in the setlist.fm cache against
// the canonical GD song list in lib/canonical-songs.json.
//
// Usage: node scripts/audit-songs.js [--cache <path>] [--json]
//
// Outputs three buckets:
//   MATCHED  — resolved to a canonical song
//   UNMATCHED — not in canonical list (needs alias or new entry)
//   UNSEEN   — canonical songs never found in cache

'use strict'

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const CACHE_DEFAULT = path.join(ROOT, '.cache', 'gd-setlists.json')

const args = process.argv.slice(2)
const cachePath = args.includes('--cache') ? args[args.indexOf('--cache') + 1] : CACHE_DEFAULT
const jsonOutput = args.includes('--json')

// ---------------------------------------------------------------------------
// Normalization (mirrors lib/ids.ts — keep in sync)
// ---------------------------------------------------------------------------

function normalizeRaw(title) {
  return title
    .toLowerCase()
    .replace(/\s*\(live\)\s*/g, ' ')
    .replace(/\s*\(jam\)\s*/g, ' ')
    .replace(/\s*\(tease\)\s*/g, ' ')
    .replace(/\s*\(intro\)\s*/g, ' ')
    .replace(/\s*\(outro\)\s*/g, ' ')
    .replace(/\s*>\s*/g, ' ')
    .replace(/’/g, "'") // curly apostrophe → straight
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeFuzzy(title) {
  return normalizeRaw(title)
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// ---------------------------------------------------------------------------
// Load canonical list and build lookup maps
// ---------------------------------------------------------------------------

const canonicalPath = path.join(ROOT, 'lib', 'canonical-songs.json')
const canonical = JSON.parse(fs.readFileSync(canonicalPath, 'utf-8'))
const canonicalSongs = canonical.songs // [{ title, aliases }]

const byNormalizedTitle = new Map()
const byAlias = new Map()

for (const song of canonicalSongs) {
  byNormalizedTitle.set(normalizeFuzzy(song.title), song)
  for (const alias of song.aliases) {
    byAlias.set(alias.toLowerCase().trim(), song)
  }
}

function resolve(rawTitle) {
  const fuzzy = normalizeFuzzy(rawTitle)
  const raw   = normalizeRaw(rawTitle)

  if (byNormalizedTitle.has(fuzzy)) return byNormalizedTitle.get(fuzzy)
  if (byAlias.has(raw))             return byAlias.get(raw)
  if (byAlias.has(fuzzy))           return byAlias.get(fuzzy)

  // Linear fuzzy scan — handles punctuation variants of aliases
  for (const [key, song] of byAlias) {
    if (normalizeFuzzy(key) === fuzzy) return song
  }

  return null
}

// ---------------------------------------------------------------------------
// Load setlist cache
// ---------------------------------------------------------------------------

if (!fs.existsSync(cachePath)) {
  console.error(`Cache not found: ${cachePath}`)
  console.error('Run the app at least once with SETLISTFM_API_KEY set to populate the cache.')
  process.exit(1)
}

const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf-8'))
const setlists  = cacheData.setlists || []

// ---------------------------------------------------------------------------
// Extract every song occurrence and count it
// ---------------------------------------------------------------------------

// rawName → { count, exampleDate, resolved: CanonicalSong | null }
const nameStats = new Map()

for (const setlist of setlists) {
  const date = setlist.eventDate || 'unknown'
  const sets = setlist.sets?.set || []
  for (const set of sets) {
    for (const song of (set.song || [])) {
      const name = (song.name || '').trim()
      if (!name) continue
      if (!nameStats.has(name)) {
        nameStats.set(name, { count: 0, exampleDate: date, resolved: null })
      }
      const entry = nameStats.get(name)
      entry.count++
    }
  }
}

// Resolve each unique name
for (const [name, entry] of nameStats) {
  entry.resolved = resolve(name)
}

// ---------------------------------------------------------------------------
// Build report buckets
// ---------------------------------------------------------------------------

const matched   = []  // { rawName, canonical, count }
const unmatched = []  // { rawName, count, exampleDate }

for (const [rawName, { count, exampleDate, resolved }] of nameStats) {
  if (resolved) {
    matched.push({ rawName, canonical: resolved.title, count })
  } else {
    unmatched.push({ rawName, count, exampleDate })
  }
}

// Canonical songs seen in data
const canonicalSeen = new Set(matched.map(m => m.canonical))

// Canonical songs NEVER seen in cache
const unseen = canonicalSongs.filter(s => !canonicalSeen.has(s.title))

// Sort
unmatched.sort((a, b) => b.count - a.count)
unseen.sort((a, b) => a.title.localeCompare(b.title))

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

if (jsonOutput) {
  console.log(JSON.stringify({
    summary: {
      setlists: setlists.length,
      uniqueRawNames: nameStats.size,
      canonicalSongs: canonicalSongs.length,
      matched: matched.length,
      unmatched: unmatched.length,
      unseenCanonical: unseen.length,
    },
    unmatched,
    unseen: unseen.map(s => s.title),
  }, null, 2))
  process.exit(0)
}

// Human-readable output
const hr = '─'.repeat(72)

console.log('\n╔══════════════════════════════════════════╗')
console.log('║   GRATEFUL DEAD SONG AUDIT               ║')
console.log('╚══════════════════════════════════════════╝\n')

console.log(`  Cache file  : ${cachePath}`)
console.log(`  Setlists    : ${setlists.length}`)
console.log(`  Unique names: ${nameStats.size}  (raw setlist.fm strings)`)
console.log(`  Canonical   : ${canonicalSongs.length}  (lib/canonical-songs.json)`)
console.log()
console.log(`  ✓ Matched   : ${matched.length} raw names → ${canonicalSeen.size} canonical songs`)
console.log(`  ✗ Unmatched : ${unmatched.length} raw names (need alias or new entry)`)
console.log(`  ? Unseen    : ${unseen.length} canonical songs never appear in cache`)
console.log()

if (unmatched.length > 0) {
  console.log(hr)
  console.log(`UNMATCHED — ${unmatched.length} raw names not in canonical list`)
  console.log('Add these to lib/canonical-songs.json as a new entry or alias.\n')
  console.log('  Count │ Raw setlist.fm name')
  console.log('  ──────┼' + '─'.repeat(50))
  for (const { rawName, count } of unmatched) {
    console.log(`  ${String(count).padStart(5)} │ ${rawName}`)
  }
  console.log()
}

if (unseen.length > 0) {
  console.log(hr)
  console.log(`UNSEEN — ${unseen.length} canonical songs not found in this cache slice`)
  console.log('Cache may not cover all years, or these are very rare songs.\n')
  for (const s of unseen) {
    console.log(`  ${s.title}`)
  }
  console.log()
}

console.log(hr)
console.log(`MATCHED — ${canonicalSeen.size} canonical songs confirmed in cache`)
console.log()
for (const title of [...canonicalSeen].sort()) {
  console.log(`  ✓  ${title}`)
}
console.log()
