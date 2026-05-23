# Handoff: The Vault Operator — Mobile

> **Scope: mobile only.** This handoff covers the **mobile reimagining** of the Vault Operator app. It is intentionally self-contained — it does not reference, depend on, or describe the existing desktop UI.
>
> **Code is the source of truth.** Where this document and the production app's code disagree, **the code wins.** These files capture the original design intent for the mobile experience; in-flight changes the team has merged supersede anything written here. If the desktop styles in the codebase have evolved past what's described in here, **do not "fix" them** — leave them alone. Touch only mobile-specific styles, components, and routes.

---

## 1. About these files

The `design-reference/` folder contains an **HTML/CSS/React prototype** of the mobile design. Do **not** ship it as-is. It is intentionally:

- Self-contained, no build step (uses Babel-in-browser).
- Wrapped in an iOS device frame + a side-by-side design canvas — these are review-only scaffolds.
- Carrying fixture data inline so the visuals can be reviewed without the real backend.

Your job is to **re-implement these screens inside the existing mobile shell** of the application, using its own framework, routing, data layer, and state management. Most of the data the screens read already exists in the app — wire it up to the new presentational components.

Open `design-reference/The Vault Operator - Mobile.html` in any browser to interact with the prototype. The **Tweaks** toggle in the toolbar lets you cycle through the three Deck hero variants (see §6).

---

## 2. Files in this handoff

```
design_handoff_vault_operator_mobile/
├── README.md                       ← you are here
└── design-reference/               ← the working HTML prototype
    ├── The Vault Operator - Mobile.html   ← entry: design canvas with 4 iOS frames
    ├── mobile-styles.css                  ← all mobile CSS (source of truth)
    ├── mobile-screens.jsx                 ← Deck, Songs, SongDetail, Stats + chrome
    ├── ios-frame.jsx                      ← REVIEW SCAFFOLD — discard in implementation
    ├── design-canvas.jsx                  ← REVIEW SCAFFOLD — discard in implementation
    └── tweaks-panel.jsx                   ← REVIEW SCAFFOLD — discard in implementation
```

When implementing: take the markup from `mobile-screens.jsx`, the CSS from `mobile-styles.css`, and drop them into your mobile shell. **Discard** `ios-frame.jsx`, `design-canvas.jsx`, and `tweaks-panel.jsx` — those are only there so the design can be reviewed in a browser.

---

## 3. Design language — the elevator pitch

The mobile design frames the app as an **annotated archival ledger you can fit in one hand** — a pocket almanac with a working tape player as its home screen. Visual cues:

- Warm parchment background with subtle radial foxing + SVG noise overlay (`.mv::before`, `.mv::after` in `mobile-styles.css`).
- A small **masthead with double-rule top + bottom borders** at the top of the Deck (home) screen only — display serif title `Stealyour​Stats`, mono metadata above, italic + blackletter subtitle below.
- A thin **chapter strip** on every screen replacing the desktop's tab nav — Roman numeral chapter + label on the left, page counter on the right.
- **One column**, always. Desktop marginalia survive as **inline pull-quote `Operator's Note` blocks**.
- A persistent **64px mini-player** above the tab bar on every screen except the Deck (the Deck *is* the full player).
- A **4-tab footer** with the chapter chapters: I · Deck, III · Songs, VIII · Stats, II · Search.
- A **colophon-style ❦ divider** between sections.

The vocabulary is consistent: "the deck", "indexed", "edition", "REEL TO REEL", "MMXXVI". Keep it.

### 3.1 Guiding moves (the *why*)

- **The Deck (home) *is* the player.** On mobile the music app *is* the primary surface; the now-playing view is the home screen, not a fixed bar overlaid on a magazine page.
- **One column, always.** No multi-column gutters; marginalia (`Operator's Note`, pull-quotes) embed inline at the moment they're relevant.
- **Chapter nav becomes a 4-tab footer.** Roman numerals stay; labels are the same chapters.
- **Mini-player above the tab bar.** 64px tall, present on every non-Home screen. Tap to expand into the full Deck view (transition not built — see §10).
- **Sticky alpha headers** for long lists (Songs catalog).

---

## 4. Design tokens

All defined as CSS custom properties in `mobile-styles.css` `:root`. Re-use these whether you stay in CSS-variables or port to your design-system tokens.

### 4.1 Colors

