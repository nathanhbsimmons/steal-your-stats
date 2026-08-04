import { describe, it, expect, vi } from 'vitest'
import { buildCategories, deriveEffectiveFilters, type CategorySetters } from '@/components/search/categories'
import type { RailFilters } from '@/components/search/use-search-state'
import type { ParsedToken } from '@/lib/search/query-parser'

function makeFilters(overrides: Partial<RailFilters> = {}): RailFilters {
  return { audio: false, release: false, series: [], decade: [], era: [], country: [], state: [], ...overrides }
}

function makeSetters(): CategorySetters & Record<keyof CategorySetters, ReturnType<typeof vi.fn>> {
  return {
    toggleBoolean: vi.fn(),
    setRecordingType: vi.fn(),
    toggleArrayField: vi.fn(),
    setSingle: vi.fn(),
    setFields: vi.fn(),
    clearField: vi.fn(),
    setYearRange: vi.fn(),
  }
}

const FACETS = {
  decade: [{ value: '1970', label: '1970s', count: 80 }, { value: '1990', label: '1990s', count: 12 }],
  country: [{ value: 'united states', label: 'United States', count: 122 }, { value: 'france', label: 'France', count: 1 }],
  state: [{ value: 'california', label: 'California', count: 30 }, { value: 'new york', label: 'New York', count: 20 }],
}

function findOption(categories: ReturnType<typeof buildCategories>, categoryId: string, groupKey: string, value: string) {
  const cat = categories.find(c => c.id === categoryId)!
  const group = cat.groups.find(g => g.key === groupKey)!
  return group.options.find(o => o.value === value)!
}

describe('categories: decade/era are checkboxes — multi-select within a facet', () => {
  it('adding a decade while no era is active only sets decade', () => {
    const setters = makeSetters()
    const categories = buildCategories(makeFilters({ decade: ['1970'] }), FACETS, setters)

    findOption(categories, 'time', 'decade', '1990').onToggle()

    expect(setters.setFields).toHaveBeenCalledWith({ decade: ['1970', '1990'] })
  })

  it('unchecking one of two selected decades keeps the other and does not touch era', () => {
    const setters = makeSetters()
    const categories = buildCategories(makeFilters({ decade: ['1970', '1990'] }), FACETS, setters)

    findOption(categories, 'time', 'decade', '1970').onToggle()

    expect(setters.setFields).toHaveBeenCalledWith({ decade: ['1990'] })
  })

  it('both 1970s and 1990s show as checked when both are selected', () => {
    const setters = makeSetters()
    const categories = buildCategories(makeFilters({ decade: ['1970', '1990'] }), FACETS, setters)

    expect(findOption(categories, 'time', 'decade', '1970').checked).toBe(true)
    expect(findOption(categories, 'time', 'decade', '1990').checked).toBe(true)
  })

  it('adding a decade while an era is active clears the era in the same update', () => {
    const setters = makeSetters()
    const categories = buildCategories(makeFilters({ era: ['brent'] }), FACETS, setters)

    findOption(categories, 'time', 'decade', '1970').onToggle()

    expect(setters.setFields).toHaveBeenCalledWith({ decade: ['1970'], era: [] })
  })

  it('adding an era while a decade is active clears the decade in the same update', () => {
    const setters = makeSetters()
    const categories = buildCategories(makeFilters({ decade: ['1970'] }), FACETS, setters)

    const brentOption = categories.find(c => c.id === 'time')!.groups.find(g => g.key === 'era')!.options.find(o => o.value === 'brent')!
    brentOption.onToggle()

    expect(setters.setFields).toHaveBeenCalledWith({ era: ['brent'], decade: [] })
  })

  it('unchecking the only selected decade does not touch era', () => {
    const setters = makeSetters()
    const categories = buildCategories(makeFilters({ decade: ['1970'] }), FACETS, setters)

    findOption(categories, 'time', 'decade', '1970').onToggle()

    expect(setters.setFields).toHaveBeenCalledWith({ decade: [] })
  })

  it('adding a second era when decade is already empty does not reference decade at all', () => {
    const setters = makeSetters()
    const categories = buildCategories(makeFilters({ era: ['primal'] }), FACETS, setters)

    const brentOption = categories.find(c => c.id === 'time')!.groups.find(g => g.key === 'era')!.options.find(o => o.value === 'brent')!
    brentOption.onToggle()

    expect(setters.setFields).toHaveBeenCalledWith({ era: ['primal', 'brent'] })
  })

  it('reflects both decade and era counts in the Time category selectedCount', () => {
    const setters = makeSetters()
    const categories = buildCategories(makeFilters({ decade: ['1970', '1990'], era: ['brent'] }), FACETS, setters)
    expect(categories.find(c => c.id === 'time')!.selectedCount).toBe(3)
  })
})

