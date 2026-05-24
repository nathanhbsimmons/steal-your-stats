import { test, expect } from '@playwright/test'
import { mockAllApis } from './fixtures'

const PLAY_LOG_KEY = 'steal-your-stats-play-log'

const mockPlayLog = [
  {
    timestamp: Date.now() - 3600000,
    trackName: 'gd77-05-08d1t01.mp3',
    showDate: '1977-05-08',
    venue: 'Barton Hall',
    city: 'Ithaca',
    duration: 312,
  },
  {
    timestamp: Date.now() - 7200000,
    trackName: 'gd72-05-26d1t01.mp3',
    showDate: '1972-05-26',
    venue: 'Strand Lyceum',
    city: 'London',
    duration: 540,
  },
]

test.describe('Recent play log page — empty state', () => {
  test('shows empty-state message when log is empty', async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/recent')
    await expect(page.getByText(/Nothing played yet/)).toBeVisible({ timeout: 8_000 })
  })

  test('renders page heading', async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/recent')
    await expect(page.getByText(/play log/i)).toBeVisible({ timeout: 8_000 })
  })

  test('lede shows 0 tracks when empty', async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/recent')
    await expect(page.getByText(/The deck has not yet been played/)).toBeVisible({ timeout: 8_000 })
  })

  test('no JS errors on empty load', async ({ page }) => {
    await mockAllApis(page)
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await page.goto('/recent')
    await page.waitForTimeout(1500)
    expect(errors).toHaveLength(0)
  })
})

test.describe('Recent play log page — with entries', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page)
    // Seed localStorage before navigating
    await page.addInitScript((data) => {
      localStorage.setItem('steal-your-stats-play-log', JSON.stringify(data))
    }, mockPlayLog)
    await page.goto('/recent')
  })

  test('shows the play log entries', async ({ page }) => {
    await expect(page.getByText('gd77-05-08d1t01.mp3')).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText('gd72-05-26d1t01.mp3')).toBeVisible({ timeout: 8_000 })
  })

  test('shows venue and show date for each entry', async ({ page }) => {
    await expect(page.getByText('1977-05-08').first()).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText('Barton Hall').first()).toBeVisible({ timeout: 8_000 })
  })

  test('shows "Today" day heading for recent entries', async ({ page }) => {
    await expect(page.getByText('Today')).toBeVisible({ timeout: 8_000 })
  })

  test('shows formatted duration for tracks', async ({ page }) => {
    // 312 seconds = 5:12, 540 seconds = 9:00
    await expect(page.getByText('5:12')).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText('9:00')).toBeVisible({ timeout: 8_000 })
  })

  test('lede updates to show track and day count', async ({ page }) => {
    await expect(page.getByText(/2 tracks/).first()).toBeVisible({ timeout: 8_000 })
  })

  test('no JS errors with play log entries', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await page.waitForTimeout(1500)
    expect(errors).toHaveLength(0)
  })
})
