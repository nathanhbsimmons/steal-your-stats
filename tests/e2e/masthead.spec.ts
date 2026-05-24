import { test, expect } from '@playwright/test'
import { mockAllApis, mockWeather } from './fixtures'

test.describe('Masthead — weather widget', () => {
  test('displays live temperature and GD lyric label after load', async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/')

    // SWR fetches /api/weather; wait for the label to appear
    const weather = page.locator('.weather')
    await expect(weather).toContainText('°F', { timeout: 8_000 })
    await expect(weather).toContainText(mockWeather.label)
  })

  test('shows temperature as a number followed by °F', async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/')

    const weather = page.locator('.weather')
    await expect(weather).toContainText(`${mockWeather.temp}°F`, { timeout: 8_000 })
  })

  test('shows ellipsis (…) while weather is loading', async ({ page }) => {
    // Register base mocks first, then override weather with slow route.
    // Last-registered wins in Playwright, so the slow route takes precedence.
    await mockAllApis(page)
    await page.route('**/api/weather**', async route => {
      await new Promise(r => setTimeout(r, 2000))
      await route.fulfill({ json: mockWeather })
    })
    await page.goto('/')

    const weather = page.locator('.weather')
    await expect(weather).toContainText('…')
  })

  test('shows nothing when weather API returns an error', async ({ page }) => {
    // Register base mocks first, then override weather with error route.
    await mockAllApis(page)
    await page.route('**/api/weather**', r => r.fulfill({ status: 503, json: { temp: null, code: null, label: null } }))
    await page.goto('/')

    const weather = page.locator('.weather')
    await expect(weather).not.toContainText('°F', { timeout: 6_000 })
    await expect(weather).not.toContainText('undefined')
  })

  test('⌘K keyboard shortcut focuses the search input', async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/')

    await page.keyboard.press('Meta+k')
    // The masthead search input should be focused
    const input = page.locator('header input')
    await expect(input).toBeFocused({ timeout: 3_000 })
  })

  test('pressing Enter in masthead search navigates to /search', async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/')

    const input = page.locator('header input')
    await input.fill('Dark Star')
    await input.press('Enter')
    await expect(page).toHaveURL(/\/search\?q=Dark/)
  })
})
