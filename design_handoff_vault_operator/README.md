# Handoff: The Vault Operator — UI Redesign

> A complete visual + interaction redesign of an existing Grateful Dead setlist/songs archive application. The application logic (catalog, search, recent plays, member data, venues, stats, etc.) already exists in the target codebase; this handoff covers the **new look & feel** that should be applied to it.

> **Addendum:** see `MEMBER_DETAIL.md` for the dedicated Band-Member detail page (`/member/<id>`) added in v.11.6.

---

## 1. About these files

The `design-reference/` folder contains an **HTML/CSS/React prototype** of the redesign. Do **not** ship it as-is. It is intentionally:

- Self-contained, no build step (uses Babel-in-browser).
- Holding fixture data inline (`data.jsx`, `data-ext.jsx`) so the visuals can be reviewed without the real backend.
- Single-file CSS (`styles.css`) — every visual rule is in there. Treat it as the source of truth for tokens, type, and component styling.

Your job is to **re-implement these screens inside the existing application** using its own framework, routing, data layer, and state management. Most of the data the screens read already exists in the app — wire it up to the new presentational components.

If the target codebase has no UI framework yet, use the framework that best fits the rest of the stack — the components in `app.jsx` / `pages.jsx` / `pages2.jsx` were written in React but the structure ports cleanly to Vue, Svelte, SwiftUI, etc.

## 2. Fidelity

**High-fidelity.** Colors, type ramp, spacing, borders, shadow offsets, and copy are all final. Recreate pixel-for-pixel; the warm "operator's-handbook" aesthetic depends on those exact tokens being preserved.

## 3. Design language — the elevator pitch

The redesign frames the app as an **annotated archival ledger** — a printed handbook with a working tape player at the bottom. Visual cues:

- Warm parchment background with subtle radial foxing + SVG noise overlay (`body::before`, `body::after` in `styles.css`).
- A masthead with **double-rule top + bottom borders**, oversized display serif title (`Stealyour​Stats`), mono metadata flanks (date/weather/search on the right).
- Tab-style chapter nav across the top with Roman numerals (I–IX).
- Two-column page grid (`1fr 332px`) — main content left, ledger / pinned / margin notes right. Wide pages (Search, Stats, etc.) drop the right column.
- A persistent **bottom-bar tape-deck player** with spinning reel, scrubber-with-ticks, vol slider, queue drawer.
- A **colophon** (footer with print-shop credits + ❦ glyphs).

The vocabulary is consistent: "the ledger", "indexed", "edition", "the deck", "pp. 0001–2333", "M.M.X.X.V.I". Keep it.

---

## 4. Design tokens

All defined as CSS custom properties in `styles.css` `:root`. Re-use these whether you stay in CSS-variables or port to your design-system tokens.

### Colors

| Token            | Value     | Role                                    |
| ---------------- | --------- | --------------------------------------- |
| `--paper`        | `#f1e6cf` | Page background (warm cream)            |
| `--paper-2`      | `#ead9b6` | Right column / inset surfaces           |
| `--paper-3`      | `#e2cd9f` | Badges, chip backgrounds                |
| `--paper-edge`   | `#cfb886` | Border tones                            |
| `--ink`          | `#1a140c` | Primary text + hard rules               |
| `--ink-2`        | `#3a2d1c` | Secondary text                          |
| `--ink-3`        | `#6b5535` | Tertiary text, metadata                 |
| `--ink-4`        | `#8c7a55` | Disabled / quietest text                |
| `--forest`       | `#1f3a2c` | Italic accents in headings (h2 italics) |
| `--forest-2`     | `#2f5240` | Secondary green                         |
| `--rust`         | `#a8391f` | The accent color — numerals, dots, play button, active tab underline, "live" dot |
| `--rust-dark`    | `#7a2511` | Hover state of `--rust`                 |
| `--ledger-blue`  | `#2c4a6a` | Occasional accent in stat tables        |
| `--rule`         | `rgba(26,20,12,0.55)` | Solid rules                   |
| `--rule-soft`    | `rgba(26,20,12,0.22)` | Soft rules / inner borders    |
| `--rule-faint`   | `rgba(26,20,12,0.10)` | Quietest rules                |
| `--hi`           | `rgba(168,57,31,0.10)` | Hover background (faint rust)|

### Type ramp

