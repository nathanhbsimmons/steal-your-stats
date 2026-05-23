import { test, expect } from '@playwright/test'
import { mockAllApis, mockSongsList, mockNoSongResults } from './fixtures'

test.describe('Songs catalog page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page)
    await page.route('**/api/songs**', r => r.fulfill({ json: mockSongsList }))
  })

  test('renders page heading', async ({ page }) => {
    await page.goto('/songs')
    await expect(page.getByText(/catalog/i)).toBeVisible({ timeout: 8_000 })
  })

  test('shows total count in lede', async ({ page }) => {
    await page.goto('/songs')
    // Default lede shows total when no query
    await expect(page.getByText(/442 unique titles/)).toBeVisible({ timeout: 8_000 })
  })

  test('displays songs grouped by letter', async ({ page }) => {
    await page.goto('/songs')
    // The grouped view should show letter headers A, B, D, E, F
    await expect(page.getByText('A').first()).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText('D').first()).toBeVisible({ timeout: 8_000 })
  })

  test('lists song titles in catalog', async ({ page }) => {
    await page.goto('/songs')
    await expect(page.getByText('Althea')).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText('Dark Star')).toBeVisible({ timeout: 8_000 })
  })

  test('filter input narrows results and updates count', async ({ page }) => {
    await page.route('**/api/songs**', r => {
      const url = r.request().url()
      if (url.includes('q=Dark')) return r.fulfill({ json: { songs: [mockSongsList.songs[2]], total: 1 } })
      return r.fulfill({ json: mockSongsList })
    })
    await page.goto('/songs')
    const input = page.getByPlaceholder('filter songs…')
    await input.fill('Dark')
    await expect(page.getByText(/1 result.*"Dark"/)).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText('Dark Star')).toBeVisible({ timeout: 8_000 })
  })

  test('shows "No songs match" when filter returns nothing', async ({ page }) => {
    await page.route('**/api/songs**', r => {
      const url = r.request().url()
      if (url.includes('q=')) return r.fulfill({ json: mockNoSongResults })
      return r.fulfill({ json: mockSongsList })
    })
    await page.goto('/songs')
    const input = page.getByPlaceholder('filter songs…')
    await input.fill('zzznomatch')
    await expect(page.getByText(/No songs match/)).toBeVisible({ timeout: 8_000 })
  })

  test('clear button (×) resets filter', async ({ page }) => {
    await page.route('**/api/songs**', r => {
      const url = r.request().url()
      if (url.includes('q=')) return r.fulfill({ json: { songs: [mockSongsList.songs[2]], total: 1 } })
      return r.fulfill({ json: mockSongsList })
    })
    await page.goto('/songs')
    const input = page.getByPlaceholder('filter songs…')
    await input.fill('Dark')
    await expect(page.getByText('Dark Star')).toBeVisible({ timeout: 8_000 })
    await page.locator('.clear').click()
    await expect(page.getByText('Althea')).toBeVisible({ timeout: 8_000 })
  })

  test('clicking a song navigates to song page', async ({ page }) => {
    await page.goto('/songs')
    await expect(page.getByText('Dark Star')).toBeVisible({ timeout: 8_000 })
    await page.getByText('Dark Star').click()
    await expect(page).toHaveURL(/\/song\/Dark%20Star/)
  })

  test('shows loading skeletons before data arrives', async ({ page }) => {
    await page.route('**/api/songs**', async route => {
      await new Promise(r => setTimeout(r, 1500))
      await route.fulfill({ json: mockSongsList })
    })
    await page.goto('/songs')
    await expect(page.locator('.skeleton-vault').first()).toBeVisible()
  })

  test('no JS errors on load', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await page.goto('/songs')
    await page.waitForTimeout(2000)
    expect(errors).toHaveLength(0)
  })
})
