# Plan: Restore mobile mini player + add /support (feedback + tip jar)

## Context
- `ed7e89f` ("merge mobile mini-player into the tab bar dock", in squash `aab1de5`) shrank the mobile mini player from 64px to a 30px strip. The play/pause button went to 26px, the venue line and release badge were dropped, and the skip button was removed. It's now too small to tap and shows too little. Goal: bring back the old look and keep the fixes that change only behavior.
- Users have no way to report bugs or ask for features, and there's no way to tip. Goal: one `/support` page with a feedback form (emailed through Resend) and a PayPal.me tip link.

Decisions made: PayPal.me only. Keep the Deck-tab playing dot. One `/support` page, linked from the desktop colophon and the bottom of mobile Home.

---

## Part A: Restore the mini player (branch `feat/restore-mobile-mini`)

Restore the visuals from the parent commit of `ed7e89f`: `git show ed7e89f^:app/mobile.css` (the `/* MINI PLAYER */` block) and `git show ed7e89f^:components/mobile/mobile-shell.tsx` (`MobileMini`).

**What to keep from the merge (behavior only, no visual change):**
- The single `.mv-dock` wrapper: the mini player and tabs stack inside it in normal flow. This replaces the two separately positioned bars with hand-tuned `bottom: calc(...)` offsets, so they can't drift apart again.
- Height tokens. `--mv-chrome-h` stays the source of truth, and back-to-top keeps reading it.
- The accessible name on the open button includes the track: `Open player — {name}`.
- The Deck-tab `deck-playing` dot.
- `touch-action: manipulation` and no tap highlight on all mini player buttons.

**New behavior-only fixes:**
- Skip ▶▶ button: the visible glyph stays the same size. Add an invisible centered `::after` overlay (44×44) so the tap target is large enough. This follows the `.mv-addq::after` pattern in `app/mobile.css` (from `66f113c`).
- Play/pause button: the visible size stays 36px. Add the same overlay to bring its tap target to 44×44.
- Move `aria-live` off the whole row, which wraps buttons, onto a visually hidden `<span>` that holds only the track title and date. Screen readers then announce track changes without re-reading the controls.
- Restore the `.mv-mini .stamp::after` rule under `prefers-reduced-motion`.

**Steps:**
1. `app/globals.css:46`: rename `--mv-dock-now-h: 30px` to `--mv-mini-h: 64px`. Keep `--mv-chrome-h = tabbar + mini`.
2. `app/mobile.css` (~line 555–630): replace the `.mv-dock-now`, `.mv-dock-open` and `.mv-dock-pp` rules with the old `.mv-mini*` rules (stamp, meta, title-row, title, sub, pp, next, hair). Keep `.mv-dock` as the wrapper. Remove the `position: absolute` and `bottom` from `.mv-mini`, because it now sits in flow inside the dock. Keep `border-top: 3px double var(--ink)` on the mini player, and use the dock's border only when no track is playing.
3. `app/mobile.css`: add the `::after` hit-area overlays to `.mv-mini .next` and `.mv-mini .pp`, and set `position: relative` on both.
4. `app/mobile.css` (iOS fixes selector ~line 636): swap `.mv-dock-pp` and `.mv-dock-open` for `.mv-mini .pp`, `.mv-mini .next` and `.mv-mini-open`.
5. `app/mobile.css` (reduced-motion block ~line 222): add `.mv-mini .stamp::after` back.
6. `components/mobile/mobile-shell.tsx` (`MobileDock`, ~line 137): replace the `.mv-dock-now` markup with the old `MobileMini` markup:
   - stamp
   - title and `ReleaseBadge`
   - date · venue · city sub-line
   - skip button wired to `next`
   - play/pause button
   - hair
   
   Also make these changes:
   - Pull `next` from `usePlayer()`.
   - Keep the accessible name `Open player — {name}`.
   - Add a hidden live `<span>` (use the existing visually-hidden class if there is one; otherwise an inline sr-only style).
7. `test/mobile-shell.test.tsx` (~line 344–440, 1234–1250): update the selectors from `.mv-dock-now`/`.mv-dock-open` to `.mv-mini`/`.mv-mini-open`. Add tests that:
   - the skip button calls `next`
   - the venue line renders
   - there is exactly one `.mv-dock`
8. Run `pnpm test:run`, `pnpm lint`, `pnpm typecheck`.

---

## Part B: `/support` page (branch `feat/support-page`)

### Spec: feedback form
- Fields:
  - **Type**: radio, one of Bug / Improvement / New feature (required).
  - **Message**: textarea, 10–4000 characters (required).
  - **Email**: optional, for replies, validated as an email.
  - **Page**: hidden, filled from `document.referrer` or the query `?from=`.
  - **User agent**: captured on the server from the request header.
- Spam controls:
  - A honeypot field named `website`, visually hidden; a filled value means a silent 200 and no email.
  - Reject submissions made less than 3s after the form rendered (a hidden timestamp).
  - A best-effort in-memory rate limit of 5 submissions per IP per 10 minutes, kept in a module-level `Map`. On serverless this applies per instance, which is acceptable.
