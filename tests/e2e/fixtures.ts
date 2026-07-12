import { Page } from '@playwright/test'

// ── Shared mock payloads ─────────────────────────────────────────────────────

export const mockWeather = { temp: 72, code: 1, label: 'Mainly clear and here comes the sunshine' }

export const mockVenues = {
  total: 3,
  venues: [
    { name: 'Winterland Arena', city: 'San Francisco', state: 'CA', country: 'US', showCount: 51, firstYear: 1967, lastYear: 1978 },
    { name: 'Fillmore West',    city: 'San Francisco', state: 'CA', country: 'US', showCount: 44, firstYear: 1968, lastYear: 1971 },
    { name: 'Fillmore East',    city: 'New York',      state: 'NY', country: 'US', showCount: 26, firstYear: 1968, lastYear: 1971 },
  ],
}

export const mockVenueSongs = {
  songs: [
    { name: 'Dark Star',        count: 38 },
    { name: 'Casey Jones',      count: 32 },
    { name: 'Truckin\'',        count: 29 },
    { name: 'Ripple',           count: 21 },
    { name: 'Friend of the Devil', count: 18 },
  ],
}

export const mockSongFacts = {
  songTitle: 'Dark Star',
  aliases: ['darkstar'],
  totalPerformances: 135,
  first: { date: '1968-04-02', venue: 'Carousel Ballroom', city: 'San Francisco', country: 'US', url: '' },
  last:  { date: '1995-03-29', venue: 'The Omni',          city: 'Atlanta',       country: 'US', url: '' },
}

export const mockPositionFacts = {
  opener: { count: 2, shows: [
    { date: '1970-02-11', venue: 'Winterland Arena', city: 'San Francisco', country: 'US', url: '' },
    { date: '1969-11-02', venue: 'Fillmore West', city: 'San Francisco', country: 'US', url: '' },
  ]},
  closer: { count: 1, shows: [
    { date: '1972-08-27', venue: 'Old Renaissance Faire Grounds', city: 'Veneta', country: 'US', url: '' },
  ]},
  encore: { count: 0, shows: [] },
}