| Token              | Stack                                                 | Use                                |
| ------------------ | ----------------------------------------------------- | ---------------------------------- |
| `--serif-display`  | DM Serif Display, Bodoni Moda, Bodoni 72, Didot       | All headlines, big stat numerals   |
| `--serif-numerals` | Bodoni Moda, DM Serif Display, Didot                  | Numeric displays (alternate)       |
| `--serif-body`     | Crimson Pro, EB Garamond, Hoefler Text, Georgia       | Body copy, ledes, list items       |
| `--mono`           | JetBrains Mono, IBM Plex Mono, ui-monospace           | Metadata, kickers, badges, time codes |
| `--blackletter`    | UnifrakturMaguntia, Old English Text MT               | The "Dead" word in the masthead subtitle only |

Loaded from Google Fonts in the HTML head — replicate that load or substitute the closest match in the target system's font pipeline.

**Scale used:**

- Masthead H1 (`Stealyour​Stats`): **78px** display serif, line-height 0.85, letter-spacing -0.012em.
- Section H2 (page heads): **44–52px** display serif, italic accents in `--forest`.
- Featured H2 (home): **~60px** display serif, two-line.
- KPI big values: 36–56px display serif.
- Body: 16px Crimson Pro, line-height 1.45.
- Lede: 17px Crimson Pro italic, max-width 60ch.
- Kicker (above H2): 11px mono, uppercase, letter-spacing 0.18em, color `--ink-3`.
- Gutter labels (column headers): 9.5px mono uppercase, letter-spacing 0.18em; right-column variant is 11.5px / 500 weight.
- Time codes, badges, kbd chips: 9.5–11px mono.
- Body 12.5px mono uppercase: header left/right column metadata.

### Spacing & layout

- Page outer: `max-width: 1480px; margin: 0 auto; padding: 24px 56px 160px`. Bottom padding leaves room for the persistent player.
- Masthead grid: `1fr auto 1fr`, `gap: 32px`, double-rule borders (`4px double --ink`).
- Main two-column grid: `1fr 332px`, no gap; right column sits on `--paper-2` with `1px solid --rule` left border. The right column is **omitted on wide routes** (Search, Stats, Venues, Eras, Members, Recent, Export, Songs, Show, Song).
- Chapter tabs: bottom border 1px `--ink`; active tab carries a 3px `--rust` underline at the bottom edge (`::after`).
- Card / input chrome: `1.5px solid --ink` border, `--paper` background, `box-shadow: 3px 3px 0 --rule-soft`. This "hard offset shadow" is the consistent treatment for inputs, dropdowns, and play-CTA chips.

### Borders / shadows / radii

