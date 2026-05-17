'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { TopBar } from '@/components/glass/topbar'
import { Icon, ICONS } from '@/components/glass/icons'
import { PLAY_LOG_KEY, PlayLogEntry } from '@/lib/hooks/use-audio-player'

interface DayGroup {
  label: string
  isoDate: string
  entries: PlayLogEntry[]
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatDuration(secs?: number): string {
  if (!secs) return ''
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function groupByDay(entries: PlayLogEntry[]): DayGroup[] {
  const map = new Map<string, PlayLogEntry[]>()
  for (const e of entries) {
    const d = new Date(e.timestamp)
    const key = d.toISOString().slice(0, 10)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(e)
  }

  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([iso, items]) => {
    let label: string
    if (iso === today) {
      label = `Today · ${new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
    } else if (iso === yesterday) {
      label = `Yesterday · ${new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
    } else {
      label = new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }
    return { label, isoDate: iso, entries: items }
  })
}

export default function RecentPage() {
  const [days, setDays] = useState<DayGroup[]>([])
  const [empty, setEmpty] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PLAY_LOG_KEY)
      const log: PlayLogEntry[] = stored ? JSON.parse(stored) : []
      if (log.length === 0) {
        setEmpty(true)
      } else {
        setDays(groupByDay(log))
      }
    } catch {
      setEmpty(true)
    }
  }, [])

  return (
    <>
      <TopBar eyebrow="Recent" title="Your listening history." />

      <div className="scroll-hide" style={{ flex: 1, overflow: 'auto', padding: '0 28px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {empty ? (
          <section className="glass" style={{ padding: '48px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
            <Icon d={ICONS.list} size={32} />
            <h3 className="t-h3">No history yet</h3>
            <p className="t-small" style={{ maxWidth: 320 }}>
              Start playing songs or shows — your listening history will appear here, grouped by day.
            </p>
            <Link href="/songs" className="btn primary" style={{ textDecoration: 'none' }}>
              Browse songs
            </Link>
          </section>
        ) : (
          days.map(day => (
            <section key={day.isoDate} className="glass" style={{ padding: 4, display: 'flex', flexDirection: 'column' }}>
              <header style={{ padding: '14px 18px 8px', display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <h3 className="t-h3" style={{ fontSize: 16 }}>{day.label}</h3>
                <span className="t-eyebrow">{day.entries.length} tracks</span>
              </header>

              <div style={{ display: 'flex', flexDirection: 'column', padding: '0 6px 10px' }}>
                {day.entries.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '10px 12px', borderRadius: 'var(--r-sm)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span className="t-mono" style={{ fontSize: 11, color: 'var(--fg-4)', width: 42, flexShrink: 0 }}>
                      {formatTime(item.timestamp)}
                    </span>
                    <div style={{
                      width: 32, height: 32, borderRadius: 'var(--r-xs)',
                      background: 'var(--glass-bg-strong)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--accent)',
                      flexShrink: 0,
                    }}>
                      <Icon d={ICONS.play} size={13} fill="currentColor" stroke={0} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                      <span style={{ fontSize: 13.5, color: 'var(--fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.trackName}
                      </span>
                      <span className="t-small" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.showDate && item.showDate.replace(/-/g, '·')}
                        {item.venue ? ` · ${item.venue}` : ''}
                        {item.city ? `, ${item.city}` : ''}
                      </span>
                    </div>
                    {item.duration && (
                      <span className="t-mono" style={{ fontSize: 12, color: 'var(--fg-3)', flexShrink: 0 }}>
                        {formatDuration(item.duration)}
                      </span>
                    )}
                    <span className="pill" style={{
                      fontSize: 10, padding: '2px 8px',
                      background: 'var(--accent-soft)',
                      color: 'var(--accent-strong)',
                      borderColor: 'rgba(240,176,74,0.32)',
                      fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase',
                      flexShrink: 0,
                    }}>
                      played
                    </span>
                    {item.showDate && (
                      <Link
                        href={`/show/${item.showDate}`}
                        className="play-mini"
                        title="View setlist"
                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Icon d={ICONS.list} size={11} />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </>
  )
}
