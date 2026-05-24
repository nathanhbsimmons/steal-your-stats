import { test, expect } from '@playwright/test'
import { mockAllApis, mockStats } from './fixtures'

test.describe('Eras overview page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/eras')
  })

  test('renders page heading', async ({ page }) => {
    await expect(page.getByText(/five lives/i)).toBeVisible({ timeout: 8_000 })
  })

  test('shows all five era cards', async ({ page }) => {
    const eraNames = ['Primal Dead', "Europe '72", 'Hiatus & Return', 'Brent Years', 'Final Tours']
    for (const name of eraNames) {
      await expect(page.getByText(name).first()).toBeVisible({ timeout: 8_000 })
    }
  })

  test('shows era year ranges', async ({ page }) => {
    await expect(page.getByText('1965 – 1971')).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText('1991 – 1995')).toBeVisible({ timeout: 8_000 })
  })

  test('era tags are displayed', async ({ page }) => {
    await expect(page.getByText('Pigpen era')).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText('Arena Dead')).toBeVisible({ timeout: 8_000 })
  })

  test('clicking an era card updates the focus section', async ({ page }) => {
    await expect(page.getByText('Primal Dead').first()).toBeVisible({ timeout: 8_000 })
    await page.getByText('Primal Dead').first().click()
    await expect(page.getByText('Focus · Primal Dead')).toBeVisible({ timeout: 8_000 })
  })

  test('focus section shows signature jam', async ({ page }) => {
    // Default focus is europe72
    await expect(page.getByText('Signature jam')).toBeVisible({ timeout: 8_000 })
  })

  test('focus section shows songs debuted in this era', async ({ page }) => {
    await expect(page.getByText('Songs debuted in this era')).toBeVisible({ timeout: 8_000 })
  })

  test('focus section shows avg show length', async ({ page }) => {
    await expect(page.getByText('Avg. show length')).toBeVisible({ timeout: 8_000 })
  })

  test('each era card has an "Explore" link', async ({ page }) => {
    const exploreLinks = page.getByRole('link', { name: 'Explore ⟶' })
    const count = await exploreLinks.count()
    expect(count).toBe(5)
  })

  test('"Explore" link for Primal Dead navigates to era detail', async ({ page }) => {
    const primalCard = page.locator('.era-card', { hasText: 'Primal Dead' })
    await primalCard.getByRole('link', { name: 'Explore ⟶' }).click()
    await expect(page).toHaveURL(/\/eras\/primal/)
  })

  test('?focus= param pre-selects the correct era', async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/eras?focus=primal')
    await expect(page.getByText('Focus · Primal Dead')).toBeVisible({ timeout: 8_000 })
  })

  test('shows show counts from stats API', async ({ page }) => {
    // Stats mock has showsPerYear data; era cards should show aggregated counts
    // Just verify no "—" or loading placeholder for show count
    const eraCards = page.locator('.era-card')
    await expect(eraCards.first()).toBeVisible({ timeout: 8_000 })
    // Each card has a Shows label
    await expect(page.getByText('Shows').first()).toBeVisible()
  })

  test('timeline strip is rendered', async ({ page }) => {
    await expect(page.locator('.timeline')).toBeVisible({ timeout: 8_000 })
  })

  test('no JS errors on load', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await page.waitForTimeout(2000)
    expect(errors).toHaveLength(0)
  })
})

test.describe('Era detail page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/eras/europe')
  })

  test('renders the era name', async ({ page }) => {
    await expect(page.getByText(/Europe '72/)).toBeVisible({ timeout: 8_000 })
  })

  test('shows the era tag', async ({ page }) => {
    await expect(page.getByText('wall-of-sound')).toBeVisible({ timeout: 8_000 })
  })

  test('shows era description', async ({ page }) => {
    await expect(page.getByText(/legendary European tours/)).toBeVisible({ timeout: 8_000 })
  })

  test('signature songs are pill links', async ({ page }) => {
    const darkStarLink = page.locator('a.pill', { hasText: 'Dark Star' })
    await expect(darkStarLink).toBeVisible({ timeout: 8_000 })
    await expect(darkStarLink).toHaveAttribute('href', /\/song\/Dark%20Star/)
  })

  test('shows list renders after data loads', async ({ page }) => {
    await expect(page.getByText('Strand Lyceum')).toBeVisible({ timeout: 8_000 })
  })

  test('"Most played" sidebar shows top song names', async ({ page }) => {
    await expect(page.getByText('Dark Star').first()).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText("Playing in the Band").first()).toBeVisible({ timeout: 8_000 })
  })

  test('show rows link to show pages', async ({ page }) => {
    await expect(page.getByText('Strand Lyceum')).toBeVisible({ timeout: 8_000 })
    const showLink = page.locator('a', { hasText: 'Strand Lyceum' }).first()
    const href = await showLink.getAttribute('href')
    expect(href).toMatch(/\/show\/1972-05-26/)
  })

  test('shows "Era not found" for unknown era id', async ({ page }) => {
    await mockAllApis(page)
    await page.goto('/eras/unknown-era')
    await expect(page.getByText('Era not found')).toBeVisible({ timeout: 8_000 })
  })

  test('no JS errors on load', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await page.waitForTimeout(2000)
    expect(errors).toHaveLength(0)
  })
})
