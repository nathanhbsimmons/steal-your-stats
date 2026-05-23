# Handoff: Member Detail Page

> **Companion to `README.md`.** Read that first for the global design language, tokens, layout shell, and player chrome. This file covers only the **new Member Detail page** that hangs off the Band Members tab.

---

## 1. What this page is

When a user clicks a member card on the **Band Members** page (`/members`), they land on a dedicated page for that member — for example `/member/garcia`, `/member/brent`, `/member/pigpen`. There are **10 members total** (6 core, 4 passing through); the same page template renders for all of them with per-member data.

The page sits inside the same shell as every other route — masthead, edition strip, chapter nav, persistent bottom player, colophon. It is a **wide page** (no right-column gutter).

Reference implementation:

- `design-reference/pages2.jsx` → `MemberDetailPage` (component)
- `design-reference/data-ext.jsx` → `MEMBER_DETAIL`, `browseShowsForYear`, `MEMBERS`, `ERAS_DATA`, `SHOWS_PER_YEAR`
- `design-reference/styles.css` → search for the comment block **`MEMBER DETAIL PAGE`**

---

## 2. Routing

| URL                  | Maps to                                  |
| -------------------- | ---------------------------------------- |
| `#/members`          | `MembersPage` (existing)                 |
| `#/member/<id>`      | `MemberDetailPage` (new)                 |

`<id>` is the member's `id` field (see §4). The chapter-nav highlight for both routes is **V · Band Members** — keep `ROUTE_TO_CHAPTER` mapping `member → members`.

Each member card on the Members page should navigate to the detail page on click:

```jsx
<div className="member-card" onClick={() => nav.go("member", { id: m.id })}>
```

Breadcrumbs on the detail page: `HOME / BAND MEMBERS / <NAME>`.

---

## 3. Page anatomy (top to bottom)

```
┌─────────────────────────────────────────────────────────────┐
│  HERO                                                       │
│  [portrait]   kicker · "Band member · core"                 │
│   260×280     <name h2>                                     │
│   placeholder <role italic>                                 │
│               ┌──────┬──────┬──────┬──────┐                 │
│               │Years │Shows │Born  │Mark  │  facts strip    │
│               └──────┴──────┴──────┴──────┘                 │
│               [⟶ View era · <Era name>]  [▶ Play featured]  │
├─────────────────────────────────────────────────────────────┤
│  § Bio                                                      │
│  Long paragraph, indented first line, Crimson Pro 17px.     │
├─────────────────────────────────────────────────────────────┤
│  § Shows per year                                           │
│  ▓ ▓ ▓ ▓ ▓ ▓ █ ▓ ▓ ▓ ▓ ▓ ▓   ← bar chart, click to jump    │
│  '65 '66 '67 '68 '69 '70 …                                  │
├─────────────────────────────────────────────────────────────┤
│  § Signature shows                                          │
│  ┌──────────────────────────┬──────────────────────────┐    │
│  │ ⓿ 01  1977-05-08         │ ⓿ 02  1972-05-26         │    │
│  │       Barton Hall ITHACA │       Strand Lyceum LDN  │    │
│  │       — canonical Cornell│       — 32-min Dark Star │    │
│  │                Setlist ↗ │                Setlist ↗ │    │
│  └──────────────────────────┴──────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  § Songs debuted in this era                                │
│  [Sugaree] [Bertha] [Loser] [Eyes of the World] …  ← pills  │
├─────────────────────────────────────────────────────────────┤
│  § Signature songs                                          │
│  [Eyes of the World] [Sugaree] [Althea] [Morning Dew] …     │
├─────────────────────────────────────────────────────────────┤
│  § Browse shows                                             │
│  [1965][1966][1967] … [1995]   ← year-tab strip             │
│  Table: # · Date · Venue · Songs · ▶ Play · open ↗          │
│  ═══════════════════════════════════════════════════════    │
│  [⟵ 1976]      viewing 1977       [1978 ⟶]      ← year pager│
│  previous year                    next year                 │
└─────────────────────────────────────────────────────────────┘
```

Section headers are the standard `.section-head` row (h3 + italic descr in `--ink-3` + mono meta on the right).

---

## 4. Data model

### 4.1 `MEMBERS` (existing)

Already present in `data-ext.jsx`. Each entry:

```ts
type Member = {
  id: string;          // "garcia" | "weir" | "lesh" | …
  name: string;        // "Jerry Garcia"
  role: string;        // "Lead guitar · vocals"
  years: string;       // "1965–1995"  (en-dash; hyphen also accepted)
  shows: number;       // 2328
  core: boolean;       // true for the founding six
  born: number;        // 1942
  died?: number;       // 1995, if applicable
  mark: string;        // "▲" — a single glyph used as the member's emblem
};
```

