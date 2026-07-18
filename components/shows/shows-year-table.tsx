'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { OfficialRelease } from '@/lib/official-releases'
import { ReleaseBadge } from '@/components/ui/release-badge'

export interface ShowRef {
  id: string
  date: string
  venue: string
  city: string
  state?: string
  country: string
}

type SortKey = 'date' | 'date-desc' | 'venue'

function formatDate(iso: string) { return iso.replace(/-/g, ' · ') }

export function ShowsYearTable({ initialShows, audioDates, officialReleases }: { initialShows: ShowRef[]; audioDates: string[]; officialReleases: OfficialRelease[] }) {
  const router = useRouter()
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const audioDateSet = useMemo(() => new Set(audioDates), [audioDates])
  const releasesByDate = useMemo(() => {
    const map = new Map<string, OfficialRelease[]>()
    for (const r of officialReleases) {
      const list = map.get(r.date)
      if (list) list.push(r)
      else map.set(r.date, [r])
    }
    return map
  }, [officialReleases])

  const sortedShows = [...initialShows].sort((a, b) => {
    if (sortKey === 'date') return a.date.localeCompare(b.date)
    if (sortKey === 'date-desc') return b.date.localeCompare(a.date)
    return a.venue.localeCompare(b.venue) || a.date.localeCompare(b.date)
  })

  return (
    <>
      {/* Sort controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Sort</span>
        {([
          { key: 'date' as const,  label: sortKey === 'date' ? 'Date ↑' : sortKey === 'date-desc' ? 'Date ↓' : 'Date ↑' },
          { key: 'venue' as const, label: 'Venue' },
        ] as const).map(({ key, label }) => {
          const isDateBtn = key === 'date'
          const isActive = isDateBtn ? (sortKey === 'date' || sortKey === 'date-desc') : sortKey === key
          return (
            <button
              key={key}
              onClick={() => {
                if (isDateBtn) setSortKey(sortKey === 'date' ? 'date-desc' : 'date')
                else setSortKey(key)
              }}
              style={{
                background: isActive ? 'var(--ink)' : 'var(--paper)',
                border: '1px solid var(--ink)',
                color: isActive ? 'var(--paper)' : 'var(--ink)',
                fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.08em',
                padding: '4px 10px', cursor: 'pointer',
              }}
            >{label}</button>
          )
        })}
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>
          {initialShows.length} shows
        </span>
      </div>

      {/* Shows table */}
      <table className="tbl">
        <thead>
          <tr>
            <th>Date</th>
            <th>Venue</th>
            <th>City</th>
            <th style={{ textAlign: 'right' }}>Release</th>
            <th style={{ width: 80, textAlign: 'right' }}>Audio</th>
          </tr>
        </thead>
        <tbody>
          {sortedShows.map((s, i) => {
            const hasAudio = audioDateSet.has(s.date)
            const releases = releasesByDate.get(s.date) ?? []
            return (
              <tr
                key={s.id || i}
                style={{ cursor: 'pointer' }}
                onClick={() => router.push(`/show/${s.date}`)}
              >
                <td style={{ fontFamily: 'var(--mono)', fontSize: 12, whiteSpace: 'nowrap' }}>{formatDate(s.date)}</td>
                <td><span className="tbl-title">{s.venue}</span></td>
                <td style={{ fontFamily: 'var(--serif-body)', fontSize: 13, color: 'var(--ink-3)' }}>
                  {s.city}{s.state ? `, ${s.state}` : ''}
                </td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <ReleaseBadge releases={releases} size="xs" />
                </td>
                <td style={{ textAlign: 'right' }}>
                  {hasAudio && (
                    <span style={{
                      fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.1em',
                      textTransform: 'uppercase', color: 'var(--paper)',
                      background: 'var(--rust)',
                      border: '1px solid var(--rust)', padding: '2px 5px',
                    }}>
                      ▶ audio
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}
