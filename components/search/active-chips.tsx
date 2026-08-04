'use client'

import type { ParsedToken } from '@/lib/search/query-parser'
import type { RailFilters } from './use-search-state'
import { ERA_DEFS } from '@/lib/eras'

type CategoryId = 'audio' | 'release' | 'time' | 'place' | 'tour'

const CAT_META: Record<CategoryId, { ccVar: string; name: string }> = {
  audio: { ccVar: '--cat-audio', name: 'Audio' },
  release: { ccVar: '--cat-rel', name: 'Release' },
  time: { ccVar: '--cat-time', name: 'Time' },
  place: { ccVar: '--cat-place', name: 'Place' },
  tour: { ccVar: '--cat-tour', name: 'Tour' },
}

const TOKEN_CATEGORY: Record<ParsedToken['facet'], CategoryId> = {
  date: 'time', year: 'time', yearRange: 'time', decade: 'time', month: 'time', season: 'time', era: 'time',
  series: 'release', recordingType: 'audio', hasAudio: 'audio', hasRelease: 'release',
  country: 'place', state: 'place',
}

export interface Chip {
  key: string
  cat: CategoryId
  label: string
  onRemove: () => void
}

function eraName(id: string): string {
  return ERA_DEFS.find(e => e.id === id)?.name ?? id
}

export interface ActiveChipsCallbacks {
  removeToken: (raw: string) => void
  toggleBoolean: (key: 'audio' | 'release') => void
  setRecordingType: (value?: string) => void
  toggleArrayField: (key: 'series' | 'decade' | 'era' | 'country' | 'state', value: string) => void
  clearField: (key: keyof RailFilters) => void
  setYearRange: (from?: string, to?: string) => void
}

/**
 * Builds the flat chip list from parsed tokens + rail filters. Exported (not just used
 * internally) so callers that need to know "is there anything to clear" — e.g. mobile's
 * pinned clear-all button, which must stay visible outside the horizontally-scrolling
 * chip strip — can reuse the exact same "which tokens actually count" logic instead of
 * re-deriving a slightly-different approximation of it.
 */
export function buildActiveChips(tokens: ParsedToken[], filters: RailFilters, cb: ActiveChipsCallbacks): Chip[] {
  const chips: Chip[] = []

  // A rail selection always wins over a same-axis typed token (see tokensToFilters in
  // lib/services/show-index.ts) — so a token whose axis the rail already covers isn't
  // actually being applied, and showing its chip anyway would be a lie: a filter chip
  // sitting right there, doing nothing. Skip promoting it instead.
  const railHasTime = !!(filters.year || filters.yearFrom || filters.yearTo || filters.decade.length || filters.era.length)
  const railHasPlace = filters.country.length > 0 || filters.state.length > 0
  const TIME_FACETS = new Set(['date', 'year', 'yearRange', 'decade', 'month', 'season', 'era'])
  const PLACE_FACETS = new Set(['country', 'state'])

  for (const token of tokens) {
    if (railHasTime && TIME_FACETS.has(token.facet)) continue
    if (railHasPlace && PLACE_FACETS.has(token.facet)) continue
    if (filters.rec && token.facet === 'recordingType') continue
    chips.push({ key: `token-${token.raw}`, cat: TOKEN_CATEGORY[token.facet], label: token.label, onRemove: () => cb.removeToken(token.raw) })
  }
  if (filters.audio) chips.push({ key: 'audio', cat: 'audio', label: 'has audio', onRemove: () => cb.toggleBoolean('audio') })
  if (filters.release) chips.push({ key: 'release', cat: 'release', label: 'official release', onRemove: () => cb.toggleBoolean('release') })
  if (filters.rec) chips.push({ key: 'rec', cat: 'audio', label: filters.rec, onRemove: () => cb.setRecordingType(undefined) })
  for (const s of filters.series) {
    chips.push({ key: `series-${s}`, cat: 'release', label: s, onRemove: () => cb.toggleArrayField('series', s) })
  }
  if (filters.year) chips.push({ key: 'year', cat: 'time', label: filters.year, onRemove: () => cb.clearField('year') })
  if (filters.yearFrom || filters.yearTo) {
    chips.push({
      key: 'yearRange', cat: 'time',
      label: `${filters.yearFrom ?? '…'}–${filters.yearTo ?? '…'}`,
      onRemove: () => cb.setYearRange(undefined, undefined),
    })
  }
  for (const d of filters.decade) {
    chips.push({ key: `decade-${d}`, cat: 'time', label: `${d}s`, onRemove: () => cb.toggleArrayField('decade', d) })
  }
  for (const e of filters.era) {
    chips.push({ key: `era-${e}`, cat: 'time', label: eraName(e), onRemove: () => cb.toggleArrayField('era', e) })
  }
  for (const c of filters.country) {
    chips.push({ key: `country-${c}`, cat: 'place', label: c, onRemove: () => cb.toggleArrayField('country', c) })
  }
  for (const s of filters.state) {
    chips.push({ key: `state-${s}`, cat: 'place', label: s, onRemove: () => cb.toggleArrayField('state', s) })
  }
  if (filters.city) chips.push({ key: 'city', cat: 'place', label: filters.city, onRemove: () => cb.clearField('city') })
  if (filters.tour) chips.push({ key: 'tour', cat: 'tour', label: filters.tour, onRemove: () => cb.clearField('tour') })

  return chips
}

export function ActiveChips({
  tokens,
  filters,
  removeToken,
  toggleBoolean,
  setRecordingType,
  toggleArrayField,
  clearField,
  setYearRange,
  clearAll,
  emptyState = true,
  showClearAll = true,
}: ActiveChipsCallbacks & {
  tokens: ParsedToken[]
  filters: RailFilters
  clearAll: () => void
  /** Render "No filters applied…" when there are no chips. Desktop wants this; the mobile
   * horizontal scroll row next to the Filters button does not. */
  emptyState?: boolean
  /** Desktop renders "clear all" inline with the chips. Mobile pins its own clear-all
   * outside the scrolling strip instead (see SearchScreen), so it suppresses this one. */
  showClearAll?: boolean
}) {
  const chips = buildActiveChips(tokens, filters, { removeToken, toggleBoolean, setRecordingType, toggleArrayField, clearField, setYearRange })

  if (chips.length === 0) {
    if (!emptyState) return null
    return <span className="fx-empty">No filters applied — the whole catalog.</span>
  }

  return (
    <>
      {chips.map(chip => {
        const meta = CAT_META[chip.cat]
        return (
          <button
            key={chip.key}
            type="button"
            className="fx-chip"
            style={{ '--cc': `var(${meta.ccVar})` } as React.CSSProperties}
            onClick={chip.onRemove}
            title={`Remove ${meta.name}: ${chip.label}`}
            aria-label={`Remove filter: ${meta.name} ${chip.label}`}
          >
            <span className="k">{meta.name}</span>
            <span>{chip.label}</span>
            <span className="x" aria-hidden="true">×</span>
          </button>
        )
      })}
      {showClearAll && <button type="button" className="fx-clear" onClick={clearAll}>clear all</button>}
    </>
  )
}
