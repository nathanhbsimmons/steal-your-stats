# Handoff: Spine navigation + /support page

## Overview
Two changes to the desktop shell of Steal Your Stats:

1. **Spine navigation.** The stacked masthead, edition strip and chapter tabs are replaced by a sticky left sidebar ("spine") and a slim top band. Content now starts about 60px from the top instead of about 316px.
2. **/support page.** A new route with a feedback form (posts to `/api/feedback`, sent by email through Resend) and an optional PayPal.me tip jar.

Branch: `feat/support-page`. Mobile (`components/mobile/*`, `app/mobile.css`) is **not** changed.

## About the files
The files under `app/`, `components/` and `lib/` mirror repo paths and are written against the repo's current code on `main` (Next.js App Router, tokens in `app/globals.css`). They are meant to be dropped in, then reviewed. The `design-reference/` folder holds the HTML prototype they were built from (open `The Vault Operator v2.html`; the Tweaks panel simulates API responses and toggles the tip jar).

## Fidelity
High fidelity. Colors, type, spacing and states are final. All values use the existing tokens (`--paper*`, `--ink*`, `--rust*`, `--forest`, `--rule*`, `--hi`, `--serif-display`, `--serif-body`, `--mono`, `--blackletter`, `--vault-player-h`).

## Install checklist
| Action | File |
|---|---|
| Add | `app/vault-spine.css`, `app/support.css` |
| Edit | `app/layout.tsx`: `import "./vault-spine.css"; import "./support.css";` after `globals.css`, before `mobile.css` |
| Add | `components/vault/spine.tsx`, `components/vault/top-band.tsx` |
| Replace | `components/vault/vault-shell.tsx`, `components/vault/colophon.tsx`, `lib/site-config.ts` |
| Delete (now unused) | `components/vault/masthead.tsx`, `components/vault/edition-strip.tsx`, `components/vault/chapters.tsx` |
| Add | `app/support/page.tsx`, `components/support/feedback-form.tsx`, `components/support/tip-jar.tsx`, `app/api/feedback/route.ts` |
| Edit | `components/home/home-client.tsx`: remove the gutter label at ~line 178 (`Featured · On This Day` / `PG. 1977`) and the one at ~line 447 (`The Ledger · Stats` / `MMXXVI`), including the label's bottom border |
| Env | `RESEND_API_KEY`, `FEEDBACK_FROM_EMAIL` (verified Resend sender), `FEEDBACK_TO_EMAIL` |
| Config | set `PAYPAL_ME_URL` in `lib/site-config.ts`; empty hides the tip jar |
| Optional | add `/support` to `app/sitemap.ts` |

If `globals.css` rules are wrapped in an `@layer`, put both new files in the same layer so the overrides of `.vault-page` win.

---

## 1. Shell layout
`.vault-page.spine` is a two-column grid: `232px | minmax(0,1fr)` (folded: `64px | …`). Page padding is `0 0 var(--vault-player-h)`, with no max-width on the page. The main column (`.vault-main`) has `max-width:1360px` and `padding:16px 56px 0 40px` (folded: left padding `48px`). Main contains `TopBand`, then `.page-grid`, then `Colophon`.

`/support` is added to `WIDE_ROUTES`.

## 2. Spine (sidebar)
`.spine-wrap` is sticky (`top:0`), with `height: calc(100vh - var(--vault-player-h))` and `z-index:30`. The inner `aside.spine` scrolls (`overflow-y:auto`) and has `background: var(--paper-2)`, `border-right: 4px double var(--ink)`, `padding:16px 18px`, and a flex column with `gap:16px`.

From top to bottom:

- **Wordmark.** "Steal*your*Stats", DM Serif Display 26px, `--ink`; "your" is italic `--rust`. Links to `/`. Folded: "S*y*S" at 22px.
- **Search,** directly under the wordmark. 1px `--rule` hairline border, transparent background, `padding:5px 8px`, `margin-top:-4px`. Contains a ⌕ glyph (`--ink-3`), the input (mono 12px, placeholder "search…"), and a ⌘K chip (mono 9.5px, 1px `--rule` border, `--paper` background, `0 5px` padding, 16px line height). On focus-within the border turns `--ink`. Enter pushes `/search?q=…`. Folded: a 28×28 hairline icon button that links to `/search`.
- **Chapter list.** I Home, II Search, III Songs (badge = `CANONICAL_SONG_COUNT`), IV Recent, V Band Members, VI Venues, VII Shows, VIII Eras, IX Stats, X Export. Each row is a grid `38px | 1fr | auto` with `padding:6px 8px` and `margin:0 -8px`.
  - Label: DM Serif 16px, `--ink-2`.
  - Numeral: mono 10px, letter-spacing .08em, `--rust`.
  - Badge: mono 10px, `--ink-3`.
  - Hover: `--hi` background, `--ink` text.
  - Active: `--ink` background, `--paper` text; numeral and badge `--paper-3`.
  - Focus: 2px `--rust` outline, 2px offset.
  - Folded: numerals only, centered, `padding:9px 0`, 11px.
- **Footer.** Pinned to the bottom (`margin-top:auto`), 1px `--rule` top border, 10px top padding. One link, "Support & feedback": mono 10px, uppercase, letter-spacing .12em, `--ink-3`. Hover turns it `--rust`. On `/support` it is `--ink` with a `--rust` underline (3px offset). It links to `/support?from=<pathname>`. Folded: just ✉ at 14px.
- **Notch.** The fold toggle. It sits on the double rule, vertically centered: `right:-15px`, 15×46px, `--paper` background, 1.5px `--ink` border with no left edge, radius `0 3px 3px 0`, chevron ‹ (or › when folded) at 13px. Hover inverts it to an `--ink` background. Its tooltip appears 8px to the right: an `--ink` background, mono 10px uppercase "Fold ⌘B" / "Expand ⌘B", fading in over 120ms.

**Keys:** ⌘/Ctrl+K focuses search (expanding the spine first if folded). ⌘/Ctrl+B toggles fold.
**Persistence:** the fold state is stored in `localStorage['sys:spine-folded']`.

## 3. Top band
Replaces the masthead and edition strip. The date line ("INDEXED …") and the "compiled by hand…" tagline are removed.

- Layout: a grid `minmax(0,1fr) | auto | minmax(0,1fr)`, `gap:24px`, aligned on the baseline. A 4px double `--ink` rule above and below, `padding:7px 0 8px`, `margin-bottom:20px`.
- Right bleed: `margin-right:-22px`, so the rules run out to the right edge of the stats column, which bleeds by 22px.
- Left: temperature from `/api/weather` ("49°F"), left-aligned.
- Center: "The *Grateful Dead* Archive". Crimson Pro italic 17px `--ink-2`; "Grateful Dead" in UnifrakturMaguntia 19px `--forest`.
- Right: the weather label, right-aligned.
- Weather text: mono 11px, uppercase, letter-spacing .08em, `--ink-2`, single line with ellipsis. Below 1200px: 10px with .04em letter-spacing. Below 1100px: 9.5px, no letter-spacing, and the grid gap drops to 12px.

## 4. Colophon
The right-hand span, "v.11.5 · cached locally · last sync 1h ago", becomes a link: "Send feedback · tip the operator" → `/support?from=<pathname>`, in `--rust`, underlined.

## 5. /support page
Breadcrumb `HOME / SUPPORT`, using the existing `.page-head` with kicker "Support", h2 "Found a bug? *Have an idea?*" (the italic part uses the existing h2 italic style), and lede "Tell us what's broken, what could be better, or what feature you wish existed."

Below that is `.support-grid`: the form plus the tip jar in a column of `minmax(260px,340px)`, `gap:48px`. It switches to one column when the section is narrower than 820px (container query). Without a tip jar, the form takes the full width (`.solo`).