| Token            | Value     | Role                                    |
| ---------------- | --------- | --------------------------------------- |
| `--paper`        | `#f1e6cf` | Page background (warm cream)            |
| `--paper-2`      | `#ead9b6` | Inset surfaces (mini player, status bar, chapter strip, cards) |
| `--paper-3`      | `#e2cd9f` | Tape cards, J-card inlay, mini-reel hubs |
| `--paper-edge`   | `#cfb886` | Border tones                            |
| `--ink`          | `#1a140c` | Primary text + hard rules               |
| `--ink-2`        | `#3a2d1c` | Secondary text                          |
| `--ink-3`        | `#6b5535` | Tertiary text, metadata, mono labels    |
| `--ink-4`        | `#8c7a55` | Disabled / quietest text                |
| `--forest`       | `#1f3a2c` | Lit status indicator ("playing entire show"), occasional italic accent |
| `--forest-2`     | `#2f5240` | Secondary green                         |
| `--rust`         | `#a8391f` | The accent color — numerals, dots, active tab indicator, "live" stamps, rust progress fill |
| `--rust-dark`    | `#7a2511` | Current-track title, hover state of `--rust` |
| `--ledger-blue`  | `#2c4a6a` | Era distribution accent (Brent Years)   |
| `--rule`         | `rgba(26,20,12,0.55)` | Solid rules                   |
| `--rule-soft`    | `rgba(26,20,12,0.22)` | Soft rules / inner borders    |
| `--rule-faint`   | `rgba(26,20,12,0.10)` | Quietest rules                |

### 4.2 Type ramp

| Token              | Stack                                                 | Use                                |
| ------------------ | ----------------------------------------------------- | ---------------------------------- |
| `--serif-display`  | DM Serif Display, Bodoni 72, Didot                    | All headlines, hero titles, stat numerals |
| `--serif-numerals` | Bodoni Moda, DM Serif Display, Didot                  | Big numeric displays               |
| `--serif-body`     | Crimson Pro, EB Garamond, Georgia                     | Body copy, list items, tab labels  |
| `--mono`           | JetBrains Mono, ui-monospace                          | Metadata, kickers, badges, time codes |
| `--blackletter`    | UnifrakturMaguntia, Old English Text MT               | The word "Dead" in the masthead subtitle only |

Loaded from Google Fonts (see the `<link href="https://fonts.googleapis.com/css2?…"…>` line in `The Vault Operator - Mobile.html` head). Replicate that load or substitute the closest match in the target system's font pipeline.

**Scale used on mobile (smaller and denser than desktop equivalent):**

| Role                          | Size                          |
| ----------------------------- | ----------------------------- |
| Masthead H1 (`Stealyour​Stats`) | 28px display serif            |
| Page H2 (e.g. song title)     | 44px display serif (page anchor — kept big) |
| Stats headline figure         | 84px Bodoni 700 (-0.04em tracking) |
| KPI numerals                  | 22–28px Bodoni 700            |
| Hero track title (Deck)       | 30px display serif            |
| Card / row title              | 17–17.5px Crimson Pro         |
| Set / section heads           | 20–22px display serif         |
| Body                          | 15px Crimson Pro              |
| Kicker (above H2)             | 8.5–10px mono / 0.14–0.18em uppercase rust or ink-3 |
| Chapter strip                 | 9.5px mono / 0.12em uppercase ink-2 |
| Sub-line on hero / mini player | 9–10.5px mono / 0.1em uppercase ink-3 |
| Tab label (footer)            | 13px serif body italic + 11px mono numeral |
| Time codes, badges            | 10.5–11px mono                |

### 4.3 Spacing & layout

- Outer page padding inside the device viewport: **18px horizontal** (`.mv-mast`, `.mv-chapter`, `.mv-setlist`, etc.).
- Scroll region padding: **50px top** (clears iOS status bar) and **162px bottom** (clears mini player 64 + tab bar 64 + home indicator 34).
- On the Deck (Home) where the mini player is hidden, scroll region bottom padding is **98px** instead.
- Card / inset internal padding: 10–18px.
- Section-head pattern: **3px solid `--ink`** top border above section heads.
- Row separator pattern: **1px dotted `--rule-soft`** between rows.

### 4.4 Borders / shadows / radii

- All borders are `1.5px solid --ink` for chrome (mini player play button, transport play button, hero inlay), or `1px solid --rule` / `--rule-soft` for dividers.
- The mast and song-detail hero get a `3px double --ink` bottom border (the only double-rule treatment on mobile).
- Radii are **0** almost everywhere — flat, set-in-type aesthetic. The only round things: the reel + hub + transport play button + mini-player stamp + mini-player play button + era donut + alpha-rail dots + the J-card stamp + iOS-specific status-bar / home-indicator clearance.
- Shadows are sparing on mobile — only on the J-card hero variant (`0 14px 28px -22px rgba(26,20,12,0.5)`) and the inlay reel-hole gradients. No 2–3px hard offset shadows (those belong to the desktop chrome).

