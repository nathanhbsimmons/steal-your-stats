import { test, expect, Page } from '@playwright/test'
import { mockAllApis } from './fixtures'

// ── Helpers ──────────────────────────────────────────────────────────────────

// The vault player's <audio> element never actually plays real media in
// e2e (no real network fetch of the mp3), so `duration` stays 0 and the
// seek bar's `max` stays 0 too — ArrowRight would have nothing to move
// through. Fake a `durationchange` the same way the real browser would
// once metadata loads, so the seek bar has real range to scrub.
async function fakeAudioDuration(page: Page, seconds: number) {
  await page.evaluate(d => {
    const audio = document.querySelector('audio')
    if (!audio) throw new Error('vault player <audio> element not found')
    Object.defineProperty(audio, 'duration', { value: d, configurable: true })
    audio.dispatchEvent(new Event('durationchange'))
  }, seconds)
}

// Loads the song page (real setlist.fm/Archive.org data via the on-disk
// cache, same as /shows/1977 below — this route's facts/versions are server
// props, not client fetches, so they can't be mocked via page.route) and
// clicks two version rows' play buttons to get two distinct tracks queued.
async function loadSongPageWithQueue(page: Page) {
  await mockAllApis(page)
  await page.goto('/song/Dark%20Star')
  await expect(page.getByText('Dark Star').first()).toBeVisible({ timeout: 10_000 })
  const playBtns = page.locator('.tbl-play')
  await expect(playBtns.nth(1)).toBeVisible({ timeout: 10_000 })
  await playBtns.nth(0).click()
  await expect(page.locator('.vault-player .meta .title')).not.toContainText('nothing in the deck', { timeout: 10_000 })
  await playBtns.nth(1).click()
  await expect(page.locator('button.toggleq')).toContainText('2', { timeout: 10_000 })
}

// ── Tests ────────────────────────────────────────────────────────────────────

test.describe('Vault player — keyboard access', () => {
  test('Tab reaches the seek bar; ArrowRight advances currentTime', async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/')
    await expect(page.locator('.vault-player')).toBeVisible({ timeout: 10_000 })
    await fakeAudioDuration(page, 600)

    const seek = page.locator('.bar-input')
    await seek.focus()
    await expect(seek).toBeFocused()

    const before = Number(await seek.inputValue())
    await page.keyboard.press('ArrowRight')
    const after = Number(await seek.inputValue())
    expect(after).toBeGreaterThan(before)
  })

  test('Tab reaches the volume slider; ArrowUp raises volume', async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/')
    await expect(page.locator('.vault-player')).toBeVisible({ timeout: 10_000 })

    const vol = page.locator('.vol-input')
    await vol.focus()
    await expect(vol).toBeFocused()

    const before = Number(await vol.inputValue())
    await page.keyboard.press('ArrowUp')
    const after = Number(await vol.inputValue())
    expect(after).toBeGreaterThan(before)
  })
})

test.describe('Vault queue — keyboard access', () => {
  test('Queue toggle: Enter opens, focus moves inside, Escape closes and restores focus', async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/')
    await expect(page.locator('.vault-player')).toBeVisible({ timeout: 10_000 })

    const toggle = page.locator('button.toggleq')
    await toggle.focus()
    await expect(toggle).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(page.locator('.vault-queue')).toBeVisible({ timeout: 5_000 })
    await expect(page.locator('.queue-dismiss-btn')).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(page.locator('.vault-queue')).not.toBeVisible()
    await expect(toggle).toBeFocused()
  })

  test('Queue row reachable by Tab; Enter selects; remove button has an accessible name', async ({ page }) => {
    await loadSongPageWithQueue(page)
    await page.locator('button.toggleq').click()
    await expect(page.locator('.vault-queue')).toBeVisible({ timeout: 5_000 })

    const rowButtons = page.locator('.qrow-btn')
    await expect(rowButtons).toHaveCount(2)

    const secondRow = rowButtons.nth(1)
    await secondRow.focus()
    await expect(secondRow).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page.locator('.qrow').nth(1)).toHaveClass(/current/)

    const removeBtn = page.locator('.qx').nth(1)
    await expect(removeBtn).toHaveAccessibleName(/Remove/)
  })
})

test.describe('Shows table — keyboard access', () => {
  test('/shows/1977 — a show row is reachable by Tab and Enter navigates', async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/shows/1977')
    const firstRow = page.locator('table.tbl tbody tr').first()
    await expect(firstRow).toBeVisible({ timeout: 10_000 })

    const rowLink = firstRow.getByRole('link')
    await rowLink.focus()
    await expect(rowLink).toBeFocused()

    await Promise.all([
      page.waitForURL(/\/show\//, { timeout: 8_000 }),
      page.keyboard.press('Enter'),
    ])
    await expect(page).toHaveURL(/\/show\/1977-/)
  })
})

test.describe('Chapter navigation — link regression guard', () => {
  test('Chapter nav links expose href attributes', async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/')
    const links = page.getByRole('navigation', { name: 'Chapter navigation' }).getByRole('link')
    const count = await links.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute('href')
      expect(href).toBeTruthy()
    }
  })
})
