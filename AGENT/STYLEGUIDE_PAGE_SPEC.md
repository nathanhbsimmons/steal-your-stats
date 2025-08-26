# Styleguide Page Spec — `/styleguide`

The `/styleguide` route should render a **demo page** showing all key tokens, typography, and generic components in isolation.  
This is for **visual verification only** — not app logic.

---

## 1. Page Layout

- Route: `/styleguide`
- Wrap content in a `<Window>` component (Header + Body).
- Sidebar optional — this page is standalone.

---

## 2. Sections

### a) Colors & Tokens
- Show color swatches for `--ink`, `--paper`, `--gray`.
- Show border radii samples (12px, 24px).
- Show a box with 2px border + retro offset shadow.

### b) Typography
- H1 in serif (Playfair Display).
- H2/H3 samples.
- Body paragraph (~65ch).
- Inline mono text example.

### c) Buttons
- Primary Button (filled).
- Secondary Button (outline).
- Disabled Button.
- Loading Button (spinner/dots).

### d) Pills
- Neutral pill.
- Active pill.
- Disabled pill.

### e) Cards
- Card with header + body text.
- Card with scrollable content.

### f) Sidebar & NavItem
- Render a Sidebar with 3 NavItems.
- One active, one normal, one hovered.

### g) Table
- Simple 3-column table.
- Header row with sortable icons (up/down).
- 2–3 sample rows.

### h) Collapse
- Collapsible panel with heading + sample content.
- Expanded and collapsed states visible.

### i) Player (Docked)
- Docked at bottom.
- Show fake queue with 2 tracks.
- Play/pause + next/prev buttons.

---

## 3. States
Each component should include:
- Idle.
- Loading (skeleton or dots).
- Empty (neutral message).
- Error (red border/text + retry).

---

## 4. Accessibility Checks
- Keyboard navigation: tab through all components in order.
- Focus rings visible.
- `aria-live` demo region that announces “Async data loaded” after a 2s timeout.
- Collapse toggle has `aria-expanded`.

---

## 5. Notes
- **No real data** — mock placeholders only.
- This page is for design QA: colors, borders, spacing, fonts, a11y.
- Keep it updated as new primitives/components are added.