- `POST /api/feedback` validates the body with zod, then sends through the Resend REST API using `fetch` (no new dependency):
  - Endpoint: `POST https://api.resend.com/emails` with `Authorization: Bearer RESEND_API_KEY`.
  - Body: `{ from: FEEDBACK_FROM_EMAIL, to: FEEDBACK_TO_EMAIL, reply_to: email?, subject: "[SYS {type}] {first 60 chars}", text }`.
  - Responses: 200 `{ok:true}`, 400 for validation errors, 429 when rate-limited, 503 when Resend fails or env vars are missing.
- UI states (project model, idle → loading → empty → error → success):
  - **idle**: the form.
  - **loading**: submit disabled, "Sending…".
  - **error**: inline message in an `aria-live` region, with the form values kept.
  - **success**: thank-you panel with a "Send another" button.
- Accessibility (WCAG AA):
  - Labels on every field; the type choice is a `fieldset`/`legend`.
  - Errors are tied to their fields with `aria-describedby`.
  - Focus moves to the status message after submit.
  - Visible focus rings come from the existing tokens.

### Spec: tip jar
- The PayPal.me link is a constant: `PAYPAL_ME_URL` in `lib/site-config.ts` (for example `https://paypal.me/<handle>`). If it's empty, the section is hidden.
- Short copy, and one primary button "Tip via PayPal" that opens in a new tab (`target="_blank" rel="noopener noreferrer"`).
- No backend, no amounts, no PCI scope. PayPal.me accepts cards from people without a PayPal account.

### Files
New:
- `app/support/page.tsx`: server component that exports `metadata` and renders `<SupportContent />`.
- `components/support/support-content.tsx`: client component holding the feedback form and the tip section, shared by both shells.
- `components/support/feedback-form.tsx`: the form and its state machine.
- `app/api/feedback/route.ts`: the POST handler.
- `test/feedback-route.test.ts`, `test/feedback-form.test.tsx`

Modified:
- `lib/env.ts`: add optional `RESEND_API_KEY`, `FEEDBACK_TO_EMAIL` and `FEEDBACK_FROM_EMAIL` to the schema.
- `lib/site-config.ts`: add `PAYPAL_ME_URL`.
- `components/vault/colophon.tsx`: add a "Feedback & Tips" link to `/support`.
- `components/mobile/mobile-shell.tsx`:
  - Under the home tab, render `<SupportContent />` when `pathname === '/support'`. This mirrors the `isShowDetail` pattern around line 2050, because the mobile shell ignores route children.
  - Add a `chapterMeta` entry for `/support`.
  - Add a "Feedback & Tips" link at the bottom of `HomeScreen`.
- `app/globals.css` and `app/mobile.css`: form styles using the existing tokens (`--rule`, `--r-*`, `--shadow-card`, and the button variant tokens from `8fe7395`). Add no new colors.
- `app/sitemap.ts`: add `/support`.
- `CLAUDE.md`: list the three new env vars.

### Steps
1. Add the env schema entries and the site-config constant.
2. Write the route tests for valid input, invalid input, honeypot, rate limit and Resend failure, with `fetch` mocked. Then implement `app/api/feedback/route.ts`. The patterns to follow are `NextResponse.json` from `app/api/weather/route.ts` and zod from `lib/env.ts`.
3. Write the form tests for the states and accessibility wiring, then implement `feedback-form.tsx`.
4. Build `support-content.tsx` (form plus tip section) and `app/support/page.tsx`.
5. Wire the mobile shell route, the colophon link and the mobile Home link.
6. Add styles to both stylesheets.
7. Update the sitemap and `CLAUDE.md`.
8. Run `pnpm test:run`, `pnpm lint`, `pnpm typecheck`.

### You need to provide
- `RESEND_API_KEY`
- A sending address on a domain verified in Resend (for example `feedback@stealyourstats.com`) as `FEEDBACK_FROM_EMAIL`
- The inbox to receive feedback as `FEEDBACK_TO_EMAIL`
- Your PayPal.me handle

Add the env vars to `.env.local` and to the hosting dashboard.

---

## Verification
- **Part A:** run `pnpm dev`, then use the Playwright MCP at 390×844.
  - Play a track and check that the mini player matches the old screenshot and layout (`git stash` and check out `ed7e89f^` to compare).
  - Check that skip and play/pause respond to taps on the edge of the 44px area.
  - Check that the Deck dot shows.
  - Check that back-to-top isn't covered by the dock.
  - Check that content isn't hidden behind the dock, both with a track playing and without.
- **Part B:**
  - Submit the form at `/support` on desktop and mobile widths, and confirm the email arrives with reply-to set.
  - Submit with the honeypot filled and confirm no email is sent.
  - Submit 6 times quickly and confirm the 6th returns 429.
  - Remove the env vars and confirm a graceful 503 error state.
  - Confirm the PayPal link opens in a new tab.
  - Do a keyboard-only pass.
- `pnpm test:run && pnpm lint && pnpm typecheck` all pass. Then recommend `test-qa-engineer` for end-to-end coverage of `/support`.
