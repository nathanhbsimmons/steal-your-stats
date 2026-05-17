'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon, ICONS, LogoMark } from './icons'

const NAV_ITEMS = [
  { id: 'home',    href: '/',        label: 'Home',    icon: 'home' as const },
  { id: 'search',  href: '/search',  label: 'Search',  icon: 'search' as const },
  { id: 'recent',  href: '/recent',  label: 'Recent',  icon: 'clock' as const },
  { id: 'artists', href: '/artists', label: 'Band Members', icon: 'mic' as const },
  { id: 'venues',  href: '/venues',  label: 'Venues',  icon: 'pin' as const },
  { id: 'eras',    href: '/eras',    label: 'Eras',    icon: 'history' as const },
  { id: 'stats',   href: '/stats',   label: 'Stats',   icon: 'chart' as const },
  { id: 'export',  href: '/export',  label: 'Export',  icon: 'download' as const },
]

const PINNED_SONGS = [
  { name: 'Dark Star',         href: '/song/Dark%20Star' },
  { name: 'St. Stephen',       href: '/song/St.%20Stephen' },
  { name: 'Scarlet › Fire',    href: '/song/Scarlet%20Begonias' },
  { name: 'Eyes of the World', href: '/song/Eyes%20of%20the%20World' },
  { name: 'Morning Dew',       href: '/song/Morning%20Dew' },
]

function getActiveId(pathname: string): string {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/search')) return 'search'
  if (pathname.startsWith('/recent')) return 'recent'
  if (pathname.startsWith('/artists')) return 'artists'
  if (pathname.startsWith('/venues')) return 'venues'
  if (pathname.startsWith('/eras')) return 'eras'
  if (pathname.startsWith('/stats')) return 'stats'
  if (pathname.startsWith('/export')) return 'export'
  if (pathname.startsWith('/song')) return 'song'
  return ''
}

export function Sidebar() {
  const pathname = usePathname()
  const activeId = getActiveId(pathname)
  const isSongPage = activeId === 'song'

  return (
    <aside style={{
      width: 232,
      flex: '0 0 232px',
      display: 'flex',
      flexDirection: 'column',
      padding: '22px 16px 16px',
      gap: 22,
      height: '100vh',
      overflow: 'hidden',
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0 8px' }}>
        <LogoMark size={34} />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', letterSpacing: '-0.01em' }}>
            Steal Your Stats
          </span>
          <span className="t-eyebrow" style={{ fontSize: 9.5 }}>The Dead Archive</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="glass" style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 2, borderRadius: 'var(--r-lg)' }}>
        {NAV_ITEMS.map(item => (
          <Link
            key={item.id}
            href={item.href}
            className={`nav-item${activeId === item.id ? ' active' : ''}`}
          >
            <span className="nav-icon">
              <Icon d={ICONS[item.icon]} size={16} />
            </span>
            <span>{item.label}</span>
            {item.id === 'recent' && activeId !== 'recent' && (
              <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg-4)' }}>
                12
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Pinned songs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="t-eyebrow" style={{ padding: '0 8px' }}>Pinned</div>
        <div className="glass faint" style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {PINNED_SONGS.map((song) => {
            const isActive = isSongPage && pathname.includes(encodeURIComponent(song.name.split(' ')[0]))
            return (
              <Link
                key={song.name}
                href={song.href}
                className={`nav-item${isActive ? ' active' : ''}`}
                style={{ padding: '7px 10px' }}
              >
                <span
                  className="nav-icon"
                  style={{ color: isActive ? 'var(--accent)' : 'var(--fg-4)' }}
                >
                  <Icon d={ICONS.music} size={13} />
                </span>
                <span style={{ fontSize: 12.5 }}>{song.name}</span>
              </Link>
            )
          })}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* User chip */}
      <div className="glass faint" style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent), var(--accent-strong))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#2a1a05', fontWeight: 700, fontSize: 12, flexShrink: 0,
        }}>
          JG
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 12, color: 'var(--fg)', fontWeight: 500 }}>jerry@archive</span>
          <span style={{ fontSize: 10.5, color: 'var(--fg-4)', fontFamily: 'var(--font-mono)' }}>cached · 24h</span>
        </div>
        <span style={{ color: 'var(--fg-3)', flexShrink: 0 }}>
          <Icon d={ICONS.cog} size={14} />
        </span>
      </div>
    </aside>
  )
}
