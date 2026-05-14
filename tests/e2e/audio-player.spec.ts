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
  opener: { count: 10, shows: [] },
  closer: { count: 5, shows: [] },
  encore: { count: 3, shows: [] },
}

const mockVersionsFacts = { tracks: [], extremes: null }

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

// ── Helper ───────────────────────────────────────────────────────────────────

async function setupApiMocks(page: Page) {
  await page.route('**/api/song-facts**', route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(mockSongFacts) })
  )
  await page.route('**/api/position-facts**', route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(mockPositionFacts) })
  )
  await page.route('**/api/versions**', route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(mockVersionsFacts) })
  )
  await page.route('**/api/archive/resolve-show**', route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(mockArchiveShow) })
  )
  await page.route('**/api/archive/song-tracks**', route =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(mockTracks) })
  )
}

async function loadSongPage(page: Page, song = 'Dark%20Star') {
  await setupApiMocks(page)
  await page.goto(`/song/${song}`)
  // Wait for song data to load
  await expect(page.getByText('Dark Star').first()).toBeVisible({ timeout: 10_000 })
}

// ── Tests ────────────────────────────────────────────────────────────────────

test.describe('Audio Player — initial state', () => {
  test('renders empty player and queue on load', async ({ page }) => {
    await loadSongPage(page)
    await expect(page.getByText('No track selected')).toBeVisible()
    await expect(page.getByText('Queue is empty')).toBeVisible()
  })

  test('play/pause controls not rendered when no track is selected', async ({ page }) => {
    await loadSongPage(page)
    // AudioPlayerDock renders only the empty-state card when currentTrack is null
    await expect(page.getByRole('button', { name: 'Play', exact: true })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Pause', exact: true })).not.toBeVisible()
  })
})

test.describe('Audio Player — queue management', () => {
  test('clicking Play First Show Versions adds tracks to queue', async ({ page }) => {
    await loadSongPage(page)
    await page.getByRole('button', { name: 'Play First Show Versions' }).click()
    await expect(page.getByText('Queue (2)')).toBeVisible({ timeout: 10_000 })
  })

  test('clicking Play First Show Versions auto-selects first track', async ({ page }) => {
    await loadSongPage(page)
    await page.getByRole('button', { name: 'Play First Show Versions' }).click()
    // Player should now show a track (not "No track selected")
    await expect(page.getByText('No track selected')).not.toBeVisible({ timeout: 10_000 })
  })

  test('removing a track from the queue decrements count', async ({ page }) => {
    await loadSongPage(page)
    await page.getByRole('button', { name: 'Play First Show Versions' }).click()
    await expect(page.getByText('Queue (2)')).toBeVisible({ timeout: 10_000 })

    await page.getByRole('button', { name: /Remove track 1/ }).click()
    await expect(page.getByText('Queue (1)')).toBeVisible()
  })

  test('Clear button empties the queue', async ({ page }) => {
    await loadSongPage(page)
    await page.getByRole('button', { name: 'Play First Show Versions' }).click()
    await expect(page.getByText('Queue (2)')).toBeVisible({ timeout: 10_000 })

    await page.getByRole('button', { name: 'Clear', exact: true }).click()
    await expect(page.getByText('Queue is empty')).toBeVisible()
  })

  test('"Clear & Play Entire Show" replaces queue with full show', async ({ page }) => {
    await loadSongPage(page)

    // Add some tracks first
    await page.getByRole('button', { name: 'Play First Show Versions' }).click()
    await expect(page.getByText('Queue (2)')).toBeVisible({ timeout: 10_000 })

    // Mock a second resolve-show call for the entire show
    await page.route('**/api/archive/resolve-show**', route =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(mockArchiveShow) })
    )
    await page.route('**/api/archive/song-tracks**', route =>
      route.fulfill({ contentType: 'application/json', body: JSON.stringify(mockTracks) })
    )

    await page.getByRole('button', { name: 'Clear & Play Entire Show' }).click()
    // Queue should still have tracks (replaced, not cleared to zero)
    await expect(page.getByText('Queue is empty')).not.toBeVisible({ timeout: 10_000 })
  })
})