### 4.5 Decorative motifs

- The `❦` (floral heart) glyph — appears in `.mv-divider` between sections at end of pages. Rust color.
- `▶` marker before the current track in setlists (absolute-positioned at `left: -2px`).
- `✦` star markers used as section dividers (status row, "NOW PLAYING" label in the grid hero).
- `❡` pilcrow used as the pin icon in setlist rows.
- `›` chevron used at the end of list rows that lead to detail pages.
- `⌕` glyph for search inputs.

### 4.6 Page-level body texture

```css
.mv::before { /* radial-gradient foxing in rust/brown, opacity built into colors */ }
.mv::after  { /* 220×220 SVG fractalNoise tile, opacity 0.38, mix-blend-mode: multiply */ }
```

Keep both. They give the parchment its life. **Slightly lower opacity than the desktop equivalent** (0.38 vs 0.42 on desktop) because the smaller viewport amplifies the noise pattern.

---

## 5. Layout shell

Every screen renders inside the same shell:

```
┌─────────────────────────────────┐
│  iOS status bar (47px)          │  ← system, not ours
├─────────────────────────────────┤
│  .mv-mast        (optional)     │  ← masthead, ONLY on Deck/Home
│   ┌───────────────────────────┐ │
│   │ Indexed Tue 19 May MMXXVI │ │   (mono 9px uppercase)
│   │      Stealyour​Stats       │ │   (28px display serif)
│   │  The Dead Archive · …     │ │   (11px italic + blackletter)
│   └───────────────────────────┘ │
├─────────────────────────────────┤
│  .mv-chapter                    │  ← chapter strip, every screen
│   III. SONGS · CATALOG    442   │   (mono 9.5px / paper-2 bg)
├─────────────────────────────────┤
│                                 │
│  .mv-scroll                     │  ← scrollable content
│   { route body }                │     padding-top 50px (clears status bar)
│                                 │     padding-bottom 162px (clears chrome)
│                                 │
├─────────────────────────────────┤
│  .mv-mini   (64px, NOT on Home) │  ← persistent mini player
├─────────────────────────────────┤
│  .mv-tabs   (64px, every screen)│  ← 4-tab footer chapter nav
├─────────────────────────────────┤
│  iOS home indicator (34px)      │  ← system, not ours
└─────────────────────────────────┘
```

### 5.1 Top mast (`.mv-mast`)

Only on the Deck (Home) screen. Vertically-stacked masthead:

- **Top row**: flex `space-between` — indexed date on the left (`INDEXED TUE 19 MAY MMXXVI`), cache status on the right (`CACHED · 24H`). Mono 9px / 0.14em uppercase, ink-3.
- **H1**: centered `Stealyour​Stats` — the word "your" is **italic + rust** (`--rust`), set in `--serif-body` at 17px so it reads as an intrusion in the display-serif word. The outer words are 28px DM Serif Display.
- **Sub-line**: `The Dead Archive · *by hand, through the deck*` — body italic, the word "Dead" rendered in blackletter (`--blackletter` family) at 15px.
- Bottom border: **3px double `--ink`**.

Every other screen jumps straight from the iOS status-bar clearance to the chapter strip, to save vertical real estate.

### 5.2 Chapter strip (`.mv-chapter`)

Single row on every screen replacing the desktop's tab nav:

```
III. SONGS · CATALOG                                          442
```

- Left: roman numeral in rust (`--rust`), then a period, then the chapter label and an optional sub-path (e.g. `III·a SONGS › DETAIL`).
- Right: page counter or entry count (`442`, `0001`, `1842 / 2333`).
- Mono 9.5px / 0.12em uppercase, ink-2 on paper-2, 1px ink-rule bottom border.
- `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` on the left span so the label clips cleanly when narrow.

### 5.3 Mini player (`.mv-mini`)

Above the tab bar on every screen **except Home** (since Home **is** the full player).

```
┌────────────────────────────────────────────────────┐
│  ◯       Scarlet → Fire                  ▶▶   ❚❚  │
│  ⊙       1977 · CORNELL · SIDE B                   │
└────────────────────────────────────────────────────┘
 ▔▔▔▔▔▔▔▔▔ rust progress hairline (2px) ▔▔▔▔▔▔▔
```

