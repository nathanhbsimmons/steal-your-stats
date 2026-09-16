# Agent Tasks

## Completed

### Task 6 — API Clients & Repository Pattern
- SetlistFM client, Archive.org client, MusicBrainz client
- Repository pattern, `FileSongIndexRepository`
- Canonical song ID resolution (`lib/ids.ts`, 60+ aliases)

### Task 7 — Song Page (Repository-Based Facts)
- Dynamic `/song/[slug]` page, SWR data fetching
- `FactRow`, `SongHeader`, `Window`/`Card` layout components
- 24h cache, idle → loading → empty → error → success state model
- WCAG AA accessibility (aria-live, keyboard focus rings)

### Task 8 — Opener / Closer / Encore Sections
- Position facts API (`/api/position-facts`)
- Collapsible sections, `Collapse` component
- `PaginatedPositionList`, cursor-based pagination

### Task 9 — Archive Resolver & Audio Player
- `/api/archive/resolve-show` — resolves setlist.fm show → Archive.org identifier
- `/api/archive/song-tracks` — fetches matching MP3 tracks for song
- `AudioPlayerDock` component (play/pause, seek bar, volume, keyboard shortcuts)
- `Queue` component (track list, remove, clear)
- `useAudioPlayer` hook (queue persistence via localStorage, enqueueEntireShow)
- `VersionsTable`, `ExtremesCard` components
- MP3-only audio filtering

### Task 10 — Audio Player Bug Fixes (2026-05-13)
- **Fixed:** `resolveArchiveShow` hardcoded for only 2 dates; now scored Archive.org search, any date
- **Fixed:** `getAllTracks` treated Archive.org `files` array as object (`Object.entries` on array); now typed array filter
- **Fixed:** audio element missing `audio.load()` on track change, race condition between tracks; split into separate reset and play/pause effects
- **Fixed:** progress bar showed `NaN%` when `duration === 0` (divide-by-zero); guarded with `duration > 0 ? ... : 0`
- **Fixed:** `setCurrentTrack` / `setIsPlaying` called inside `setQueue` updater callback (React anti-pattern); moved outside via `queueRef`
- **Fixed:** track names showed raw Archive.org filenames (e.g. `gd1993-09-09d1t01`); now cleaned to `Track 1`, `Track 3 (Disc 2)`, etc.
- **Fixed:** version track "play" buttons added to queue but never started playback; now calls `selectTrack` when nothing playing
- **Fixed:** "Play First/Last Show Versions" buttons didn't auto-start playback; same fix
- **Fixed:** `handleClearAndPlayEntireShow` exact duplicate of `handlePlayEntireShow`; removed
- **Added:** Playwright E2E suite (`tests/e2e/audio-player.spec.ts`) — 16 browser tests, queue management + playback controls + keyboard shortcuts
- **Added:** `formatArchiveTrackName` unit tests (`test/format-archive-track-name.test.ts`)
- **Added:** advanced `useAudioPlayer` edge-case tests (`test/use-audio-player-advanced.test.ts`)

### Task 15 — Accessibility Remediation (8-tier a11y pass)
- **Foundation:** global focus-ring and `.sr-only` CSS tokens (`--focus-ring`, `--focus-ring-offset`) added to `app/globals.css`
- **Vault player + mobile shell:** keyboard-accessible seek bar and volume slider (native `<input type="range">`, `aria-valuetext`), queue drawer opens with focus moving inside, Escape closes and restores focus to the toggle; mobile now-playing bar seek/touch targets fixed
- **Global nav:** masthead/chapters links and inputs ARIA-wired, single `aria-current="page"`; input labels added across search/filter controls
- **Tables & widgets:** keyboard-accessible show rows (shows-year-table, venues-table via a focusable `Link` in the row), setlist track slices as real buttons, eras-board timeline/cards modeled as one roving-tabindex `role="tablist"`, "clear filter" spans converted to labeled buttons
- **Stats combobox:** song search on `/stats` ARIA-wired (`role="combobox"`/`listbox`/`option`, `aria-activedescendant`, `aria-expanded`), live-region announcements decoupled from fetch debounce
- **Export page:** dossier section checkboxes are real labeled checkboxes, predecessor/successor chips are `aria-pressed` toggle buttons, keyboard "Move up"/"Move down" setlist reorder with live-region position announcements
- **Guardrails (this task):** `eslint-plugin-jsx-a11y` (`recommended` + 6 rules ratcheted to `error`) wired into `eslint.config.mjs` via the existing `FlatCompat` pattern, with a scoped override for verified-unmounted legacy files (`components/glass/*`, `components/ui/audio-player-dock.tsx`, `components/ui/queue.tsx`, `components/ui/versions-table.tsx`); remaining live-code stragglers fixed (home page track rows, show detail track rows, member bar chart, mobile position search, stats combobox option, styleguide demo links, song versions table header)
- **Added:** `tests/e2e/a11y-keyboard.spec.ts` — keyboard smoke suite covering seek bar/volume slider arrow-key scrubbing, queue toggle focus management, queue row selection and remove-button labeling, keyboard show-row navigation on `/shows/[year]`, and a chapter-nav `<Link>` regression guard

## Backlog

### Task 11 — Track Metadata Enrichment
- Fetch title metadata from Archive.org (`/metadata/{id}`), show real song titles instead of parsed filenames
- Archive.org items often include `title` field per file in files array

### Task 12 — Search & Home Page Polish
- Improve search ranking / fuzzy matching
- Home page, recent/featured songs

### Task 13 — Offline / PWA Support
- Service worker for audio caching
- Persist queue across sessions (already done via localStorage)

### Task 14 — CI/CD
- GitHub Actions workflow: lint + typecheck + `pnpm test:run` + `pnpm test:e2e`
- Deploy to Vercel