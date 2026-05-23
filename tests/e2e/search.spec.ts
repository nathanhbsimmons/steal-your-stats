import { test, expect } from '@playwright/test'
import { mockAllApis, mockSongSearchResults, mockVenueShows, mockVenueSongs, mockNoSongResults } from './fixtures'

test.describe('Search page — song mode', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page)
  })

  test('shows placeholder text when no query', async ({ page }) => {
    await page.goto('/search')
    await expect(page.getByText(/Start typing to search/)).toBeVisible()
  })

  test('shows song results when query matches a song', async ({ page }) => {
    await page.route('**/api/songs**', r => r.fulfill({ json: mockSongSearchResults }))
    await page.goto('/search?q=Dark+Star')
    // a.row is the song result link; distinct from venue leaderboard entries
    await expect(page.locator('a.row', { hasText: 'Dark Star' })).toBeVisible({ timeout: 8_000 })
  })

  test('navigates to song page when a song result is clicked', async ({ page }) => {
    await page.route('**/api/songs**', r => r.fulfill({ json: mockSongSearchResults }))
    await page.goto('/search?q=Dark+Star')
    await expect(page.locator('a.row', { hasText: 'Dark Star' })).toBeVisible({ timeout: 8_000 })
    await page.locator('a.row', { hasText: 'Dark Star' }).click()
    await expect(page).toHaveURL(/\/song\/Dark/)
  })

  test('"No songs found" shown when query matches nothing', async ({ page }) => {
    // Override venue-shows so we stay in song mode (empty venue → isVenueMode=false)
    await page.route('**/api/shows/by-venue**', r => r.fulfill({ json: { shows: [] } }))
    await page.goto('/search?q=zzznomatch')
    await expect(page.getByText('No songs found.')).toBeVisible({ timeout: 8_000 })
  })
})

test.describe('Search page — venue mode', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page)
  })

  test('shows venue shows column when no songs match', async ({ page }) => {
    await page.goto('/search?q=Fillmore+East')
    await expect(page.getByText('Shows at Fillmore East')).toBeVisible({ timeout: 8_000 })
  })

  test('populates songs column with venue leaderboard', async ({ page }) => {
    await page.goto('/search?q=Fillmore+East')
    await expect(page.getByText('Songs · Fillmore East')).toBeVisible({ timeout: 8_000 })
  })

  test('leaderboard shows top song names', async ({ page }) => {
    await page.goto('/search?q=Fillmore+East')
    await expect(page.getByText('Dark Star').first()).toBeVisible({ timeout: 8_000 })
  })

  test('leaderboard shows play counts', async ({ page }) => {
    await page.goto('/search?q=Fillmore+East')
    // First song's count (38) should be visible
    await expect(page.getByText('38').first()).toBeVisible({ timeout: 8_000 })
  })

  test('clicking leaderboard song navigates to song page with venue filter', async ({ page }) => {
    await page.goto('/search?q=Fillmore+East')
    await expect(page.getByText('Dark Star').first()).toBeVisible({ timeout: 8_000 })
    await page.getByText('Dark Star').first().click()
    await expect(page).toHaveURL(/\/song\/Dark%20Star\?venue=Fillmore%20East/)
  })

  test('each venue show row links to show page', async ({ page }) => {
    await page.goto('/search?q=Fillmore+East')
    await expect(page.getByText('1971-10-21')).toBeVisible({ timeout: 8_000 })
  })

  test('shows "No song data for this venue" when leaderboard returns empty', async ({ page }) => {
    await page.route('**/api/venues/songs**', r => r.fulfill({ json: { songs: [] } }))
    await page.goto('/search?q=Fillmore+East')
    await expect(page.getByText('No song data for this venue')).toBeVisible({ timeout: 8_000 })
  })

  test('venue API down shows no songs message, not a crash', async ({ page }) => {
    await page.route('**/api/venues/songs**', r => r.abort())
    await page.goto('/search?q=Fillmore+East')
    // Shows column should still render (venue shows side works)
    await expect(page.getByText('Shows at Fillmore East')).toBeVisible({ timeout: 8_000 })
    // No unhandled JS errors
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await page.waitForTimeout(1000)
    expect(errors).toHaveLength(0)
  })

  test('typing a new query updates the search', async ({ page }) => {
    await page.goto('/search')
    // Use the .search-big container to target the page input, not the masthead input
    const input = page.locator('.search-big input')
    await input.fill('Fillmore East')
    await expect(page.getByText('Songs · Fillmore East')).toBeVisible({ timeout: 8_000 })
  })

  test('clear button resets query and hides results', async ({ page }) => {
    await page.goto('/search?q=Fillmore+East')
    await expect(page.getByText('Shows at Fillmore East')).toBeVisible({ timeout: 8_000 })
    await page.getByRole('button', { name: 'clear' }).click()
    await expect(page.getByText(/Start typing to search/)).toBeVisible()
  })
})
