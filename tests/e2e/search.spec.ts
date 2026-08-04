import { test, expect } from '@playwright/test'
import { mockAllApis } from './fixtures'

// /api/search reads entirely from local, git-tracked data (.cache/gd-setlists.json,
// .cache/archive-index.json, lib/official-releases.ts) — no setlist.fm/Archive.org
// calls happen on the search path, so these run against the real route rather than
// mocking search-specific fixtures.
//
// The mobile shell renders in parallel with the desktop shell at all times (CSS media
// queries decide which is visible), so assertions are scoped to `.page-grid` — the
// desktop container — to avoid strict-mode collisions with the mobile copy.

test.describe('Search page — faceted search', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page)
  })

  const desktop = (page: import('@playwright/test').Page) => page.locator('.page-grid')
  const showsCol = (page: import('@playwright/test').Page) =>
    desktop(page).locator('.result-col').filter({ has: page.locator('h4', { hasText: 'Shows' }) })

  test('shows placeholder text when no query', async ({ page }) => {
    await page.goto('/search')
    await expect(desktop(page).getByText(/Start typing to search/)).toBeVisible()
  })

  test('one query produces shows, venues, and releases sections together', async ({ page }) => {
    await page.goto('/search?q=cornell+5%2F8%2F77')
    await expect(desktop(page).getByRole('heading', { name: 'Shows · 1', exact: true })).toBeVisible({ timeout: 8_000 })
    await expect(showsCol(page).locator('a.row', { hasText: 'Barton Hall' })).toBeVisible()
    await expect(desktop(page).getByRole('heading', { name: 'Venues · 1', exact: true })).toBeVisible()
    await expect(desktop(page).getByRole('heading', { name: 'Releases · 1', exact: true })).toBeVisible()
    await expect(desktop(page).getByText('Cornell 5/8/77').first()).toBeVisible()
  })

  test('typed facet words promote into removable, colour-coded chips', async ({ page }) => {
    await page.goto(`/search?q=${encodeURIComponent("dave's picks 1990")}`)
    await expect(desktop(page).getByRole('button', { name: /Remove filter: Release Dave's Picks/ })).toBeVisible({ timeout: 8_000 })
    await expect(desktop(page).getByRole('button', { name: 'Remove filter: Time 1990' })).toBeVisible()
  })

  test('Load more appends the next page of shows instead of losing the first page', async ({ page }) => {
    await page.goto(`/search?q=${encodeURIComponent('dicks picks 1970s')}`)
    const heading = desktop(page).getByRole('heading', { name: /^Shows · \d+$/ })
    await expect(heading).toBeVisible({ timeout: 8_000 })
    const total = parseInt((await heading.textContent())!.replace(/\D/g, ''), 10)
    expect(total).toBeGreaterThan(20)

    await expect(showsCol(page).locator('a.row')).toHaveCount(20)
    const firstRowBefore = await showsCol(page).locator('a.row').first().textContent()

    await desktop(page).getByRole('button', { name: /Load more/ }).click()

    await expect(showsCol(page).locator('a.row')).toHaveCount(Math.min(40, total), { timeout: 8_000 })
    const firstRowAfter = await showsCol(page).locator('a.row').first().textContent()
    expect(firstRowAfter).toBe(firstRowBefore)
  })

  test('typed facet words check their popover checkboxes, not just show a chip', async ({ page }) => {
    // Regression: "dicks picks 1970s" produced a Release chip and a Time chip, but the
    // Release and Time popovers showed everything unchecked since the checkboxes only
    // ever reflected rail state, never the query text that actually drove the chips.
    await page.goto(`/search?q=${encodeURIComponent('dicks picks 1970s')}`)
    await expect(desktop(page).getByRole('button', { name: /Remove filter: Release Dick's Picks/ })).toBeVisible({ timeout: 8_000 })

    await desktop(page).getByRole('button', { name: /^Release/ }).click()
    await expect(desktop(page).getByRole('checkbox', { name: "Dick's Picks" })).toBeChecked()

    await desktop(page).getByRole('button', { name: /^Time/ }).click()
    await expect(desktop(page).getByRole('checkbox', { name: '1970s' })).toBeChecked()
  })

  test('shortened/singular release words ("vault", "road trip") also check their box, not just match text', async ({ page }) => {
    await page.goto(`/search?q=${encodeURIComponent('vault 60s')}`)
    await expect(desktop(page).getByRole('button', { name: /Remove filter: Release From the Vault/ })).toBeVisible({ timeout: 8_000 })

    await desktop(page).getByRole('button', { name: /^Release/ }).click()
    await expect(desktop(page).getByRole('checkbox', { name: 'From the Vault' })).toBeChecked()
  })

  test('typing a decade then clicking a second decade in the dropdown keeps both (regression)', async ({ page }) => {
    // Reported bug: typed "1970s" gives a Time chip, but clicking 1990s in the dropdown
    // built its next value from the empty rail array instead of the token-merged one,
    // silently dropping 1970 the first time a checkbox click "promoted" the selection.
    await page.goto(`/search?q=${encodeURIComponent('1970s')}`)
    await expect(desktop(page).getByRole('button', { name: /Remove filter: Time 1970s/ })).toBeVisible({ timeout: 8_000 })

    await desktop(page).getByRole('button', { name: /^Time/ }).click()
    await expect(desktop(page).getByRole('checkbox', { name: '1970s' })).toBeChecked()
    await desktop(page).getByRole('checkbox', { name: '1990s' }).click()

    await expect(page).toHaveURL(/decade=1970/)
    await expect(page).toHaveURL(/decade=1990/)
    await expect(desktop(page).getByRole('checkbox', { name: '1970s' })).toBeChecked()
    await expect(desktop(page).getByRole('checkbox', { name: '1990s' })).toBeChecked()
    await expect(desktop(page).getByRole('button', { name: /^Time 2 /, exact: false })).toBeVisible()
  })

  test('removing a chip widens the results', async ({ page }) => {
    await page.goto('/search?q=cornell+5%2F8%2F77')
    await expect(desktop(page).getByRole('heading', { name: 'Shows · 1', exact: true })).toBeVisible({ timeout: 8_000 })
    await desktop(page).getByRole('button', { name: /Remove filter: Time 1977-05-08/ }).click()
    await expect(desktop(page).getByRole('heading', { name: 'Shows · 3', exact: true })).toBeVisible({ timeout: 8_000 })
  })

  test('toggling a rail filter narrows the shows list and updates the URL', async ({ page }) => {
    await page.goto('/search?q=barton+hall')
    await expect(desktop(page).getByRole('heading', { name: /^Shows/ })).toBeVisible({ timeout: 8_000 })

    // Category checkboxes only mount once their popover is open.
    await desktop(page).getByRole('button', { name: /^Audio/ }).click()
    await desktop(page).getByRole('checkbox', { name: 'has audio' }).click()
    await expect(page).toHaveURL(/audio=1/)
    await expect(desktop(page).getByRole('heading', { name: /^Shows/ })).toBeVisible({ timeout: 8_000 })
  })

  test('facet counts stay populated after selecting a filter (never zero out their own group)', async ({ page }) => {
    await page.goto('/search?q=1977')
    await desktop(page).getByRole('button', { name: /^Release/ }).click()
    await expect(desktop(page).getByText('Studio/Compilation')).toBeVisible({ timeout: 8_000 })
    await desktop(page).getByRole('checkbox', { name: 'official release' }).click()
    await expect(page).toHaveURL(/release=1/)
    await expect(desktop(page).getByText('Studio/Compilation')).toBeVisible({ timeout: 8_000 })
  })

  test('URL round-trips a query with rail filters on reload', async ({ page }) => {
    await page.goto('/search?q=1977&audio=1')
    await page.reload()
    await expect(desktop(page).getByRole('button', { name: /Remove filter: Audio has audio/ })).toBeVisible({ timeout: 8_000 })
  })

  test('picking an era clears an active decade — they are the same Time axis', async ({ page }) => {
    await page.goto('/search?decade=1970')
    await desktop(page).getByRole('button', { name: /^Time/ }).click()
    await expect(desktop(page).getByRole('checkbox', { name: '1970s' })).toBeChecked()

    await desktop(page).getByRole('checkbox', { name: 'Brent Years' }).click()

    await expect(page).toHaveURL(/era=brent/)
    expect(page.url()).not.toContain('decade=')
    await expect(desktop(page).getByRole('checkbox', { name: '1970s' })).not.toBeChecked()
    await expect(desktop(page).getByRole('button', { name: /^Time 1 /, exact: false })).toBeVisible()
  })

  test('picking a decade clears an active era — they are the same Time axis', async ({ page }) => {
    await page.goto('/search?era=brent')
    await desktop(page).getByRole('button', { name: /^Time/ }).click()
    await expect(desktop(page).getByRole('checkbox', { name: 'Brent Years' })).toBeChecked()

    await desktop(page).getByRole('checkbox', { name: '1990s' }).click()

    await expect(page).toHaveURL(/decade=1990/)
    expect(page.url()).not.toContain('era=')
    await expect(desktop(page).getByRole('checkbox', { name: 'Brent Years' })).not.toBeChecked()
  })

  test('multiple decades can be selected together — same facet, OR-combined', async ({ page }) => {
    await page.goto('/search?decade=1970')
    await desktop(page).getByRole('button', { name: /^Time/ }).click()
    await expect(desktop(page).getByRole('checkbox', { name: '1970s' })).toBeChecked()

    await desktop(page).getByRole('checkbox', { name: '1990s' }).click()

    await expect(page).toHaveURL(/decade=1970/)
    await expect(page).toHaveURL(/decade=1990/)
    await expect(desktop(page).getByRole('checkbox', { name: '1970s' })).toBeChecked()
    await expect(desktop(page).getByRole('checkbox', { name: '1990s' })).toBeChecked()
    await expect(desktop(page).getByRole('button', { name: /^Time 2 /, exact: false })).toBeVisible()

    // Unchecking one leaves the other selected rather than clearing both.
    await desktop(page).getByRole('checkbox', { name: '1970s' }).click()
    await expect(desktop(page).getByRole('checkbox', { name: '1970s' })).not.toBeChecked()
    await expect(page).not.toHaveURL(/decade=1970/)
    await expect(page).toHaveURL(/decade=1990/)
    await expect(desktop(page).getByRole('checkbox', { name: '1990s' })).toBeChecked()
  })

  test('multiple states can be selected together — same facet, OR-combined', async ({ page }) => {
    await page.goto(`/search?state=${encodeURIComponent('California')}`)
    await desktop(page).getByRole('button', { name: /^Place/ }).click()
    await expect(desktop(page).getByRole('checkbox', { name: 'California', exact: true })).toBeChecked()

    await desktop(page).getByRole('checkbox', { name: 'New York', exact: true }).click()

    await expect(page).toHaveURL(/state=California/)
    await expect(page).toHaveURL(/state=New(\+|%20)York/)
    await expect(desktop(page).getByRole('checkbox', { name: 'California', exact: true })).toBeChecked()
    await expect(desktop(page).getByRole('checkbox', { name: 'New York', exact: true })).toBeChecked()
  })

  test('picking a state clears an active country — they are the same Place axis', async ({ page }) => {
    // Rail values are always the facet's own raw-case string (set by clicking an
    // option, never hand-typed), so the URL here matches that — "France" not "france".
    // The state list is itself narrowed by the active country, so pick a state that
    // actually appears under France rather than an unrelated one like California.
    await page.goto(`/search?country=${encodeURIComponent('France')}`)
    await desktop(page).getByRole('button', { name: /^Place/ }).click()
    await expect(desktop(page).getByRole('checkbox', { name: 'France', exact: true })).toBeChecked()

    await desktop(page).getByRole('checkbox', { name: 'Île-de-France' }).click()

    await expect(page).toHaveURL(/state=%C3%8Ele-de-France/)
    expect(page.url()).not.toContain('country=')
    await expect(desktop(page).getByRole('checkbox', { name: 'France', exact: true })).not.toBeChecked()
  })

  test('picking a country clears an active state — they are the same Place axis', async ({ page }) => {
    await page.goto(`/search?state=${encodeURIComponent('California')}`)
    await desktop(page).getByRole('button', { name: /^Place/ }).click()
    await expect(desktop(page).getByRole('checkbox', { name: 'California', exact: true })).toBeChecked()

    await desktop(page).getByRole('checkbox', { name: 'United States' }).click()

    await expect(page).toHaveURL(/country=United(\+|%20)States/)
    expect(page.url()).not.toContain('state=')
    await expect(desktop(page).getByRole('checkbox', { name: 'California', exact: true })).not.toBeChecked()
  })

  test('typing a decade word while an era is active drops the era (rail beats token)', async ({ page }) => {
    // "1970s" typed alongside an existing ?era=brent rail selection must not silently
    // AND them into a redundant-or-empty combo — the rail selection wins and the typed
    // word is not promoted into a competing chip.
    await page.goto(`/search?${encodeURIComponent('q')}=1970s&era=brent`)
    await expect(desktop(page).getByRole('button', { name: /Remove filter: Time Brent Years/ })).toBeVisible({ timeout: 8_000 })
    await expect(desktop(page).getByRole('button', { name: /Remove filter: Time 1970s/ })).toHaveCount(0)
  })

  test('Escape closes an open category popover and returns focus to its trigger', async ({ page }) => {
    await page.goto('/search?q=1977')
    const trigger = desktop(page).getByRole('button', { name: /^Release/ })
    await trigger.click()
    await expect(desktop(page).getByText('Studio/Compilation')).toBeVisible({ timeout: 8_000 })
    await page.keyboard.press('Escape')
    await expect(desktop(page).getByText('Studio/Compilation')).not.toBeVisible()
    await expect(trigger).toBeFocused()
  })

  test('clear button resets query and hides results', async ({ page }) => {
    await page.goto('/search?q=cornell')
    await expect(desktop(page).getByRole('heading', { name: /^Shows/ })).toBeVisible({ timeout: 8_000 })
    await desktop(page).getByRole('button', { name: 'clear' }).click()
    await expect(desktop(page).getByText(/Start typing to search/)).toBeVisible()
  })

  test('song result navigates to the song page', async ({ page }) => {
    await page.goto('/search?q=dark+star')
    await expect(desktop(page).locator('a.row', { hasText: 'Dark Star' })).toBeVisible({ timeout: 8_000 })
    await desktop(page).locator('a.row', { hasText: 'Dark Star' }).click()
    await expect(page).toHaveURL(/\/song\/Dark/)
  })

  test('show result navigates to the show page', async ({ page }) => {
    await page.goto('/search?q=cornell+5%2F8%2F77')
    const showLink = showsCol(page).locator('a.row[href="/show/1977-05-08"]')
    await expect(showLink).toBeVisible({ timeout: 8_000 })
    await showLink.click()
    await expect(page).toHaveURL(/\/show\/1977-05-08/)
  })
})
