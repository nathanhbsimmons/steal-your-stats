import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSearchResults } from '@/components/search/use-search-results'
import type { RailFilters } from '@/components/search/use-search-state'

function makeFilters(overrides: Partial<RailFilters> = {}): RailFilters {
  return { audio: false, release: false, series: [], decade: [], era: [], country: [], state: [], ...overrides }
}

function showsPage(from: number, to: number) {
  return Array.from({ length: to - from }, (_, i) => ({ id: `show-${from + i}`, date: `1977-01-${String(from + i + 1).padStart(2, '0')}` }))
}

function mockFetchByPage(totalShows: number, pageSize = 20) {
  return vi.fn((url: string) => {
    const u = new URL(url, 'http://localhost')
    const page = parseInt(u.searchParams.get('page') ?? '1', 10)
    const start = (page - 1) * pageSize
    const shows = showsPage(start, Math.min(start + pageSize, totalShows))
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        tokens: [], text: '', songs: [], venues: [], releases: [],
        shows,
        facets: {},
        totals: { songs: 0, venues: 0, releases: 0, shows: totalShows },
        page, pageSize,
      }),
    })
  }) as unknown as typeof fetch
}

describe('useSearchResults: pagination', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('reports totals.shows even though only one page of shows is returned', async () => {
    global.fetch = mockFetchByPage(77)
    const { result } = renderHook(() => useSearchResults('dicks picks 1970s', makeFilters(), 1))

    await waitFor(() => expect(result.current.data).not.toBeNull())

    expect(result.current.data!.totals.shows).toBe(77)
    expect(result.current.data!.shows).toHaveLength(20)
  })

  it('appends the next page onto the existing shows rather than replacing them', async () => {
    global.fetch = mockFetchByPage(77)
    const { result, rerender } = renderHook(
      ({ page }) => useSearchResults('dicks picks 1970s', makeFilters(), page),
      { initialProps: { page: 1 } }
    )

    await waitFor(() => expect(result.current.data?.shows).toHaveLength(20))

    rerender({ page: 2 })
    await waitFor(() => expect(result.current.data?.shows).toHaveLength(40))

    // First page's rows are still present, not dropped when page 2 arrives.
    expect(result.current.data!.shows[0].id).toBe('show-0')
    expect(result.current.data!.shows[39].id).toBe('show-39')
    expect(result.current.data!.totals.shows).toBe(77)
  })

  it('starts a fresh (replacing) list when the query changes, even if page stays 1', async () => {
    global.fetch = mockFetchByPage(77)
    const { result, rerender } = renderHook(
      ({ q }) => useSearchResults(q, makeFilters(), 1),
      { initialProps: { q: 'dicks picks 1970s' } }
    )
    await waitFor(() => expect(result.current.data?.shows).toHaveLength(20))

    global.fetch = mockFetchByPage(3)
    rerender({ q: 'dark star' })
    await waitFor(() => expect(result.current.data?.totals.shows).toBe(3))

    expect(result.current.data!.shows).toHaveLength(3)
  })

  it('starts a fresh list when filters change while page stays 1', async () => {
    global.fetch = mockFetchByPage(77)
    const { result, rerender } = renderHook(
      ({ filters }) => useSearchResults('dicks picks 1970s', filters, 1),
      { initialProps: { filters: makeFilters() } }
    )
    await waitFor(() => expect(result.current.data?.shows).toHaveLength(20))

    global.fetch = mockFetchByPage(5)
    rerender({ filters: makeFilters({ audio: true }) })
    await waitFor(() => expect(result.current.data?.totals.shows).toBe(5))

    expect(result.current.data!.shows).toHaveLength(5)
  })

  it('exposes loadingMore (not the initial loading flag) while fetching a later page', async () => {
    let resolvePage2!: (v: unknown) => void
    let callCount = 0
    global.fetch = vi.fn((url: string) => {
      callCount++
      const u = new URL(url, 'http://localhost')
      const page = parseInt(u.searchParams.get('page') ?? '1', 10)
      if (page === 1) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            tokens: [], text: '', songs: [], venues: [], releases: [],
            shows: showsPage(0, 20), facets: {},
            totals: { songs: 0, venues: 0, releases: 0, shows: 40 },
            page: 1, pageSize: 20,
          }),
        })
      }
      return new Promise(resolve => { resolvePage2 = resolve })
    }) as unknown as typeof fetch

    const { result, rerender } = renderHook(
      ({ page }) => useSearchResults('dicks picks 1970s', makeFilters(), page),
      { initialProps: { page: 1 } }
    )
    await waitFor(() => expect(result.current.data?.shows).toHaveLength(20))
    expect(result.current.loading).toBe(false)

    rerender({ page: 2 })
    await waitFor(() => expect(result.current.loadingMore).toBe(true))
    expect(result.current.loading).toBe(false)

    resolvePage2({
      ok: true,
      json: () => Promise.resolve({
        tokens: [], text: '', songs: [], venues: [], releases: [],
        shows: showsPage(20, 40), facets: {},
        totals: { songs: 0, venues: 0, releases: 0, shows: 40 },
        page: 2, pageSize: 20,
      }),
    })
    await waitFor(() => expect(result.current.loadingMore).toBe(false))
    expect(callCount).toBe(2)
  })
})
