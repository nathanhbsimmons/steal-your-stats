# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working code this repo.

## Project Overview

Steal Your Stats — Grateful Dead stats + audio player web app. Song lookup, performance stats (first/last show, opener/closer/encore counts), version comparisons w/ durations, in-browser playback archived shows from Archive.org.

## Architecture

### Key Constants
- Grateful Dead MusicBrainz ID: `6faa7ca7-0d99-4a5e-bfa6-1fd5037520c6`
- Audio queue localStorage key: `steal-your-stats-audio-queue`

## Design System

Vintage ledger/archive theme, high contrast:
- **Colors**: paper (#f1e6cf), ink (#1a140c), plus accents — forest (#1f3a2c), rust (#a8391f), ledger-blue (#2c4a6a), amber (#b6702c), oxblood (#653b37)
- **Borders**: solid, tokenized via `--rule` / `--rule-soft` / `--rule-faint`
- **Radii**: sharp — 0-4px (`--r-xs` 0 to `--r-lg` 4px), `--r-full` 99px for pills
- **Shadows**: offset retro style, `3px 3px 0` (`--shadow-card`)
- **Typography**: DM Serif Display + Bodoni Moda (headings/numerals), Crimson Pro (body), JetBrains Mono (meta), UnifrakturMaguntia (blackletter accents)

Tokens defined in `app/globals.css`. Mobile layout has its own stylesheet, `app/mobile.css`.

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