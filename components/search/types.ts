import type { ParsedToken } from '@/lib/search/query-parser'
import type { ShowIndexEntry } from '@/lib/services/show-index'

export interface SearchSongResult {
  title: string
  displayTitle: string
  aliases: string[]
  score: number
}

export interface SearchVenueResult {
  name: string
  city: string
  state?: string
  country: string
  showCount: number
  firstYear: number
  lastYear: number
}

export interface SearchReleaseResult {
  title: string
  series: string
  volume?: string
  date: string
}

export interface FacetOption {
  value: string
  label: string
  count: number
}

export interface SearchResponse {
  tokens: ParsedToken[]
  text: string
  songs: SearchSongResult[]
  venues: SearchVenueResult[]
  releases: SearchReleaseResult[]
  shows: ShowIndexEntry[]
  facets: Record<string, FacetOption[]>
  totals: { songs: number; venues: number; releases: number; shows: number }
  page: number
  pageSize: number
}