- 64px tall, paper-2 background, **3px double `--ink`** top border.
- Grid: `44px 1fr auto auto` — stamp / meta / skip-next / play-pause.
- **Stamp**: 34px round, paper-3 fill, 1px ink-2 border, dashed inner ring at `inset: 4px` that animates `mv-spin 10s linear infinite`. A 9px ink-2 dot at center. Pause the animation when `!player.playing`.
- **Meta**: track title (14.5px serif body, single-line ellipsis) over a mono 9px / 0.1em uppercase sub-line.
- **Skip-next** ▶▶: 12px mono, ink-2, padded.
- **Play-pause** ❚❚ / ▶: 36px round, 1.2px ink border, paper background. Same vocabulary as the round transport button.
- **Hairline progress**: 2px rust strip at the very bottom (`bottom: -1px`), width = `(elapsed / duration) * 100%`. Set inline, update on the player tick.
- **Tap target**: the whole bar expands to the full Deck view (transition not built — see §10).

### 5.4 Tab bar (`.mv-tabs`)

A 4-tab footer fixed at `bottom: 34px` to clear the iOS home indicator:

| #     | Numeral | Label    | Route key |
| ----- | ------- | -------- | --------- |
| 1     | I       | Deck     | `deck`    |
| 2     | III     | Songs    | `songs`   |
| 3     | VIII    | Stats    | `stats`   |
| 4     | II      | Search   | `search`  |

- 64px tall, paper-3 background, 1px `--rule` top border, 1px `--rule-soft` between cells.
- Each tab: roman numeral (mono 11px / 0.16em uppercase, ink-3 → rust when active) above the label (13px serif body, ink-2 → ink + italic when active).
- Active tab carries a **2px `--rust` indicator** along the top edge, inset 14% on each side (`::before` with `top: 0; left: 14%; right: 14%`).
- Detail pages (Song Detail, Show Detail, etc.) keep their parent tab highlighted — same `ROUTE_TO_CHAPTER` pattern: `song → songs`, `show → deck`, etc.

Other chapters (IV Recent, V Members, VI Venues, VII Eras, IX Export) are **not first-class on mobile** in this design — they're reachable via in-content cross-links and sheets. See §10 for the open work.

---

## 6. Screen anatomy

Four screens are designed. Each is a vertical stack of sections separated by the section-rule pattern (3px `--ink` top + 1px `--rule-soft` bottom).

### 6.1 Deck — Home / Now Playing (`deck`)

The home screen. **No mini player** — the Deck *is* the full player. Mast at top, then chapter strip `I. THE DECK · NOW PLAYING / 0001`, then:

```
┌─────────────────────────────────┐
│                                 │
│         [ hero — 220×220 ]      │  ← see §7 for 3 variants
│                                 │
│       Scarlet Begonias →        │  ← 30px display serif
│       Fire on the Mountain      │
│   05·08·1977 · Cornell, Barton  │  ← 10.5px mono + REEL TO REEL tag
├─────────────────────────────────┤
│  0:14    ──●─────────    21:47  │  ← progress: time | bar+ticks+needle | time
│                                 │
│   ◀◀    −10   [ ❚❚ ]   +10   ▶▶ │  ← 5-cell transport
├─────────────────────────────────┤
│  ● playing entire show · 14     │  ← status row (paper-2, mono 9.5px)
│         tracks      1:42:08 left│
├─────────────────────────────────┤
│  ─── Set II ──────── 7 / 58:14  │  ← set head
│   01  Estimated Prophet   9:32  │
│ ▶ 02  Scarlet → Fire    21:47   │  ← current track: rust wash + ▶ marker
│   03  Good Lovin'         8:04  │
│   …                             │
│                                 │
│  ┌────────────────────────────┐ │
│  │ OPERATOR'S NOTE            │ │  ← inline pull-quote
│  │ Believed by many … the     │ │
│  │ single finest tape …       │ │
│  └────────────────────────────┘ │
└─────────────────────────────────┘
                  ━━━━━ tab bar ━━━━━
```

**Transport** (`.mv-transport`):
- Progress row: `38px 1fr 38px` grid — elapsed | bar | duration. The bar has 11 evenly-spaced tick marks, a 2px rust fill from left, and a 10px round needle (paper fill, 1.5px rust border) at the playhead.
- Controls row: 5-cell grid — `◀◀`, `−10`, **play (64px round)**, `+10`, `▶▶`. The play button is paper-2 with a 1.5px ink border; the four ghost buttons are paper with 1px ink-2 borders.

**Status row** (`.mv-status`):
- Paper-2 background, 8px vertical padding, 1px ink-rule bottom border.
- Left: state — `● playing entire show · 14 tracks` (the dot is forest green, blinking 1.6s ease-in-out) or `cued · N tracks` or `standby · no queue`.
- Right: `1:42:08 left`.

