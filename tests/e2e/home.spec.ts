import { test, expect } from '@playwright/test'
import { mockAllApis, mockOnThisDay, mockStatsSummary } from './fixtures'

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page)
  })

  test('renders "On This Day" section heading', async ({ page }) => {
    await page.goto('/')
    // The label reads "Featured · On This Day"; use first() to avoid strict-mode error
    await expect(page.getByText(/On This Day/).first()).toBeVisible({ timeout: 8_000 })
  })

  test('displays a show from on-this-day API data', async ({ page }) => {
    await page.goto('/')
    // The home page renders shows in a feature card — look for venue or city
    await expect(page.getByText('Ithaca').first()).toBeVisible({ timeout: 8_000 })
  })

  test('shows year of the on-this-day show', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('1977').first()).toBeVisible({ timeout: 8_000 })
  })

  test('displays total shows KPI from stats summary', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(mockStatsSummary.totalShows.toLocaleString()).first()).toBeVisible({ timeout: 8_000 })
  })

  test('displays unique songs KPI', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(String(mockStatsSummary.uniqueSongs)).first()).toBeVisible({ timeout: 8_000 })
  })

  test('shows loading skeletons before data arrives', async ({ page }) => {
    await page.route('**/api/on-this-day**', async route => {
      await new Promise(r => setTimeout(r, 1500))
      await route.fulfill({ json: mockOnThisDay })
    })
    await page.goto('/')
    const skeletons = page.locator('.skeleton-vault')
    await expect(skeletons.first()).toBeVisible()
  })

  test('no JS errors on load', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await page.goto('/')
    await page.waitForTimeout(2000)
    expect(errors).toHaveLength(0)
  })

  test('shows empty-state gracefully when on-this-day returns no shows', async ({ page }) => {
    await page.route('**/api/on-this-day**', r => r.fulfill({ json: { shows: [] } }))
    await page.goto('/')
    await expect(page.getByText(/On This Day/).first()).toBeVisible({ timeout: 8_000 })
    await expect(page.locator('body')).not.toContainText('Error')
  })
})
