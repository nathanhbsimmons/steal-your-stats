# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working code this repo.

## Project Overview

Steal Your Stats — Grateful Dead stats + audio player web app. Song lookup, performance stats (first/last show, opener/closer/encore counts), version comparisons w/ durations, in-browser playback archived shows from Archive.org.

## Architecture

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