**Setlist** (`.mv-setlist`):
- `.mv-set-head`: 3px ink top border + 1px rule bottom border. Set name (22px display serif) on the left, mono meta `7 tracks · 58:14` on the right.
- **Track row** (`.mv-track`): 4 columns — `22px 1fr 48px 18px` — number / title / duration / pin glyph (`❡`). 8px vertical padding, dotted bottom border.
- Current track: `linear-gradient(to right, rgba(168, 57, 31, 0.08), transparent 88%)` wash + italic rust-dark title + `▶` marker absolute at `left: -2px`.
- Segue arrow (`→`) renders inline in the title at rust + italic + 14px (e.g. `Scarlet → Fire`).

**Operator's Note** (`.mv-note`):
- 14px italic serif on paper-2 with a 2px rust left-border.
- Label "OPERATOR'S NOTE" auto-generated via `::before` in mono 9px / 0.16em uppercase rust. **Don't write the label yourself.**
- This is the survival of marginalia from the broadsheet — instead of right-gutter notes, notes embed inline at the moment they're relevant. Drop a `.mv-note` at the bottom of any section that warrants annotation.

### 6.2 Songs catalog (`songs`)

Chapter strip `III. SONGS · CATALOG / 442`, then:

```
┌─────────────────────────────────┐
│ ⌕ Search songs, lyrics …  [442] │  ← search row, paper bg, italic placeholder
├─────────────────────────────────┤
│ A                5 · Alabama → … │  ← STICKY alpha head (2px ink top border)
│   Alabama Getaway          78×› │  ← song row
│   Althea                  274×› │
│   And It Stoned Me          4×› │
│   …                             │
│ B                9 · Beat → …    │  ← STICKY (replaces A as user scrolls)
│   Bertha                  391×› │
│   …                             │
└─────────────────────────────────┘
```

- **Search row** (`.mv-search`): 3-cell grid — `⌕` glyph / italic input / count chip. Placeholder italic serif. The chip is a small 1px rule-soft box with the catalog count.
- **Alpha header** (`.mv-alpha-head`): `position: sticky; top: 0; z-index: 3` so the current letter pins to the top of the scroll region as the user scrolls. Big 28px display-serif letter on the left, mono 9px count on the right (`"5 entries · Alabama → Attics"`).
- **Song row** (`.mv-song-row`): 3-cell grid `1fr 56px 18px` — title (17.5px serif), play count (11px mono ink-3, right-aligned), chevron (12px mono ink-4). Dotted bottom border. Tap → song detail.
- **Alpha rail** (`.mv-alpha-rail`): a vertical strip of A–Z down the right edge in 9px mono, ink-3. Active letter rust. **Decorative-only in the prototype** — wire to a jump-scroll on tap and a drag-to-scrub for the iOS-Contacts gesture.

### 6.3 Song Detail (`song`)

Chapter strip `III·a SONGS › DETAIL / 0214 / 2333`. Hero, then KPI strip, then extremes pair, then recent versions, then an operator's note.

```
┌─────────────────────────────────┐
│ CATALOG № 0214 · AN ORIGINAL    │  ← kicker (9.5px mono rust)
│ Scarlet Begonias                │  ← 44px display serif H2
│ Composed by Garcia / Hunter,    │  ← byline (14px italic serif body)
│  1974. First performed at Cow … │
├─────────────────────────────────┤
│  Times Played │ First   │ Last  │  ← .mv-kpi-row (3 cells, 1px --rule-soft dividers)
│      318      │ 03·1974 │ 07·19…│
├─────────────────────────────────┤
│  ╔═══════════════════════════╗  │
│  ║ SHORTEST    ║ LONGEST     ║  │  ← .mv-extremes (2 cells, rust labels, faint rust bg)
│  ║   6:12      ║   14:08     ║  │
│  ║ 10·1974 …   ║ 05·1977 …   ║  │
│  ╚═══════════════════════════╝  │
├─────────────────────────────────┤
│ ━ Recent versions ━━━ of 318 ›  │  ← section head
│  07·09·1995  Soldier Field      │  ← .mv-version (3-cell row)
│                  CHICAGO, IL    │
│                          11:24  │
│  06·22·1995  Knickerbocker …    │
│  …                              │
│                                 │
│  ┌──── OPERATOR'S NOTE ───┐     │
│  │ The Cornell pairing …  │     │
│  └────────────────────────┘     │
└─────────────────────────────────┘
```

