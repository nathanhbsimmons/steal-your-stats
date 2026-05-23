import { test, expect } from '@playwright/test'
import { mockAllApis, mockSongFacts, mockPositionFacts, mockVersions } from './fixtures'

async function setupSongPage(page: Parameters<typeof mockAllApis>[0], song = 'Dark%20Star') {
  await mockAllApis(page)
  await page.goto(`/song/${song}`)
  await expect(page.getByRole('heading', { level: 2 })).toBeVisible({ timeout: 10_000 })
}

test.describe('Song page — hero section', () => {
  test('displays the song title', async ({ page }) => {
    await setupSongPage(page)
    await expect(page.getByRole('heading', { level: 2 })).toContainText('Dark Star')
  })

  test('shows total performances count', async ({ page }) => {
    await setupSongPage(page)
    await expect(page.getByText(String(mockSongFacts.totalPerformances)).first()).toBeVisible({ timeout: 8_000 })
  })

  test('action buttons are in a row (not stacked)', async ({ page }) => {
    await setupSongPage(page)
    const actions = page.locator('.song-hero .actions')
    await expect(actions).toBeVisible()
    const firstBtn  = page.getByRole('button', { name: /First show/ })
    const lastBtn   = page.getByRole('button', { name: /Last show/ })
    const [firstBox, lastBox] = await Promise.all([firstBtn.boundingBox(), lastBtn.boundingBox()])
    expect(Math.abs((firstBox?.y ?? 0) - (lastBox?.y ?? 0))).toBeLessThan(10)
  })

  test('"First show" button is visible', async ({ page }) => {
    await setupSongPage(page)
    await expect(page.getByRole('button', { name: /First show/ })).toBeVisible()
  })

  test('"Last show" button is visible', async ({ page }) => {
    await setupSongPage(page)
    await expect(page.getByRole('button', { name: /Last show/ })).toBeVisible()
  })

  test('"Play longest version" button is visible', async ({ page }) => {
    await setupSongPage(page)
    await expect(page.getByRole('button', { name: /Play longest version/ })).toBeVisible()
  })

  test('shows first performance date', async ({ page }) => {
    await setupSongPage(page)
    await expect(page.getByText('1968 · 04 · 02')).toBeVisible({ timeout: 8_000 })
  })

  test('shows last performance date', async ({ page }) => {
    await setupSongPage(page)
    await expect(page.getByText('1995 · 03 · 29')).toBeVisible({ timeout: 8_000 })
  })
})

test.describe('Song page — position facts', () => {
  test('shows "Opened the show" section when opener data exists', async ({ page }) => {
    await setupSongPage(page)
    await expect(page.getByText('Opened the show')).toBeVisible({ timeout: 8_000 })
  })

  test('shows opener count', async ({ page }) => {
    await setupSongPage(page)
    // mockPositionFacts.opener.shows has 2 items; page uses shows.length for count
    await expect(page.getByText(/2 times/)).toBeVisible({ timeout: 8_000 })
  })

  test('does not show encore section when count is zero', async ({ page }) => {
    await setupSongPage(page)
    await expect(page.getByText('Played as encore')).not.toBeVisible()
  })
})

