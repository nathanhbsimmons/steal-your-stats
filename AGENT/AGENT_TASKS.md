# Agent Tasks

## Completed

### Task 6 — API Clients & Repository Pattern
- SetlistFM client, Archive.org client, MusicBrainz client
- Repository pattern with `FileSongIndexRepository`
- Canonical song ID resolution (`lib/ids.ts`, 60+ aliases)

### Task 7 — Song Page (Repository-Based Facts)
- Dynamic `/song/[slug]` page with SWR data fetching
- `FactRow`, `SongHeader`, `Window`/`Card` layout components
- 24h cache, idle → loading → empty → error → success state model
- WCAG AA accessibility (aria-live, keyboard focus rings)

### Task 8 — Opener / Closer / Encore Sections
- Position facts API (`/api/position-facts`)
- Collapsible sections with `Collapse` component
- `PaginatedPositionList` with cursor-based pagination

### Task 9 — Archive Resolver & Audio Player
- `/api/archive/resolve-show` — resolves setlist.fm show → Archive.org identifier
- `/api/archive/song-tracks` — fetches matching MP3 tracks for a song
- `AudioPlayerDock` component (play/pause, seek bar, volume, keyboard shortcuts)
- `Queue` component (track list, remove, clear)
- `useAudioPlayer` hook (queue persistence via localStorage, enqueueEntireShow)
- `VersionsTable` and `ExtremesCard` components
- MP3-only audio filtering

### Task 10 — Audio Player Bug Fixes (2026-05-13)
- **Fixed:** `resolveArchiveShow` was hardcoded for only 2 dates; now uses scored Archive.org search for any date
- **Fixed:** `getAllTracks` treated Archive.org `files` array as object (`Object.entries` on array); now uses typed array filter
- **Fixed:** Audio element had no `audio.load()` call on track change, causing race conditions between tracks; split into separate reset and play/pause effects
- **Fixed:** Progress bar showed `NaN%` when `duration === 0` (divide-by-zero); guarded with `duration > 0 ? ... : 0`
- **Fixed:** `setCurrentTrack` / `setIsPlaying` were called inside `setQueue` updater callback (React anti-pattern); moved outside using `queueRef`
- **Fixed:** Track names displayed raw Archive.org filenames (e.g. `gd1993-09-09d1t01`); now cleaned to `Track 1`, `Track 3 (Disc 2)`, etc.
- **Fixed:** Version track "play" buttons added to queue but never started playback; now calls `selectTrack` when nothing is playing
- **Fixed:** "Play First/Last Show Versions" buttons didn't auto-start playback; fixed the same way
- **Fixed:** `handleClearAndPlayEntireShow` was an exact duplicate of `handlePlayEntireShow`; removed
- **Added:** Playwright E2E test suite (`tests/e2e/audio-player.spec.ts`) — 16 browser tests covering queue management, playback controls, keyboard shortcuts
- **Added:** `formatArchiveTrackName` unit tests (`test/format-archive-track-name.test.ts`)
- **Added:** Advanced `useAudioPlayer` edge-case tests (`test/use-audio-player-advanced.test.ts`)

## Backlog

### Task 11 — Track Metadata Enrichment
- Fetch title metadata from Archive.org (`/metadata/{id}`) to show real song titles instead of parsed filenames
- Archive.org items often include `title` field per file in the files array

### Task 12 — Search & Home Page Polish
- Improve search ranking / fuzzy matching
- Home page with recent/featured songs

### Task 13 — Offline / PWA Support
- Service worker for audio caching
- Persist queue across sessions (already done via localStorage)

### Task 14 — CI/CD
- GitHub Actions workflow: lint + typecheck + `pnpm test:run` + `pnpm test:e2e`
- Deploy to Vercel
