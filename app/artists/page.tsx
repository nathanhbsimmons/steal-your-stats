'use client'

import React, { useEffect, useState } from 'react'

interface YearCount { year: number; count: number }

const CORE_SIX = [
  { name: 'Jerry Garcia',    role: 'Lead guitar · vocals',      initial: 'JG', years: '1965 – 1995', mark: 'J' },
  { name: 'Bob Weir',        role: 'Rhythm guitar · vocals',    initial: 'BW', years: '1965 – 1995', mark: 'B' },
  { name: 'Phil Lesh',       role: 'Bass · vocals',             initial: 'PL', years: '1965 – 1995', mark: 'P' },
  { name: 'Bill Kreutzmann', role: 'Drums',                     initial: 'BK', years: '1965 – 1995', mark: 'K' },
  { name: 'Mickey Hart',     role: 'Drums · percussion',        initial: 'MH', years: '1967 – 1995', mark: 'M' },
  { name: 'Pigpen',          role: 'Keys · harmonica · vocals', initial: 'PP', years: '1965 – 1972', mark: 'R' },
]

const PASSING_THROUGH = [
  { name: 'Keith Godchaux',  role: 'Keys',               initial: 'KG', years: '1971 – 1979', mark: 'K' },
  { name: 'Donna Godchaux',  role: 'Vocals',             initial: 'DG', years: '1972 – 1979', mark: 'D' },
  { name: 'Brent Mydland',   role: 'Keys · vocals',      initial: 'BM', years: '1979 – 1990', mark: 'B' },
  { name: 'Vince Welnick',   role: 'Keys · vocals',      initial: 'VW', years: '1990 – 1995', mark: 'V' },
]

function sumYears(data: YearCount[], from: number, to: number): number {
  return data.filter(d => d.year >= from && d.year <= to).reduce((s, d) => s + d.count, 0)
}

function MemberCard({
  member,
  shows,
  minor,
}: {
  member: typeof CORE_SIX[0]
  shows: number
  minor?: boolean
}) {
  return (
    <div className={`member-card${minor ? ' minor' : ''}`}>
      <div className="portrait">
        <span className="mark">{member.mark}</span>
        <span className="lbl">{member.initial}</span>
      </div>
      <div className="name">{member.name}</div>
      <div className="role">{member.role}</div>
      <div className="stats">
        <div>
          Shows<span className="n">{shows > 0 ? shows.toLocaleString() : '—'}</span>
        </div>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', alignSelf: 'end' }}>
          {member.years}
        </span>
      </div>
    </div>
  )
}

export default function ArtistsPage() {
  const [yearData, setYearData] = useState<YearCount[]>([])

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.showsPerYear) setYearData(d.showsPerYear) })
      .catch(() => {})
  }, [])

  return (
    <section className="col">
      <div className="page-head">
        <div>
          <div className="kicker">Band Members · V</div>
          <h2>The <span className="italic">lineup,</span> assembled.</h2>
          <div className="lede">
            Ten people sat in a Grateful Dead lineup between 1965 and 1995. Six core, four just passing through.
          </div>
        </div>
      </div>

      <div className="section-head">
        <h3>The core six</h3>
        <span className="descr">— the founding lineup</span>
        <span className="meta">1965 — 1995</span>
      </div>
      <div className="member-grid">
        {CORE_SIX.map(m => {
          const [from, to] = m.years.split(' – ').map(Number)
          const shows = sumYears(yearData, from, to)
          return <MemberCard key={m.name} member={m} shows={shows} />
        })}
      </div>

      <div className="section-head" style={{ marginTop: 32 }}>
        <h3>Passing through</h3>
        <span className="descr">— keyboardists and harmony singers</span>
        <span className="meta">1971 — 1995</span>
      </div>
      <div className="member-grid">
        {PASSING_THROUGH.map(m => {
          const [from, to] = m.years.split(' – ').map(Number)
          const shows = sumYears(yearData, from, to)
          return <MemberCard key={m.name} member={m} shows={shows} minor />
        })}
      </div>
    </section>
  )
}
