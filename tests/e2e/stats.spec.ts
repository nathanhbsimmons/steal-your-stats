import { test, expect } from '@playwright/test'
import { mockAllApis, mockStats, mockStatsSummary } from './fixtures'

test.describe('Stats page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/stats')
  })

  test('renders the page heading', async ({ page }) => {
    await expect(page.getByText(/big numbers/i)).toBeVisible({ timeout: 8_000 })
  })

  test('displays Total Shows KPI', async ({ page }) => {
    await expect(page.getByText(mockStatsSummary.totalShows.toLocaleString()).first()).toBeVisible({ timeout: 8_000 })
  })

  test('displays Unique Songs KPI', async ({ page }) => {
    await expect(page.getByText(String(mockStatsSummary.uniqueSongs)).first()).toBeVisible({ timeout: 8_000 })
  })

  test('shows the all-time leaderboard section heading', async ({ page }) => {
    await expect(page.getByText('All-time leaderboard')).toBeVisible({ timeout: 8_000 })
  })

  test('leaderboard lists top songs', async ({ page }) => {
    await expect(page.getByText('Playing in the Band').first()).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText('Dark Star').first()).toBeVisible()
  })

  test('clicking a leaderboard song navigates to song page', async ({ page }) => {
    await expect(page.getByText('Playing in the Band')).toBeVisible({ timeout: 8_000 })
    await page.getByText('Playing in the Band').click()
    await expect(page).toHaveURL(/\/song\/Playing/)
  })

  test('shows the bar chart section', async ({ page }) => {
    await expect(page.getByText(/Shows per year/)).toBeVisible({ timeout: 8_000 })
  })

  test('shows the position breakdown donut section', async ({ page }) => {
    await expect(page.getByText('Position breakdown')).toBeVisible({ timeout: 8_000 })
  })

  test('no JS errors on load', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await page.waitForTimeout(1500)
    expect(errors).toHaveLength(0)
  })

  test('shows loading skeletons before data arrives', async ({ page }) => {
    // Slow down stats so the skeleton stays visible after React renders.
    // Use waitUntil:'commit' so goto returns before JS loads (avoids slow-route timeout).
    await page.route('**/api/stats**', async route => {
      await new Promise(r => setTimeout(r, 2000))
      await route.fulfill({ json: mockStats })
    })
    await page.goto('/stats', { waitUntil: 'commit' })
    // Skeleton renders when stats=null; 2s delay keeps it visible for assertion
    await expect(page.locator('.skeleton-vault').first()).toBeVisible({ timeout: 8_000 })
  })
})
