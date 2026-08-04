'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function useDebounce<T>(value: T, ms: number): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export interface RailFilters {
  audio: boolean
  release: boolean
  rec?: string
  /** Multi-select (OR): "Dick's Picks or Dave's Picks". */
  series: string[]
  year?: string
  yearFrom?: string
  yearTo?: string
  /** Multi-select (OR): "70s or 80s". Mutually exclusive with `era` as an axis — see
   * tokensToFilters in lib/services/show-index.ts — but multiple decades together are
   * fine since they're the same granularity. */
  decade: string[]
  /** Multi-select (OR), same reasoning as decade. */
  era: string[]
  /** Multi-select (OR). Mutually exclusive with `state` as an axis. */
  country: string[]
  /** Multi-select (OR). Mutually exclusive with `country` as an axis. */
  state: string[]
  city?: string
  tour?: string
}

const RAIL_KEYS = ['audio', 'release', 'rec', 'series', 'year', 'yearFrom', 'yearTo', 'decade', 'era', 'country', 'state', 'city', 'tour'] as const

export function railFiltersFromParams(searchParams: URLSearchParams): RailFilters {
  return {
    audio: searchParams.get('audio') === '1',
    release: searchParams.get('release') === '1',
    rec: searchParams.get('rec') ?? undefined,
    series: searchParams.getAll('series'),
    year: searchParams.get('year') ?? undefined,
    yearFrom: searchParams.get('yearFrom') ?? undefined,
    yearTo: searchParams.get('yearTo') ?? undefined,
    decade: searchParams.getAll('decade'),
    era: searchParams.getAll('era'),
    country: searchParams.getAll('country'),
    state: searchParams.getAll('state'),
    city: searchParams.get('city') ?? undefined,
    tour: searchParams.get('tour') ?? undefined,
  }
}

export function activeRailCount(filters: RailFilters): number {
  let n = 0
  if (filters.audio) n++
  if (filters.release) n++
  if (filters.rec) n++
  n += filters.series.length
  if (filters.year) n++
  if (filters.yearFrom || filters.yearTo) n++
  n += filters.decade.length
  n += filters.era.length
  n += filters.country.length
  n += filters.state.length
  if (filters.city) n++
  if (filters.tour) n++
  return n
}

/** Owns the URL <-> UI state for /search: the raw query text, the debounced value used
 * to drive fetches, and the rail filter selections (which live entirely in the URL so
 * results are linkable). */
export function useSearchState() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [q, setQState] = useState(searchParams.get('q') ?? '')
  const dq = useDebounce(q, 250)

  useEffect(() => {
    setQState(searchParams.get('q') ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('q')])

  const filters = useMemo(() => railFiltersFromParams(searchParams), [searchParams])

  const pushParams = useCallback((updates: Record<string, string | string[] | null>) => {
    const next = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      next.delete(key)
      if (value === null) continue
      if (Array.isArray(value)) {
        for (const v of value) next.append(key, v)
      } else {
        next.set(key, value)
      }
    }
    const qs = next.toString()
    router.replace(qs ? `/search?${qs}` : '/search', { scroll: false })
  }, [router, searchParams])

  // Commit the debounced query text to the URL so results stay linkable.
  useEffect(() => {
    if (dq !== (searchParams.get('q') ?? '')) {
      pushParams({ q: dq || null, page: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dq])

  const setQ = useCallback((value: string) => setQState(value), [])

  const toggleBoolean = useCallback((key: 'audio' | 'release') => {
    pushParams({ [key]: filters[key] ? null : '1', page: null })
  }, [filters, pushParams])

  const setRecordingType = useCallback((value?: string) => {
    pushParams({ rec: value ?? null, page: null })
  }, [pushParams])

  /** Toggle a value in/out of a multi-select rail field (series, decade, era, country,
   * state) — each of these is OR-combined with its own siblings ("70s or 80s"). */
  const toggleArrayField = useCallback((key: 'series' | 'decade' | 'era' | 'country' | 'state', value: string) => {
    const current = filters[key]
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value]
    pushParams({ [key]: next.length ? next : null, page: null })
  }, [filters, pushParams])

  const setSingle = useCallback((key: 'year' | 'city' | 'tour', value?: string) => {
    pushParams({ [key]: value ?? null, page: null })
  }, [pushParams])

  /** Set several rail fields in one atomic navigation — required whenever a change to
   * one field must also clear another (e.g. picking a decade must clear era in the same
   * update). Two sequential setSingle-style calls would each rebuild their patch from the
   * same stale `searchParams` snapshot and the second call would silently undo the first. */
  const setFields = useCallback((fields: Partial<RailFilters>) => {
    const updates: Record<string, string | string[] | null> = { page: null }
    for (const [key, value] of Object.entries(fields)) {
      if (typeof value === 'boolean') {
        updates[key] = value ? '1' : null
      } else {
        updates[key] = value === undefined || (Array.isArray(value) && value.length === 0) ? null : value
      }
    }
    pushParams(updates)
  }, [pushParams])

  const setYearRange = useCallback((from?: string, to?: string) => {
    pushParams({ yearFrom: from ?? null, yearTo: to ?? null, page: null })
  }, [pushParams])

  const clearField = useCallback((key: keyof RailFilters) => {
    pushParams({ [key]: null, page: null })
  }, [pushParams])

  const removeToken = useCallback((raw: string) => {
    setQState(prev => prev.replace(raw, '').replace(/\s+/g, ' ').trim())
  }, [])

  const clearFilters = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString())
    for (const key of RAIL_KEYS) next.delete(key)
    next.delete('page')
    const qs = next.toString()
    router.replace(qs ? `/search?${qs}` : '/search', { scroll: false })
  }, [router, searchParams])

  const clearAll = useCallback(() => {
    setQState('')
    router.replace('/search', { scroll: false })
  }, [router])

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  const setPage = useCallback((p: number) => pushParams({ page: p > 1 ? String(p) : null }), [pushParams])

  return {
    q, setQ, dq, filters, page,
    toggleBoolean, setRecordingType, toggleArrayField, setSingle, setFields, setYearRange, clearField,
    removeToken, clearFilters, clearAll, setPage,
  }
}
