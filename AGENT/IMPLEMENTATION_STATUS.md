# Implementation Status & Roadmap

_Last updated: 2026-05-15. Reflects the post-redesign codebase (glass morphism UI)._

---

## API Routes — All Functional

| Route | Method | Status |
|---|---|---|
| `/api/song-facts` | GET | ✅ Real data from setlist.fm |
| `/api/position-facts` | GET | ✅ Real data — opener/closer/encore counts + first 10 shows |
| `/api/position-facts/page` | GET | ✅ Cursor-paginated position lists (not yet called by UI) |
| `/api/versions` | GET | ✅ Returns all performances — **but `durationSec` and `url` are always `undefined`** |
| `/api/archive/resolve-show` | POST | ✅ Fuzzy-matches date+venue → Archive.org identifier |
| `/api/archive/song-tracks` | POST | ✅ Returns MP3 tracks for a given Archive.org item + song title |
| `/api/show` | GET | ✅ Full setlist for a date from setlist.fm |
| `/api/on-this-day` | GET | ✅ All GD shows on today's calendar date across all years |
| `/api/songs` | GET | ✅ Full song catalog with aliases, filterable by query |
| `/api/search/shows-with-songs` | GET | ✅ Exists — not yet called by the search UI |
| `/api/setlist/search-setlists` | GET | ✅ Internal pass-through |
| `/api/setlist/search-songs` | GET | ✅ Internal pass-through |
| `/api/rebuild` | GET | ✅ Exists — not yet wired to any UI button |
| `/api/rebuild-song` | GET | ✅ Exists — not yet wired to any UI |

---

## Pages — Current State

### `/` — Home ✅ Partially functional

**Works:**
- On This Day API returns real GD shows for today's calendar date
- Featured show selection prefers golden-era shows with songs (1967–1994, sorted by quality score)
- "Play the show" Link navigates to the correct show date
- Recent Activity list shows real show data from the API
- Most-Played song names are clickable Links to `/song/[slug]`

**Dead UI:**
- "Rebuild index" button — no handler
- "Today's tape" TopBar button — no handler
- "Open setlist" hero button — no handler
- All 4 KPI tile numbers hardcoded (2,317 / 484 / 6,189 / "2h ago")
- Most-Played play counts hardcoded mock data

---

### `/song/[slug]` — Song Detail ✅ Mostly functional

**Works:**
- Song title + aliases from setlist.fm
- Performance Facts card — first/last show date, venue, city, "View setlist" link, total count, SWR 24h cache
- Position Facts — opener/closer/encore counts + show lists (real data)
- Versions table — all performances listed, linked to archive via resolution
- Play buttons in table resolve Archive.org show then queue song tracks
- "Play longest version", "Play first-show versions", "Play last-show versions" — all functional
- PlayerDock — audio, transport, scrubber, volume, "playing entire show" pill, queue count