describe('categories: country/state are checkboxes — multi-select within a facet', () => {
  it('adding a state while no country is active only sets state', () => {
    const setters = makeSetters()
    const categories = buildCategories(makeFilters({ state: ['california'] }), FACETS, setters)

    findOption(categories, 'place', 'state', 'new york').onToggle()

    expect(setters.setFields).toHaveBeenCalledWith({ state: ['california', 'new york'] })
  })

  it('unchecking one of two selected states keeps the other', () => {
    const setters = makeSetters()
    const categories = buildCategories(makeFilters({ state: ['california', 'new york'] }), FACETS, setters)

    findOption(categories, 'place', 'state', 'california').onToggle()

    expect(setters.setFields).toHaveBeenCalledWith({ state: ['new york'] })
  })

  it('adding a state while a country is active clears the country in the same update', () => {
    const setters = makeSetters()
    const categories = buildCategories(makeFilters({ country: ['france'] }), FACETS, setters)

    findOption(categories, 'place', 'state', 'california').onToggle()

    expect(setters.setFields).toHaveBeenCalledWith({ state: ['california'], country: [] })
  })

  it('adding a country while a state is active clears the state in the same update', () => {
    const setters = makeSetters()
    const categories = buildCategories(makeFilters({ state: ['california'] }), FACETS, setters)

    findOption(categories, 'place', 'country', 'united states').onToggle()

    expect(setters.setFields).toHaveBeenCalledWith({ country: ['united states'], state: [] })
  })

  it('unchecking the only selected state does not touch country', () => {
    const setters = makeSetters()
    const categories = buildCategories(makeFilters({ state: ['california'] }), FACETS, setters)

    findOption(categories, 'place', 'state', 'california').onToggle()

    expect(setters.setFields).toHaveBeenCalledWith({ state: [] })
  })
})

const seriesToken = (value: string): ParsedToken => ({ facet: 'series', value, label: value, raw: value })
const decadeToken = (value: number): ParsedToken => ({ facet: 'decade', value, label: `${value}s`, raw: `${value}s` })
const eraToken = (value: string): ParsedToken => ({ facet: 'era', value, label: value, raw: value })
const countryToken = (value: string): ParsedToken => ({ facet: 'country', value, label: value, raw: value })
const recTypeToken = (value: 'sbd' | 'aud' | 'matrix'): ParsedToken => ({ facet: 'recordingType', value, label: value, raw: value })
const hasAudioToken = (): ParsedToken => ({ facet: 'hasAudio', value: true, label: 'has audio', raw: 'has audio' })
const hasReleaseToken = (): ParsedToken => ({ facet: 'hasRelease', value: true, label: 'official release', raw: 'official release' })

