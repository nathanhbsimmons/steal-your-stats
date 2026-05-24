import { test, expect } from '@playwright/test'
import { mockAllApis } from './fixtures'

test.beforeEach(async ({ page }) => {
  await mockAllApis(page)
})

test.describe('Navigation', () => {
  test('home page loads with site title', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Stats')
  })

  test('chapter nav is visible on home page', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('navigation', { name: 'Chapter navigation' })).toBeVisible()
  })

  test('clicking Search nav item navigates to /search', async ({ page }) => {
    await page.goto('/')
    await Promise.all([
      page.waitForURL(/\/search/, { timeout: 8_000 }),
      page.getByRole('navigation').getByText('Search').click(),
    ])
    await expect(page).toHaveURL(/\/search/)
  })

  test('clicking Songs nav item navigates to /songs', async ({ page }) => {
    await page.goto('/')
    await Promise.all([
      page.waitForURL(/\/songs/, { timeout: 8_000 }),
      page.getByRole('navigation').getByText('Songs').click(),
    ])
    await expect(page).toHaveURL(/\/songs/)
  })

  test('clicking Band Members nav item navigates to /artists', async ({ page }) => {
    await page.goto('/')
    await Promise.all([
      page.waitForURL(/\/artists/, { timeout: 8_000 }),
      page.getByRole('navigation').getByText('Band Members').click(),
    ])
    await expect(page).toHaveURL(/\/artists/)
  })

  test('clicking Venues nav item navigates to /venues', async ({ page }) => {
    await page.goto('/')
    await Promise.all([
      page.waitForURL(/\/venues/, { timeout: 8_000 }),
      page.getByRole('navigation').getByText('Venues').click(),
    ])
    await expect(page).toHaveURL(/\/venues/)
  })

  test('clicking Stats nav item navigates to /stats', async ({ page }) => {
    await page.goto('/')
    await Promise.all([
      page.waitForURL(/\/stats/, { timeout: 8_000 }),
      page.getByRole('navigation').getByText('Stats').click(),
    ])
    await expect(page).toHaveURL(/\/stats/)
  })

  test('site title click returns to home from another page', async ({ page }) => {
    await page.goto('/search')
    await page.getByRole('heading', { level: 1 }).click()
    await expect(page).toHaveURL('/')
  })
})
