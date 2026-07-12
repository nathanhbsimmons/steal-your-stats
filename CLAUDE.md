# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working code this repo.

## Project Overview

Steal Your Stats — Grateful Dead stats + audio player web app. Song lookup, performance stats (first/last show, opener/closer/encore counts), version comparisons w/ durations, in-browser playback archived shows from Archive.org.

## Commands

```bash
pnpm dev          # Start dev server with Turbopack
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm typecheck    # TypeScript validation
pnpm test         # Run Vitest in watch mode
pnpm test:run     # Single test run
pnpm test:ui      # Vitest with UI dashboard
```

Run single test file:
```bash
pnpm test test/utils.test.ts
```

## Architecture

### Tech Stack
- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui components
- SWR data fetching
- Vitest + Testing Library tests
- pnpm package manager

### Directory Structure

```
app/                    # Next.js App Router pages and API routes
  api/                  # API routes (setlist, archive, song-facts, etc.)
  song/[slug]/          # Dynamic song detail page
components/
  ui/                   # Reusable UI primitives (typography, window, card, etc.)
  app-shell.tsx         # Main layout container
lib/
  clients/              # External API clients (setlist.ts, archive.ts, musicbrainz.ts)
  repositories/         # Data persistence layer
  hooks/                # React hooks (use-audio-player.ts)
  http.ts               # Central fetch wrapper with retries and caching
  cache.ts              # In-memory TTL cache
  ids.ts                # Song aliases and MusicBrainz IDs
  env.ts                # Zod-validated environment config
test/                   # Test files
```

### Data Flow

1. **External APIs**: setlist.fm (performance data), Archive.org (audio files), MusicBrainz (artist IDs)
2. **HttpClient** (`lib/http.ts`): Wraps fetch, retries, exponential backoff on 429, in-memory caching
3. **Song Resolution** (`lib/ids.ts`): Maps song title variations → canonical names (60+ aliases)
4. **API Routes**: Expose data via `/api/song-facts`, `/api/position-facts`, `/api/versions`, etc.
5. **Audio Player** (`lib/hooks/use-audio-player.ts`): Queue management, localStorage persistence

### Key Constants
- Grateful Dead MusicBrainz ID: `6faa7ca7-0d99-4a5e-bfa6-1fd5037520c6`
- Audio queue localStorage key: `steal-your-stats-audio-queue`

## Design System

Monochrome, retro, high contrast:
- **Colors**: ink (#111), paper (#f5f5f2), gray (#bfbfb7)
- **Borders**: 2px solid everywhere
- **Radii**: 12px (small), 24px (large)
- **Shadows**: Offset retro style (e.g., `6px 6px 0`)
- **Typography**: Playfair Display (headings), Inter (body), IBM Plex Mono (meta)

## Development Workflow

- One task at time from `/AGENT/AGENT_TASKS.md`
- Branch naming: `feat/<slice-kebab>`
- Tests, lint, typecheck must pass before merge
- UI state model: idle → loading → empty → error → success
- WCAG AA required (keyboard-first, visible focus rings, aria-live async)

## Environment Variables

Required in `.env.local`:
```
SETLISTFM_API_KEY=your_key_here
```

## Path Alias

`@/*` maps to project root (configured tsconfig.json)

## Lessons Learned

At the end of each session, update `~/.claude/projects/[project]/memory/learnings.md` with key learnings from this session using this format:

- **[Date]** | [Context] | [Lesson]

Examples:
- **2026-07-12** | Async state updates | useState doesn't batch updates in event handlers, need useTransition for optimal performance
- **2026-07-11** | Database queries | N+1 queries on user feed endpoint, add batch loader