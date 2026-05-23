'use client'

import { usePathname, useRouter } from 'next/navigation'

const CHAPTERS = [
  { id: 'home',    num: 'I',    label: 'Home',         href: '/',        badge: null },
  { id: 'search',  num: 'II',   label: 'Search',       href: '/search',  badge: '⌘K' },
  { id: 'songs',   num: 'III',  label: 'Songs',        href: '/songs',   badge: '442' },
  { id: 'recent',  num: 'IV',   label: 'Recent',       href: '/recent',  badge: null },
  { id: 'members', num: 'V',    label: 'Band Members', href: '/artists', badge: null },
  { id: 'venues',  num: 'VI',   label: 'Venues',       href: '/venues',  badge: null },
  { id: 'eras',    num: 'VII',  label: 'Eras',         href: '/eras',    badge: null },
  { id: 'stats',   num: 'VIII', label: 'Stats',        href: '/stats',   badge: null },
  { id: 'export',  num: 'IX',   label: 'Export',       href: '/export',  badge: null },
]

function getActiveId(pathname: string): string {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/search')) return 'search'
  if (pathname.startsWith('/songs') || pathname.startsWith('/song')) return 'songs'
  if (pathname.startsWith('/recent')) return 'recent'
  if (pathname.startsWith('/artists')) return 'members'
  if (pathname.startsWith('/venues')) return 'venues'
  if (pathname.startsWith('/eras')) return 'eras'
  if (pathname.startsWith('/stats')) return 'stats'
  if (pathname.startsWith('/export')) return 'export'
  if (pathname.startsWith('/show')) return 'home'
  return 'home'
}

const PAGE_NUMS: Record<string, string> = {
  home: '0001', search: '0002', songs: '0003', recent: '0004',
  members: '0005', venues: '0006', eras: '0007', stats: '0008', export: '0009',
}

export function Chapters() {
  const pathname = usePathname()
  const router = useRouter()
  const activeId = getActiveId(pathname)

  return (
    <nav className="chapters" role="navigation" aria-label="Chapter navigation">
      {CHAPTERS.map(c => (
        <button
          key={c.id}
          className={activeId === c.id ? 'active' : ''}
          onClick={() => router.push(c.href)}
          aria-current={activeId === c.id ? 'page' : undefined}
        >
          <span className="num">{c.num}.</span>
          {c.label}
          {c.badge && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: '9.5px', color: 'var(--ink-3)', letterSpacing: '0.05em', paddingLeft: '4px' }}>
              {c.badge}
            </span>
          )}
        </button>
      ))}
      <div className="spacer" />
      <div className="meta">
        PG. <span style={{ color: 'var(--rust)' }}>{PAGE_NUMS[activeId] ?? '0001'}</span> of 2333
      </div>
    </nav>
  )
}
