import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const getShowsOnDate = vi.fn()
const fetchShowDetailMock = vi.fn()
const listCandidates = vi.fn()
const selectBest = vi.fn()
const getAllTracks = vi.fn()
const readFileSync = vi.fn()
const writeFileSync = vi.fn()
const mkdirSync = vi.fn()

vi.mock('@/lib/services/realtime-song-facts', () => ({
  realtimeSongFactsService: {
    getShowsOnDate: (...args: unknown[]) => getShowsOnDate(...args),
  },
}))

vi.mock('@/lib/services/show-detail', () => ({
  fetchShowDetail: (...args: unknown[]) => fetchShowDetailMock(...args),
}))

vi.mock('@/lib/clients/archive', () => ({
  ArchiveClientImpl: class {
    listArchiveShowCandidates = (...args: unknown[]) => listCandidates(...args)
    selectBestRecording = (...args: unknown[]) => selectBest(...args)
    getAllTracks = (...args: unknown[]) => getAllTracks(...args)
  },
}))

vi.mock('fs', () => {
  const mocked = {
    readFileSync: (...args: unknown[]) => readFileSync(...args),
    writeFileSync: (...args: unknown[]) => writeFileSync(...args),
    mkdirSync: (...args: unknown[]) => mkdirSync(...args),
  }
  return { default: mocked, ...mocked }
})

import { ShowOfTheDayService, localDateKey } from '@/lib/services/show-of-the-day'

const barton = {
  date: '1977-05-08', year: 1977, venue: 'Barton Hall', city: 'Ithaca',
  state: 'NY', country: 'US', songs: ['Dark Star'],
}
const bartonDetail = {
  date: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca', state: 'NY', country: 'US',
  sets: [{ name: 'Set 1', encore: false, songs: ['Dark Star', 'St. Stephen'], segues: [false, false] }],
  totalSongs: 2,
}

function happyPathMocks() {
  getShowsOnDate.mockResolvedValue([barton])
  fetchShowDetailMock.mockResolvedValue(bartonDetail)
  listCandidates.mockResolvedValue([{ identifier: 'gd77-05-08.sbd' }])
  selectBest.mockResolvedValue({ identifier: 'gd77-05-08.sbd', mp3Count: 2 })
  getAllTracks.mockResolvedValue([
    { name: 'gd77t01.mp3', title: 'Dark Star', length: '23:00' },
  ])
}

async function flushAsync() {
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

describe('ShowOfTheDayService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-07-12T09:00:00'))
    readFileSync.mockImplementation(() => { throw new Error('no disk cache') })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('computes the full payload on first get()', async () => {
    happyPathMocks()
    const svc = new ShowOfTheDayService()
    const payload = await svc.get()

    expect(payload.dateKey).toBe('2026-07-12')
    expect(getShowsOnDate).toHaveBeenCalledWith('07', '12')
    expect(payload.featured).toEqual(barton)
    expect(payload.showDetail).toEqual(bartonDetail)
    expect(payload.archive?.identifier).toBe('gd77-05-08.sbd')
    expect(payload.archive?.tracks[0].url).toBe('https://archive.org/download/gd77-05-08.sbd/gd77t01.mp3')
    expect(payload.complete).toBe(true)
  })

  it('serves from memory on subsequent get() without recomputing', async () => {
    happyPathMocks()
    const svc = new ShowOfTheDayService()
    const first = await svc.get()
    const second = await svc.get()

    expect(second).toBe(first)
    expect(getShowsOnDate).toHaveBeenCalledTimes(1)
  })

  it('recomputes when the calendar date rolls over', async () => {
    happyPathMocks()
    const svc = new ShowOfTheDayService()
    const first = await svc.get()
    expect(first.dateKey).toBe('2026-07-12')

    vi.setSystemTime(new Date('2026-07-13T00:06:00'))
    const second = await svc.get()

    expect(second.dateKey).toBe('2026-07-13')
    expect(getShowsOnDate).toHaveBeenCalledTimes(2)
    expect(getShowsOnDate).toHaveBeenLastCalledWith('07', '13')
  })

  it('dedupes concurrent get() calls into one compute', async () => {
    happyPathMocks()
    const svc = new ShowOfTheDayService()
    const [a, b] = await Promise.all([svc.get(), svc.get()])

    expect(a).toBe(b)
    expect(getShowsOnDate).toHaveBeenCalledTimes(1)
  })

  it('returns a partial payload when the archive stage fails, then retries after the window', async () => {
    happyPathMocks()
    listCandidates.mockRejectedValue(new Error('archive.org down'))
    const svc = new ShowOfTheDayService()

    const partial = await svc.get()
    expect(partial.showDetail).toEqual(bartonDetail)
    expect(partial.archive).toBeNull()
    expect(partial.complete).toBe(false)

    // Within the retry window: served as-is, no recompute.
    await svc.get()
    expect(getShowsOnDate).toHaveBeenCalledTimes(1)

    // Past the window: partial served immediately, recompute fires in background.
    listCandidates.mockResolvedValue([{ identifier: 'gd77-05-08.sbd' }])
    vi.setSystemTime(new Date('2026-07-12T09:11:00'))
    const stillPartial = await svc.get()
    expect(stillPartial.complete).toBe(false)

    await flushAsync()
    const healed = await svc.get()
    expect(healed.complete).toBe(true)
    expect(healed.archive?.identifier).toBe('gd77-05-08.sbd')
  })

  it('treats a day with no shows as complete', async () => {
    getShowsOnDate.mockResolvedValue([])
    const svc = new ShowOfTheDayService()
    const payload = await svc.get()

    expect(payload.featured).toBeNull()
    expect(payload.complete).toBe(true)
    expect(fetchShowDetailMock).not.toHaveBeenCalled()
  })

  it('persists to disk and a fresh instance adopts a same-day disk payload', async () => {
    happyPathMocks()
    const svc = new ShowOfTheDayService()
    await svc.get()
    expect(writeFileSync).toHaveBeenCalledTimes(1)
    const written = writeFileSync.mock.calls[0][1] as string

    vi.clearAllMocks()
    readFileSync.mockReturnValue(written)
    const fresh = new ShowOfTheDayService()
    const payload = await fresh.get()

    expect(payload.dateKey).toBe('2026-07-12')
    expect(payload.complete).toBe(true)
    expect(getShowsOnDate).not.toHaveBeenCalled()
  })

  it('ignores a disk payload from a different date', async () => {
    happyPathMocks()
    readFileSync.mockReturnValue(JSON.stringify({
      dateKey: '2026-07-11', shows: [], featured: null, showDetail: null,
      archive: null, complete: true, computedAt: Date.now(),
    }))
    const svc = new ShowOfTheDayService()
    const payload = await svc.get()

    expect(payload.dateKey).toBe('2026-07-12')
    expect(getShowsOnDate).toHaveBeenCalledTimes(1)
  })
})

describe('localDateKey', () => {
  it('formats as YYYY-MM-DD with zero padding', () => {
    expect(localDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})