export const mockVersions = {
  tracks: [
    { id: 'ds-1', showDate: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca', country: 'US', durationSec: 817 },
    { id: 'ds-2', showDate: '1972-08-27', venue: 'Old Renaissance Faire Grounds', city: 'Veneta', country: 'US', durationSec: 2341 },
    { id: 'ds-3', showDate: '1970-02-11', venue: 'Winterland Arena', city: 'San Francisco', country: 'US', durationSec: 1240 },
  ],
  extremes: {
    longest:  { id: 'ds-2', showDate: '1972-08-27', venue: 'Old Renaissance Faire Grounds', city: 'Veneta', country: 'US', durationSec: 2341 },
    shortest: { id: 'ds-1', showDate: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca', country: 'US', durationSec: 817 },
  },
  songTitle: 'Dark Star',
}

export const mockSongSearchResults = {
  songs: [{ title: 'dark star', displayTitle: 'Dark Star', aliases: ['Darkstar'] }],
  total: 1,
}

export const mockNoSongResults = { songs: [], total: 0 }

export const mockVenueShows = {
  shows: [
    { date: '1971-10-21', venue: 'Fillmore East', city: 'New York', state: 'NY', country: 'US', songs: [] },
    { date: '1970-09-19', venue: 'Fillmore East', city: 'New York', state: 'NY', country: 'US', songs: [] },
  ],
}

export const mockShowDetail = {
  date: '1977-05-08',
  venue: 'Barton Hall, Cornell University',
  city: 'Ithaca',
  state: 'NY',
  country: 'US',
  sets: [
    { name: 'Set 1', encore: false, songs: ['Scarlet Begonias', 'Fire on the Mountain'] },
    { name: 'Set 2', encore: false, songs: ['Estimated Prophet', 'Morning Dew'] },
  ],
  totalSongs: 4,
}

export const mockStats = {
  showsPerYear: Array.from({ length: 31 }, (_, i) => ({ year: 1965 + i, count: Math.floor(Math.random() * 80) + 10 })),
  leaderboard: [
    { name: 'Playing in the Band', count: 477, pct: 100 },
    { name: 'Dark Star',           count: 135, pct: 28 },
    { name: 'Casey Jones',         count: 120, pct: 25 },
  ],
}

export const mockStatsSummary = { totalShows: 2333, uniqueSongs: 442, hoursArchived: 6299, lastUpdated: null }

export const mockOnThisDay = {
  shows: [{
    date: '1977-05-08', year: 1977,
    venue: 'Barton Hall', city: 'Ithaca', state: 'NY', country: 'US',
    songs: ['Scarlet Begonias', 'Fire on the Mountain'],
  }],
}

export const mockShowOfTheDay = {
  dateKey: '1977-05-08',
  shows: mockOnThisDay.shows,
  featured: mockOnThisDay.shows[0],
  showDetail: mockShowDetail,
  archive: null,
  complete: true,
  computedAt: 0,
}

export const mockShowOfTheDayEmpty = {
  dateKey: '1977-05-08',
  shows: [],
  featured: null,
  showDetail: null,
  archive: null,
  complete: true,
  computedAt: 0,
}

export const mockSongsList = {
  songs: [
    { title: 'althea',           displayTitle: 'Althea',           aliases: [] },
    { title: 'bertha',           displayTitle: 'Bertha',           aliases: [] },
    { title: 'dark star',        displayTitle: 'Dark Star',        aliases: ['Darkstar'] },
    { title: 'estimated prophet', displayTitle: 'Estimated Prophet', aliases: [] },
    { title: 'fire on the mountain', displayTitle: 'Fire on the Mountain', aliases: [] },
  ],
  total: 5,
}

export const mockMemberShows = {
  shows: [
    { date: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca', state: 'NY', country: 'US', songCount: 19 },
    { date: '1977-05-09', venue: 'Buffalo Coliseum', city: 'Buffalo', state: 'NY', country: 'US', songCount: 17 },
  ],
  total: 2,
  page: 1,
  itemsPerPage: 20,
}

export const mockEraShows = {
  shows: [
    { id: 'gd72-05-26', date: '1972-05-26', venue: 'Strand Lyceum', city: 'London', state: null, country: 'GB' },
    { id: 'gd73-02-09', date: '1973-02-09', venue: 'Maples Pavilion', city: 'Stanford', state: 'CA', country: 'US' },
  ],
  total: 2,
  page: 1,
}

export const mockEraTopSongs = {
  songs: [
    { name: 'Dark Star',       count: 64 },
    { name: 'Playing in the Band', count: 58 },
    { name: 'Truckin\'',       count: 42 },
  ],
}

// ── Route setup helpers ──────────────────────────────────────────────────────

export async function mockAllApis(page: Page) {
  // Register general routes FIRST, specific sub-paths LAST.
  // In Playwright, last-registered route wins when multiple patterns match.
  await page.route('**/api/stats**',                   r => r.fulfill({ json: mockStats }))
  await page.route('**/api/venues**',                  r => r.fulfill({ json: mockVenues }))
  await page.route('**/api/songs**',                   r => r.fulfill({ json: mockNoSongResults }))
  await page.route('**/api/show**',                    r => r.fulfill({ json: mockShowDetail }))
  await page.route('**/api/on-this-day**',             r => r.fulfill({ json: mockOnThisDay }))
  await page.route('**/api/weather**',                 r => r.fulfill({ json: mockWeather }))
  await page.route('**/api/song-facts**',              r => r.fulfill({ json: mockSongFacts }))
  await page.route('**/api/position-facts**',          r => r.fulfill({ json: mockPositionFacts }))
  await page.route('**/api/versions**',                r => r.fulfill({ json: mockVersions }))
  await page.route('**/api/member-shows**',            r => r.fulfill({ json: mockMemberShows }))
  await page.route('**/api/shows**',                   r => {
    const url = r.request().url()
    if (url.includes('topSongs=1')) return r.fulfill({ json: mockEraTopSongs })
    return r.fulfill({ json: mockEraShows })
  })
  // These must come AFTER their parent patterns (last-registered = highest priority):
  await page.route('**/api/show-of-the-day**',         r => r.fulfill({ json: mockShowOfTheDay }))
  await page.route('**/api/stats/summary**',           r => r.fulfill({ json: mockStatsSummary }))
  await page.route('**/api/venues/songs**',            r => r.fulfill({ json: mockVenueSongs }))
  await page.route('**/api/search/shows-with-songs**', r => r.fulfill({ json: { shows: [] } }))
  await page.route('**/api/shows/by-venue**',          r => r.fulfill({ json: mockVenueShows }))
}
