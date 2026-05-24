import { test, expect } from '@playwright/test'
import { mockAllApis, mockVenues } from './fixtures'

test.describe('Venues page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/venues')
  })

  test('renders the page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Halls/ })).toBeVisible({ timeout: 8_000 })
  })

  test('displays the unique-venues KPI count', async ({ page }) => {
    await expect(page.getByText(String(mockVenues.total)).first()).toBeVisible({ timeout: 8_000 })
  })

  test('lists the most-played venue name', async ({ page }) => {
    await expect(page.getByText('Winterland Arena').first()).toBeVisible({ timeout: 8_000 })
  })

  test('shows show count for each venue', async ({ page }) => {
    await expect(page.getByText('51').first()).toBeVisible({ timeout: 8_000 })
  })

  test('filter input narrows the venue list', async ({ page }) => {
    const input = page.getByPlaceholder('filter venues…')
    await input.fill('Fillmore')
    await expect(page.getByText('Fillmore West')).toBeVisible()
    await expect(page.getByText('Fillmore East').first()).toBeVisible()
    // Check the table cell specifically — KPI box always shows top venue regardless of filter
    await expect(page.locator('.tbl-title', { hasText: 'Winterland Arena' })).not.toBeVisible()
  })

  test('clearing filter restores full list', async ({ page }) => {
    const input = page.getByPlaceholder('filter venues…')
    await input.fill('Fillmore')
    await page.getByText('×').click()
    await expect(page.getByText('Winterland Arena').first()).toBeVisible()
  })

  test('clicking a venue row navigates to search with that venue name', async ({ page }) => {
    await page.getByText('Fillmore East').first().click()
    await expect(page).toHaveURL(/\/search\?q=Fillmore/)
    // Verify the search page loaded with the venue query (shows venue results)
    await expect(page.getByText('Shows at Fillmore East')).toBeVisible({ timeout: 8_000 })
  })

  test('shows years active range in the table', async ({ page }) => {
    await expect(page.getByText('1967 – 1978')).toBeVisible({ timeout: 8_000 })
  })

  test('no JS errors on load', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await page.waitForTimeout(1500)
    expect(errors).toHaveLength(0)
  })
})
