# Plan: Restore mobile mini player, spine nav + /support, home column swap

Branch: `feat/mini-player-and-support`. Do the parts in order and commit after each one.

## Context
- `ed7e89f` ("merge mobile mini-player into the tab bar dock", in squash `aab1de5`) shrank the mobile mini player from 64px to a 30px strip. The play/pause button went to 26px, the venue line and release badge were dropped, and the skip button was removed. It's now too small to tap and shows too little. Goal: bring back the old look and keep the fixes that change only behavior.
- Users have no way to report bugs or ask for features, and there's no way to tip. `design_handoff_spine_support/` supplies a high-fidelity desktop redesign (spine sidebar plus top band) and a `/support` page: a feedback form sent through Resend, and a PayPal.me tip jar.
- On the desktop home page, the right column should list "Also On This Day" before "Most Played".

Decisions made: PayPal.me only. Keep the Deck-tab playing dot. Reach `/support` from the spine footer and the colophon on desktop, and from the bottom of mobile Home.

---

## Part A: Restore the mini player (mobile)

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
- Move `aria-live` off the whole row, which wraps buttons, onto a `.sr-only` span (defined in `app/globals.css:113`) that holds only the track title and date.
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
   - Add the `.sr-only` live span.
7. `test/mobile-shell.test.tsx` (~line 344–440, 1234–1250): update the selectors from `.mv-dock-now`/`.mv-dock-open` to `.mv-mini`/`.mv-mini-open`. Add tests that:
   - the skip button calls `next`
   - the venue line renders
   - there is exactly one `.mv-dock`
8. Run `pnpm test:run`, `pnpm lint`, `pnpm typecheck`, then commit.

---

## Part B: Install `design_handoff_spine_support` (desktop spine + /support)

Source: `design_handoff_spine_support/README.md` is the spec. Its files mirror repo paths and are written against `main`. Install as listed, then make the repo-specific adjustments below.

**Install (copy from the handoff):**
1. Add `app/vault-spine.css` and `app/support.css`. In `app/layout.tsx:5-6`, import both after `globals.css` and before `mobile.css`. `globals.css` has no `@layer`, so no layer wrapping is needed.
2. Add `components/vault/spine.tsx` and `components/vault/top-band.tsx`.
3. Replace `components/vault/vault-shell.tsx` and `components/vault/colophon.tsx`. `/support` is added to `WIDE_ROUTES`.
4. `lib/site-config.ts`: copy the handoff's `PAYPAL_ME_URL` addition only, set to the user's PayPal.me URL. The other contents are identical to the repo's.
5. Delete `components/vault/masthead.tsx`, `edition-strip.tsx` and `chapters.tsx`. The only importer is `vault-shell.tsx`. User approved deletion.
6. Add `app/support/page.tsx`, `components/support/feedback-form.tsx`, `components/support/tip-jar.tsx` and `app/api/feedback/route.ts`.
7. `components/home/home-client.tsx`: remove the gutter labels at ~line 178 ("Featured · On This Day" / "PG. 1977") and ~line 446 ("The Ledger · Stats" / "MMXXVI"), including the label's bottom border.
8. `app/sitemap.ts`: add `/support`.

**Repo adjustments to the handoff:**
- `lib/env.ts`: add optional `RESEND_API_KEY`, `FEEDBACK_TO_EMAIL` and `FEEDBACK_FROM_EMAIL` to the schema. The route reads `process.env` directly, which is fine on the server; the schema documents the keys.
- `app/api/feedback/route.ts`: the handoff uses `error.flatten()` and `z.string().email()`, which are deprecated in zod v4 (the repo is on `^4.1.3`). Swap in `z.flattenError(error)` and `z.email()`, keeping the behavior the same.
- Mobile `/support`: the handoff leaves mobile untouched, but the mobile shell ignores route children, so `/support` would render blank on phones. In `components/mobile/mobile-shell.tsx`:
  - Under the home tab, render `<FeedbackForm />` and `<TipJar />` when `pathname === '/support'`. This mirrors the `isShowDetail` pattern around line 2050.
  - Add a `chapterMeta` entry for `/support`.
  - Add a "Feedback & tips" link at the bottom of `HomeScreen`.
  - `support.css` selectors aren't scoped (`.support`, `.fb*`, `.tip`), so they apply inside `.mv`. Add mobile-only size tweaks to `app/mobile.css` if needed, using existing tokens.