describe('deriveEffectiveFilters: a typed word applies a filter without touching the rail', () => {
  it('a series token is reflected even though rail.series is empty', () => {
    const effective = deriveEffectiveFilters(makeFilters(), [seriesToken("Dick's Picks")])
    expect(effective.series).toContain("Dick's Picks")
  })

  it('unions a token series with an already rail-selected series', () => {
    const effective = deriveEffectiveFilters(makeFilters({ series: ['Road Trips'] }), [seriesToken("Dick's Picks")])
    expect(effective.series).toEqual(expect.arrayContaining(['Road Trips', "Dick's Picks"]))
    expect(effective.series).toHaveLength(2)
  })

  it('does not duplicate a series already present in rail', () => {
    const effective = deriveEffectiveFilters(makeFilters({ series: ["Dick's Picks"] }), [seriesToken("Dick's Picks")])
    expect(effective.series).toEqual(["Dick's Picks"])
  })

  it('a decade token is reflected when rail has no Time selection', () => {
    const effective = deriveEffectiveFilters(makeFilters(), [decadeToken(1970)])
    expect(effective.decade).toEqual(['1970'])
  })

  it('rail decade still wins over a conflicting token era for effective state', () => {
    const effective = deriveEffectiveFilters(makeFilters({ decade: ['1970'] }), [eraToken('brent')])
    expect(effective.decade).toEqual(['1970'])
    expect(effective.era).toEqual([])
  })

  it('a country token is reflected when rail has no Place selection', () => {
    const effective = deriveEffectiveFilters(makeFilters(), [countryToken('france')])
    expect(effective.country).toEqual(['france'])
  })

  it('rail state still wins over a conflicting token country for effective state', () => {
    const effective = deriveEffectiveFilters(makeFilters({ state: ['california'] }), [countryToken('france')])
    expect(effective.state).toEqual(['california'])
    expect(effective.country).toEqual([])
  })

  it('a recordingType token is reflected when rail has none set', () => {
    const effective = deriveEffectiveFilters(makeFilters(), [recTypeToken('sbd')])
    expect(effective.rec).toBe('sbd')
  })

  it('rail recordingType wins over a conflicting token', () => {
    const effective = deriveEffectiveFilters(makeFilters({ rec: 'aud' }), [recTypeToken('sbd')])
    expect(effective.rec).toBe('aud')
  })

  it('hasAudio/hasRelease tokens OR into the boolean rail fields', () => {
    const effective = deriveEffectiveFilters(makeFilters(), [hasAudioToken(), hasReleaseToken()])
    expect(effective.audio).toBe(true)
    expect(effective.release).toBe(true)
  })

  it('a rail decade with two selections stays a two-element array in the effective view', () => {
    const effective = deriveEffectiveFilters(makeFilters({ decade: ['1970', '1990'] }), [])
    expect(effective.decade).toEqual(['1970', '1990'])
  })
})

describe('categories: checkboxes reflect token-derived state, not just rail (the reported bug)', () => {
  it('a typed series word shows its checkbox as checked even with empty rail series', () => {
    const setters = makeSetters()
    const categories = buildCategories(makeFilters(), FACETS, setters, [seriesToken("Dick's Picks")])
    const option = categories.find(c => c.id === 'release')!.groups.find(g => g.key === 'series')!.options.find(o => o.value === "Dick's Picks")!
    expect(option.checked).toBe(true)
  })

  it('the Release category badge counts a token-only series selection', () => {
    const setters = makeSetters()
    const categories = buildCategories(makeFilters(), FACETS, setters, [seriesToken("Dick's Picks")])
    expect(categories.find(c => c.id === 'release')!.selectedCount).toBe(1)
  })

  it('a typed decade word shows its checkbox as checked with empty rail', () => {
    const setters = makeSetters()
    const categories = buildCategories(makeFilters(), FACETS, setters, [decadeToken(1970)])
    const option = categories.find(c => c.id === 'time')!.groups.find(g => g.key === 'decade')!.options.find(o => o.value === '1970')!
    expect(option.checked).toBe(true)
  })

  it('a typed country word shows its checkbox as checked despite lowercase-vs-facet-case mismatch', () => {
    const setters = makeSetters()
    // Token value is lowercase ("france", query-parser's vocabulary); the facet option
    // label/value is title case ("France", straight from the data) — must still match.
    const facetsWithTitleCase = { ...FACETS, country: [{ value: 'France', label: 'France', count: 1 }] }
    const categories = buildCategories(makeFilters(), facetsWithTitleCase, setters, [countryToken('france')])
    const option = categories.find(c => c.id === 'place')!.groups.find(g => g.key === 'country')!.options.find(o => o.value === 'France')!
    expect(option.checked).toBe(true)
  })

  it('a rail series selection still shows checked with no tokens at all (no regression)', () => {
    const setters = makeSetters()
    const categories = buildCategories(makeFilters({ series: ['Road Trips'] }), FACETS, setters)
    const option = categories.find(c => c.id === 'release')!.groups.find(g => g.key === 'series')!.options.find(o => o.value === 'Road Trips')!
    expect(option.checked).toBe(true)
  })

  it('reproduces the reported scenario: "dicks picks 1970s" checks both Dick\'s Picks and 1970s', () => {
    const setters = makeSetters()
    const categories = buildCategories(makeFilters(), FACETS, setters, [seriesToken("Dick's Picks"), decadeToken(1970)])

    const seriesOption = categories.find(c => c.id === 'release')!.groups.find(g => g.key === 'series')!.options.find(o => o.value === "Dick's Picks")!
    const decadeOption = categories.find(c => c.id === 'time')!.groups.find(g => g.key === 'decade')!.options.find(o => o.value === '1970')!

    expect(seriesOption.checked).toBe(true)
    expect(decadeOption.checked).toBe(true)
  })
})

