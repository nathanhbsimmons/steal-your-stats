# Steal Your Stats — UI Style Guide

This guide defines the **visual design language** for all UI components.  
It focuses on *look and feel only* — not content.  
Use this consistently across the application to avoid drift.

---

## 1. Color & Theme

- **Palette**: Monochrome, high-contrast.
  - `--ink: #111111` (text, borders)
  - `--paper: #f5f5f2` (background)
  - `--gray: #bfbfb7` (secondary surfaces, dividers)
- **Contrast**: Minimum AA contrast (4.5:1).
- **Dark Mode**: Optional inversion (ink → light, paper → dark).

---

## 2. Borders, Radius & Shadows

- **Border Width**: 2px solid `--ink`.
- **Radii**:  
  - Small: 12px  
  - Large: 24px
- **Shadows**: Offset retro shadow (e.g., `6px 6px 0 rgba(0,0,0,0.2)`).

---

## 3. Typography

- **Display (H1)**: Serif (e.g., *Playfair Display*). Large, bold.  
- **Body**: Sans-serif (e.g., *Inter*). Comfortable reading width (~65ch).  
- **Meta/Code**: Monospace (e.g., *IBM Plex Mono*).  
- **Line Height**: 1.4–1.6 for readability.  
- **Styles**: Subheads may use italic for emphasis.

---

## 4. Layout

- **Window**: Rounded, bordered container with header (striped optional), body, and footer slots.  
- **Grid**: Sidebar (fixed 240–260px) + Content Pane (fluid).  
- **Responsive**: Collapsible sidebar on mobile (<640px).  
- **Max Widths**: Text content ~800px; wider layouts for tables/lists.

---

## 5. Components

- **Window**: Root chrome element; contains Header, Body, Footer.  
- **WindowHeader**: Title slot + optional generic icon slots.  
- **Sidebar**: List of `NavItem`s, scrollable if long.  
- **NavItem**: Text + optional icon, bold when active.  
- **Pill**: Rounded label with outline; used for filters/status.  
- **Card**: Neutral background, thick border, rounded corners.  
- **Table**: Minimal stripes; sortable headers; keyboard accessible.  
- **Collapse**: Expand/collapse with accessible toggle (`aria-expanded`).  
- **Player**: Docked at bottom; queue list + transport controls.  

---

## 6. States & Feedback

- **State Model**: idle → loading → empty → error → success.  
- **Loading**: Skeletons or animated dots.  
- **Empty**: Neutral message with optional helper action.  
- **Error**: Clear text; retry button.  
- **Disabled**: Reduced opacity; retain visible border.

---

## 7. Accessibility

- **Keyboard-First**: All interactive elements reachable, logical order.  
- **Focus Ring**: Thick, high-contrast outline (not removed).  
- **ARIA**:  
  - Async updates announced with `aria-live="polite"`.  
  - Combobox/search uses `aria-expanded`, `aria-controls`.  
- **Motion**: Respect `prefers-reduced-motion`.  
- **Headings**: One `<h1>` per view; logical hierarchy.  
- **Forms**: Visible labels + `aria-describedby` for help/errors.

---

## 8. Optional Textures

- **Background Grain**: Low-opacity noise overlay for retro feel.  
- **Striped Header**: Horizontal stripes for “window” headers (CSS gradient).

---

## 9. Do & Don’t

- ✅ Reuse these tokens and primitives consistently.  
- ✅ Keep UI minimal, monochrome, high-contrast.  
- ❌ Do not introduce external colors without a defined token.  
- ❌ Do not replicate reference screenshot *content* (icons, labels). Style only.  
