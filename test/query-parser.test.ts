import { describe, it, expect } from 'vitest'
import { parseQuery, normalizeFacetText } from '@/lib/search/query-parser'

describe('parseQuery: dates', () => {
  it('parses ISO dates', () => {
    const { tokens, text } = parseQuery('1977-05-08')
    expect(tokens).toEqual([{ facet: 'date', value: '1977-05-08', label: '1977-05-08', raw: '1977-05-08' }])
    expect(text).toBe('')
  })

  it('parses US slash dates with 2-digit year', () => {
    const { tokens } = parseQuery('5/8/77')
    expect(tokens[0]).toMatchObject({ facet: 'date', value: '1977-05-08' })
  })

  it('parses "month day, year"', () => {
    const { tokens } = parseQuery('may 8 1977')
    expect(tokens[0]).toMatchObject({ facet: 'date', value: '1977-05-08' })
  })

  it('parses "day month year"', () => {
    const { tokens } = parseQuery('8 may 1977')
    expect(tokens[0]).toMatchObject({ facet: 'date', value: '1977-05-08' })
  })

  it('keeps free text alongside a parsed date', () => {
    const { tokens, text } = parseQuery('cornell 5/8/77')
    expect(tokens[0]).toMatchObject({ facet: 'date', value: '1977-05-08' })
    expect(text).toBe('cornell')
  })

  it('rejects an invalid date (month 13)', () => {
    const { tokens } = parseQuery('1977-13-08')
    expect(tokens.find(t => t.facet === 'date')).toBeUndefined()
  })
})

describe('parseQuery: years, ranges, decades', () => {
  it('parses a bare 4-digit year', () => {
    const { tokens, text } = parseQuery('1977')
    expect(tokens).toEqual([{ facet: 'year', value: 1977, label: '1977', raw: '1977' }])
    expect(text).toBe('')
  })

  it('parses a bare 2-digit year in range', () => {
    const { tokens } = parseQuery('72')
    expect(tokens[0]).toMatchObject({ facet: 'year', value: 1972 })
  })

  it('does not treat an out-of-range 2-digit number as a year', () => {
    const { tokens, text } = parseQuery('55')
    expect(tokens.find(t => t.facet === 'year')).toBeUndefined()
    expect(text).toBe('55')
  })

  it('parses a 4-digit year range', () => {
    const { tokens } = parseQuery('1972-1974')
    expect(tokens[0]).toMatchObject({ facet: 'yearRange', value: { from: 1972, to: 1974 } })
  })

  it('parses a 2-digit year range', () => {
    const { tokens } = parseQuery('72-74')
    expect(tokens[0]).toMatchObject({ facet: 'yearRange', value: { from: 1972, to: 1974 } })
  })

  it('parses a 4-digit decade', () => {
    const { tokens } = parseQuery('1970s')
    expect(tokens[0]).toMatchObject({ facet: 'decade', value: 1970 })
  })

  it('parses a shorthand decade', () => {
    const { tokens } = parseQuery('70s')
    expect(tokens[0]).toMatchObject({ facet: 'decade', value: 1970 })
  })

  it('parses a season + year into a month range', () => {
    const { tokens } = parseQuery('spring 1977')
    expect(tokens[0]).toMatchObject({ facet: 'season', value: { year: 1977, monthFrom: 3, monthTo: 5 } })
  })

  it('parses a bare month + year', () => {
    const { tokens } = parseQuery('may 1977')
    expect(tokens[0]).toMatchObject({ facet: 'month', value: { year: 1977, month: 5 } })
  })
})

describe('parseQuery: facet vocabulary', () => {
  it('parses an era name', () => {
    const { tokens } = parseQuery('brent years')
    expect(tokens[0]).toMatchObject({ facet: 'era', value: 'brent' })
  })

  it('parses a release series with an apostrophe', () => {
    const { tokens, text } = parseQuery("dave's picks 1990")
    expect(tokens.find(t => t.facet === 'series')).toMatchObject({ value: "Dave's Picks" })
    expect(tokens.find(t => t.facet === 'year')).toMatchObject({ value: 1990 })
    expect(text).toBe('')
  })

  it('parses a release series without the apostrophe', () => {
    const { tokens } = parseQuery('dicks picks')
    expect(tokens[0]).toMatchObject({ facet: 'series', value: "Dick's Picks" })
  })

  it('parses the natural shortened/singular forms people actually type', () => {
    // These previously fell through to plain haystack text search — matching results,
    // but with no series token, so no chip and an unchecked checkbox even though a
    // release series was effectively driving every result.
    expect(parseQuery('vault 60s').tokens.find(t => t.facet === 'series')).toMatchObject({ value: 'From the Vault' })
    expect(parseQuery('road trip 70s').tokens.find(t => t.facet === 'series')).toMatchObject({ value: 'Road Trips' })
    expect(parseQuery("dicks pick").tokens[0]).toMatchObject({ facet: 'series', value: "Dick's Picks" })
    expect(parseQuery("dave's pick").tokens[0]).toMatchObject({ facet: 'series', value: "Dave's Picks" })
  })

  it('still prefers the full phrase over the shortened alias when both would match', () => {
    const { tokens, text } = parseQuery('road trips vol 3')
    expect(tokens[0]).toMatchObject({ facet: 'series', value: 'Road Trips' })
    expect(text).toBe('vol 3')
  })

  it('parses recording type keywords', () => {
    expect(parseQuery('sbd').tokens[0]).toMatchObject({ facet: 'recordingType', value: 'sbd' })
    expect(parseQuery('soundboard').tokens[0]).toMatchObject({ facet: 'recordingType', value: 'sbd' })
    expect(parseQuery('audience').tokens[0]).toMatchObject({ facet: 'recordingType', value: 'aud' })
  })

  it('parses "has audio" and "official release" phrases', () => {
    expect(parseQuery('has audio').tokens[0]).toMatchObject({ facet: 'hasAudio', value: true })
    expect(parseQuery('official release').tokens[0]).toMatchObject({ facet: 'hasRelease', value: true })
  })

  it('parses a US state name', () => {
    const { tokens, text } = parseQuery('california 1975')
    expect(tokens.find(t => t.facet === 'state')).toMatchObject({ value: 'california' })
    expect(text).toBe('')
  })

  it('parses a country name', () => {
    const { tokens } = parseQuery('germany 1972')
    expect(tokens.find(t => t.facet === 'country')).toMatchObject({ value: 'germany' })
  })
})

