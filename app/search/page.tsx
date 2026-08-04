'use client'

import React, { useRef, useEffect, Suspense } from 'react'
import { CANONICAL_SONG_COUNT } from '@/lib/ids'
import { parseQuery } from '@/lib/search/query-parser'
import { useSearchState } from '@/components/search/use-search-state'
import { useSearchResults } from '@/components/search/use-search-results'
import { ActiveChips } from '@/components/search/active-chips'
import { FilterRail } from '@/components/search/filter-rail'
import { SongsSection, VenuesSection, ReleasesSection, ShowsSection } from '@/components/search/result-sections'

function SearchContent() {
  const inputRef = useRef<HTMLInputElement>(null)
  const {
    q, setQ, dq, filters, page, setPage,
    toggleBoolean, setRecordingType, toggleArrayField, setSingle, setFields, setYearRange, clearField,
    removeToken, clearAll,
  } = useSearchState()

  const { data, loading, loadingMore, active } = useSearchResults(dq, filters, page)
  const { tokens } = parseQuery(dq)

  useEffect(() => { inputRef.current?.focus() }, [])

  return (
    <section className="col">
      <div className="page-head">
        <div>
          <div className="kicker">Search · II</div>
          <h2>The <span className="italic">catalog,</span> at your fingertips.</h2>
          <div className="lede">
            Let inspiration move you brightly across the catalog, the calendar, and the venues.
          </div>
        </div>
      </div>

      <div className="fx-bar">
        <div className="fx-search">
          <span className="gl">⌕</span>
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="song, show, venue, date…"
          />
          {q && (
            <button className="clear" onClick={() => { setQ(''); inputRef.current?.focus() }}>
              clear
            </button>
          )}
          <span className="kbd">⌘K</span>
        </div>

        <FilterRail
          filters={filters}
          facets={data?.facets ?? {}}
          toggleBoolean={toggleBoolean}
          setRecordingType={setRecordingType}
          toggleArrayField={toggleArrayField}
          setSingle={setSingle}
          setFields={setFields}
          clearField={clearField}
          setYearRange={setYearRange}
          resultCount={active ? (data?.totals.shows ?? 0) : undefined}
          tokens={tokens}
        />

        <div className="fx-line">
          <div className="fx-chips" role="group" aria-label="Active filters">
            <ActiveChips
              tokens={tokens}
              filters={filters}
              removeToken={removeToken}
              toggleBoolean={toggleBoolean}
              setRecordingType={setRecordingType}
              toggleArrayField={toggleArrayField}
              clearField={clearField}
              setYearRange={setYearRange}
              clearAll={clearAll}
            />
          </div>
        </div>
      </div>

      {!active && (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-3)', fontFamily: 'var(--serif-body)', fontStyle: 'italic', fontSize: 17 }}>
          Start typing to search the archive — 2,333 shows, {CANONICAL_SONG_COUNT} songs.
        </div>
      )}

      {active && (
        <div className="results-cols">
          <ShowsSection
            shows={data?.shows ?? []}
            total={data?.totals.shows ?? 0}
            loading={loading}
            loadingMore={loadingMore}
            onLoadMore={() => setPage(page + 1)}
          />
          <SongsSection songs={data?.songs ?? []} loading={loading} />
          <VenuesSection venues={data?.venues ?? []} loading={loading} />
          <ReleasesSection releases={data?.releases ?? []} loading={loading} />
        </div>
      )}
    </section>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<section className="col" style={{ color: 'var(--ink-3)', fontStyle: 'italic', paddingTop: 40 }}>Loading…</section>}>
      <SearchContent />
    </Suspense>
  )
}
