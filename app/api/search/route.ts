import { NextRequest, NextResponse } from 'next/server'
import { getSongCatalog } from '@/lib/ids'
import { searchAndRank } from '@/lib/search/score'
import { parseQuery } from '@/lib/search/query-parser'
import {
  getShowIndex,
  filterShows,
  computeFacetCounts,
  tokensToFilters,
  type ShowFilters,
} from '@/lib/services/show-index'
import type { RecordingType } from '@/lib/clients/archive'

const PAGE_SIZE = 20

function railFilters(searchParams: URLSearchParams): Partial<ShowFilters> {
  const filters: Partial<ShowFilters> = {}

  if (searchParams.get('audio') === '1') filters.hasAudio = true
  if (searchParams.get('release') === '1') filters.hasRelease = true

  const rec = searchParams.get('rec')
  if (rec === 'sbd' || rec === 'aud' || rec === 'matrix' || rec === 'unknown') {
    filters.recordingType = rec as RecordingType
  }

  const series = searchParams.getAll('series').filter(Boolean)
  if (series.length > 0) filters.series = series

  const year = searchParams.get('year')
  if (year) {
    const n = parseInt(year, 10)
    if (!isNaN(n)) filters.year = n
  }

  const yearFrom = searchParams.get('yearFrom')
  const yearTo = searchParams.get('yearTo')
  if (yearFrom || yearTo) {
    const from = yearFrom ? parseInt(yearFrom, 10) : undefined
    const to = yearTo ? parseInt(yearTo, 10) : undefined
    if (from !== undefined && !isNaN(from)) filters.yearFrom = from
    if (to !== undefined && !isNaN(to)) filters.yearTo = to
  }

  const decades = searchParams.getAll('decade').map(d => parseInt(d, 10)).filter(n => !isNaN(n))
  if (decades.length > 0) filters.decade = decades

  const eras = searchParams.getAll('era').filter(Boolean)
  if (eras.length > 0) filters.eraId = eras

  const countries = searchParams.getAll('country').filter(Boolean)
  if (countries.length > 0) filters.country = countries

  const states = searchParams.getAll('state').filter(Boolean)
  if (states.length > 0) filters.state = states

  const city = searchParams.get('city')
  if (city) filters.city = city

  const tour = searchParams.get('tour')
  if (tour) filters.tour = tour

  return filters
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const rawQuery = searchParams.get('q') ?? ''
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)

  const { text, tokens } = parseQuery(rawQuery)
  const filters = tokensToFilters(tokens, railFilters(searchParams))

  const index = await getShowIndex()
  const allMatchingShows = filterShows(index, filters, text)
  const facets = computeFacetCounts(index, filters, text)

  const start = (page - 1) * PAGE_SIZE
  const shows = allMatchingShows.slice(start, start + PAGE_SIZE)

  const hasFreeText = text.trim().length > 0

  const songs = hasFreeText
    ? searchAndRank(getSongCatalog(), text, s => s.displayTitle, s => s.aliases)
        .slice(0, 12)
        .map(({ item, score }) => ({ ...item, score }))
    : []

  const venueMap = new Map<string, { name: string; city: string; state?: string; country: string; showCount: number; firstYear: number; lastYear: number }>()
  for (const entry of index) {
    const key = entry.venueSlug
    const existing = venueMap.get(key)
    if (existing) {
      existing.showCount++
      existing.firstYear = Math.min(existing.firstYear, entry.year)
      existing.lastYear = Math.max(existing.lastYear, entry.year)
    } else {
      venueMap.set(key, {
        name: entry.venue, city: entry.city, state: entry.state, country: entry.country,
        showCount: 1, firstYear: entry.year, lastYear: entry.year,
      })
    }
  }
  const venues = hasFreeText
    ? searchAndRank([...venueMap.values()], text, v => `${v.name} ${v.city}`)
        .slice(0, 10)
        .map(({ item }) => item)
    : []

  const releaseMap = new Map<string, { title: string; series: string; volume?: string; date: string }>()
  for (const entry of index) {
    for (const release of entry.releases) {
      if (!releaseMap.has(release.title)) {
        releaseMap.set(release.title, { title: release.title, series: release.series, volume: release.volume, date: release.date })
      }
    }
  }
  const releases = hasFreeText
    ? searchAndRank([...releaseMap.values()], text, r => r.title)
        .slice(0, 10)
        .map(({ item }) => item)
    : []

  return NextResponse.json(
    {
      tokens,
      text,
      filters,
      songs,
      venues,
      releases,
      shows,
      facets,
      totals: { songs: songs.length, venues: venues.length, releases: releases.length, shows: allMatchingShows.length },
      page,
      pageSize: PAGE_SIZE,
    },
    { headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=21600' } }
  )
}