describe('parseQuery: negative cases (must not hijack free text)', () => {
  it('leaves an unrelated song-ish phrase entirely as free text', () => {
    const { tokens, text } = parseQuery('dark star')
    expect(tokens).toEqual([])
    expect(text).toBe('dark star')
  })

  it('does not promote a plain venue name', () => {
    const { tokens, text } = parseQuery('fillmore east')
    expect(tokens).toEqual([])
    expect(text).toBe('fillmore east')
  })

  it('does not misparse a volume number as a year', () => {
    const { tokens, text } = parseQuery("dave's picks 5")
    expect(tokens.find(t => t.facet === 'year')).toBeUndefined()
    expect(text).toContain('5')
  })
})

describe('parseQuery: same-axis collisions (only one "when" / one "where" per query)', () => {
  it('keeps only the first Time-axis match when season and era both appear', () => {
    // "spring 1977" and "primal dead" each name a time window on their own — taking
    // both would either be redundant or, for a non-overlapping pair, silently return
    // zero results. Season is tried before era, so it wins; "primal dead" is left as
    // free text rather than promoted into a second, contradictory time token.
    const { tokens, text } = parseQuery('spring 1977 primal dead')
    expect(tokens).toEqual([
      { facet: 'season', value: { year: 1977, monthFrom: 3, monthTo: 5 }, label: 'Spring 1977', raw: 'spring 1977' },
    ])
    expect(text).toBe('primal dead')
  })

  it('keeps only the first Time-axis match when decade and era both appear', () => {
    // Decade is tried before era in priority order, so "1970s" wins here.
    const { tokens, text } = parseQuery('1970s primal dead')
    expect(tokens).toEqual([{ facet: 'decade', value: 1970, label: '1970s', raw: '1970s' }])
    expect(text).toBe('primal dead')
  })

  it('keeps only the first Time-axis match when a decade and a bare year both appear', () => {
    const { tokens } = parseQuery('1970s 1977')
    expect(tokens).toHaveLength(1)
    expect(tokens[0].facet).toBe('decade')
  })

  it('keeps only the first Place-axis match when a state and a country both appear', () => {
    // State is tried before country, so "california" wins; "france" is left as text
    // rather than becoming a second, contradictory place token.
    const { tokens, text } = parseQuery('california france')
    expect(tokens).toEqual([{ facet: 'state', value: 'california', label: 'california', raw: 'california' }])
    expect(text).toBe('france')
  })

  it('keeps only the first Place-axis match when two states appear', () => {
    const { tokens } = parseQuery('california new york')
    expect(tokens).toHaveLength(1)
    expect(tokens[0]).toMatchObject({ facet: 'state', value: 'california' })
  })

  it('extracts every series phrase in one query — series is the deliberately multi-select facet', () => {
    const { tokens, text } = parseQuery("dick's picks dave's picks")
    expect(tokens).toEqual([
      { facet: 'series', value: "Dick's Picks", label: "Dick's Picks", raw: "dick's picks" },
      { facet: 'series', value: "Dave's Picks", label: "Dave's Picks", raw: "dave's picks" },
    ])
    expect(text).toBe('')
  })

  it('still extracts independent non-axis facets alongside a Time token', () => {
    // recordingType/hasAudio/hasRelease are orthogonal to Time and Place and should
    // never be suppressed by the axis-exclusivity rule.
    const { tokens } = parseQuery('sbd 1970s has audio')
    expect(tokens.map(t => t.facet).sort()).toEqual(['decade', 'hasAudio', 'recordingType'])
  })
})

describe('normalizeFacetText', () => {
  it('lowercases and strips punctuation', () => {
    expect(normalizeFacetText("Dave's Picks!")).toBe('dave s picks')
  })
})