The 10 IDs: `garcia, weir, lesh, kreutzmann, hart, pigpen, keith, donna, brent, vince`.

### 4.2 `MEMBER_DETAIL` — new fixture

Per-member content for the detail page. Keys match `Member.id`.

```ts
type MemberDetail = {
  eraId: string;                  // primary era key (one of ERAS_DATA.id)
  bio: string;                    // 4–6 sentence paragraph

  signatureShows: {               // 4 entries — curated highlights
    date: string;                 // "YYYY-MM-DD"
    venue: string;                // "Barton Hall"
    city: string;                 // "Ithaca, NY"
    note?: string;                // "the canonical Cornell · 13-min Morning Dew"
  }[];

  debuts: string[];               // song titles debuted during this member's era
  signatureSongs: string[];       // song titles this member is known for
};
```

All ten members are defined in `data-ext.jsx`. Bios and song lists are **canonical copy** — please preserve verbatim. Each member's `eraId` is the era they're most associated with (Garcia/Lesh/Kreutzmann → `europe72`, Weir/Hart → `brent`, Pigpen → `primal`, Keith/Donna → `hiatus`, Brent → `brent`, Vince → `final`).

### 4.3 Shows-per-year — derived from `SHOWS_PER_YEAR`

`SHOWS_PER_YEAR` is a `[year, count][]` covering 1965–1995. For a given member, filter to the rows whose year is inside their `years` range:

```js
const [fromY, toY] = member.years.split(/[–-]/).map(s => parseInt(s, 10));
const yearData = SHOWS_PER_YEAR.filter(([y]) => y >= fromY && y <= toY);
```

The chart's max bar height is normalized against the max value in `yearData`, not the global max. The italic "approx N" label in the section meta is the sum of `yearData[i][1]`.

> **NOTE for the production app:** if you already track per-member appearance counts per year (e.g. `Member.appearancesByYear`), use that instead — `SHOWS_PER_YEAR` is a stand-in. The interaction (click a bar → scroll-jump to that year in the table below) is unchanged.

### 4.4 Browse shows — `browseShowsForYear(memberId, year, count)`

The prototype generates a deterministic synthetic list of shows for any (member, year) pair so each year tab shows a unique-looking table. In production this should be replaced by **the real query**:

> *Give me the list of shows in year Y that this member played, paginated 1 page = 1 year.*

Each row shape:

```ts
type ShowRow = {
  date: string;        // "1977-05-19"
  venue: string;       // "Fox Theatre"
  city: string;        // "Atlanta, GA"
  songs: number;       // song count for this show
};
```

