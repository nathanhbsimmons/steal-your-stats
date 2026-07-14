# Official-Release Indicator (no cover art)

## Context

User asked whether official GD release album covers could be used on the bottom media player bar. Answer: no — cover art is copyrighted (Rhino/Warner/GDP), and GD logos/imagery are trademarked; using them on a third-party player implies endorsement. Real infringement risk, not just theoretical.

Fallback, agreed with user: a text badge (no imagery) marking shows that have an official release (Dick's Picks, Dave's Picks, Road Trips, Download Series, From the Vault, compilations) and/or are on the official "Play Dead" app. Shown on: shows-year catalog table, the bottom player bar (`VaultPlayer`), the show detail page, and the mobile equivalents of all of those (`mobile-shell.tsx` is a separate parallel implementation for <767px, not a wrapper around the desktop components).

Data source: no API exists for this mapping. Seeding with a small, citation-backed, admittedly incomplete dataset now; expand later (e.g. from deaddisc.com tables). Play Dead app catalog (422 shows, weekly additions) needs its own scrape/source later — ship the mechanism now, zero Play Dead rows to start.

## 1. New file: `lib/official-releases.ts`

Plain TS module (no JSON, no `fs`) — same shape as `lib/venue-tidbits.ts`, safe to import from client components.

```ts
export interface OfficialRelease {
  date: string            // 'YYYY-MM-DD'
  series: string           // "Dick's Picks" | "Dave's Picks" | "Road Trips" | "Download Series"
                           // | "From the Vault" | "Studio/Compilation" | "Play Dead"
  title: string            // "Dick's Picks Vol. 1", "Cornell 5/8/77", etc.
  volume?: string
  contributingOnly?: boolean  // true when release draws from multiple nights (Europe '72, Live/Dead, Road Trips)
}
```

Seed with the 17 verified date entries from Plan agent research (Live/Dead, Bear's Choice/DP4, Three from the Vault, Europe '72, DP1, Download Vol.1, Cornell 5/8/77, Dave's Picks Vol.1, Road Trips Vol.1 No.1 — exact dates/titles as researched). Export:
- `getOfficialReleasesForDate(date: string): OfficialRelease[]`
- `getOfficialReleasesForDates(dates: string[]): OfficialRelease[]`
- `hasOfficialRelease(date: string): boolean`

Model Play Dead as a normal `OfficialRelease` row (`series: 'Play Dead'`), not a separate boolean — one lookup path for every UI surface.

## 2. New file: `test/official-releases.test.ts`

Mirror `test/archive-catalog.test.ts` structure. Assert known date returns expected entry, multi-date lookup flattens correctly, unknown date returns `[]`.

## 3. New file: `components/ui/release-badge.tsx`

Presentational only — takes already-filtered `OfficialRelease[]`, renders `null` if empty. Style with inline `style={{...}}` referencing `var(--ink)`/`var(--forest)`/`var(--mono)` CSS vars from `app/globals.css`, matching the existing `▶ audio` chip in `shows-year-table.tsx` (mono, uppercase, ~10px, 1px border) but in `var(--forest)` to stay visually distinct from the audio chip. **Do not use `components/ui/pill.tsx`** — it's unwired scaffolding referencing Tailwind tokens (`border-ink`, `font-meta`) that don't exist in this app's theme.

```tsx
export function ReleaseBadge({ releases, size = 'sm' }: { releases: OfficialRelease[]; size?: 'sm' | 'xs' }) { ... }
```

Show primary release title; if multiple, append `+N`.

## 4. Wire into shows-year catalog table

- `app/shows/[year]/page.tsx`: add `const officialReleases = getOfficialReleasesForDates(shows.map(s => s.date))` next to the existing `audioDates` fetch (~line 34-37); pass as new `officialReleases` prop (~line 66).
- `components/shows/shows-year-table.tsx`: add `officialReleases: OfficialRelease[]` to props; build a `Map<string, OfficialRelease[]>` via `useMemo` (same pattern as the existing `audioDateSet` at line 22). Render `<ReleaseBadge>` in the same `<td>` as the `▶ audio` chip (~lines 88-98).

## 5. Wire into player bar

- `components/vault/vault-player.tsx`: import `getOfficialReleasesForDate` directly (static lookup, no prop threading needed — same pattern `mobile-shell.tsx` already uses for `getVenueTidbit`). Compute `releases` via `useMemo` keyed on `currentTrack?.showDate`. Render `<ReleaseBadge releases={releases} size="xs" />` in the `.meta` block near the `{showDate} · {venue}` line (~193-198) or beside "go to show ↗" (~199-210).

## 6. Wire into show detail page

- `app/show/[date]/page.tsx`: `const officialReleases = getOfficialReleasesForDate(date)`; pass to `<ShowDetailClient ... officialReleases={officialReleases} />`.
- `components/show/show-detail-client.tsx`: accept prop, render `<ReleaseBadge releases={officialReleases} />` near the venue/`lede` header (~line 261-271), showing all entries (more room than a table row).

## 7. Wire into mobile (mobile-shell.tsx)

Separate parallel implementation, not reusing the desktop components — needs its own wiring:
- Mini player bar `.sub` line (~256-264): import `getOfficialReleasesForDate` directly, render badge same as desktop player bar.
- `ShowDetailScreen` (~line 1414+) venue header: same lookup, render badge.

## Verification

- `pnpm test:run test/official-releases.test.ts` — new unit tests pass.
- `pnpm typecheck` and `pnpm lint`.
- `pnpm dev`: visit `/shows/1977` (badge shows on 1977-05-08 and 1977-05-25 rows), play a track from Cornell 5/8/77 and confirm player-bar badge, visit `/show/1977-05-08` for detail-page badge, resize to mobile width (<767px) and repeat all three checks in `mobile-shell.tsx`.