### Feedback form (max-width 680px, 22px gap between fields)
- **Type** (required). A `fieldset` + `legend` "What kind of note?" containing three radios: Bug / Improvement / New feature, styled as pills. Each pill has a 1.5px `--ink` border, `9px 18px` padding, DM Serif 18px and a 2px offset shadow in `--rule-soft`. Checked: `--ink` background, `--paper` text, `--rust` shadow.
- **Message** (required), 10–4000 characters. Textarea with 8 rows; placeholder "What happened, what you expected, and what page you were on." A live counter "n / 4,000" (mono 11px, tabular figures) sits bottom-right.
- **Email** (optional). The label hint reads "optional · only if you want a reply". Max-width 420px.
- **Hidden fields:** the honeypot `website` (positioned off-screen, `tabIndex -1`, `aria-hidden`), `page` (from `?from=`, falling back to `document.referrer`), and `ts` (the time the form rendered).
- **Labels:** mono 11px, uppercase, letter-spacing .12em. "required" is `--rust` 10px; the optional hint is `--ink-3`.
- **Inputs:** Crimson Pro 17px, 1.5px `--ink` border, `--paper` background, 2px `--rule-soft` offset shadow. Invalid: `--rust` border and shadow. Focus: 2px `--rust` outline.
- **Submit:** `.btn.primary` "Send feedback", above a 1px `--rule` top border with 18px padding.

### States
- **idle:** the form.
- **loading:** the button is disabled and reads "Sending…"; `aria-busy` is set on the form.
- **error:** the form values are kept. Field errors show as Crimson italic 15px `--rust-dark` with a "✕" prefix, linked to their field through `aria-describedby`. The `aria-live="assertive"` status box at the top shows `--hi` with a 1.5px `--rust` border, and focus moves to it.
  - Client-side validation: "**One thing / N things to fix** before this can go out."
  - 400: "**Something in the form didn't check out.** Look over the fields and send it again." (A `fieldErrors` object returned by the server is shown under the matching fields.)
  - 429: "**Too many notes from this address.** The vault takes five every ten minutes. Try again shortly."
  - 503 / network failure: "**The mail room is closed right now.** Your note wasn't sent. Nothing you wrote has been lost — try again in a few minutes."
- **success:** the form is replaced by a panel with a 4px double `--ink` border and `28px 30px` padding. Focus moves to it (`role="status"`). It contains:
  - A "RECEIVED" stamp: mono, `--forest`, rotated −2°.
  - The heading "Thanks. *It's in the mailbag.*" in 34px.
  - With an email: "If there's a reply, it'll go to **x**." Without: "You didn't leave an email, so there won't be a reply. It will still get read."
  - A `.btn` "Send another" button, which resets the form and the timestamp.

### Tip jar (only when `PAYPAL_ME_URL` is set)
A sticky card (`top:20px`) with a 1.5px `--ink` border, a 3px `--rule-soft` offset shadow and `22px` padding. It contains:
- The gutter label "Tip jar".
- The heading "Keep the *tapes rolling.*" in 28px (italic `--forest`).
- Copy: "Steal Your Stats is free, has no ads, and is kept up by one person. If it's earned a place in your rotation, a tip helps pay for hosting and data."
- The button `.btn.primary` "Tip via PayPal ↗", which opens in a new tab (`target="_blank" rel="noopener noreferrer"`, with "(opens in a new tab)" for screen readers).
- A note: "Opens PayPal in a new tab. You can pay by card without a PayPal account."

There is no backend involved.

## 6. POST /api/feedback
- Validation: `zod` checks the type enum, message 10–4000 characters after trimming, optional email, `page`, `website` and `ts`.
- Order of checks: invalid body → **400** with `{ ok:false, fieldErrors }`. A filled honeypot → silent **200**, no email sent. Under 3s since render → **400**. Rate limit exceeded (5 per IP per 10 minutes, kept in an in-memory `Map`, per instance) → **429**. Missing environment variables → **503**.
- Sending: `fetch('https://api.resend.com/emails')` with `Authorization: Bearer RESEND_API_KEY` and the body `{ from, to, reply_to?, subject: "[SYS {type}] {first 60 chars}", text }`. The text contains type, page, reply-to, user agent (read from the request header) and the message. A Resend failure → **503**. Otherwise **200** `{ ok:true }`.

## Files
- `app/vault-spine.css`: spine, top band, colophon link
- `app/support.css`: support page
- `components/vault/spine.tsx`, `top-band.tsx`, `vault-shell.tsx`, `colophon.tsx`
- `components/support/feedback-form.tsx`, `tip-jar.tsx`
- `app/support/page.tsx`, `app/api/feedback/route.ts`
- `lib/site-config.ts`
- `design-reference/`: the HTML prototype (`The Vault Operator v2.html` plus its scripts and styles)
