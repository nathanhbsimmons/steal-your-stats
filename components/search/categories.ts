import { ERA_DEFS } from '@/lib/eras'
import { RELEASE_SERIES_ORDER } from '@/components/ui/release-icons'
import { normalizeFuzzy } from '@/lib/ids'
import type { ParsedToken } from '@/lib/search/query-parser'
import type { RailFilters } from './use-search-state'
import type { FacetOption } from './types'

export interface CategoryOption {
  value: string
  label: string
  count: number
  checked: boolean
  onToggle: () => void
}

export interface CategoryGroup {
  key: string
  sub: string
  /** checkbox: independent, multi-select toggle (availability, series, decade, era,
   * country, state — each OR-combines with its own siblings). radio: single-select,
   * picking one clears siblings within the group (recording type, tour). */
  kind: 'checkbox' | 'radio'
  find?: boolean
  options: CategoryOption[]
}

export type CategoryId = 'audio' | 'release' | 'time' | 'place' | 'tour'

export interface Category {
  id: CategoryId
  name: string
  ccVar: string
  wide?: boolean
  cols: number
  groups: CategoryGroup[]
  selectedCount: number
  onReset: () => void
}

const RECORDING_TYPES: { value: string; label: string }[] = [
  { value: 'sbd', label: 'Soundboard' },
  { value: 'aud', label: 'Audience' },
  { value: 'matrix', label: 'Matrix' },
]

function countOf(facets: Record<string, FacetOption[]>, key: string, value: string): number {
  return facets[key]?.find(o => o.value === value)?.count ?? 0
}

export interface CategorySetters {
  toggleBoolean: (key: 'audio' | 'release') => void
  setRecordingType: (value?: string) => void
  /** Toggle a value in/out of a multi-select rail field. Series, decade, era, country,
   * and state are all OR-combined with their own siblings ("70s or 80s"). */
  toggleArrayField: (key: 'series' | 'decade' | 'era' | 'country' | 'state', value: string) => void
  setSingle: (key: 'year' | 'city' | 'tour', value?: string) => void
  setFields: (fields: Partial<RailFilters>) => void
  clearField: (key: keyof RailFilters) => void
  setYearRange: (from?: string, to?: string) => void
}

/**
 * A typed word in the search box (e.g. "dicks picks") can apply a filter — via
 * tokensToFilters in lib/services/show-index.ts — without ever touching the rail's URL
 * params, since rail only wins when it *also* has a value for that axis. The rail
 * checkboxes must reflect that same "is this actually applied" state, or a chip shows
 * active while its checkbox sits unchecked right next to it. This mirrors
 * tokensToFilters' precedence (rail wins per axis; series/booleans are additive) but in
 * RailFilters' string-keyed shape, purely for what the UI should show as checked.
 */
export function deriveEffectiveFilters(filters: RailFilters, tokens: ParsedToken[]): RailFilters {
  const effective: RailFilters = {
    ...filters,
    series: [...filters.series],
    decade: [...filters.decade],
    era: [...filters.era],
    country: [...filters.country],
    state: [...filters.state],
  }
  const railHasTime = filters.decade.length > 0 || filters.era.length > 0
  const railHasPlace = filters.country.length > 0 || filters.state.length > 0

  for (const token of tokens) {
    switch (token.facet) {
      case 'decade': {
        const value = String(token.value)
        if (!railHasTime && !effective.decade.includes(value)) effective.decade = [...effective.decade, value]
        break
      }
      case 'era':
        if (!railHasTime && !effective.era.includes(token.value)) effective.era = [...effective.era, token.value]
        break
      case 'country':
        if (!railHasPlace && !effective.country.some(c => normalizeFuzzy(c) === normalizeFuzzy(token.value))) {
          effective.country = [...effective.country, token.value]
        }
        break
      case 'state':
        if (!railHasPlace && !effective.state.some(s => normalizeFuzzy(s) === normalizeFuzzy(token.value))) {
          effective.state = [...effective.state, token.value]
        }
        break
      case 'recordingType':
        if (!filters.rec) effective.rec = token.value
        break
      case 'series':
        if (!effective.series.some(s => normalizeFuzzy(s) === normalizeFuzzy(token.value))) {
          effective.series = [...effective.series, token.value]
        }
        break
      case 'hasAudio':
        effective.audio = true
        break
      case 'hasRelease':
        effective.release = true
        break
    }
  }
  return effective
}

