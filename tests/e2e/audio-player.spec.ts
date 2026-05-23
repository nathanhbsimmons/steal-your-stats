import { test, expect, Page } from '@playwright/test'

// ── Mock data ────────────────────────────────────────────────────────────────

const mockSongFacts = {
  songTitle: 'Dark Star',
  aliases: ['Darkstar'],
  totalPerformances: 135,
  first: { date: '1968-04-02', venue: 'Carousel Ballroom', city: 'San Francisco', country: 'US', url: '' },
  last: { date: '1995-03-29', venue: 'The Omni', city: 'Atlanta', country: 'US', url: '' },
}

const mockPositionFacts = {
  opener: { count: 2, shows: [
    { date: '1970-02-11', venue: 'Winterland Arena', city: 'San Francisco', country: 'US', url: '' },
    { date: '1969-11-02', venue: 'Fillmore West', city: 'San Francisco', country: 'US', url: '' },
  ]},
  closer: { count: 1, shows: [{ date: '1972-08-27', venue: 'Old Renaissance Faire Grounds', city: 'Veneta', country: 'US', url: '' }]},
  encore: { count: 0, shows: [] },
}

const mockVersionsFacts = {
  tracks: [
    { id: 'ds-1', showDate: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca', country: 'US', durationSec: 817 },
    { id: 'ds-2', showDate: '1972-08-27', venue: 'Old Renaissance Faire Grounds', city: 'Veneta', country: 'US', durationSec: 2341 },
  ],
  extremes: null,
  songTitle: 'Dark Star',
}

const mockArchiveShow = {
  identifier: 'gd68-04-02.aud.seamons.25.sbeok.shnf',
  title: 'Grateful Dead Live at Carousel Ballroom on 1968-04-02',
  creator: 'Grateful Dead',
  date: '1968-04-02T00:00:00Z',
  venue: 'Carousel Ballroom',
  city: 'San Francisco',
  state: 'CA',
  country: 'USA',
  licenseurl: '',
  rights: '',
  publicdate: '',
}

const mockTracks = {
  tracks: [
    {
      id: 'gd68-04-02-t1',
      name: 'gd68-04-02d1t01.mp3',
      url: 'https://archive.org/download/gd68-04-02/gd68-04-02d1t01.mp3',
      showDate: '1968-04-02',
      venue: 'Carousel Ballroom',
      city: 'San Francisco',
      archiveItemId: 'gd68-04-02.aud.seamons.25.sbeok.shnf',
    },
    {
      id: 'gd68-04-02-t2',
      name: 'gd68-04-02d1t02.mp3',
      url: 'https://archive.org/download/gd68-04-02/gd68-04-02d1t02.mp3',
      showDate: '1968-04-02',
      venue: 'Carousel Ballroom',
      city: 'San Francisco',
      archiveItemId: 'gd68-04-02.aud.seamons.25.sbeok.shnf',
    },
  ],
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function setupApiMocks(page: Page) {
  await page.route('**/api/song-facts**', r => r.fulfill({ json: mockSongFacts }))
  await page.route('**/api/position-facts**', r => r.fulfill({ json: mockPositionFacts }))
  await page.route('**/api/versions**', r => r.fulfill({ json: mockVersionsFacts }))
  await page.route('**/api/archive/resolve-show**', r => r.fulfill({ json: mockArchiveShow }))
  await page.route('**/api/archive/song-tracks**', r => r.fulfill({ json: mockTracks }))
  await page.route('**/api/weather**', r => r.fulfill({ json: { temp: 72, code: 1, label: 'Clear' } }))
  await page.route('**/api/stats**', r => r.fulfill({ json: { showsPerYear: [], leaderboard: [] } }))
  await page.route('**/api/stats/summary**', r => r.fulfill({ json: {} }))
}

async function loadSongPage(page: Page, song = 'Dark%20Star') {
  await setupApiMocks(page)
  await page.goto(`/song/${song}`)
  await expect(page.getByText('Dark Star').first()).toBeVisible({ timeout: 10_000 })
}

// Clicks "First show" button and waits for tracks to load into the player
async function addFirstShowToQueue(page: Page) {
  await page.getByRole('button', { name: /First show/i }).click()
  // Wait until the player has a track (no longer shows "nothing in the deck")
  await expect(page.locator('.vault-player .meta .title')).not.toContainText('nothing in the deck', { timeout: 10_000 })
}

// ── Tests ────────────────────────────────────────────────────────────────────

test.describe('VaultPlayer — initial state', () => {
  test('shows "nothing in the deck" when no track loaded', async ({ page }) => {
    await loadSongPage(page)
    await expect(page.locator('.vault-player')).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText('nothing in the deck')).toBeVisible()
  })

  test('shows standby status with no queue', async ({ page }) => {
    await loadSongPage(page)
    await expect(page.getByText(/standby · no queue/)).toBeVisible()
  })

  test('play button is present (aria-label Play)', async ({ page }) => {
    await loadSongPage(page)
    await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()
  })

  test('Queue badge shows 0 initially', async ({ page }) => {
    await loadSongPage(page)
    // Queue button shows "Queue N" — with empty queue, badge is 0
    const queueBtn = page.locator('button.toggleq')
    await expect(queueBtn).toBeVisible()
    await expect(queueBtn).toContainText('0')
  })

  test('no JS errors on load', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await loadSongPage(page)
    await page.waitForTimeout(1500)
    expect(errors).toHaveLength(0)
  })
})