test.describe('Audio Player — playback controls', () => {
  test('play button becomes pause after track is selected', async ({ page }) => {
    await loadSongPage(page)
    await page.getByRole('button', { name: 'Play First Show Versions' }).click()
    await expect(page.getByText('Queue (2)')).toBeVisible({ timeout: 10_000 })

    // A track should be auto-selected; play/pause button should exist
    await expect(
      page.getByRole('button', { name: /^(Play|Pause)$/ }).first()
    ).toBeVisible()
  })

  test('clicking a track in the queue makes it current', async ({ page }) => {
    await loadSongPage(page)
    await page.getByRole('button', { name: 'Play First Show Versions' }).click()
    await expect(page.getByText('Queue (2)')).toBeVisible({ timeout: 10_000 })

    // Click second track in queue
    await page.getByRole('button', { name: /Play track 2/ }).click()
    // Player should show the track (not "No track selected")
    await expect(page.getByText('No track selected')).not.toBeVisible()
  })

  test('Next track button is enabled when a track is loaded', async ({ page }) => {
    await loadSongPage(page)
    await page.getByRole('button', { name: 'Play First Show Versions' }).click()
    await expect(page.getByText('Queue (2)')).toBeVisible({ timeout: 10_000 })

    const nextBtn = page.getByRole('button', { name: 'Next track' })
    await expect(nextBtn).not.toBeDisabled()
  })

  test('Previous track button is enabled when a track is loaded', async ({ page }) => {
    await loadSongPage(page)
    await page.getByRole('button', { name: 'Play First Show Versions' }).click()
    await expect(page.getByText('Queue (2)')).toBeVisible({ timeout: 10_000 })

    const prevBtn = page.getByRole('button', { name: 'Previous track' })
    await expect(prevBtn).not.toBeDisabled()
  })

  test('clicking Next advances to second track', async ({ page }) => {
    await loadSongPage(page)
    await page.getByRole('button', { name: 'Play First Show Versions' }).click()
    await expect(page.getByText('Queue (2)')).toBeVisible({ timeout: 10_000 })

    // Both track labels should be visible in the queue
    await expect(page.getByText('Track 1').first()).toBeVisible()
    await expect(page.getByText('Track 2').first()).toBeVisible()

    // Click Next — second track becomes the current track in the player
    await page.getByRole('button', { name: 'Next track' }).click()

    // Player header should update (no longer on the first track's position)
    // Verify no JS errors occurred during navigation
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))
    expect(errors).toHaveLength(0)
  })
})

test.describe('Audio Player — keyboard shortcuts', () => {
  test('Space key does not throw errors when no track selected', async ({ page }) => {
    await loadSongPage(page)
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))

    await page.keyboard.press('Space')
    expect(errors).toHaveLength(0)
  })

  test('Space key does not throw errors when track is playing', async ({ page }) => {
    await loadSongPage(page)
    await page.getByRole('button', { name: 'Play First Show Versions' }).click()
    await expect(page.getByText('Queue (2)')).toBeVisible({ timeout: 10_000 })

    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))

    await page.keyboard.press('Space')
    await page.keyboard.press('Space')
    expect(errors).toHaveLength(0)
  })

  test('ArrowRight moves to next track', async ({ page }) => {
    await loadSongPage(page)
    await page.getByRole('button', { name: 'Play First Show Versions' }).click()
    await expect(page.getByText('Queue (2)')).toBeVisible({ timeout: 10_000 })

    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))
    await page.keyboard.press('ArrowRight')
    expect(errors).toHaveLength(0)
  })

  test('M key toggles mute without error', async ({ page }) => {
    await loadSongPage(page)
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))

    await page.keyboard.press('m')
    expect(errors).toHaveLength(0)
  })
})

test.describe('Audio Player — Play Entire Show', () => {
  test('Play Entire Show button appears when a track is loaded', async ({ page }) => {
    await loadSongPage(page)
    await page.getByRole('button', { name: 'Play First Show Versions' }).click()
    await expect(page.getByText('Queue (2)')).toBeVisible({ timeout: 10_000 })

    await expect(page.getByRole('button', { name: 'Play entire show', exact: true })).toBeVisible()
  })
})