- Hero (`.mv-song-hero`): kicker + 44px H2 + byline. Bottom border is `3px double --ink`.
- KPI strip uses `--serif-numerals` (Bodoni Moda 700) for the numbers, mono labels above. First/Last use a smaller `18px` numeral so the dates fit; Times Played is 26px.
- Extremes pair (`.mv-extremes`): 2-cell grid with a 1px `--rule` outline and `rgba(168, 57, 31, 0.03)` rust wash background.
- Recent versions list: 3-cell row `56px 1fr 48px` — date (mono 11px ink) / venue (italic serif) + city (mono 9.5px ink-3, block-displayed under the venue) / duration (mono 11px). Tap → show detail.

### 6.4 Stats — The Almanac (`stats`)

Chapter strip `VIII. STATS · ALMANAC / 1842 / 2333`. Begins with a single big figure, then a 2×2 KPI quad, then a most-played ledger, then an era donut.

```
┌─────────────────────────────────┐
│         2,318                   │  ← .mv-bigfig (84px Bodoni 700)
│  documented shows between       │
│  1965 and 1995                  │  ← rust mono year tags inline
├─────────────────────────────────┤
│ Unique songs  │ Total perfs.    │  ← .mv-kpi-quad (2x2)
│     442       │    41,807       │
│ of which 218  │ across thirty   │
│ are originals │ years           │
├───────────────┼─────────────────┤
│ Hours on tape │ Venues          │
│    6,422      │     382         │
│ ≈ 267 days    │ in 31 countries │
├─────────────────────────────────┤
│ ━ Most-played, all-time ━ ›     │
│  I   Sugar Magnolia       596×  │  ← rank in rust roman numeral
│  II  Truckin'             532×  │     bar underneath = % of leader
│  ─── (rust 0.45 opacity fill) ──│
│  …                              │
├─────────────────────────────────┤
│ ━ Era distribution ━━━━━━ 5 ›   │
│  ◯◐◑    Pigpen '65–'72   24%   │  ← .mv-era-donut: 120px donut + legend
│         Keith & Donna    22%   │
│         Brent Years      31%   │
│         Final Chapter    14%   │
│         Reunions          9%   │
└─────────────────────────────────┘
```

- `.mv-bigfig`: 84px Bodoni 700 with -0.04em tracking. Italic serif caption underneath; mono 12px rust tags inline-style the year boundaries (`1965`, `1995`).
- `.mv-kpi-quad`: 2×2 grid, 1px `--rule-soft` dividers between cells, no border on the outer edges of the row.
- `.mv-ledger .row`: 3-cell `22px 1fr auto` — rank (18px Bodoni 700 rust) / name (17px serif body) / count (12px mono). The bar underneath is `position: absolute` with `linear-gradient(to right, --rust var(--w), transparent var(--w))` driven by a `--w` custom prop set inline per row.
- Donut: pure SVG, `viewBox="-60 -60 120 120"`, rotated `-90deg` so the first slice starts at 12 o'clock. Each arc is a `<circle>` with `strokeDasharray` + `strokeDashoffset`, stroke width 14. Era colors: rust / forest / ledger-blue / ink-2 / ink-4.

---

## 7. Hero variants (Deck screen)

The Deck hero has **three swappable treatments**. The default is `reel`. The Tweaks toggle in the prototype's toolbar cycles between them.

### 7.1 `reel` — single spinning reel-to-reel (default)

A 220×220 circular plate with three concentric rings (outer ink border, dashed inner ring, solid inner inner ring), a 60×60 hub at center stamped `A · 01`, and three spokes that rotate `360deg` over 14s linear infinite via `@keyframes mv-spin`. The animation pauses on `.mv-reel.paused` (drive it from `player.playing`).

**The play state is the animation.** No separate play/pause icon overlaid on the hero — the play button lives in the transport row below. The reel either spins or doesn't.

**Use this** as the production default. It is the most identity-rich treatment and the most "object"-like.

### 7.2 `inlay` — printed J-card

The rectangular paper insert that came inside a cassette case. Roughly 360×260 on a 402-wide screen. Layout:

- Two **reel-hole circles** at the top corners — implemented as twin radial-gradients on `.mv-hero-inlay`'s background, so they show through to the warm paper underneath rather than being separate elements.
- Centered: small mono catalog label (`SBD · Side B · Reel 02 of 04`), then a 26px display-serif title, then an italic 14px venue line.
- A 32-bar **barcode** with hand-tuned widths (`flex: 3 1 2 4 1 2 …`) — purely decorative.
- A 64px round **"REEL TO REEL" stamp** in rust, rotated -14deg, anchored bottom-right and overhanging the inlay's edge by 12px (acts as a wax-seal mark).
- Box-shadow: `0 14px 28px -22px rgba(26,20,12,0.5)`.