describe('categories: clicking a second checkbox must not drop a token-derived first value (the reported bug)', () => {
  it('typed "1970s" + clicking 1990s in the dropdown keeps both, not just the click', () => {
    // Before the fix: onToggle built its next array from raw rail `filters.decade`
    // (empty, since 1970 only ever lived in the token) instead of `effective.decade`,
    // so clicking 1990s produced { decade: ['1990'] } and silently dropped 1970.
    const setters = makeSetters()
    const categories = buildCategories(makeFilters(), FACETS, setters, [decadeToken(1970)])

    findOption(categories, 'time', 'decade', '1990').onToggle()

    expect(setters.setFields).toHaveBeenCalledWith({ decade: expect.arrayContaining(['1970', '1990']) })
    expect((setters.setFields.mock.calls[0][0] as { decade: string[] }).decade).toHaveLength(2)
  })

  it('typed era word + clicking a decade in the dropdown keeps neither dropped: era clears, decade set', () => {
    const setters = makeSetters()
    const categories = buildCategories(makeFilters(), FACETS, setters, [eraToken('brent')])

    findOption(categories, 'time', 'decade', '1970').onToggle()

    // Cross-axis rule still applies: adding a decade clears era (brent), it just must
    // start from the *effective* era/decade rather than silently no-op-ing on an empty
    // rail array.
    expect(setters.setFields).toHaveBeenCalledWith({ decade: ['1970'], era: [] })
  })

  it('typed country word + clicking a second country in the dropdown keeps both', () => {
    const setters = makeSetters()
    const categories = buildCategories(makeFilters(), FACETS, setters, [countryToken('france')])

    findOption(categories, 'place', 'country', 'united states').onToggle()

    const call = setters.setFields.mock.calls[0][0] as { country: string[] }
    expect(call.country).toHaveLength(2)
    expect(call.country.map(c => c.toLowerCase())).toEqual(expect.arrayContaining(['france', 'united states']))
  })

  it('unchecking a token-derived decade (via its own checkbox) removes it instead of duplicating it', () => {
    const setters = makeSetters()
    const categories = buildCategories(makeFilters(), FACETS, setters, [decadeToken(1970)])

    findOption(categories, 'time', 'decade', '1970').onToggle()

    expect(setters.setFields).toHaveBeenCalledWith({ decade: [] })
  })
})

describe('categories: unaffected axes', () => {
  it('tour uses setSingle, not setFields — it has no mutually-exclusive sibling', () => {
    const setters = makeSetters()
    const filters = makeFilters({ tour: 'Summer Tour 1990' })
    const facetsWithTour = { ...FACETS, tour: [{ value: 'Summer Tour 1990', label: 'Summer Tour 1990', count: 7 }] }
    const categories = buildCategories(filters, facetsWithTour, setters)

    findOption(categories, 'tour', 'tour', 'Summer Tour 1990').onToggle()

    expect(setters.setSingle).toHaveBeenCalledWith('tour', undefined)
    expect(setters.setFields).not.toHaveBeenCalled()
  })

  it('recording type stays single-select via setRecordingType and never touches Time/Place fields', () => {
    const setters = makeSetters()
    const filters = makeFilters({ decade: ['1970'], country: ['united states'] })
    const categories = buildCategories(filters, FACETS, setters)

    categories.find(c => c.id === 'audio')!.groups.find(g => g.key === 'rec')!.options.find(o => o.value === 'sbd')!.onToggle()

    expect(setters.setRecordingType).toHaveBeenCalledWith('sbd')
    expect(setters.setFields).not.toHaveBeenCalled()
  })

  it('series stays multi-select via toggleArrayField, independent of decade/era/country/state', () => {
    const setters = makeSetters()
    const filters = makeFilters({ decade: ['1970'] })
    const categories = buildCategories(filters, FACETS, setters)

    categories.find(c => c.id === 'release')!.groups.find(g => g.key === 'series')!.options[0].onToggle()

    expect(setters.toggleArrayField).toHaveBeenCalled()
    expect(setters.setFields).not.toHaveBeenCalled()
  })
})
