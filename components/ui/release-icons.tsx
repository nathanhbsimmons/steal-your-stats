import React from 'react'

type IconProps = { size?: number }

function Square({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="3" y="3" width="10" height="10" />
    </svg>
  )
}

function Ring({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 3.3a2.7 2.7 0 100 5.4 2.7 2.7 0 000-5.4z" />
    </svg>
  )
}

function ArrowDown({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M6.8 2h2.4v6.2h2.9L8 12.5 3.9 8.2h2.9V2z" />
    </svg>
  )
}

function Car({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="1.5" y="8" width="13" height="4" rx="1" />
      <rect x="4" y="5.3" width="8" height="3.5" rx="1" />
      <circle cx="4.6" cy="12" r="1.5" />
      <circle cx="11.4" cy="12" r="1.5" />
    </svg>
  )
}

function Keyhole({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 2.3a2.6 2.6 0 100 5.2 2.6 2.6 0 000-5.2zM6.7 8.3h2.6l1.4 5a.6.6 0 01-.58.75H5.88a.6.6 0 01-.58-.75l1.4-5z" />
    </svg>
  )
}

function Bolt({ size = 12 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M9 1L3.2 9.2h3.6L5.6 15l7.2-8.4H9.4L9 1z" />
    </svg>
  )
}

const SERIES_ICON: Record<string, { Icon: React.FC<IconProps>; color: string }> = {
  "Dick's Picks": { Icon: Square, color: 'var(--ink-2)' },
  "Dave's Picks": { Icon: Ring, color: 'var(--oxblood)' },
  'Road Trips': { Icon: Car, color: 'var(--forest)' },
  'Download Series': { Icon: ArrowDown, color: 'var(--ink-3)' },
  'From the Vault': { Icon: Keyhole, color: 'var(--ink-2)' },
  'Studio/Compilation': { Icon: Bolt, color: 'var(--amber)' },
}

const DEFAULT_ICON = { Icon: Bolt, color: 'var(--ink-3)' }

export function releaseSeriesStyle(series: string) {
  return SERIES_ICON[series] ?? DEFAULT_ICON
}

export function ReleaseIcon({ series, size = 12 }: { series: string; size?: number }) {
  const { Icon, color } = releaseSeriesStyle(series)
  return (
    <span style={{ color, display: 'inline-flex', flexShrink: 0 }}>
      <Icon size={size} />
    </span>
  )
}