- All borders are `1.5px solid --ink` (or `1px` for dividers / `--rule-soft` for soft inner rules).
- Radii are **0** almost everywhere — this is a flat, set-in-type aesthetic. The only round things are the player's reel/needle/knob and the small `--rust` dot used in section headers.
- Shadows: **2–3px hard offset** (`2px 2px 0 var(--rust)` for the player's reel; `3px 3px 0 var(--rule-soft)` for inputs; `2px 2px 0 var(--ink)` for the round play button).

### Decorative motifs

- The `❦` (floral heart) glyph — appears in section breaks, edition strip, colophon. Rust color.
- `▶` arrow before active items in the left-index list.
- `★` markers next to featured rows (e.g. Fox Theatre '77 in the venues list).
- Section dividers: 1px `--rule` line with `❦` overlapping in `--paper` background, centered.

### Page-level body texture

```css
body::before { /* 4 radial-gradient foxing blobs in rust/brown */ }
body::after  { /* 220×220 SVG fractalNoise tile, opacity 0.42, mix-blend-mode: multiply */ }
```

Keep both. They give the parchment its life.

---

## 5. Layout shell

Implement the page shell once and have every route render inside it.

```
<div class="page">
  <Masthead/>
  <EditionStrip/>
  <Chapters/>
  <div class="grid [wide]">{routeBody}</div>
  <Colophon/>
  <Player/>           <!-- fixed bottom -->
  <QueueDrawer/>      <!-- fixed, slides in -->
</div>
```

### 5.1 Masthead (`.masthead`)

Three-column grid:

- **Left (.left)**: just a single line — `INDEXED TUE 19 MAY MMXXVI · 04:12 EST`. Mono 12.5px, uppercase, `--ink-2`. Anchored to the **top** of the masthead via `align-self: start`.
- **Center (.center)**: huge `Stealyour​Stats` title with the word "your" italic + rust. Below it a subtitle: `The Dead Archive · compiled by hand, played through the deck` (the word "Dead" is blackletter, forest color).
- **Right (.right)**: vertical flex, two children stretched top↔bottom.
  - Top: weather line — `49°F · clear sky and a Sunshine Daydream`. Same mono 12.5px uppercase style as the left column.
  - Bottom: search input — `1.5px solid --ink` border, paper background, mono 12px, with `⌕` glyph leading and a `⌘K` keyboard chip trailing. Width matches the weather line above it.

### 5.2 Edition strip (`.edition-strip`)

Thin row under the masthead. Three slots:
- Left: `Pp. 0001 — 2333` (the catalog's "page range").
- Center: `❦  An Annotated Guide to Grateful Dead Songlists  ❦`.
- Right: `setlist.fm · archive.org · this volume` (sources).

Mono 10px uppercase, color `--ink-3`. Bottom-bordered with 1px `--rule`.

### 5.3 Chapter nav (`.chapters`)

Horizontal tab bar of 9 chapters:

| Num   | Label        | Badge   | Route key |
| ----- | ------------ | ------- | --------- |
| I     | Home         | —       | `home`    |
| II    | Search       | `⌘K`    | `search`  |
| III   | Songs        | `442`   | `songs`   |
| IV    | Recent       | `12`    | `recent`  |
| V     | Band Members | —       | `members` |
| VI    | Venues       | `382`   | `venues`  |
| VII   | Eras         | —       | `eras`    |
| VIII  | Stats        | —       | `stats`   |
| IX    | Export       | —       | `export`  |

- Tab I (Home) is **18px** display serif.
- Tabs II–IX are **14.4px** display serif (20% smaller than tab I). This intentional asymmetry emphasizes Home.
- Each tab has the roman numeral in mono 9.5px rust before the label, and an optional badge in mono 9.5px ink-3.
- Active tab carries a 3px `--rust` underline (`::after`) flush with the bottom border.
- Right-aligned in the bar: `PG. 0001 of 2333` (the current "page number" — purely decorative; can be hardcoded or wired to route index).

### 5.4 Colophon (`.colophon`)

Three-slot footer under the grid:
- Left: `© MMXXVI · Steal Your Stats Press · Made by hand`
- Center: `❦  If you get confused, listen to the music play  ❦`
- Right: `v.11.5 · cached locally · last sync 1h ago`

Mono 10px uppercase, `--ink-3`. Border-top 1px `--rule`.

### 5.5 Player (`.player`) — persistent bottom bar

A 3-column grid (`minmax(260, 320) / 1fr / minmax(220, 280)`) fixed to the bottom of the viewport.

- **Left "now playing"**: 56×56 stamp (paper-2 fill, 1.5px ink border, 2px rust offset shadow) containing a **36px circle** (1.5px ink border) with a small rust dot in the middle. The circle `animation: spin 6s linear infinite` while playing.
  Next to it: track title (24px display serif, ellipsis) and a mono 10.5px uppercase sub-line — `{showDate} · {venue} · REEL TO REEL`.
- **Center transport**: ◀◀ / ▶ / ▶▶ buttons. The play button is a **38px round rust circle** with `2px 2px 0 --ink` hard shadow. Below them, the scrubber: elapsed time | bar | duration.
  - The bar is a **horizontal rule with 11 evenly-spaced tick marks**, a rust 1px fill from left, and a 12px round needle (rust + ink border) at the playhead.
- **Right controls**: VOL label + a small 80px slider built identically (rule + fill + 8px knob). And a `Queue [N]` toggle button (mono 10px uppercase, 1px ink border).
- **Status row** below the controls: left side reports playback state (`standby · no queue · click a setlist track to begin` / `cued · 4 tracks · 32:14 left` / `playing entire show · queue · 28 tracks · 1:42:38 left`); right side: `Side A · Track 3 / 28 · 72 dB`.

### 5.6 Queue drawer (`.queue`)

Slides up when the `Queue` button is toggled. Header `Queue · N TRACKS · time left`, list of cued tracks (number / title / show meta / duration / × remove), footer with `Clear & play entire show` button.

---

## 6. Pages

Every page that is not Home uses `.page-head` (kicker + h2 + lede + optional toolbar) at the top, then content sections separated by `.section-head` rules (h3 + descr + meta right-aligned), then KPI rows, then tables/lists.

### 6.1 Home (`home`)

**Two-column.** Left main column = "Featured · On This Day", right = ledger gutter.

**Main column** (`pages.jsx :: HomePage`):
- Gutter label: `Featured · On This Day` / `PG. 1977`. 11.5px / 500 weight.
- `<h2>` for the date:
  - Smaller (0.88em) line: `Thursday, the 19th of May` — "19" has a rust `th` superscript; "of" is italic forest.
  - Bigger (0.85em italic, `--ink-3`) line: `1977`.
- Venue line: `**Fox Theatre** · Atlanta, Georgia — "the Fabulous Fox," a movie palace built in 1929`.
- Meta row: tour name, era, tape lineage. Mono badges.
- Two setlist columns (Set I, Set II) followed by an Encore card. Each track row is clickable → plays via `playTrack(id, ALL_TRACKS)`.
- Tracks render: roman position number, title, optional `note` (italic), `dur` right-aligned, optional `segue ›` arrow between tracks.

**Right ledger column** (`RightLedger`):
- Section: `The Ledger · Stats` / `MMXXVI`. Stats cards (Shows Indexed `2,333`, Hours Archived `6,299`, Unique Songs `442`, Last Refresh `1h ago`).
- Section: `Most Played · All-Time` / `N=2,333`. Hand-drawn bars list — track name + sparkline bar + play count.
- Section: `Also on May 19` / `6 SHOWS`. List of other May-19th shows across years, each clickable to a show detail page.

### 6.2 Search (`search`)

Wide. Big search input matches the masthead's chrome (`.search-big` — 1.5px ink border, 3px ink-faint offset shadow, mono 15px). Two columns of results below: **Songs** matching the query and **Shows** matching the query. Lede: `Let inspiration move you brightly across the catalog, the calendar, and the venues.`

### 6.3 Songs Catalog (`songs`)

Wide. Lede: `442 unique titles in the catalog. Filter to narrow.` Filter input (`.filter-input` — same chrome as masthead search, but at 12px mono). Songs render in alphabetical columns; each title links to a song detail page.

### 6.4 Recent (`recent`)

Wide. Lede: `{N} tracks stored across {days} days of this long, strange trip.` Day-grouped list (TODAY / YESTERDAY / earlier date), each entry = time-of-play / track title / show context / duration.

### 6.5 Band Members (`members`)

Wide. Lede: `Ten people sat in a Grateful Dead lineup between 1965 and 1995. Six core, four just passing through.`
- Section: `The core six` — descr `— the founding lineup`, meta `1965 — 1995`.
- Section: `Passing through` — descr `— keyboardists and harmony singers`, meta `1971 — 1995`.

### 6.6 Venues (`venues`)

Wide. Lede: `25 unique venues to truck through.` KPI row (Unique Venues / Most-played venue / Showing-after-filter). Filter input + table of venues with shows count, era span.

### 6.7 Eras (`eras`) and Era Detail (`era`)

Wide. Cards for each era (Primal, Pigpen, Keith, Brent, Bruce/Vince), each with a date range, key facts, and "go deeper" link.

### 6.8 Stats (`stats`)

Wide. **No right column.**
- H2: `The big numbers, *through the years.*`
- Lede: `Every show, every song, every hour of hand-filed tape.`
- KPI row of headline numbers.
- Shows-per-year section — `Shows per year  1965 — 1995`, peak year highlighted. Italic caption: `Peak — {year}, {N} shows. The longest stretches off-road came in 1975 (the studio year) and 1986 (Garcia's coma).`
- Multiple chart blocks below (distribution of song lengths, era contribution, tour timeline).

### 6.9 Export (`export`)

Wide. Tabbed builder for exporting playlists / spreadsheets / printable setlists.

---

## 7. Interactions & behavior

- **Routing**: hash-based router in `useRouter` (`app.jsx`). Routes: `home, search, songs, song, show, recent, members, venues, eras, era, stats, export`. Replace with the host app's router.
- **Player state**: kept in `usePlayer`. Plays a queue of tracks; `playEntireShow` queues all of `ALL_TRACKS` (the flattened featured show). The player ticks every 250ms and auto-advances at track end.
- **Track click → play**: any setlist row, recent-log row, queue row, or pinned song calls `player.playTrack(trackId, contextTracks)`. The track that's playing gets a `current` highlight in the queue drawer.
- **Pinned songs (left index)**: clicking jumps to the earliest version of that title in the vault (`onPlayPinned` in `app.jsx`).
- **Search input** (`⌘K`): pressing Enter in the masthead search routes to `search` with the query as a param.
- **Tab nav**: clicking a tab routes; the active tab is derived via `ROUTE_TO_CHAPTER` so detail pages (e.g. `song`, `show`, `era`) keep their parent tab highlighted.
- **Hover affordances**: rows highlight to `var(--hi)` (faint rust wash). Buttons darken to `--rust-dark`. The play button translates `-1px, -1px` on hover and `+1px, +1px` on active, with the offset shadow scaling to match.
- **Animations**: only one — the player's reel spin (`@keyframes spin`, 6s linear infinite, runs only when `playing`).

---

## 8. State to wire up

If your existing app already has these, just plug them in:

| State                          | Source / shape                                          |
| ------------------------------ | ------------------------------------------------------- |
| `featuredShow`                 | Currently fixtured as `FEATURED_SHOW` (1977-05-19 Fox). Replace with whatever your app picks for "on this day". |
| `pinnedSongs`                  | User-scoped list of song titles + play counts.          |
| `mostPlayed`                   | All-time most-played leaderboard (label + count).        |
| `alsoOnThisDay`                | Other shows that share today's month/day.               |
| `stats / kpis`                 | Aggregate numbers (shows indexed, hours, unique songs, last refresh). |
| `recentLog`                    | Grouped-by-day list of recently played tracks.          |
| `venues`, `eras`, `members`    | Catalog tables.                                         |
| `queue / index / playing / elapsed / volume` | Persisted-locally player state.            |

---

## 9. Copy decisions (use exactly)

A few one-liners were workshopped — preserve verbatim:

- Masthead H1: **Stealyour​Stats** (with "your" italic, rust).
- Masthead sub: `The Dead Archive · compiled by hand, played through the deck` (the word "Dead" is blackletter forest).
- Right column weather: `49°F · clear sky and a Sunshine Daydream`.
- Colophon center: `❦  If you get confused, listen to the music play  ❦`.
- Home venue line: `…— "the Fabulous Fox," a movie palace built in 1929`.
- Stats h2: `The big numbers, *through the years.*`
- Stats lede: `Every show, every song, every hour of hand-filed tape.`
- Stats off-road caption: `…longest stretches off-road came in 1975 (the studio year) and 1986 (Garcia's coma).`
- Venues lede: `25 unique venues to truck through.`
- Search lede: `Let inspiration move you brightly across the catalog, the calendar, and the venues.`
- Members lede: `Ten people sat in a Grateful Dead lineup between 1965 and 1995. Six core, four just passing through.`
- Members section descrs: `— the founding lineup` / `— keyboardists and harmony singers`.
- Recent lede: `{N} tracks stored across {days} days of this long, strange trip.`

Year numerals on screen are **arabic digits** (1965, 1995, 1977, 1929, 1975, 1986) — earlier drafts used roman numerals; they have been removed.

---

## 10. Assets

No image assets are required. Everything is type, CSS, and unicode glyphs:

- Glyphs used: `❦` `▶` `★` `⌕` `⌘` `❡` `›` `◀◀` `▶▶` `❚❚` `·` `—` `★`
- Fonts: load via Google Fonts URL (see `design-reference/The Vault Operator.html` head).

---

## 11. Files in this handoff

```
design_handoff_vault_operator/
├── README.md                     ← you are here
└── design-reference/             ← the working HTML prototype
    ├── The Vault Operator.html   ← entry HTML
    ├── styles.css                ← all CSS (source of truth for tokens + components)
    ├── app.jsx                   ← shell: masthead, chapters, router, player
    ├── pages.jsx                 ← Home, Show detail, Song detail, Songs catalog, Search
    ├── pages2.jsx                ← Stats, Venues, Eras, Members, Recent, Export
    ├── data.jsx                  ← featured show + nav + pinned + stats fixtures
    └── data-ext.jsx              ← venues, recent log, member roster, song aliases
```

Open `The Vault Operator.html` in any browser to interact with the prototype — every click, hover, and the player all work.
