'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { PlayShowButton } from '@/components/member/play-show-button'

interface YearCount { year: number; count: number }

interface MemberShow {
  date: string
  venue: string
  city: string
  state?: string
  country: string
  songCount: number
}

interface MemberDef {
  startYear: number
  endYear: number
  shows: number
}

const PER_PAGE = 20

export function MemberShowBrowser({
  member,
  memberAllYears,
  showsPerYear,
  initialSelectedYear,
  initialBrowseShows,
  initialBrowseTotal,
}: {
  member: MemberDef
  memberAllYears: number[]
  showsPerYear: YearCount[]
  initialSelectedYear: number
  initialBrowseShows: MemberShow[]
  initialBrowseTotal: number
}) {
  const [selectedYear, setSelectedYear] = useState(initialSelectedYear)
  const [browsePage, setBrowsePage] = useState(1)
  const [browseShows, setBrowseShows] = useState<MemberShow[]>(initialBrowseShows)
  const [browseTotal, setBrowseTotal] = useState(initialBrowseTotal)
  const [browseLoading, setBrowseLoading] = useState(false)

  const fetchBrowse = useCallback(async (year: number, page: number) => {
    if (!year) return
    setBrowseLoading(true)
    try {
      const r = await fetch(`/api/member-shows?year=${year}&page=${page}`)
      if (r.ok) {
        const d = await r.json()
        setBrowseShows(d.shows ?? [])
        setBrowseTotal(d.total ?? 0)
      }
    } finally {
      setBrowseLoading(false)
    }
  }, [])

  // Skip re-fetching the (initialSelectedYear, 1) combo — it's already
  // server-rendered into initialBrowseShows/initialBrowseTotal.
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (selectedYear) fetchBrowse(selectedYear, browsePage)
  }, [selectedYear, browsePage, fetchBrowse])

  const jumpToYear = (year: number) => {
    setSelectedYear(year)
    setBrowsePage(1)
    setTimeout(() => {
      const el = document.getElementById('browse-shows')
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 40, behavior: 'smooth' })
    }, 30)
  }

  const yi = memberAllYears.indexOf(selectedYear)
  const prevYear = yi > 0 ? memberAllYears[yi - 1] : null
  const nextYear = yi < memberAllYears.length - 1 ? memberAllYears[yi + 1] : null

  const memberYearData = memberAllYears.map(y => ({
    year: y,
    count: showsPerYear.find(d => d.year === y)?.count ?? 0,
  }))
  const maxCount = Math.max(...memberYearData.map(d => d.count), 1)
  const totalBrowsePages = Math.ceil(browseTotal / PER_PAGE)

  return (
    <>
      {/* ── SHOWS PER YEAR ── */}
      <div className="section-head">
        <h3>Shows per year</h3>
        <div className="descr">— click any bar to jump to that year below</div>
        <span className="meta">N ≈ {member.shows.toLocaleString()}</span>
      </div>
      <div className="barchart member-chart">
        {memberYearData.map(({ year, count }) => (
          <div
            key={year}
            className={`bar${year === selectedYear ? ' peak' : ''}`}
            style={{ height: count > 0 ? `${(count / maxCount) * 100}%` : '2%' }}
            onClick={() => jumpToYear(year)}
            title={`${year} · ${count} shows`}
          >
            <span className="val">{count || ''}</span>
          </div>
        ))}
      </div>
      <div className="barchart-axis-dense">
        {memberYearData.map(({ year }) => (
          <span
            key={year}
            className={year === selectedYear ? 'on' : ''}
            onClick={() => jumpToYear(year)}
          >
            &apos;{String(year).slice(2)}
          </span>
        ))}
      </div>

      {/* ── BROWSE SHOWS ── */}
      <div id="browse-shows" className="section-head" style={{ marginTop: 28 }}>
        <h3>Browse shows</h3>
        <div className="descr">— full archive, paged one year at a time</div>
        <span className="meta">{selectedYear} · {browseShows.length} of {browseTotal || '?'}</span>
      </div>

      {/* ── YEAR PAGER ── */}
      <div className="year-pager">
        <button
          className={`pg${prevYear ? '' : ' muted'}`}
          onClick={() => prevYear && setSelectedYear(prevYear)}
          disabled={!prevYear}
        >
          <span className="arrow">⟵</span>
          <span className="col">
            <span className="lbl">{prevYear ? 'previous year' : 'start of run'}</span>
            <span className="yr">{prevYear ?? '—'}</span>
          </span>
        </button>
        <span className="current-year">
          <span className="lbl">viewing</span>
          <span className="yr">{selectedYear}</span>
        </span>
        <button
          className={`pg right${nextYear ? '' : ' muted'}`}
          onClick={() => nextYear && setSelectedYear(nextYear)}
          disabled={!nextYear}
        >
          <span className="col">
            <span className="lbl">{nextYear ? 'next year' : 'end of run'}</span>
            <span className="yr">{nextYear ?? '—'}</span>
          </span>
          <span className="arrow">⟶</span>
        </button>
      </div>

      {browseLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-vault" style={{ height: 44 }} />
          ))}
        </div>
      ) : browseShows.length === 0 ? (
        <div style={{ padding: '20px 0', fontFamily: 'var(--serif-body)', fontStyle: 'italic', color: 'var(--ink-3)' }}>
          No setlist data found for {selectedYear}.
        </div>
      ) : (
        <>
          <table className="tbl member-tbl">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Venue · City</th>
                <th className="r">Songs</th>
                <th className="r">Play</th>
                <th className="r">Setlist</th>
              </tr>
            </thead>
            <tbody>
              {browseShows.map((show, i) => (
                <tr key={show.date}>
                  <td className="num">{String((browsePage - 1) * PER_PAGE + i + 1).padStart(2, '0')}</td>
                  <td><span className="title">{show.date}</span></td>
                  <td>
                    <span style={{ fontFamily: 'var(--serif-body)', fontStyle: 'italic', fontSize: 14 }}>{show.venue}</span>
                    <span className="sub">{show.city}{show.state ? `, ${show.state}` : ''}</span>
                  </td>
                  <td className="r">{show.songCount || '—'}</td>
                  <td className="r">
                    <PlayShowButton show={show} label="▶" className="row-play" title="Play show" />
                  </td>
                  <td className="r">
                    <Link href={`/show/${show.date}`} className="row-link">open ↗</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalBrowsePages > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
              <button
                className="btn ghost"
                style={{ padding: '4px 10px', fontSize: 13 }}
                disabled={browsePage <= 1}
                onClick={() => setBrowsePage(p => p - 1)}
              >
                ← Prev
              </button>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
                {browsePage} / {totalBrowsePages}
              </span>
              <button
                className="btn ghost"
                style={{ padding: '4px 10px', fontSize: 13 }}
                disabled={browsePage >= totalBrowsePages}
                onClick={() => setBrowsePage(p => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      <div className="year-strip">
        {memberAllYears.map(y => (
          <button
            key={y}
            className={`year-tab${y === selectedYear ? ' on' : ''}`}
            onClick={() => setSelectedYear(y)}
          >
            {y}
          </button>
        ))}
      </div>
    </>
  )
}