export function buildCategories(
  filters: RailFilters,
  facets: Record<string, FacetOption[]>,
  setters: CategorySetters,
  tokens: ParsedToken[] = []
): Category[] {
  const { toggleBoolean, setRecordingType, toggleArrayField, setSingle, setFields, clearField, setYearRange } = setters
  const effective = deriveEffectiveFilters(filters, tokens)

  const audio: Category = {
    id: 'audio', name: 'Audio', ccVar: '--cat-audio', cols: 2,
    selectedCount: (effective.audio ? 1 : 0) + (effective.rec ? 1 : 0),
    onReset: () => {
      if (filters.audio) toggleBoolean('audio')
      if (filters.rec) setRecordingType(undefined)
    },
    groups: [
      {
        key: 'has', sub: 'availability', kind: 'checkbox',
        options: [{
          value: 'audio', label: 'has audio', count: facets.hasAudio?.[0]?.count ?? 0,
          checked: effective.audio, onToggle: () => toggleBoolean('audio'),
        }],
      },
      {
        key: 'rec', sub: 'recording type', kind: 'radio',
        options: RECORDING_TYPES.map(rt => ({
          value: rt.value, label: rt.label, count: countOf(facets, 'recordingType', rt.value),
          checked: effective.rec === rt.value,
          onToggle: () => setRecordingType(filters.rec === rt.value ? undefined : rt.value),
        })),
      },
    ],
  }

  const release: Category = {
    id: 'release', name: 'Release', ccVar: '--cat-rel', wide: true, cols: 2,
    selectedCount: (effective.release ? 1 : 0) + effective.series.length,
    onReset: () => {
      if (filters.release) toggleBoolean('release')
      for (const s of filters.series) toggleArrayField('series', s)
    },
    groups: [
      {
        key: 'off', sub: 'availability', kind: 'checkbox',
        options: [{
          value: 'official', label: 'official release', count: facets.hasRelease?.[0]?.count ?? 0,
          checked: effective.release, onToggle: () => toggleBoolean('release'),
        }],
      },
      {
        key: 'series', sub: 'series', kind: 'checkbox',
        options: RELEASE_SERIES_ORDER.map(series => ({
          value: series, label: series, count: countOf(facets, 'series', series),
          checked: effective.series.some(s => normalizeFuzzy(s) === normalizeFuzzy(series)),
          onToggle: () => toggleArrayField('series', series),
        })),
      },
    ],
  }

  const time: Category = {
    id: 'time', name: 'Time', ccVar: '--cat-time', wide: true, cols: 2,
    selectedCount: (effective.year ? 1 : 0) + (effective.yearFrom || effective.yearTo ? 1 : 0)
      + effective.decade.length + effective.era.length,
    onReset: () => {
      if (filters.year) clearField('year')
      if (filters.yearFrom || filters.yearTo) setYearRange(undefined, undefined)
      if (filters.decade.length) clearField('decade')
      if (filters.era.length) clearField('era')
    },
    groups: [
      {
        key: 'decade', sub: 'decade', kind: 'checkbox',
        options: (facets.decade ?? []).map(opt => ({
          value: opt.value, label: `${opt.value}s`, count: opt.count,
          checked: effective.decade.includes(opt.value),
          // Multiple decades OR together fine ("70s or 80s") — but decade and era are
          // two granularities of the same "when" axis, so *adding* a decade while an
          // era is active would either double-narrow redundantly or, for a
          // non-overlapping pair, silently return zero results. Only clear era when
          // adding a new decade, never when unchecking one.
          //
          // Build the next array from `effective` (rail + any token contribution), not
          // raw `filters` — a decade typed into the search box only lives in the token,
          // never in the rail array, so starting from `filters` here would silently
          // drop it the first time a checkbox click promotes the selection to the rail.
          onToggle: () => {
            const adding = !effective.decade.includes(opt.value)
            const nextDecade = adding ? [...effective.decade, opt.value] : effective.decade.filter(d => d !== opt.value)
            setFields({ decade: nextDecade, ...(adding && effective.era.length > 0 ? { era: [] } : {}) })
          },
        })),
      },
      {
        key: 'era', sub: 'era', kind: 'checkbox',
        options: ERA_DEFS.map(era => ({
          value: era.id, label: era.name, count: countOf(facets, 'era', era.id),
          checked: effective.era.includes(era.id),
          // See the decade group above: era and decade are mutually exclusive axes,
          // but multiple eras together are fine. Build from `effective`, same reason.
          onToggle: () => {
            const adding = !effective.era.includes(era.id)
            const nextEra = adding ? [...effective.era, era.id] : effective.era.filter(e => e !== era.id)
            setFields({ era: nextEra, ...(adding && effective.decade.length > 0 ? { decade: [] } : {}) })
          },
        })),
      },
    ],
  }

  const place: Category = {
    id: 'place', name: 'Place', ccVar: '--cat-place', cols: 2,
    selectedCount: effective.country.length + effective.state.length + (effective.city ? 1 : 0),
    onReset: () => {
      if (filters.country.length) clearField('country')
      if (filters.state.length) clearField('state')
      if (filters.city) clearField('city')
    },
    groups: [
      {
        key: 'country', sub: 'country', kind: 'checkbox',
        options: (facets.country ?? []).map(opt => ({
          value: opt.value, label: opt.label, count: opt.count,
          // effective.country may include a lowercase typed token (query-parser's
          // vocabulary) while opt.value is the facet's raw-case string from the data —
          // compare case/punctuation-insensitively, same as matchesFilters does.
          checked: effective.country.some(c => normalizeFuzzy(c) === normalizeFuzzy(opt.value)),
          // Country and state are two granularities of the same "where" axis — every
          // state in this dataset belongs to exactly one country, so *adding* a country
          // that doesn't match an already-selected state (or vice versa) would silently
          // return zero results. Only clear state when adding a new country.
          //
          // Build from `effective`, not raw `filters` — a country typed into the search
          // box only lives in the token (and may be lowercase, query-parser's
          // vocabulary), never in the rail array, so this must both start from the
          // effective set *and* compare case/punctuation-insensitively.
          onToggle: () => {
            const adding = !effective.country.some(c => normalizeFuzzy(c) === normalizeFuzzy(opt.value))
            const nextCountry = adding
              ? [...effective.country, opt.value]
              : effective.country.filter(c => normalizeFuzzy(c) !== normalizeFuzzy(opt.value))
            setFields({ country: nextCountry, ...(adding && effective.state.length > 0 ? { state: [] } : {}) })
          },
        })),
      },
      {
        key: 'state', sub: 'state', kind: 'checkbox', find: true,
        options: (facets.state ?? []).map(opt => ({
          value: opt.value, label: opt.label, count: opt.count,
          checked: effective.state.some(s => normalizeFuzzy(s) === normalizeFuzzy(opt.value)),
          // See the country group above: country and state are mutually exclusive axes,
          // and the same "build from effective, compare fuzzily" reasoning applies.
          onToggle: () => {
            const adding = !effective.state.some(s => normalizeFuzzy(s) === normalizeFuzzy(opt.value))
            const nextState = adding
              ? [...effective.state, opt.value]
              : effective.state.filter(s => normalizeFuzzy(s) !== normalizeFuzzy(opt.value))
            setFields({ state: nextState, ...(adding && effective.country.length > 0 ? { country: [] } : {}) })
          },
        })),
      },
    ],
  }

  const tour: Category = {
    id: 'tour', name: 'Tour', ccVar: '--cat-tour', cols: 2,
    selectedCount: filters.tour ? 1 : 0,
    onReset: () => { if (filters.tour) clearField('tour') },
    groups: [
      {
        key: 'tour', sub: 'tagged shows only', kind: 'radio', find: true,
        options: (facets.tour ?? []).map(opt => ({
          value: opt.value, label: opt.label, count: opt.count,
          checked: filters.tour === opt.value,
          onToggle: () => setSingle('tour', filters.tour === opt.value ? undefined : opt.value),
        })),
      },
    ],
  }

  return [audio, release, time, place, tour]
}
