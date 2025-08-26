# Agent Task Cards — Steal Your Stats

---

## Agent Task Card 1 — Repo Bootstrap & Quality Rails

**Goal Recap**  
Scaffold project with TypeScript, Tailwind, testing, linting, typed env loader.

**Plan**
1. `pnpm dlx create-next-app@latest steal-your-stats --ts --eslint --tailwind --app`.
2. `pnpm add swr zod` and dev deps: `vitest @testing-library/react @testing-library/jest-dom jsdom prettier`.
3. Configure Vitest + JSDOM; add `pnpm test`.
4. Install shadcn/ui and generate minimal primitives (Button, Card, Input, ScrollArea).
5. Create `lib/env.ts` (zod-validated `.env.local`: `SETLISTFM_API_KEY`, etc.).
6. Add `lib/clients/` stubs (`setlist.ts`, `archive.ts`, `musicbrainz.ts`) and `lib/cache.ts` (Map TTL).
7. Base layout landmarks: header/nav/main/footer + “Skip to content”.

**Acceptance**  
Dev server runs; tests pass; lint/typecheck pass; app renders a blank shell.

---

## Agent Task Card 2 — Retro Mono Theme Tokens & Utilities

**Goal Recap**  
Implement theme variables and utilities that evoke the retro/monochrome design language *without copying specific content*.

**Plan**
1. Fonts (open-source): serif for display (e.g., Playfair Display), sans for body (Inter), mono for meta (IBM Plex Mono).
2. Define CSS variables in `globals.css`:
   - Colors: `--ink:#111`, `--paper:#f5f5f2`, `--gray:#bfbfb7`.
   - Borders: `--border-w:2px; --radius-xl:24px; --radius-md:12px`.
   - Shadow: subtle offset shadow (retro window vibe).
3. Create optional halftone/grain background utility class (pure CSS; low opacity).
4. Tailwind theme extensions (fonts, radii, border widths).
5. Focus rings: thick, high-contrast outlines; motion reduced with `prefers-reduced-motion`.

**Acceptance**  
A `/styleguide` route demonstrates tokens on generic components (buttons, cards, headings) with strong resemblance to reference *style*, not content.

---

## Agent Task Card 3 — Generic “Window” Component & App Shell

**Goal Recap**  
Build reusable chrome primitives (header with stripes, bordered container, body/footer slots) to host all app views.

**Plan**
1. Components: `Window`, `WindowHeader`, `WindowBody`, `WindowFooter`.
2. `WindowHeader` supports: title slot; generic icon button slots (no branded icons).
3. Create responsive grid layout for app shell: persistent left column (navigation) + content pane.
4. Ensure keyboard focus order, Escape handling for any dismissible areas, and logical headings (one `<h1>` per view).

**Acceptance**  
Shell renders with retro chrome, rounded corners, stripes bar, and offset shadow—no app-specific content.

---

## Agent Task Card 4 — Navigation Sidebar & Typography System

**Goal Recap**  
Ship reusable, content-agnostic components resembling the reference style: folders/list items, pills, and typographic scales.

**Plan**
1. `Sidebar` with `NavSection` + `NavItem` (icon optional, text mandatory) using thick borders and active state.
2. `Pill` component (rounded, outlined) for filters/status.
3. Typography utilities: display H1 (serif), subhead (italic style class), body text (comfortable measure ~65ch).
4. Add `ScrollArea` integration; ensure no scroll traps.

**Acceptance**  
Sidebar and content pane look & feel match the style language; works from 320px width to desktop; no specific icons or branded labels included.

---

## Agent Task Card 5 — Search UI (Stubbed Data, Component-Only)

**Goal Recap**  
Implement generic search field + result list with all states; no external calls yet.

**Plan**
1. `SearchBar` (label + input) with debounced onChange and clear button.
2. Results list (`SearchResults`) inside Card with keyboard navigation (combobox pattern).
3. States: idle helper text, loading skeleton, empty message, error message; ARIA: `role="combobox"`, `aria-expanded`, `aria-controls`.
4. Add sample JSON stub with 5–10 generic items to exercise UI (not specific songs).

**Acceptance**  
Keyboard-only selection works; visually matches design language; accessible states present.

---

## Agent Task Card 6 — API Clients & Canonical ID Resolution

**Goal Recap**  
Implement typed clients for setlist.fm, MusicBrainz, Archive.org; resolve a song to canonical IDs/aliases (generic logic).

**Plan**
1. `lib/http.ts` with caching, retry/backoff, rate-limit header logging.
2. `clients/setlist.ts` minimal methods: `searchSongs`, `getSetlistsByArtist`, `searchSetlistsBySong`.
3. `clients/musicbrainz.ts`: `searchWorkByTitle`, `lookupRecordingAliases`.
4. `clients/archive.ts`: `searchShows`, `listTracks`.
5. `lib/ids.ts`: constants for artist MBIDs; `resolveSong({title})` → normalized title, aliases, optional MBIDs.
6. Unit tests for `http` (cache) and `ids` (normalization).

