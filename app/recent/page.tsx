'use client'

import React, { useEffect, useState } from 'react'
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
  const groups: DayGroup[] = []
  for (const [key, entries] of map) {
    let label = key
    if (key === today) label = 'Today'
    else if (key === yesterday) label = 'Yesterday'
    else {
      const d = new Date(key + 'T12:00:00')
      label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    }
    groups.push({ label, isoDate: key, entries })
  }
  return groups.sort((a, b) => b.isoDate.localeCompare(a.isoDate))
}

function uniqueDays(entries: PlayLogEntry[]): number {
  return new Set(entries.map(e => new Date(e.timestamp).toISOString().slice(0, 10))).size
}

export default function RecentPage() {
  const [log, setLog] = useState<PlayLogEntry[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PLAY_LOG_KEY)
      if (stored) setLog(JSON.parse(stored))
    } catch {}
  }, [])

  const groups = groupByDay(log)
  const days = uniqueDays(log)

  return (
    <section className="col">
      <div className="page-head">
        <div>
          <div className="kicker">Recent · IV</div>
          <h2>The <span className="italic">play log,</span> by day.</h2>
          <div className="lede">
            {log.length > 0
              ? `${log.length} track${log.length !== 1 ? 's' : ''} stored across ${days} day${days !== 1 ? 's' : ''} of this long, strange trip.`
              : 'Nothing played yet. Cue a show and the log will fill itself.'
            }
          </div>
        </div>
      </div>

      {log.length === 0 && (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-3)', fontStyle: 'italic', fontFamily: 'var(--serif-body)', fontSize: 17 }}>
          The deck has not yet been played. Find a show and hit play.
        </div>
      )}

      {groups.map(group => (
        <div key={group.isoDate} className="recent-day">
          <div className="day-head">
            <span className="lbl">{group.label}</span>
            <span className="date">{group.isoDate}</span>
            <span className="count">{group.entries.length} track{group.entries.length !== 1 ? 's' : ''}</span>
          </div>
          {group.entries.map((entry, i) => (
            <div key={i} className="recent-entry">
              <span className="time">{formatTime(entry.timestamp)}</span>
              <span className="track-name">{entry.trackName}</span>
              <span className="src">
                {entry.showDate} · {entry.venue}
                {entry.city ? ` · ${entry.city}` : ''}
              </span>
              <span className="dur">{formatDuration(entry.duration)}</span>
            </div>
          ))}
        </div>
      ))}
    </section>
  )
}