test.describe('VaultPlayer — queue management', () => {
  test('clicking First Show button loads tracks into queue', async ({ page }) => {
    await loadSongPage(page)
    await addFirstShowToQueue(page)
    // Queue badge should now be > 0
    const queueBtn = page.locator('button.toggleq')
    await expect(queueBtn).not.toContainText('0')
  })

  test('after loading tracks, status no longer shows standby', async ({ page }) => {
    await loadSongPage(page)
    await addFirstShowToQueue(page)
    await expect(page.getByText(/standby · no queue/)).not.toBeVisible()
  })

  test('after loading tracks, track info appears in player', async ({ page }) => {
    await loadSongPage(page)
    await addFirstShowToQueue(page)
    // Title area should show the track name (not "nothing in the deck")
    await expect(page.locator('.vault-player .meta .title')).not.toContainText('nothing in the deck')
  })

  test('opening queue drawer shows tracks', async ({ page }) => {
    await loadSongPage(page)
    await addFirstShowToQueue(page)
    // Open the queue drawer
    await page.locator('button.toggleq').click()
    await expect(page.locator('.vault-queue')).toBeVisible({ timeout: 5_000 })
  })

  test('queue drawer has a "Clear queue" button', async ({ page }) => {
    await loadSongPage(page)
    await addFirstShowToQueue(page)
    await page.locator('button.toggleq').click()
    await expect(page.locator('.vault-queue')).toBeVisible({ timeout: 5_000 })
    await expect(page.getByRole('button', { name: 'Clear queue' })).toBeVisible()
  })

  test('"Clear queue" empties the queue', async ({ page }) => {
    await loadSongPage(page)
    await addFirstShowToQueue(page)
    await page.locator('button.toggleq').click()
    await expect(page.locator('.vault-queue')).toBeVisible({ timeout: 5_000 })
    await page.getByRole('button', { name: 'Clear queue' }).click()
    // Queue badge should be back to 0
    const queueBtn = page.locator('button.toggleq')
    await expect(queueBtn).toContainText('0', { timeout: 5_000 })
  })
})

test.describe('VaultPlayer — playback controls', () => {
  test('play/pause button exists', async ({ page }) => {
    await loadSongPage(page)
    // Initially shows "Play" label
    await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()
  })

  test('Previous and Next buttons are present', async ({ page }) => {
    await loadSongPage(page)
    await expect(page.getByRole('button', { name: 'Previous' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible()
  })

  test('after loading a track, play button changes to pause', async ({ page }) => {
    await loadSongPage(page)
    await addFirstShowToQueue(page)
    // selectTrack sets isPlaying=true, so button becomes "Pause"
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible({ timeout: 5_000 })
  })
})

test.describe('VaultPlayer — keyboard shortcuts', () => {
  test('Space key does not throw JS errors', async ({ page }) => {
    await loadSongPage(page)
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await page.keyboard.press('Space')
    expect(errors).toHaveLength(0)
  })

  test('ArrowRight key does not throw JS errors', async ({ page }) => {
    await loadSongPage(page)
    await addFirstShowToQueue(page)
    const errors: string[] = []
    page.on('pageerror', e => errors.push(e.message))
    await page.keyboard.press('ArrowRight')
    expect(errors).toHaveLength(0)
  })
})