**Acceptance**  
Clients compile and pass tests; no UI changes beyond wiring.

---

## Agent Task Card 7 — Song Page v1: First/Last Facts

**Goal Recap**  
For `/song/[slug]`, compute and render first/last performance facts with source links.

**Plan**
1. `lib/songFacts.ts` → `getFirstLast(artistMbid, songTitleOrId)` returning `{first: ShowRef, last: ShowRef}`.
2. UI: `SongHeader` (title + optional alias hint) and `FactRow` components.
3. Show source badges; SWR for caching; 24h TTL.

**Acceptance**  
Page displays first/last with links; skeletons/errors implemented; no content unrelated to song facts.

---

## Agent Task Card 8 — Opener/Closer/Encore Sections

**Goal Recap**  
Show counts and paginated lists of shows where the song opened, closed, or encored.

**Plan**
1. `getPositions(artistMbid, song)` → `{opener, closer, encore}` with totals and paged fetchers.
2. UI: three `Collapse` sections with accessible toggle buttons and “Load more” (SWR infinite).
3. Maintain deep-linkable anchors.

**Acceptance**  
Counts render quickly; lists page smoothly; keyboard and screen reader friendly.

---

## Agent Task Card 9 — Archive Resolver & Player (Generic)

**Goal Recap**  
Resolve Archive.org show items from a show ref, list matched tracks for the selected song, and stream audio in-browser; also enqueue whole show.

**Plan**
1. `resolveArchiveShow({date, venue?, city?})` ranking candidates by metadata similarity.
2. `getSongTracks(itemId, normalizedTitle, aliases[])` with fuzzy match for medleys/segues.
3. Player components: `AudioPlayerDock`, `Queue`, generic transport controls, `aria-live` for track change.
4. “Play versions” list and “Play entire show” enqueue.
5. Persist last queue in localStorage; show license/attribution per item.

**Acceptance**  
At least one known candidate resolves and plays; queue advances automatically; full keyboard control.

---

## Agent Task Card 10 — Durations & Versions Tab

**Goal Recap**  
Compute per-track durations; surface longest/shortest; render sortable versions table.

**Plan**
1. Populate `durationSec` from Archive metadata; fallback: lazy probe first play for missing durations; cache results.
2. `getExtremes(tracks)` → `{longest, shortest}` with outlier guardrails (toggle to include).
3. Versions table with sorting by date, duration, venue; badges for extremes.

**Acceptance**  
Extremes visible and clickable; table sortable via keyboard; cached durations persist.

---

## Agent Task Card 11 — Era Context (Static Data)

**Goal Recap**  
Display a one-paragraph era blurb for the show date using local JSON ranges.

**Plan**
1. `data/eras.json` with named ranges and short descriptions (attribution note).
2. `getEra(date)` util; `EraCard` component styled in the theme.

**Acceptance**  
All shows map to exactly one era; card passes axe checks.

---

## Agent Task Card 12 — Optional BPM Estimation (Worker)

**Goal Recap**  
Estimate BPM client-side via WebAudio in a Web Worker; compute highest/lowest measured BPM.

**Plan**
1. `/workers/bpmWorker.ts` performing short-range fetch + autocorrelation/onset detection.
2. `measureBpm(fileUrl)` wrapper with localStorage cache and confidence metric.
3. UI: “Analyze BPM” buttons (per track and bulk on Versions tab); show progress and confidence.
4. Extremes badge updates when ≥2 samples.

**Acceptance**  
Several tracks produce BPM values; extremes display; UI remains responsive.

---

## Agent Task Card 13 — A11y & States Polishing

**Goal Recap**  
Resolve accessibility and state-handling details across components.

**Plan**
1. Integrate `@axe-core/react` in dev; fix serious/critical issues.
2. Ensure all components support disabled, loading, empty, error states.
3. Add “Skip to player” shortcut; visible focus ring everywhere.
4. Error boundaries + 404 styled with theme.

**Acceptance**  
Axe shows 0 serious issues on primary routes; keyboard-only usage is complete.

---

## Deliverables (overall)
- Next.js app with generic retro design system components (window chrome, sidebar, pills, typography) and MVP features: search → song page with first/last + positions, versions with durations, player, era context, optional BPM.  
- Unit tests for clients/utilities; docs (`README.md`) with setup, envs, attribution, rate-limit notes.

## Verification (overall)
- Commands:  
  - `pnpm i && pnpm test && pnpm lint && pnpm typecheck && pnpm dev`  
- Manual: keyboard tab path, skip links, clear focus rings; player operable; loading/empty/error states visible; attribution displayed.

## Risks & Next Slice
- **API limits & pagination**: mitigate with caching/backoff and incremental scans.  
- **Title variance/medleys**: fuzzy matching + alias lists.  
- **BPM reliability**: mark experimental, opt-in.  
**Next slice after MVP**: background cache warmer for popular songs (edge/cron) and light Playwright e2e (search → song → play).