- Remove the dead masthead, edition-strip and chapters rules from `globals.css` only if they aren't shared. Check first; leave them otherwise.
- `CLAUDE.md`: list the three new env vars.

**Tests (none ship with the handoff):**
- `test/feedback-route.test.ts` (mock `fetch`). Cover:
  - 400 with fieldErrors
  - honeypot returning a silent 200 with no email
  - a submission under 3s returning 400
  - the 6th call returning 429
  - missing env returning 503
  - a Resend failure returning 503
  - success returning 200, with the `reply_to` and subject format checked
- `test/feedback-form.test.tsx`. Cover:
  - client validation and the error count
  - focus moving to the status box
  - the 400/429/503 messages
  - the success panel, with and without an email
  - "Send another" resetting the form
- A spine test for:
  - the active chapter
  - fold persistence in `localStorage['sys:spine-folded']`
  - ⌘K focusing search and ⌘B toggling fold
  - the `/support?from=` link
- Fix any existing tests that reference the masthead, chapters or edition strip.

**Env (set by the user, not pasted into chat):**
```
RESEND_API_KEY=...                                   # Resend dashboard
FEEDBACK_TO_EMAIL=nathansimmons@hey.com
FEEDBACK_FROM_EMAIL=support@stealyourstats.com       # domain must be verified in Resend
```
Add these to `.env.local` and to the hosting dashboard. Then run `pnpm test:run`, `pnpm lint`, `pnpm typecheck`, and commit.

---

## Part C: Swap Most Played and Also On This Day (desktop home)

1. `components/home/home-client.tsx` (~line 473–521): move the `{/* Also on this day */}` block (`shows.length > 1`, `.alsolist`) above the `{/* Most played */}` block (`mostPlayed.length > 0`, `.toptable`). Both keep `marginTop: 18`.
2. Update `test/home.test.tsx` if it asserts section order. Otherwise add a test that checks "Also On This Day" comes before "Most Played".
3. Run tests, lint and typecheck, then commit.

---

## Verification
- **Part A:** run `pnpm dev`, then use the Playwright MCP at 390×844.
  - Play a track and check that the mini player matches `ed7e89f^` (compare it in a worktree).
  - Check that skip and play/pause respond to taps on the edge of the 44px area.
  - Check that the Deck dot shows.
  - Check that back-to-top isn't covered by the dock.
  - Check that content isn't hidden behind the dock, both with a track playing and without.
- **Part B:**
  - At 1440px and 1100px widths, compare the spine and top band to `design-reference/The Vault Operator v2.html`.
  - Fold and unfold, reload, and confirm the fold state persists.
  - Check ⌘K and ⌘B.
  - Check that the player dock doesn't overlap the bottom of the spine.
  - At `/support` on desktop and at 390px:
    - Submit, and confirm the email arrives at `nathansimmons@hey.com` with reply-to set.
    - Submit with the honeypot filled and confirm no email is sent.
    - Submit 6 times quickly and confirm the 6th returns 429.
    - Remove the env vars and confirm the "mail room is closed" error.
    - Confirm the PayPal link opens in a new tab.
  - Do a keyboard-only pass.
- **Part C:** on the desktop home page, the right column order is: ledger, Also On This Day, Most Played, quote.
- `pnpm test:run && pnpm lint && pnpm typecheck` all pass. Then recommend `test-qa-engineer` for end-to-end coverage of `/support` and the spine.