**Dead / Broken:**
- Version duration column — always shows "—" (`durationSec` never populated by service)
- Extremes card (longest/shortest) — never renders (`extremes` not returned from API)
- Sort by "Duration ↓" — structurally works but meaningless with all durations undefined
- "Load more" in position lists — no handler (API endpoint exists but isn't called)
- "Share" icon in breadcrumb — no handler
- "Star" icon in breadcrumb — no handler
- PlayerDock keyboard shortcuts (Space/←/→/M) — displayed as `<kbd>` labels but no event listener

---

### `/show/[date]` — Show Detail ✅ Fully functional

**Works:**
- Setlist loads from setlist.fm via `/api/show`
- All songs displayed per set, each a Link to `/song/[slug]`
- "Play entire show" resolves Archive.org identifier, queues all tracks, begins playback
- `setlist.fm` external link in header
- Attribution footer
- PlayerDock — full functionality including "Clear & play entire show"

---

### `/songs` — Song Catalog ⚠️ Data works, visually broken

**Works:**
- Loads real song catalog from `/api/songs`
- Alphabetical grouping, filter by query, links to `/song/[slug]`

**Broken:**
- Still uses old `Window` / `WindowHeader` / `WindowBody` / `Card` components with old Tailwind theme classes (`text-ink`, `border-ink`, `bg-paper`) that no longer exist in the global CSS

---

### `/search` — Search ❌ Mock data only

**Works:**
- Search input controlled state, keyboard shortcuts (Esc)
- Filter chips toggle (songs/shows) with visual active state
- Text highlight on matching query within results
- Song results link correctly to `/song/[slug]`

**Dead:**
- All results are hardcoded mocks (5 songs, 5 shows for a "dark" query)
- No API is called — `/api/songs` and `/api/search/shows-with-songs` exist but are unused
- "Shows · 184", "Venues · 3" counts are hardcoded
- "Venues", "1965–1995", "All sources" filter chips have no handlers
- "See all" button — no handler

---

### `/recent` — Recent Activity ❌ Static mock

All data is 3 days of hardcoded listening history. Play mini-buttons have no handlers.
No listening-history store exists yet.

---

### `/artists` — Band Lineup ❌ Static mock

10 hardcoded band members with correct historical data. No API. Portrait images are placeholder text boxes.

---

### `/venues` — Venues ❌ Static mock

8 hardcoded venues. Filter input is uncontrolled (no `onChange`). "Map view" button dead.

---

### `/eras` — Eras ❌ Static mock

5 hardcoded eras. "Explore →" buttons and Focus card "Play" button are dead.

---

### `/stats` — Statistics ❌ Static mock

Bar chart, donut, and leaderboard are all hardcoded. Filter and sort buttons are dead.

---

### `/export` — Export ❌ UI shell only

Section toggles and format pills have interactive state but feed nothing. All export/generate buttons are dead. No PDF/PNG/CSV generation exists.

---

### `/styleguide` — Dev tool ⚠️ Old design

Uses old component system. Not user-facing; low priority.

---

## Dead UI Summary (by component)

| Component | Dead Element |
|---|---|
| PlayerDock | Queue icon (no panel), Fullscreen icon, keyboard shortcuts (no listener) |
| All pages | TopBar "Rebuild index", "Today's tape" buttons on home |
| Song page | "Share", "Star" in breadcrumb; "Load more" in position lists |
| Song page | Version durations column; extremes card |
| Search page | All results (mock); filter chips; "See all" |
| Home page | KPI numbers; Most-Played counts; "Open setlist" button |

---

## Tiered Implementation Plan

### Tier 1 — Core experience gaps ✅ All complete (2026-05-15)

**1. Version durations** ✅
- `enrichSample()` added to `RealtimeSongFactsService` — resolves Archive.org for 8 evenly-sampled shows per song
- `title` field added to `ArchiveTrack` interface so file metadata is used for song matching (not just filename)
- 12-second race timeout prevents hanging; 24h `versionsCache` prevents duplicate Archive.org calls
- Extremes card now renders when ≥2 durations available; duration column shows formatted times

**2. `/songs` glass redesign** ✅
- `app/songs/page.tsx` fully ported: TopBar, glass search input with clear button, alphabetical sections with per-letter counts
- Song rows show "aka" aliases on the right

**3. Real search** ✅
- 250ms debounce, fetches from `/api/songs?q=...` for songs panel
- Auto-fetches shows from `/api/search/shows-with-songs?songs[]=...` using top song match
- Counts and highlight text are live; empty state and clear button wired

**4. PlayerDock keyboard shortcuts** ✅
- Space → play/pause; ← → previous; → → next; M → mute toggle
- Guarded against input/textarea/select focus; `lastVolumeRef` restores volume on unmute

**5. Position facts "Load more"** ✅
- `getPositions()` now returns all shows (removed `.slice(0, 10)` cap)
- Client-side pagination: 10 per page, "Load more (N remaining)" button
- `Icon` component extended with `style?: React.CSSProperties` prop

---

### Tier 2 — High-value data pages ✅ All complete (2026-05-16)

**6. Home KPI strip — real numbers** ✅
- `/api/stats/summary` returns totalShows, uniqueSongs, hoursArchived, lastUpdated from setlist cache
- Home page fetches and displays real numbers with "—" loading skeleton

**7. Stats page — real data** ✅
- `/api/stats` returns showsPerYear histogram and all-time leaderboard (toTitleCase applied)
- Stats page is `'use client'`, bar chart uses real yearly counts with true peak highlighted, leaderboard linked to song pages

**8. "Rebuild index" button** ✅
- Home page button calls `POST /api/rebuild`, disabled during request
- Inline status text: "Rebuilding…" → "Index rebuilt" / "Rebuild failed" → resets after 3s

---

### Tier 3 — Content pages (mocks → real data) ✅ All complete (2026-05-16)

**9. Venues page** ✅
- `getVenueStats()` added to `RealtimeSongFactsService` — aggregates 593 venues with show count, first/last year, city/country
- `/api/venues` route created
- Page converted to `'use client'`: controlled filter input with debounce, 200-row cap with "narrow filter" hint, KPI strip with real total/top venue/top city

**10. Eras page** ✅
- Converted to `'use client'`, fetches `/api/stats`
- Show counts computed by summing `showsPerYear` over each era's year range (real data)
- "Explore →" buttons are now `<Link>` to the era's signature song page
- Timeline bar proportions driven by real show counts

**11. Artists page** ✅
- Converted to `'use client'`, fetches `/api/stats`
- Show counts computed per member from `showsPerYear` summed over their active years
- Portrait images remain placeholder (no asset source available)

**12. Recent page — listening history** ✅
- `PLAY_LOG_KEY` + `PlayLogEntry` interface exported from `use-audio-player.ts`
- `appendPlayLog()` called whenever a new track starts playing (via `useEffect` on `currentTrack` + `isPlaying`)
- Log persisted to localStorage (200 entries max, newest first)
- Recent page reads log, groups by calendar day, shows "No history yet" empty state with "Browse songs" link

---

### Tier 4 — Polish

**13. Queue panel**
- Add an expandable drawer triggered by the queue icon in PlayerDock
- Display queue tracks with remove buttons; highlight current track
- Hook already has full queue state (`queue`, `removeFromQueue`, `clearQueue`, `selectTrack`)

**14. "Share" / "Star" in song page**
- Share: Web Share API (`navigator.share`) with fallback to clipboard copy of URL
- Star: localStorage favorites list; starred songs surface in sidebar or a new `/favorites` page

**15. Export page**
- Requires server-side PDF generation (e.g., `@react-pdf/renderer`) or browser Canvas
- Substantial effort; implement after all data pages are live
