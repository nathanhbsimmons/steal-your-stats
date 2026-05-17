'use client'

import React, { useEffect, useState } from 'react'
import { TopBar } from '@/components/glass/topbar'

interface YearCount { year: number; count: number }

const LINEUP = [
  { name: 'Jerry Garcia',    role: 'Lead guitar · vocals',      startYear: 1965, endYear: 1995, color: '#f0b04a' },
  { name: 'Bob Weir',        role: 'Rhythm guitar · vocals',    startYear: 1965, endYear: 1995, color: '#7aa8ff' },
  { name: 'Phil Lesh',       role: 'Bass · vocals',             startYear: 1965, endYear: 1995, color: '#9b7ee0' },
  { name: 'Bill Kreutzmann', role: 'Drums',                     startYear: 1965, endYear: 1995, color: '#6ad6c6' },
  { name: 'Mickey Hart',     role: 'Drums · percussion',        startYear: 1967, endYear: 1995, color: '#f08a8a' },
  { name: 'Pigpen',          role: 'Keys · harmonica · vocals', startYear: 1965, endYear: 1972, color: '#d0a070' },
  { name: 'Keith Godchaux',  role: 'Keys',                      startYear: 1971, endYear: 1979, color: '#a8c6ff' },
  { name: 'Donna Godchaux',  role: 'Vocals',                    startYear: 1972, endYear: 1979, color: '#e6b4d4' },
  { name: 'Brent Mydland',   role: 'Keys · vocals',             startYear: 1979, endYear: 1990, color: '#88c6a0' },
  { name: 'Vince Welnick',   role: 'Keys · vocals',             startYear: 1990, endYear: 1995, color: '#c6a0e0' },
]

function sumYears(data: YearCount[], from: number, to: number): number {
  return data.filter(d => d.year >= from && d.year <= to).reduce((s, d) => s + d.count, 0)
}

function ArtistCard({
  member,
  shows,
  feature,
  loading,
}: {
  member: typeof LINEUP[0]
  shows: number | null
  feature?: boolean
  loading?: boolean
}) {
  const years = member.startYear === member.endYear
    ? `${member.startYear}`
    : `${member.startYear} – ${member.endYear}`

  return (
    <div className="glass" style={{
      padding: feature ? '18px 18px 16px' : '14px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{
        width: '100%', aspectRatio: '4 / 3', borderRadius: 'var(--r-md)',
        background: `linear-gradient(135deg, ${member.color}55, ${member.color}22), repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0 8px, transparent 8px 16px)`,
        border: '1px solid var(--glass-border)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', bottom: 12, left: 12,
          fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.4)',
          letterSpacing: '0.16em', textTransform: 'uppercase',
        }}>
          portrait · placeholder
        </div>
        <span className="t-mono" style={{
          position: 'absolute', top: 10, right: 12,
          fontSize: 10.5, color: 'rgba(255,255,255,0.5)',
        }}>
          {member.startYear}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: feature ? 16 : 14, color: 'var(--fg)', fontWeight: 600, letterSpacing: '-0.01em' }}>
          {member.name}
        </span>
        <span className="t-small" style={{ fontSize: 11.5 }}>{member.role}</span>
      </div>
      <div className="divider" />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="t-eyebrow">shows</span>
          {loading ? (
            <div className="skeleton" style={{ height: 22, width: 48, borderRadius: 6, marginTop: 2 }} />
          ) : (
            <span className="t-mono" style={{ fontSize: 17, color: 'var(--fg)' }}>
              {shows !== null ? shows.toLocaleString() : '—'}
            </span>
          )}
        </div>
        <div style={{ flex: 1 }} />
        <span className="t-mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>{years}</span>
      </div>
    </div>
  )
}

export default function ArtistsPage() {
  const [showsPerYear, setShowsPerYear] = useState<YearCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.showsPerYear) setShowsPerYear(data.showsPerYear) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const memberShows = LINEUP.map(m =>
    showsPerYear.length > 0 ? sumYears(showsPerYear, m.startYear, m.endYear) : null
  )

  return (
    <>
      <TopBar eyebrow="Lineup" title="The band, in every iteration." />
      <div className="scroll-hide" style={{ flex: 1, overflow: 'auto', padding: '0 28px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {LINEUP.slice(0, 6).map((m, i) => (
            <ArtistCard key={i} member={m} shows={memberShows[i]} feature loading={loading} />
          ))}
        </section>
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {LINEUP.slice(6).map((m, i) => (
            <ArtistCard key={i} member={m} shows={memberShows[i + 6]} loading={loading} />
          ))}
        </section>
      </div>
    </>
  )
}
