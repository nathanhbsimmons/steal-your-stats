import { test, expect } from '@playwright/test'
import { mockAllApis, mockStats, mockSongFacts, mockPositionFacts, mockVersions } from './fixtures'

const mockSetlistSongs = {
  songs: [
    {
      title: 'dark star', displayTitle: 'Dark Star', aliases: [],
      hints: {
        positionHints: { isCommonOpener: false, isCommonCloser: false, isCommonEncore: false },
        avgDurationSec: 900,
        topPredecessors: [{ name: 'China Cat Sunflower', count: 5 }],
        topSuccessors: [{ name: 'St. Stephen', count: 4 }],
      },
    },
    {
      title: 'bertha', displayTitle: 'Bertha', aliases: [],
      hints: {
        positionHints: { isCommonOpener: true, isCommonCloser: false, isCommonEncore: false },
        avgDurationSec: 400,
      },
    },
  ],
  total: 2,
}

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
    await expect(page.getByText('Song Dossier — Markdown')).toBeVisible({ timeout: 8_000 })
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
    await expect(page.getByText('Song Dossier — Markdown')).toBeVisible({ timeout: 8_000 })
  })

  test('song input has default value "Dark Star"', async ({ page }) => {
    const input = page.getByPlaceholder('Song name…')
    await expect(input).toHaveValue('Dark Star')
  })

  test('shows dossier section checkboxes', async ({ page }) => {
    await expect(page.getByText('Performance facts').first()).toBeVisible()
    await expect(page.getByText('Position breakdown').first()).toBeVisible()
    await expect(page.getByText('Versions table (top 25)').first()).toBeVisible()
  })

  test('sections are a labeled fieldset of real, checked checkboxes', async ({ page }) => {
    await expect(page.getByRole('group', { name: 'Sections' })).toBeVisible()
    await expect(page.getByRole('checkbox', { name: /Performance facts/ })).toBeChecked()
    await expect(page.getByRole('checkbox', { name: /Aliases & attribution/ })).not.toBeChecked()
  })

  test('a section checkbox is keyboard-toggleable', async ({ page }) => {
    const checkbox = page.getByRole('checkbox', { name: /Performance facts/ })
    await checkbox.focus()
    await page.keyboard.press('Space')
    await expect(checkbox).not.toBeChecked()
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
    // Click the visible label text — bubbles to the wrapping <label>'s checkbox
    await page.locator('span', { hasText: 'Performance facts' }).first().click()
    // Checkbox label is still visible in the left panel
    await expect(page.getByText('Performance facts').first()).toBeVisible()
    // Preview panel (right column — parent of "Live preview" label) no longer shows the bullet
    const rightColumn = page.getByText('Live preview', { exact: true }).locator('..')
    await expect(rightColumn).not.toContainText('Performance facts')
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

test.describe('Export page — Setlist Builder accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await mockAllApis(page)
    await page.route('**/api/songs**', r => r.fulfill({ json: mockSetlistSongs }))
    await page.goto('/export')
    await page.getByPlaceholder('China Cat, Dark Star, Bertha…').fill('dark')
  })

  // Search results and the added setlist can both show a song's title, so
  // scope the "Add" click to the result row (title span's immediate parent).
  async function addFromResults(page: import('@playwright/test').Page, title: string) {
    await page.getByText(title, { exact: true }).first().locator('..').getByRole('button', { name: /^Add/ }).click()
  }

  test('the search-is-pending state is announced in a live region', async ({ page }) => {
    await page.route('**/api/songs**', async r => {
      await new Promise(res => setTimeout(res, 800))
      await r.fulfill({ json: mockSetlistSongs })
    })
    await page.getByPlaceholder('China Cat, Dark Star, Bertha…').fill('darkx')
    await expect(page.locator('[aria-live="polite"]', { hasText: 'Searching…' })).toBeAttached()
  })

  test('predecessor/successor chips are toggle buttons with aria-pressed', async ({ page }) => {
    const pred = page.getByRole('button', { name: /China Cat Sunflower/ })
    const succ = page.getByRole('button', { name: /St\. Stephen/ })
    await expect(pred).toHaveAttribute('aria-pressed', 'false')
    await expect(succ).toHaveAttribute('aria-pressed', 'false')

    await pred.click()
    await expect(pred).toHaveAttribute('aria-pressed', 'true')
    await succ.click()
    await expect(succ).toHaveAttribute('aria-pressed', 'true')
  })

  test('added song rows have an accessible, song-specific remove and segue control', async ({ page }) => {
    await addFromResults(page, 'Dark Star')

    const removeBtn = page.getByRole('button', { name: 'Remove Dark Star' })
    await expect(removeBtn).toBeVisible()

    const segueBtn = page.getByRole('button', { name: /segue after Dark Star/ })
    await expect(segueBtn).toHaveAttribute('aria-pressed', 'false')
    await segueBtn.click()
    await expect(segueBtn).toHaveAttribute('aria-pressed', 'true')
  })

  test('keyboard "Move down"/"Move up" reorders the setlist and announces the move', async ({ page }) => {
    await addFromResults(page, 'Dark Star')
    await addFromResults(page, 'Bertha')

    // Starting order: Dark Star, Bertha — Dark Star is first, Bertha is last.
    await expect(page.getByRole('button', { name: 'Move Dark Star up' })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Move Bertha down' })).toBeDisabled()

    await page.getByRole('button', { name: 'Move Dark Star down' }).click()

    await expect(page.locator('[aria-live="polite"]', { hasText: 'Dark Star moved to position 2 of 2' })).toBeAttached()
    // Order is now flipped: Bertha first, Dark Star last.
    await expect(page.getByRole('button', { name: 'Move Bertha up' })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Move Dark Star down' })).toBeDisabled()
  })

  test('clear-search button is a labeled type="button" control', async ({ page }) => {
    const clearBtn = page.getByRole('button', { name: 'Clear search' })
    await expect(clearBtn).toBeVisible()
    await expect(clearBtn).toHaveAttribute('type', 'button')
  })
})
