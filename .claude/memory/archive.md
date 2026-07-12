---
description: "Archive.org client/data quirks — enforces title-matching fallbacks when track metadata is incomplete"
applyTo: "lib/clients/archive.ts, lib/archive-track-format.ts, lib/services/show-of-the-day.ts, app/show/**"
---

# Archive Memory

Archive.org metadata is inconsistent — never assume every track has a usable `title`.

## Tracks can have no ID3 title

Some recordings' `/metadata/{id}` response has `title: null` on every file — only `name`
(the raw filename, e.g. `"01 Dancing In The Street.mp3"`) is populated. Any code that
matches setlist song names against `track.title` (e.g. row-graying / "is this song
playable" logic) will silently match nothing and gray out an otherwise fully playable
show — "Play entire show" still works because it doesn't do per-track title matching.

Always fall back to a filename-derived title when `track.title` is empty:

```ts
// ✅ Correct
title: track.title || formatArchiveTrackName(track.name.replace(/\.mp3$/i, ''))

// ❌ Wrong — leaves title undefined, breaks all downstream title-matching
title: track.title || undefined
```

`formatArchiveTrackName` lives in `lib/utils.ts` (server-safe, no React deps) — do not
duplicate it in `lib/hooks/use-audio-player.ts` (client-only, `'use client'`); that file
re-exports it for backward-compat imports instead.
