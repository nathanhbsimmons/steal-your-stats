'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

interface YearCount { year: number; count: number }

const ERA_DEFS = [
  {
    id: 'primal', segClass: 'primal',
    name: 'Primal Dead', years: '1965 – 1971',
    startYear: 1965, endYear: 1971,
    tag: 'Pigpen era',
    sig: 'Lovelight, Caution, Viola Lee Blues',
  },
  {
    id: 'europe72', segClass: 'pigpen',
    name: "Europe '72", years: '1972 – 1974',
    startYear: 1972, endYear: 1974,
    tag: 'Wall-of-Sound',
    sig: 'Dark Star, Playing in the Band, Eyes',
  },
  {
    id: 'hiatus', segClass: 'keith',
    name: 'Hiatus & Return', years: '1975 – 1979',
    startYear: 1975, endYear: 1979,
    tag: 'Studio era',
    sig: 'Estimated Prophet, Terrapin Station',
  },
  {
    id: 'brent', segClass: 'brent',
    name: 'Brent Years', years: '1980 – 1990',
    startYear: 1980, endYear: 1990,
    tag: 'Arena Dead',
    sig: 'Throwing Stones, Hell in a Bucket',
  },
  {
    id: 'final', segClass: 'vince',
    name: 'Final Tours', years: '1991 – 1995',
    startYear: 1991, endYear: 1995,
    tag: 'Vince & Bruce',
    sig: 'Lazy River Road, Days Between',
  },
]

function sumYears(data: YearCount[], from: number, to: number): number {
  return data.filter(d => d.year >= from && d.year <= to).reduce((s, d) => s + d.count, 0)
}

export default function ErasPage() {
  const [showsPerYear, setShowsPerYear] = useState<YearCount[]>([])
  const [focusId, setFocusId] = useState('europe72')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.showsPerYear) setShowsPerYear(d.showsPerYear) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const eras = ERA_DEFS.map(e => ({
    ...e,
    shows: showsPerYear.length > 0 ? sumYears(showsPerYear, e.startYear, e.endYear) : null,
    span: e.endYear - e.startYear + 1,
  }))

  const totalSpan = 1995 - 1965 + 1
  const focus = eras.find(e => e.id === focusId) ?? eras[1]

  return (
    <section className="col">
      <div className="page-head">
        <div>
          <div className="kicker">Eras · VII</div>
          <h2>The band&apos;s <span className="italic">five lives.</span></h2>
          <div className="lede">From the Acid Tests to Soldier Field — three decades, in five chapters.</div>
        </div>
        <div className="toolbar">
          <span>2,328 shows · 1965–1995</span>
        </div>
      </div>

      {/* Timeline axis */}
      <div className="timeline-axis" style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em', marginBottom: 4 }}>
        <span>1965</span><span>1970</span><span>1975</span><span>1980</span><span>1985</span><span>1990</span><span>1995</span>
      </div>

      {/* Timeline strip */}
      <div className="timeline">
        {eras.map(e => (
          <div
            key={e.id}
            className={`seg ${e.segClass}`}
            style={{ flexBasis: `${(e.span / totalSpan) * 100}%` }}
            onClick={() => setFocusId(e.id)}
          />
        ))}
      </div>

      {/* Era cards */}
      <div className="era-grid">
        {eras.map(e => (
          <div
            key={e.id}
            className="era-card"
            style={focusId === e.id ? { background: 'var(--hi)', borderBottom: '3px solid var(--rust)' } : {}}
            onClick={() => setFocusId(e.id)}
          >
            <div className="tag">{e.tag}</div>
            <h4>{e.name}</h4>
            <div className="years">{e.years}</div>
            <div className="shows">
              Shows
              <span className="n">
                {loading ? '—' : e.shows !== null ? e.shows.toLocaleString() : '—'}
              </span>
            </div>
            <div className="sigs">{e.sig}</div>
            <Link
              href={`/eras/${e.id}`}
              className="explore"
              onClick={ev => ev.stopPropagation()}
            >
              Explore ⟶
            </Link>
          </div>
        ))}
      </div>

      {/* Focus section */}
      <div className="section-head">
        <h3>Focus · {focus.name}</h3>
        <div className="descr">{focus.tag} · {loading ? '…' : focus.shows !== null ? `${focus.shows} shows` : '—'}</div>
        <span className="meta">{focus.years}</span>
      </div>

      <div className="era-focus" style={{
        display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 0,
        border: '1.5px solid var(--ink)',
        borderTop: '3px solid var(--ink)',
        marginTop: 0,
      }}>
        <div style={{ padding: '18px 20px', borderRight: '1px solid var(--rule)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8 }}>Signature jam</div>
          <div style={{ fontFamily: 'var(--serif-display)', fontSize: 20, color: 'var(--ink)', lineHeight: 1.1 }}>Dark Star — Lyceum &#x2019;72</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 26, color: 'var(--rust)', letterSpacing: '-0.02em', marginTop: 6 }}>47:18</div>
          <Link href="/song/Dark Star" className="btn" style={{ marginTop: 14, display: 'inline-flex', textDecoration: 'none', fontSize: 15 }}>
            ▶ Play
          </Link>
        </div>
        <div style={{ padding: '18px 20px', borderRight: '1px solid var(--rule)' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8 }}>Songs debuted in this era</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {['Brown-Eyed Women', "He's Gone", 'Tennessee Jed', 'Ramble On Rose', 'Jack Straw', 'Mr. Charlie', 'Bertha', 'Wharf Rat'].map(s => (
              <Link
                key={s}
                href={`/song/${encodeURIComponent(s)}`}
                style={{
                  display: 'inline-block', border: '1px solid var(--ink)',
                  padding: '2px 8px', fontFamily: 'var(--mono)', fontSize: 11,
                  letterSpacing: '0.04em', background: 'var(--paper)', textDecoration: 'none',
                  color: 'var(--ink)',
                }}
              >
                {s}
              </Link>
            ))}
          </div>
        </div>
        <div style={{ padding: '18px 20px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8 }}>Avg. show length</div>
          <div style={{ fontFamily: 'var(--serif-display)', fontSize: 40, color: 'var(--rust)', letterSpacing: '-0.015em', lineHeight: 1 }}>3:11:42</div>
          <div style={{ fontFamily: 'var(--serif-body)', fontStyle: 'italic', fontSize: 13, color: 'var(--ink-3)', marginTop: 8, lineHeight: 1.35 }}>
            ~28% longer than the all-time average. Wall-of-Sound era.
          </div>
        </div>
      </div>
    </section>
  )
}
