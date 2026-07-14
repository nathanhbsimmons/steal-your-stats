import { describe, it, expect, vi, beforeEach } from 'vitest'

const readFileSync = vi.fn()

vi.mock('fs', () => {
  const mocked = { readFileSync: (...args: unknown[]) => readFileSync(...args) }
  return { default: mocked, ...mocked }
})

describe('archiveCatalog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    delete (globalThis as unknown as { __archiveCatalog?: unknown }).__archiveCatalog
  })

  it('returns undefined for both lookups when no catalog file exists on disk', async () => {
    readFileSync.mockImplementation(() => { throw new Error('ENOENT') })
    const { archiveCatalog } = await import('@/lib/services/archive-catalog')

    expect(archiveCatalog.getByDate('1977-05-08')).toBeUndefined()
    expect(archiveCatalog.getByIdentifier('gd1977-05-08.sbd')).toBeUndefined()
  })

  it('indexes loaded entries by date and, when present, by identifier', async () => {
    const entries = [
      {
        date: '1977-05-08',
        candidates: [{ identifier: 'gd1977-05-08.sbd', title: 'Barton Hall', recordingType: 'sbd', score: 1 }],
        best: {
          identifier: 'gd1977-05-08.sbd',
          venue: 'Barton Hall', city: 'Ithaca',
          tracks: [{ name: 'gd77-05-08d1t01.mp3', title: 'Dark Star', length: '1200.0' }],
        },
        resolvedAt: 1700000000000,
      },
      {
        // Negative entry: confirmed no Archive.org recording for this date.
        date: '1972-08-27',
        candidates: [],
        resolvedAt: 1700000000000,
      },
    ]
    readFileSync.mockReturnValue(JSON.stringify(entries))
    const { archiveCatalog } = await import('@/lib/services/archive-catalog')

    const byDate = archiveCatalog.getByDate('1977-05-08')
    expect(byDate?.best?.identifier).toBe('gd1977-05-08.sbd')

    const byIdentifier = archiveCatalog.getByIdentifier('gd1977-05-08.sbd')
    expect(byIdentifier?.date).toBe('1977-05-08')

    const negative = archiveCatalog.getByDate('1972-08-27')
    expect(negative).toBeDefined()
    expect(negative?.best).toBeUndefined()

    // A negative entry has no identifier, so it isn't indexed for identifier lookups.
    expect(archiveCatalog.getByIdentifier('1972-08-27')).toBeUndefined()
    expect(archiveCatalog.getByDate('1994-06-24')).toBeUndefined()
  })

  it('loads the catalog file from disk at most once (lazy singleton)', async () => {
    readFileSync.mockReturnValue(JSON.stringify([]))
    const { archiveCatalog } = await import('@/lib/services/archive-catalog')

    archiveCatalog.getByDate('1977-05-08')
    archiveCatalog.getByDate('1972-08-27')
    archiveCatalog.getByIdentifier('gd1977-05-08.sbd')

    expect(readFileSync).toHaveBeenCalledTimes(1)
  })
})
