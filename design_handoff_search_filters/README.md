# Handoff: Search Filters & Filter Chips

Compact facet UI for `/search` (and any other faceted list view), desktop + mobile. Replaces the current unstyled `FilterRail` + `ActiveChips` rendering.

Companion to `design_handoff_vault_operator/README.md` — all tokens, fonts, and texture rules there still apply. This document only covers what's new.

## 1. Files

`design-reference/` holds the reviewable prototype (Babel-in-browser, fixture data — do not ship as-is):

- `Filters & Chips.html` — entry point; open in a browser at ≥1400px.
- `filters.css` — **source of truth** for every new rule. New tokens at the top.
- `filters.jsx` — component structure + interaction behaviour.
- `styles.css` — existing Vault Operator stylesheet, unchanged, included for tokens/texture.

Target files in the app:

| Prototype piece | Implement in |
| --- | --- |
| `DesktopFilters`, `Popover`, `OptRow` | `components/search/filter-rail.tsx` |
| `Chip`, chip row, `clear all` | `components/search/active-chips.tsx` |
| `MobileFilters` sheet | new `components/search/filter-sheet.tsx` (mobile shell) |
| `useFacets` | existing `use-search-state.ts` — no state-shape change required |

The prototype's fixture facet lists mirror the real ones (`RECORDING_TYPES`, `RELEASE_SERIES_ORDER`, `ERA_DEFS`, decade/country/state/tour facets). Keep the real data source; only presentation changes.

## 2. Problem being solved

The current rail renders every facet of every category at once — on desktop it consumes ~600px of vertical space above the results and pushes them below the fold; on mobile it is unusable. The redesign collapses all facets into **five category menus in one line**, and surfaces state as **colour-coded chips**.

Budget: desktop filter block is **3 lines / ~118px total** (search 40, category line 30, chip line 30, gaps 18). Mobile is **2 lines / ~96px** before results start.

## 3. New tokens

```css
--cat-audio:  #2c4a6a;  /* = --ledger-blue */
--cat-rel:    #a8391f;  /* = --rust        */
--cat-time:   #1f3a2c;  /* = --forest      */
--cat-place:  #7a5c1e;  /* new — ochre     */
--cat-tour:   #5a2a4a;  /* new — plum      */
```

One hue per category, all at ledger darkness so `--paper` type on top clears AA. Add the two new values to the app's token file next to the existing palette. Category colour is passed down as a local `--cc` custom property on the category root; every child (`.sw`, `.box.on`, `.fx-chip`, `.mfx-pill.on`) reads `var(--cc)` — do **not** hard-code per-category selectors.

Category → colour, canonical order: `Audio` → audio, `Release` → rel, `Time` → time, `Place` → place, `Tour` → tour.

## 4. Desktop anatomy

