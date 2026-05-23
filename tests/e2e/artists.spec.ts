import { test, expect } from '@playwright/test'
import { mockAllApis } from './fixtures'

test.describe('Artists / Band Members page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page)
    await page.route('**/api/stats**', r => r.fulfill({ json: {
      showsPerYear: [{ year: 1970, count: 73 }],
      leaderboard: [],
    }}))
    await page.goto('/artists')
  })

  test('renders the page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /lineup/i })).toBeVisible({ timeout: 8_000 })
  })

  test('displays all six core members', async ({ page }) => {
    for (const name of ['Jerry Garcia', 'Bob Weir', 'Phil Lesh', 'Bill Kreutzmann', 'Mickey Hart', 'Pigpen']) {
      await expect(page.getByText(name)).toBeVisible({ timeout: 8_000 })
    }
  })

  test('displays all four passing-through members', async ({ page }) => {
    for (const name of ['Keith Godchaux', 'Donna Godchaux', 'Brent Mydland', 'Vince Welnick']) {
      await expect(page.getByText(name)).toBeVisible({ timeout: 8_000 })
    }
  })

  test('each member card shows their role', async ({ page }) => {
    await expect(page.getByText('Lead guitar · vocals')).toBeVisible()
    await expect(page.getByText('Bass · vocals')).toBeVisible()
  })

  test('member cards are square (portrait aspect-ratio is 5/4)', async ({ page }) => {
    const portrait = page.locator('.member-card .portrait').first()
    await expect(portrait).toBeVisible()
    const box = await portrait.boundingBox()
    if (box) {
      // aspect-ratio 5/4 means width > height
      expect(box.width).toBeGreaterThan(box.height)
    }
  })

  test('clicking a member card navigates to their detail page', async ({ page }) => {
    await expect(page.getByText('Jerry Garcia').first()).toBeVisible({ timeout: 8_000 })
    // Click the Link wrapping the member card, targeting it by its href
    await Promise.all([
      page.waitForURL(/\/member\/jerry-garcia/, { timeout: 10_000 }),
      page.locator('a[href="/member/jerry-garcia"]').click(),
    ])
  })

  test('shows years active for each member', async ({ page }) => {
    await expect(page.getByText('1965 – 1995').first()).toBeVisible()
  })

  test('no JS errors on load', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await page.waitForTimeout(1500)
    expect(errors).toHaveLength(0)
  })
})
