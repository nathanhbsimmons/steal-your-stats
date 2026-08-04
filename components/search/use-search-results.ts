'use client'

import { useEffect, useRef, useState } from 'react'
import type { RailFilters } from './use-search-state'
import type { SearchResponse } from './types'
import type { ShowIndexEntry } from '@/lib/services/show-index'

function buildQueryString(dq: string, filters: RailFilters, page: number): string {
  const params = new URLSearchParams()
  if (dq) params.set('q', dq)
  if (filters.audio) params.set('audio', '1')
  if (filters.release) params.set('release', '1')
  if (filters.rec) params.set('rec', filters.rec)
  for (const s of filters.series) params.append('series', s)
  if (filters.year) params.set('year', filters.year)
  if (filters.yearFrom) params.set('yearFrom', filters.yearFrom)
  if (filters.yearTo) params.set('yearTo', filters.yearTo)
  for (const d of filters.decade) params.append('decade', d)
  for (const e of filters.era) params.append('era', e)
  for (const c of filters.country) params.append('country', c)
  for (const s of filters.state) params.append('state', s)
  if (filters.city) params.set('city', filters.city)
  if (filters.tour) params.set('tour', filters.tour)
  if (page > 1) params.set('page', String(page))
  return params.toString()
}

function hasAnyFilter(filters: RailFilters): boolean {
  return filters.audio || filters.release || !!filters.rec || filters.series.length > 0 ||
    !!filters.year || !!filters.yearFrom || !!filters.yearTo || filters.decade.length > 0 ||
    filters.era.length > 0 || filters.country.length > 0 || filters.state.length > 0 || !!filters.city || !!filters.tour
}

export function useSearchResults(dq: string, filters: RailFilters, page: number) {
  const [data, setData] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const qs = buildQueryString(dq, filters, page)
  // Identifies "the same search" independent of page — used to tell a brand-new query
  // (which should replace the shows list) apart from paging further into the current
  // one (which should append), since /api/search only ever returns one page at a time.
  const baseQs = buildQueryString(dq, filters, 1)
  const active = !!dq.trim() || hasAnyFilter(filters)
  const accumulated = useRef<{ baseQs: string; shows: ShowIndexEntry[] }>({ baseQs: '', shows: [] })

  useEffect(() => {
    if (!active) {
      setData(null); setLoading(false); setLoadingMore(false)
      accumulated.current = { baseQs: '', shows: [] }
      return
    }
    let cancelled = false
    const isNewSearch = accumulated.current.baseQs !== baseQs
    if (isNewSearch) setLoading(true)
    else setLoadingMore(true)

    fetch(`/api/search?${qs}`)
      .then(r => r.json())
      .then((d: SearchResponse) => {
        if (cancelled) return
        accumulated.current = {
          baseQs,
          shows: isNewSearch ? d.shows : [...accumulated.current.shows, ...d.shows],
        }
        setData({ ...d, shows: accumulated.current.shows })
      })
      .catch(() => { if (!cancelled && isNewSearch) setData(null) })
      .finally(() => { if (!cancelled) { setLoading(false); setLoadingMore(false) } })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs, baseQs, active])

  return { data, loading, loadingMore, active }
}