**Use this** if the team wants the most "print-set object" feel — the home screen reads as a museum-piece tape inlay. It loses the play-state animation, so reach for it when play state is communicated elsewhere (the round play button below, the hairline progress under the mini-player on other screens).

### 7.3 `grid` — Now Playing + 2×2 of recents

A familiar music-app vocabulary in archival typography:

- Top: a single "Now Playing" card (paper-3, 1.5px `--ink` border, with a `✦ NOW PLAYING` label notched into the top border via `::before` with a paper-color background to "cut" the border). Inside: a 54px mini-reel (spinning), the track title in 19px display serif, mono sub-line, and a 42px round play button on the right.
- A `From the same reel · 4 of 14 ›` label-strip below.
- A 2-column grid of 4 tape cards — each card has a small ink "reel hole" mark in the top-right corner, mono date, serif title, and a mono venue/set position line.

**Use this** if the broader app prioritizes "discoverability" — surfacing what's around the current track. It's the most conventional choice and the least visually distinctive.

**Recommendation:** ship `reel` as the production default. Keep `inlay` and `grid` as wireframes for a v2 conversation — they're each one CSS file's worth of work to bring live, but they shift the home-screen's emphasis enough that the team should sign off explicitly before swapping. If you want a tweakable user preference, expose `heroStyle` as a Settings option (`Reel / J-card / Grid`) and persist per-account.

---

## 8. Interaction patterns

| Pattern               | Where                       | How                                                                 |
| --------------------- | --------------------------- | ------------------------------------------------------------------- |
| Mini-player → full    | Tap `.mv-mini`              | Slide-up sheet that occludes chapter strip + content. **Not built** — see §10. |
| Alpha-rail scrub      | `.mv-alpha-rail` on Songs   | Drag down the rail to jump-scroll the list. iOS Contacts gesture. **Not built** — currently decorative. |
| Sticky alpha headers  | `.mv-alpha-head` on Songs   | `position: sticky; top: 0`. Already wired in CSS.                   |
| Pull-quote notes      | `.mv-note` anywhere         | Inline replacement for right-gutter `Operator's Note`. Drop at the bottom of any section that warrants annotation. |
| Operator quote label  | `.mv-note::before`          | Auto-generates "OPERATOR'S NOTE" in mono 9px rust. Don't write the label yourself. |
| Status row dot blink  | `.mv-status .dot`           | `animation: mv-blink 1.6s ease-in-out infinite`. Drive on/off from `player.playing`. |
| Reel spin             | `.mv-reel .spokes`          | `animation: mv-spin 14s linear infinite`. Pause via `.paused` class when `!player.playing`. |
| Mini reel spin        | `.mv-mini .stamp::after`    | Same animation, 10s period. Pause same way.                        |
| Track current marker  | `.mv-track.current`         | Rust wash + `▶` glyph at `left: -2px`. Toggled by `current === track.id`. |
| Hairline progress     | `.mv-mini .hair`            | Width = `(elapsed / duration) * 100%`. Set inline, update on tick. |

---

## 9. State to wire

| State            | Source / shape                                           |
| ---------------- | -------------------------------------------------------- |
| `featuredShow`   | The "on this day" / now-playing show. Powers the Deck. |
| `currentTrack`   | The currently-playing track within the queue. |
| `queue / index / playing / elapsed / volume` | Player state — same shape as desktop player. |
| `pinnedSongs`    | User-scoped list of song titles + play counts. Drives the `❡` glyph in setlist rows. |
| `songsCatalog`   | All 442 songs grouped alphabetically. Powers the Songs screen. |
| `songDetail`     | Per-song: times played, first/last dates, extremes (shortest/longest), recent versions. Powers Song Detail. |
| `stats / kpis`   | Aggregate numbers (total shows, unique songs, total performances, hours on tape, venues). Powers Stats headline + quad. |
| `mostPlayed`     | All-time leaderboard (label + count). Powers Stats ledger. |
| `eraDistribution`| Per-era share of total performances. Powers Stats donut. |
| `heroStyle`      | `"reel" \| "inlay" \| "grid"`. Per-user setting. Default `"reel"`. Read on Deck mount, pass to whichever hero component renders. Persist to user prefs. |

Routing:

