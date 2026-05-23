import { test, expect } from '@playwright/test'
import { mockAllApis, mockStats, mockSongFacts, mockPositionFacts, mockVersions } from './fixtures'

test.describe('Export page — layout and navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/export')
  })

  test('renders page heading', async ({ page }) => {
    await expect(page.getByText(/perfect set/i)).toBeVisible({ timeout: 8_000 })
  })

  test('shows "Setlist Builder" tab button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Setlist Builder/ })).toBeVisible()
  })

  test('shows "Data Export" tab button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Data Export/ })).toBeVisible()
  })

  test('Setlist Builder tab is active by default', async ({ page }) => {
    const builderTab = page.getByRole('button', { name: /Setlist Builder/ })
    await expect(builderTab).toHaveClass(/active/)
  })

  test('clicking Data Export tab switches content', async ({ page }) => {
    await page.getByRole('button', { name: /Data Export/ }).click()
    await expect(page.getByText('Song Dossier')).toBeVisible({ timeout: 8_000 })
  })

  test('no JS errors on load', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await page.waitForTimeout(1500)
    expect(errors).toHaveLength(0)
  })
})

test.describe('Export page — Data Export tab', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/export')
    await page.getByRole('button', { name: /Data Export/ }).click()
    await expect(page.getByText('Song Dossier')).toBeVisible({ timeout: 8_000 })
  })

  test('song input has default value "Dark Star"', async ({ page }) => {
    const input = page.getByPlaceholder('Song name…')
    await expect(input).toHaveValue('Dark Star')
  })

  test('shows dossier section checkboxes', async ({ page }) => {
    await expect(page.getByText('Performance facts')).toBeVisible()
    await expect(page.getByText('Position breakdown')).toBeVisible()
    await expect(page.getByText('Versions table (top 25)')).toBeVisible()
  })

  test('live preview shows the song title', async ({ page }) => {
    await expect(page.getByText('STEAL YOUR STATS · SONG DOSSIER')).toBeVisible()
    // The preview shows the song name
    await expect(page.locator('.col').filter({ hasText: 'Dark Star' }).first()).toBeVisible({ timeout: 8_000 })
  })

  test('typing in song input updates the live preview', async ({ page }) => {
    const input = page.getByPlaceholder('Song name…')
    await input.clear()
    await input.fill('Casey Jones')
    // Preview updates to show new song name
    await expect(page.getByText('Casey Jones').first()).toBeVisible({ timeout: 8_000 })
  })

  test('"↓ Download CSV" button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Download CSV/ })).toBeVisible()
  })

  test('"↓ Download .md" button is visible and enabled with default song', async ({ page }) => {
    const dossierBtn = page.getByRole('button', { name: /Download .md/ })
    await expect(dossierBtn).toBeVisible()
    await expect(dossierBtn).not.toBeDisabled()
  })

  test('download .md button is disabled when song input is empty', async ({ page }) => {
    const input = page.getByPlaceholder('Song name…')
    await input.clear()
    const dossierBtn = page.getByRole('button', { name: /Download .md/ })
    await expect(dossierBtn).toBeDisabled()
  })

  test('CSV download button shows "Fetching…" while loading', async ({ page }) => {
    await page.route('**/api/stats**', async route => {
      await new Promise(r => setTimeout(r, 1500))
      await route.fulfill({ json: mockStats })
    })
    await page.getByRole('button', { name: /Download CSV/ }).click()
    await expect(page.getByRole('button', { name: 'Fetching…' })).toBeVisible()
  })

  test('toggling a section checkbox hides it from preview', async ({ page }) => {
    // "Aliases & attribution" is off by default — toggling "Performance facts" off
    const perfRow = page.locator('div', { hasText: 'Performance facts' }).first()
    await perfRow.click()
    // The preview "sections" panel should no longer include Performance facts bullet
    await expect(page.getByText('Performance facts').first()).toBeVisible() // label still in left panel
    // but the preview panel's bullet should be gone
    const previewBullets = page.locator('.col').filter({ hasText: 'STEAL YOUR STATS · SONG DOSSIER' })
    await expect(previewBullets).not.toContainText('Performance facts')
  })

  test('"coming in the next pressing" placeholder is visible', async ({ page }) => {
    await expect(page.getByText(/coming in the next pressing/)).toBeVisible()
  })
})

test.describe('Export page — Setlist Builder tab', () => {
  test('Setlist Builder content renders without crash', async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/export')
    // Default tab is builder — just check it doesn't crash
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await page.waitForTimeout(1500)
    expect(errors).toHaveLength(0)
  })
})