```
┌ .fx-bar  (1px rule top + bottom, 12px/10px padding, 9px row gap) ───────────┐
│ .fx-search   ⌕  dicks picks                        clear   ⌘K               │
│ .fx-line     ● Audio ▾  ● Release 1 ▾  ● Time 1 ▾  …        SHOWS · 124     │
│ .fx-line     [Release Dick's Picks ×] [Time 1970s ×]  clear all             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Search line** (`.fx-search`): 1.5px `--ink` border, `--paper-2` fill, `3px 3px 0 --rule-soft` offset shadow, mono 13px. `clear` appears only with a query; `⌘K` hint always.

**Category button** (`.fx-cat > button`): mono 10.5px, letter-spacing .14em, uppercase, 5px/9px padding, 1px `--rule-soft` border, `--paper` fill. Contents in order: 7px colour dot, label, count badge, 12px `▾` caret.
- default — `--ink-2` text, soft border
- hover — `--hi` background, `--rule` border, `--ink` text
- has selections (`.has`) — border becomes `--cc`, text `--ink`, count badge shows (filled `--cc`, `--paper` mono 9px)
- open (`.open`) — inverted: `--ink` fill, `--paper` text

**Popover** (`.fx-pop`): anchored `top: calc(100% + 6px); left: 0`, 1.5px `--ink` border, `--paper` fill, `5px 5px 0 --rule-soft` shadow, 9px rotated notch at `left: 14px`. `min-width: 300px`, `.wide` variant 470px for Release/Time. Closes on outside `mousedown` and on Escape (add Escape in the real build; also return focus to the trigger).
- Header: display serif 18px with the category colour dot; `reset` link (mono 9.5px) on the right clears only that category.
- Sub-group label (`.fx-sub`): mono 8.5px, .18em, uppercase, `--ink-4` — "recording type", "series", "decade", "era", "country", "state", "tagged shows only".
- Options grid: `repeat(var(--cols), 1fr)`, 16px column gap, 2 columns. Row = 13px checkbox + serif 14px label + mono 10px count, dotted `--rule-faint` bottom rule, `--hi` hover. Checked: box fills `--cc` with a `--paper` ✓ and the label goes 600.
- Long lists (state, tour): `.fx-opts.scroll` (max-height 168px) preceded by a small find input; filters client-side on label.
- Single-select groups (recording type, decade, era, country, state, tour) clear their siblings on pick — matches the existing `setSingle` behaviour. Series is multi-select (`toggleSeries`).

**Chip line**: chips left, `clear all` after them (mono 10px, dotted underline, `--rust` hover). Empty state is italic serif "No filters applied — the whole catalog." Result count sits right-aligned on the category line, mono 10px uppercase with the number in `--rust`.

**Chip** (`.fx-chip`): `--cc` fill, `--paper` text, 1px `rgba(26,20,12,.45)` border, `2px 2px 0 --rule-faint` shadow, 4px/7px padding. Contents: category name (mono 8.5px uppercase, `opacity .62`), value label (mono 10.5px), `×`. Whole chip is one button that removes the filter; hover fills `--ink`. `aria-label="Remove filter: <category> <label>"`.

## 5. Mobile anatomy

Same tokens, 44px-class targets.

- `.mfx-bar`: search field, then one horizontally scrolling row (`.mfx-scroll`, scrollbar hidden): `Filters ▾` button (`--ink` fill, rust count badge) followed by the chips, then a short `clear`. Chips keep the category colour but drop the category-name prefix to save width; min-height 32px, tap area extends to the 44px row.
- `.mfx-meta`: `--paper-2` strip with `SHOWS · n` and the current sort.
- **Bottom sheet** (`.mfx-sheet`): `max-height 82%`, 3px double `--ink` top border, grab handle, header "Filters" + `close ×`. Body is a single-open accordion of the five categories (`.mfx-group`, colour dot + count badge + caret), options as wrap-flow pills (`.mfx-pill`, 34px min-height; selected = `--cc` fill, `--paper` label, `--paper-3` count). Footer: `reset` (outlined) + `Show <n> shows` (rust, 1.5px ink border, `3px 3px 0 --ink` offset) which closes the sheet. Scrim `rgba(26,20,12,.42)`, tap to dismiss.
- Filters apply live as they are toggled; the footer button is a dismiss + confirmation of the count, not a commit gate. Keep it that way so the count animates while picking.

## 6. Behaviour notes

- Chip order = selection order (stable), not category order. Removing a chip is the same action as unchecking the option.
- `clear all` only renders with ≥1 chip; per-category `reset` only clears that category.
- Counts come from the facet response and are shown even when 0 (0-count options stay clickable but render `--ink-4`).
- Result count label: `shows · <n>` on show searches; substitute the entity name on other list views.
- URL state is unchanged — the redesign is presentational.

## 7. Accessibility

- Category button: `aria-expanded`, `aria-controls` pointing at the popover; popover is a `role="group"` labelled by the category name.
- Options are real `<input type="checkbox">` / `role="radio"` for single-select groups, visually replaced by `.box` — keep focus rings (thick, high-contrast, never removed).
- Chip row is `role="group" aria-label="Active filters"`; announce count changes with `aria-live="polite"` on the result count.
- Sheet: focus trap while open, Escape closes, `aria-modal="true"`.
- Respect `prefers-reduced-motion` — there is no motion in this component beyond the sheet slide; skip it when reduced.

## 8. Acceptance checklist

- [ ] Desktop filter block ≤ 3 lines at 1280px and above; results start above the fold.
- [ ] Five category menus in canonical order with correct colours and count badges.
- [ ] Chips are colour-matched to their category and removable in one click.
- [ ] Long facet lists (state, tour) scroll inside the popover with a working find field.
- [ ] Mobile: chips scroll horizontally; sheet accordion opens one category at a time; footer shows live count.
- [ ] Keyboard: tab into each category, open with Enter/Space, Escape closes and restores focus.
- [ ] No new colours beyond the two added tokens.
