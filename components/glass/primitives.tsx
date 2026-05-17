'use client'

import React from 'react'
import { Icon, ICONS } from './icons'

// ─── Stat Tile ────────────────────────────────────────────
interface StatTileProps {
  label: string
  value: string
  sub?: string
  accent?: boolean
}
export function StatTile({ label, value, sub, accent }: StatTileProps) {
  return (
    <div className="glass" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span className="t-eyebrow">{label}</span>
      <span className="t-stat" style={{ fontSize: 32, color: accent ? 'var(--accent)' : 'var(--fg)' }}>{value}</span>
      {sub && <span className="t-small">{sub}</span>}
    </div>
  )
}

// ─── Show Row ─────────────────────────────────────────────
interface ShowRowProps {
  date: string
  venue: string
  city?: string
  country?: string
  badge?: string
  onClick?: () => void
}
export function ShowRow({ date, venue, city, country, badge, onClick }: ShowRowProps) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '10px 16px',
        borderRadius: 'var(--r-sm)',
        transition: 'background 0.12s',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-bg)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <span className="t-mono" style={{ fontSize: 12.5, color: 'var(--fg)', flex: '0 0 92px' }}>{date}</span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
        <span style={{ fontSize: 13, color: 'var(--fg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{venue}</span>
        {(city || country) && (
          <span style={{ fontSize: 11.5, color: 'var(--fg-3)' }}>
            {city}{country ? ` · ${country}` : ''}
          </span>
        )}
      </div>
      {badge && (
        <span className="pill" style={{ fontSize: 10.5, padding: '2px 8px' }}>{badge}</span>
      )}
      <span style={{ color: 'var(--fg-3)', cursor: 'pointer', flexShrink: 0 }}>
        <Icon d={ICONS.external} size={14} />
      </span>
    </div>
  )
}

// ─── Collapsible Header ───────────────────────────────────
interface CollapsibleHeaderProps {
  title: string
  count?: number
  open: boolean
  accent?: boolean
  onClick: () => void
  subtitle?: string
  right?: React.ReactNode
}
export function CollapsibleHeader({ title, count, open, accent, onClick, subtitle, right }: CollapsibleHeaderProps) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 18px',
        cursor: 'pointer',
      }}
    >
      <span style={{
        color: 'var(--fg-3)',
        display: 'inline-flex',
        transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 0.15s',
        flexShrink: 0,
      }}>
        <Icon d={ICONS.chevRight} size={14} />
      </span>
      <span className="t-h3" style={{ fontSize: 16 }}>{title}</span>
      {subtitle && <span className="t-small">{subtitle}</span>}
      {count !== undefined && (
        <span className="pill" style={{
          padding: '2px 9px', fontSize: 11,
          background: accent ? 'var(--accent-soft)' : 'var(--glass-bg)',
          borderColor: accent ? 'rgba(240,176,74,0.32)' : 'var(--glass-border)',
          color: accent ? 'var(--accent-strong)' : 'var(--fg-2)',
          fontFamily: 'var(--font-mono)',
        }}>
          {count}
        </span>
      )}
      {right && <span style={{ marginLeft: 'auto' }}>{right}</span>}
    </div>
  )
}

// ─── Attribution Footer ───────────────────────────────────
export function AttributionFooter() {
  const now = new Date()
  const utcStr = now.toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
  return (
    <footer style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '10px 4px', color: 'var(--fg-4)', fontSize: 11.5,
    }}>
      <span>Data from <a style={{ color: 'var(--fg-3)' }} href="https://www.setlist.fm" target="_blank" rel="noopener noreferrer">setlist.fm</a> and <a style={{ color: 'var(--fg-3)' }} href="https://archive.org" target="_blank" rel="noopener noreferrer">Archive.org</a></span>
      <span>·</span>
      <span>Cached 24h</span>
      <span style={{ flex: 1 }} />
      <span className="t-mono">SWR · refreshed {utcStr}</span>
    </footer>
  )
}

// ─── Glass Skeleton ───────────────────────────────────────
export function GlassSkeleton({ height = 80, className = '', style }: { height?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ height, borderRadius: 'var(--r-md)', ...style }}
    />
  )
}

// ─── Donut Chart ──────────────────────────────────────────
interface DonutSegment { label: string; value: number; color: string }
interface DonutChartProps { segments: DonutSegment[]; total: number; size?: number }

export function DonutChart({ segments, total, size = 160 }: DonutChartProps) {
  const r = 60
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <svg width={size} height={size} viewBox="-80 -80 160 160" style={{ transform: 'rotate(-90deg)' }}>
      <circle r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="22" />
      {segments.map((s, i) => {
        const len = (s.value / total) * c
        const el = (
          <circle
            key={i} r={r} fill="none" stroke={s.color} strokeWidth="22"
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-offset}
          />
        )
        offset += len
        return el
      })}
      <text
        textAnchor="middle" y="8"
        style={{ transform: 'rotate(90deg)', fill: 'var(--fg)', fontSize: 22, fontFamily: 'var(--font-mono)', fontWeight: 500 }}
      >
        {total}
      </text>
      <text
        textAnchor="middle" y="22"
        style={{ transform: 'rotate(90deg)', fill: 'var(--fg-4)', fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.16em' }}
      >
        TOTAL
      </text>
    </svg>
  )
}