| Route key | Maps to tab |
| --------- | ----------- |
| `deck`    | I · Deck    |
| `songs`   | III · Songs |
| `song`    | III · Songs (parent tab stays lit) |
| `stats`   | VIII · Stats |
| `search`  | II · Search |

Detail pages keep their parent tab highlighted via a `ROUTE_TO_CHAPTER`-style mapping.

---

## 10. Not yet covered (v2)

The four screens shipped here are the floor of a usable system. Open threads:

1. **Mini-player → full-screen transition.** Recommend a slide-up sheet (translateY 100% → 0, 240ms ease-out) that occludes the chapter strip and content, with the mini player visually "growing" into the full Deck hero. Tap-to-collapse via a chevron or swipe-down.
2. **Search screen (II tab).** A full-bleed input on focus + sectioned results (Songs / Shows / Venues / Members) reusing the row patterns already designed.
3. **Show detail.** Where you arrive when tapping a "Recent version" row on Song Detail. Reuses `.mv-set-head` and `.mv-track` from the Deck.
4. **Members / Venues / Eras / Recent / Export.** Not first-class on mobile yet. **Recent** is the most-needed (it's a frequent user task). **Members** and **Eras** are the most visually involved and may want bespoke layouts. **Export** can plausibly be a settings-sheet item rather than a top-level page.
5. **Empty states.** No recent plays, no pinned songs, search with 0 results, unrecognized song slug.
6. **Loading / cached states.** Skeleton rows for the Songs list, a paused-reel state for the Deck (no spin, "ready to cue" microcopy).
7. **Settings / account.** No screen designed yet. Candidate: a fifth tab or a settings glyph in the chapter strip.
8. **Accessibility.**
   - Reduced-motion: pause both reel animations + the status-dot blink under `@media (prefers-reduced-motion)`.
   - Target sizes: every interactive element in the prototype meets the 44×44 minimum; verify when porting.
   - Contrast: rust `#a8391f` on paper `#f1e6cf` measures ~4.6:1 — meets WCAG AA for body text. Blackletter "Dead" is decorative-only; do not use blackletter for any interactive label.

---

## 11. Suggested implementation order

1. **Tokens + body texture** — port `:root` from `mobile-styles.css`, apply the foxing + noise to your mobile app shell. Visual smoke-test: a plain `<h1>` in display serif on parchment should already feel right.
2. **Tab bar + chapter strip** — the chrome that wraps every screen. Get the active-state mapping working before any screen content.
3. **Mini player** — non-interactive at first (static title + hardcoded progress hairline). Wire the spin, blink, and hairline width to live player state once it's mounted in the screen flow.
4. **Deck screen** — port the `reel` variant first; the `inlay` and `grid` variants can be wireframes for review until they're greenlit.
5. **Songs catalog** — sticky alpha headers are the only non-trivial layout move.
6. **Song Detail + Stats** — these reuse the same row vocabulary the previous screens established; they should be the fastest two.
7. **Mini-player → full-screen sheet** — last, once everything else is stable.

Treat `mobile-styles.css` as the source of truth for every visual rule.

---

## 12. Copy decisions (use exactly)

A few one-liners were workshopped — preserve verbatim:

- Masthead H1: **Stealyour​Stats** (with "your" italic + rust).
- Masthead sub: `The Dead Archive · *by hand, through the deck*` (the word "Dead" in blackletter).
- Mast top-left: `INDEXED TUE 19 MAY MMXXVI` (uppercase mono).
- Mast top-right: `CACHED · 24H`.
- Chapter strip on Deck: `I. THE DECK · NOW PLAYING / 0001`.
- Chapter strip on Songs: `III. SONGS · CATALOG / 442`.
- Chapter strip on Song Detail: `III·a SONGS › DETAIL / 0214 / 2333`.
- Chapter strip on Stats: `VIII. STATS · ALMANAC / 1842 / 2333`.
- Status row (playing): `● playing entire show · 14 tracks` / `1:42:08 left`.
- Deck operator's note: `Believed by many — including the operator — to be the single finest tape in the vault. Listen on the Maxwell, not the Sony.`
- Song Detail kicker: `CATALOG № 0214 · AN ORIGINAL`.
- Stats headline caption: `documented shows between 1965 and 1995` (rust mono year tags).
- Tab labels: `Deck / Songs / Stats / Search` (lowercase, serif italic when active).

Year numerals are **arabic digits** on data displays (1965, 1995, 1977). Roman numerals are reserved for chapter numbering (I–IX) and the rank column on the Stats ledger.

---

**Implementation reminder:** the production code is the source of truth. Where it has already diverged from this spec, leave it alone. Only touch mobile.