The table cap in the prototype is 14 rows; production can show all shows for that year (it's never more than ~15 per year per member).

---

## 5. Component spec

### 5.1 Hero (`.member-hero`)

A two-column grid: `260px portrait` | `1fr title block`. Bottom border is the page's heavy double rule (`3px double --ink`).

**Portrait** (`.portrait-lg`):
- 260×280 box, `--paper-3` fill, `1.5px solid --ink`, `4px 4px 0 --paper-edge` hard-offset shadow.
- Inside: a single big glyph (`{member.mark}`) at **132px display serif** in `--rust`, with a `3px 3px 0 --paper` text-shadow.
- Bottom-anchored label: `PORTRAIT · PLACEHOLDER` in mono 9px uppercase.
- **In production**, replace the glyph with a real portrait photo. Keep the frame and shadow exactly. If no photo available, fall back to the glyph.

**Title block**:
- Kicker: `Band member · {core ? "core" : "passing through"}` — mono 11px uppercase, `--rust`.
- H2: member name, 62px display serif, line-height 0.95.
- Role: italic Crimson Pro 19px in `--ink-2`.
- **Facts strip** (`.facts`): 4-column grid, divided by 1px dotted internal rules, top + bottom 1px rules.
  - **Years** — value is the raw `years` string ("1965–1995").
  - **Shows** — value `member.shows.toLocaleString()` in `--rust`.
  - **Born** — `member.born`. If `member.died` is set, append `† {died}` in mono 11px to the right of the year.
  - **Mark** — the member's glyph, display serif, `--rust`.
- Buttons row:
  - Primary CTA: `⟶ View era · {era.name}` → routes to `/era/{detail.eraId}`.
  - Ghost CTA: `▶ Play featured show` → calls `player.playEntireShow()` (or whatever the host app's "play featured" hook is).

### 5.2 Bio (`.member-bio`)

Single `<p>` of Crimson Pro 17px, line-height 1.55, `--ink-2`, `max-width: 78ch`, `text-wrap: pretty`, **first-line indented 1.6em**. No drop cap. Sits under a `.section-head` (h3 `Bio`, descr `— compiled by the vault operator`, meta `FOUNDING MEMBER` or `GUEST CHAIR`).

### 5.3 Shows-per-year chart (`.barchart.member-chart`)

Re-uses the existing `.barchart` styles from the Stats page with one variant class:

- `.member-chart .bar` uses `--ink-2` (instead of `--ink`) and **`--rust` on hover**.
- `.member-chart .bar.peak` (selected year) — `--rust` with an inset bottom shadow in `--rust-dark`.
- `.bar.max` (the year with most shows) — same rust treatment as `.peak` and its `.val` label is always visible.

Below the chart sits an axis row (`.barchart-axis-dense`) that lists every year (`'65 '66 …'95`) instead of the 5-year ticks used elsewhere. Each year is **clickable** and rust on hover; the currently-selected year is rust and bold.

**Click behavior:** clicking a bar OR an axis year sets `selectedYear` AND scrolls smoothly to the `#browse-shows` anchor (the Browse shows section header).

### 5.4 Signature shows (`.sig-shows`)

A 2-column grid (`repeat(2, 1fr)`, 10px gap). Each card (`.sig-show`):

- 1px ink border, `--paper-2` fill, on hover `3px 3px 0 --paper-edge` offset shadow.
- Three-column grid: `48px play | 1fr meta | auto link`.
- **Play button** (`.sig-play`): 44px round button, paper fill, 1.5px ink border. On hover: rust fill, paper glyph, `--rust-dark` border. Calls `player.playEntireShow()` (or, in production, queue the show identified by `s.date`).
- **Meta**:
  - Index — `№ 01` etc., mono 9.5px uppercase rust.
  - Date — display serif 22px.
  - Venue line — italic Crimson 14.5px + city in mono 10.5px uppercase ink-3 (8px left padding).
  - Optional note — italic Crimson 12.5px ink-3.
- **Setlist link** — mono 10.5px uppercase rust with dotted bottom border, **solid on hover**, text `Setlist ↗`. Routes to `/show/{s.date}`.

Both interaction targets (play button, setlist link) stop propagation in the prototype so they don't fire each other.

### 5.5 Pill grids — debuts + signature songs

Both pill sections re-use the **square pill** style already used on the Eras page (`.era-focus .pill`):

- Mono 11px, uppercase letter-spacing 0.02em.
- `1px solid --ink-3` border, `--paper` background.
- Hover: `--ink` fill, `--paper` text.
- Click routes to `/song/{slug}`. The prototype's `slugFor(title)` resolves a song title to its catalog slug by matching against `SONGS[].title` / `aliases` / partial match; in production this should be a clean lookup (or just store slugs directly in `MEMBER_DETAIL` instead of display titles).

Wrap them in the same `.era-focus` container the Eras page uses to inherit the grid layout, but override `gridTemplateColumns: "1fr"` to make one wide row, and zero the top/bottom borders so the section sits flush.

### 5.6 Browse shows — year tabs + table + pager

**Anchor** the section header with `id="browse-shows"` so the bar-chart click can scroll to it.

**`.year-strip`** — a horizontal scroll of one button per year in the member's range:
- Mono 11px, padding 4px 8px, no border by default.
- Hover: rust text + soft border.
- Active (selected year): `--ink` fill, `--paper` text.

**Table** (`.tbl.member-tbl`) — the standard `.tbl` chrome with two row-action columns:
- `▶ Play` button (`.row-play`): 26px round, paper fill, ink border. Rust fill + paper glyph on hover. Calls `player.playEntireShow()` for that show (production: `player.playShow(s.date)`).
- `open ↗` link (`.row-link`): mono 10.5px uppercase rust with dotted bottom border. Routes to `/show/{s.date}`.
- Disable the default row-hover background on this table (`tbody tr:hover { background: transparent }`) — the row-level buttons carry their own hover state instead.

**Year pager** (`.year-pager`) — the wide horizontal control under the table:
- 3-column grid: `1fr | auto | 1fr`. Top border is the same heavy `3px double --ink`.
- **Left button** (`.pg`): renders a rust `⟵` arrow + a two-line stack — top line in mono 9.5px `--ink-3` reading `previous year`, bottom line in display serif 30px reading **the previous year's number** (e.g. `1976`).
- **Center** (`.current-year`): two-line stack — `viewing` label (mono 9.5px) over the current year (38px display serif, `--rust`). Bracketed by dotted left+right rules.
- **Right button** (`.pg.right`): mirror of the left — `next year` label + the next year's number + `⟶`.
- **At the edges of the run** (first year / last year) the disabled button shows `start of run` / `end of run` text where the year would be, with a dashed border and 0.4 opacity. Clicks are inert.
- **Hover** on either button (when enabled) flips it to `--ink` fill, `--paper` text — including the arrow.

The current-year text in the center should match the year tab strip selection AND the chart's `.peak` bar at all times.

---

## 6. State

The page owns one piece of state: `selectedYear` (number).

Initial value: the middle year of the member's active range (`years[Math.floor(years.length / 2)]`). This puts the table at a representative middle year on first load rather than the boundary.

Three things drive `selectedYear` changes:
1. Clicking a bar in the chart (also triggers smooth scroll to `#browse-shows`).
2. Clicking a year tab in the strip.
3. Clicking prev/next in the year pager.

When `selectedYear` changes, the Browse shows table refetches/derives its rows (`browseShowsForYear(memberId, selectedYear, count)` in the prototype; real query in production).

---

## 7. Hooks into existing app state

| Page action                            | App state to call                                |
| -------------------------------------- | ------------------------------------------------ |
| Sig-show play button                   | `player.playShow(date)` (queue + play that show) |
| Browse-table play button               | `player.playShow(date)`                          |
| Setlist link / `open ↗`                | Navigate to `/show/<date>`                       |
| `View era` CTA                         | Navigate to `/era/<detail.eraId>`                |
| Pill (debut or signature song)         | Navigate to `/song/<slug>`                       |
| Member card on `/members`              | Navigate to `/member/<id>`                       |

The prototype uses `player.playEntireShow()` as a stand-in everywhere because it only has one show fixtured. **In production, pass the real show date and let the player queue that show.**

---

## 8. Styles to add

All new CSS is in `design-reference/styles.css` under the comment block `MEMBER DETAIL PAGE`. The new classes are:

```
.member-hero
.member-hero .portrait-lg / .mark / .lbl
.member-hero .title-block / .kicker / .role / .facts / .actions
.member-bio
.barchart.member-chart   (variant of the existing .barchart)
.barchart-axis-dense
.sig-shows / .sig-show / .sig-play / .meta / .setlist-link
.year-strip / .year-tab
.member-tbl .row-play / .row-link
.year-pager / .pg / .current-year / .arrow / .col / .lbl / .yr
.era-focus.member-pills  (reuse + override)
```

No new tokens. No new fonts. No new assets.

---

## 9. Acceptance criteria

A reviewer should be able to verify, on a member detail page:

1. Hero renders **portrait placeholder + name + role + years + show count**, plus a `View era · <era name>` button that routes to the correct era.
2. Bio paragraph is present and reads naturally (indented first line, no drop cap).
3. Shows-per-year bar chart is present, restricted to the member's active range; clicking a bar updates the selected year AND scrolls down to the Browse shows section.
4. **Signature shows**: 3–4 cards each with a round play button (queues that show in the player) and a `Setlist ↗` link (routes to that show's detail page).
5. **Songs debuted in this era**: square pill grid; each pill routes to the song's detail page.
6. **Signature songs**: identical pill treatment.
7. **Browse shows**:
   - The year-tab strip lists every year in the member's active range.
   - The selected year highlights as a filled black tab.
   - The table shows that year's shows with play + open columns.
   - The prev / next pager buttons display **the actual numeric year value** of the previous and next years (not just "Prev" / "Next").
   - The pager disables (with `start of run` / `end of run` label) at the boundary years.
8. All ten member IDs (`garcia, weir, lesh, kreutzmann, hart, pigpen, keith, donna, brent, vince`) load without error.

---

## 10. Notes / open questions for the team

- **Real portraits**: the placeholder portrait should become a real photo once licensing is sorted. Frame, shadow, and dimensions stay the same.
- **Shows-per-year data**: the prototype uses the band's overall `SHOWS_PER_YEAR` filtered to the member's range. A more accurate fixture would be `MEMBER_SHOWS_PER_YEAR[memberId]` once that data is in the warehouse.
- **Year-zero edges**: members whose `years` range is a single year (e.g. a hypothetical one-tour guest) need defensive code — the prototype handles this via `toY = yrs[1] || yrs[0]`.
- **Bio copy**: please run the bios past whoever owns editorial voice. The prototype copy aims for a dry, archival, slightly elegiac tone — not encyclopedic, not breathless. If you swap them, keep that register.