test.describe('Song page — versions table', () => {
  test('shows Versions heading', async ({ page }) => {
    await setupSongPage(page)
    await expect(page.getByRole('heading', { name: 'Versions' })).toBeVisible({ timeout: 8_000 })
  })

  test('does not show Longest/Shortest extremes section', async ({ page }) => {
    await setupSongPage(page)
    // Use exact:true so we match only the all-caps label, not "Play longest version" button
    await expect(page.getByText('LONGEST', { exact: true })).not.toBeVisible()
    await expect(page.getByText('SHORTEST', { exact: true })).not.toBeVisible()
  })

  test('shows sort controls', async ({ page }) => {
    await setupSongPage(page)
    await expect(page.getByRole('button', { name: 'Duration ↓' })).toBeVisible({ timeout: 8_000 })
    await expect(page.getByRole('button', { name: 'Date' })).toBeVisible({ timeout: 8_000 })
    // exact:true avoids matching the "VI. Venues" navigation button
    await expect(page.getByRole('button', { name: 'Venue', exact: true })).toBeVisible({ timeout: 8_000 })
  })

  test('lists version rows with venue names', async ({ page }) => {
    await setupSongPage(page)
    await expect(page.getByText('Barton Hall')).toBeVisible({ timeout: 8_000 })
  })

  test('play buttons are circular (tbl-play class)', async ({ page }) => {
    await setupSongPage(page)
    const playBtns = page.locator('.tbl-play')
    await expect(playBtns.first()).toBeVisible({ timeout: 8_000 })
  })

  test('no btn.icon buttons in the versions table', async ({ page }) => {
    await setupSongPage(page)
    const tbl = page.locator('.tbl')
    const boxBtns = tbl.locator('.btn.icon')
    await expect(boxBtns).toHaveCount(0, { timeout: 8_000 })
  })

  test('clicking sort by Date reorders rows', async ({ page }) => {
    await setupSongPage(page)
    await page.getByRole('button', { name: 'Date' }).click()
    const firstRow = page.locator('tbody tr').first()
    await expect(firstRow).toContainText('1970')
  })
})

test.describe('Song page — venue filter', () => {
  test('shows venue filter badge when ?venue param is present', async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/song/Dark%20Star?venue=Winterland%20Arena')
    await expect(page.getByText('Winterland Arena').first()).toBeVisible({ timeout: 10_000 })
  })

  test('venue badge shows the venue name', async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/song/Dark%20Star?venue=Winterland%20Arena')
    const badge = page.locator('text=Winterland Arena').first()
    await expect(badge).toBeVisible({ timeout: 10_000 })
  })

  test('× link in badge clears venue filter', async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/song/Dark%20Star?venue=Winterland%20Arena')
    await expect(page.getByText('Winterland Arena').first()).toBeVisible({ timeout: 10_000 })
    await page.locator('a[title="Clear venue filter"]').click()
    await expect(page).toHaveURL(/\/song\/Dark%20Star$/)
  })

  test('versions table only shows rows matching the venue', async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/song/Dark%20Star?venue=Winterland%20Arena')
    const rows = page.locator('tbody tr')
    await rows.first().waitFor({ timeout: 10_000 })
    const rowCount = await rows.count()
    expect(rowCount).toBeLessThan(mockVersions.tracks.length)
  })

  test('opener section only shows shows at the filtered venue', async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/song/Dark%20Star?venue=Winterland%20Arena')
    await expect(page.getByText('Opened the show')).toBeVisible({ timeout: 10_000 })
    // The date appears in both the opener link and the versions table; use first()
    await expect(page.getByText('1970 · 02 · 11').first()).toBeVisible()
  })

  test('closer section hidden when no closers at filtered venue', async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/song/Dark%20Star?venue=Winterland%20Arena')
    await expect(page.getByText('Closed the show')).not.toBeVisible({ timeout: 6_000 })
  })

  test('no JS errors with venue filter', async ({ page }) => {
    await mockAllApis(page)
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await page.goto('/song/Dark%20Star?venue=Winterland%20Arena')
    await page.waitForTimeout(2000)
    expect(errors).toHaveLength(0)
  })
})

test.describe('Song page — error and loading states', () => {
  test('shows loading skeleton before data arrives', async ({ page }) => {
    // Register mockAllApis FIRST, then override song-facts with a slow route
    // Last-registered route wins in Playwright
    await mockAllApis(page)
    await page.route('**/api/song-facts**', async route => {
      await new Promise(r => setTimeout(r, 2000))
      await route.fulfill({ json: mockSongFacts })
    })
    await page.goto('/song/Dark%20Star')
    await expect(page.locator('.skeleton-vault').first()).toBeVisible({ timeout: 3_000 })
  })

  test('shows error message when song-facts API fails', async ({ page }) => {
    // Register mockAllApis FIRST, then override song-facts with an error route
    await mockAllApis(page)
    await page.route('**/api/song-facts**', r => r.fulfill({ status: 500, json: { error: 'fail' } }))
    await page.goto('/song/Dark%20Star')
    await expect(page.getByText(/Failed to load/)).toBeVisible({ timeout: 10_000 })
  })
})
