import { test, expect } from '@playwright/test'
import { mockAllApis, mockMemberShows } from './fixtures'

test.describe('Member detail page — Jerry Garcia', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/member/jerry-garcia')
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible({ timeout: 10_000 })
  })

  test('displays member name as h2', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 2 })).toContainText('Jerry Garcia')
  })

  test('shows member role', async ({ page }) => {
    await expect(page.getByText('Lead guitar · vocals')).toBeVisible()
  })

  test('shows years active', async ({ page }) => {
    await expect(page.getByText('1965–1995')).toBeVisible()
  })

  test('shows show count', async ({ page }) => {
    await expect(page.getByText('2,328').first()).toBeVisible()
  })

  test('shows bio text', async ({ page }) => {
    await expect(page.getByText(/Jerome John Garcia/)).toBeVisible()
  })

  test('shows "Signature shows" section', async ({ page }) => {
    await expect(page.getByText('Signature shows')).toBeVisible()
  })

  test('lists at least one signature show date', async ({ page }) => {
    await expect(page.getByText('1977-05-08')).toBeVisible()
  })

  test('shows "Songs debuted in this era" section', async ({ page }) => {
    await expect(page.getByText('Songs debuted in this era')).toBeVisible()
  })

  test('debut songs are pill links to song pages', async ({ page }) => {
    const sugareeLink = page.locator('a.pill', { hasText: 'Sugaree' }).first()
    await expect(sugareeLink).toBeVisible()
    await expect(sugareeLink).toHaveAttribute('href', /\/song\/Sugaree/)
  })

  test('shows "Signature songs" section', async ({ page }) => {
    await expect(page.getByText('Signature songs')).toBeVisible()
  })

  test('shows "Browse shows" section with loaded data', async ({ page }) => {
    await expect(page.getByText('Browse shows')).toBeVisible()
    // Mocked data should show Barton Hall
    await expect(page.getByText('Barton Hall')).toBeVisible({ timeout: 8_000 })
  })

  test('year pager buttons are rendered', async ({ page }) => {
    // Previous/next year navigation
    await expect(page.getByText('previous year').or(page.getByText('start of run'))).toBeVisible({ timeout: 8_000 })
  })

  test('"View era" button links to eras page', async ({ page }) => {
    const eraBtn = page.getByRole('link', { name: /View era/ })
    await expect(eraBtn).toBeVisible()
    const href = await eraBtn.getAttribute('href')
    expect(href).toMatch(/\/eras/)
  })

  test('shows breadcrumb navigation', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'BAND MEMBERS' })).toBeVisible()
    await expect(page.getByText('JERRY GARCIA').first()).toBeVisible()
  })

  test('no JS errors on load', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await page.waitForTimeout(2000)
    expect(errors).toHaveLength(0)
  })
})

test.describe('Member detail page — unknown slug', () => {
  test('shows "Member not found" for invalid slug', async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/member/nobody-special')
    await expect(page.getByText('Member not found')).toBeVisible({ timeout: 8_000 })
  })
})

test.describe('Member detail page — year browsing', () => {
  test('clicking next year in pager updates selected year', async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/member/jerry-garcia')
    await expect(page.getByText('Browse shows')).toBeVisible({ timeout: 10_000 })

    const nextBtn = page.locator('.pg.right')
    const currentYear = page.locator('.current-year .yr')
    const initial = await currentYear.textContent()
    await nextBtn.click()
    const updated = await currentYear.textContent()
    expect(updated).not.toBe(initial)
  })

  test('year strip tabs are visible', async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/member/jerry-garcia')
    await expect(page.locator('.year-tab').first()).toBeVisible({ timeout: 10_000 })
  })
})
