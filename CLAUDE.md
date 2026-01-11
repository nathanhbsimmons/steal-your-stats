# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Steal Your Stats is a Grateful Dead statistics and audio player web application. It provides song lookup, performance statistics (first/last show, opener/closer/encore counts), version comparisons with durations, and in-browser playback of archived shows from Archive.org.

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

Run a single test file:
```bash
pnpm test test/utils.test.ts
```

## Architecture

### Tech Stack
- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui components
- SWR for data fetching
- Vitest + Testing Library for tests
- pnpm as package manager

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
2. **HttpClient** (`lib/http.ts`): Wraps fetch with retries, exponential backoff on 429, and in-memory caching
3. **Song Resolution** (`lib/ids.ts`): Maps song title variations to canonical names (60+ aliases)
4. **API Routes**: Expose data via `/api/song-facts`, `/api/position-facts`, `/api/versions`, etc.
5. **Audio Player** (`lib/hooks/use-audio-player.ts`): Queue management with localStorage persistence

### Key Constants
- Grateful Dead MusicBrainz ID: `6faa7ca7-0d99-4a5e-bfa6-1fd5037520c6`
- Audio queue localStorage key: `steal-your-stats-audio-queue`

## Design System

Monochrome, retro aesthetic with high contrast:
- **Colors**: ink (#111), paper (#f5f5f2), gray (#bfbfb7)
- **Borders**: 2px solid everywhere
- **Radii**: 12px (small), 24px (large)
- **Shadows**: Offset retro style (e.g., `6px 6px 0`)
- **Typography**: Playfair Display (headings), Inter (body), IBM Plex Mono (meta)

## Development Workflow

- Work one task at a time from `/AGENT/AGENT_TASKS.md`
- Branch naming: `feat/<slice-kebab>`
- All tests, lint, and typecheck must pass before merging
- State model for UI: idle → loading → empty → error → success
- WCAG AA accessibility required (keyboard-first, visible focus rings, aria-live for async)

## Environment Variables

Required in `.env.local`:
```
SETLISTFM_API_KEY=your_key_here
```

## Path Alias

`@/*` maps to the project root (configured in tsconfig.json)
