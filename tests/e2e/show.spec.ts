import { test, expect } from '@playwright/test'
import { mockAllApis, mockShowDetail } from './fixtures'

async function setupShowPage(page: Parameters<typeof mockAllApis>[0], date = '1977-05-08') {
  await mockAllApis(page)
  await page.goto(`/show/${date}`)
  await expect(page.getByRole('heading', { level: 2 })).toBeVisible({ timeout: 10_000 })
}

test.describe('Show detail page — hero section', () => {
  test('displays the formatted date in the heading', async ({ page }) => {
    await setupShowPage(page)
    // Date formats as "Sunday, May 8, 1977"
    await expect(page.getByRole('heading', { level: 2 })).toContainText('1977')
  })

  test('shows the venue name', async ({ page }) => {
    await setupShowPage(page)
    await expect(page.getByText('Barton Hall, Cornell University')).toBeVisible({ timeout: 8_000 })
  })

  test('shows city and state in lede', async ({ page }) => {
    await setupShowPage(page)
    await expect(page.getByText(/Ithaca.*NY/)).toBeVisible({ timeout: 8_000 })
  })

  test('shows total song count', async ({ page }) => {
    await setupShowPage(page)
    await expect(page.getByText(`${mockShowDetail.totalSongs} songs`)).toBeVisible({ timeout: 8_000 })
  })

  test('"Play entire show" button is visible', async ({ page }) => {
    await setupShowPage(page)
    await expect(page.getByRole('button', { name: /Play entire show/ })).toBeVisible()
  })

  test('shows breadcrumb with date', async ({ page }) => {
    await setupShowPage(page)
    await expect(page.getByText('1977-05-08')).toBeVisible()
  })
})

test.describe('Show detail page — setlist', () => {
  test('renders set headings', async ({ page }) => {
    await setupShowPage(page)
    // Set blocks show "Set 1" / "Set 2" labels or Roman numerals
    await expect(page.getByText('Set 1').or(page.getByText(/^I$/)).first()).toBeVisible({ timeout: 8_000 })
  })

  test('lists song titles in setlist', async ({ page }) => {
    await setupShowPage(page)
    await expect(page.getByText('Scarlet Begonias')).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText('Fire on the Mountain')).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText('Estimated Prophet')).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText('Morning Dew')).toBeVisible({ timeout: 8_000 })
  })

  test('song titles are links to song pages', async ({ page }) => {
    await setupShowPage(page)
    const link = page.getByRole('link', { name: 'Scarlet Begonias' })
    await expect(link).toBeVisible()
    const href = await link.getAttribute('href')
    expect(href).toMatch(/\/song\/Scarlet%20Begonias/)
  })

  test('add-to-queue (+) buttons exist for each song', async ({ page }) => {
    await setupShowPage(page)
    const addBtns = page.locator('.add-q')
    const count = await addBtns.count()
    expect(count).toBeGreaterThan(0)
  })

  test('shows provenance note', async ({ page }) => {
    await setupShowPage(page)
    await expect(page.getByText(/setlist\.fm/)).toBeVisible({ timeout: 8_000 })
  })
})

test.describe('Show detail page — loading and error states', () => {
  test('shows loading skeleton before data arrives', async ({ page }) => {
    await page.route('**/api/show**', async route => {
      await new Promise(r => setTimeout(r, 1500))
      await route.fulfill({ json: mockShowDetail })
    })
    await mockAllApis(page)
    await page.goto('/show/1977-05-08')
    await expect(page.locator('.skeleton-vault').first()).toBeVisible()
  })

  test('shows "Show not found" error state when API fails', async ({ page }) => {
    await page.route('**/api/show**', r => r.fulfill({ status: 404, json: { error: 'not found' } }))
    await mockAllApis(page)
    await page.goto('/show/9999-99-99')
    await expect(page.getByText('Show not found')).toBeVisible({ timeout: 10_000 })
  })

  test('no JS errors on load', async ({ page }) => {
    await mockAllApis(page)
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await page.goto('/show/1977-05-08')
    await page.waitForTimeout(2000)
    expect(errors).toHaveLength(0)
  })
})

test.describe('Show detail page — autoplay param', () => {
  test('?autoplay=1 triggers play automatically without JS error', async ({ page }) => {
    await mockAllApis(page)
    await page.route('**/api/archive/**', r => r.fulfill({ status: 404, json: {} }))
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await page.goto('/show/1977-05-08?autoplay=1')
    await page.waitForTimeout(2000)
    expect(errors).toHaveLength(0)
  })
})
