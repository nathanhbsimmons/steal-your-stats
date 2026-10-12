'use client'

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { CANONICAL_SONG_COUNT } from '@/lib/ids'

// Replaces components/vault/chapters.tsx + the search box in masthead.tsx.
const CHAPTERS = [
  { id: 'home',    num: 'I',    label: 'Home',         href: '/',        badge: null },
  { id: 'search',  num: 'II',   label: 'Search',       href: '/search',  badge: null },
  { id: 'songs',   num: 'III',  label: 'Songs',        href: '/songs',   badge: String(CANONICAL_SONG_COUNT) },
  { id: 'recent',  num: 'IV',   label: 'Recent',       href: '/recent',  badge: null },
  { id: 'members', num: 'V',    label: 'Band Members', href: '/artists', badge: null },
  { id: 'venues',  num: 'VI',   label: 'Venues',       href: '/venues',  badge: null },
  { id: 'shows',   num: 'VII',  label: 'Shows',        href: '/shows',   badge: null },
  { id: 'eras',    num: 'VIII', label: 'Eras',         href: '/eras',    badge: null },
  { id: 'stats',   num: 'IX',   label: 'Stats',        href: '/stats',   badge: null },
  { id: 'export',  num: 'X',    label: 'Export',       href: '/export',  badge: null },
]

export function getActiveId(pathname: string): string {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/search')) return 'search'
  if (pathname.startsWith('/songs') || pathname.startsWith('/song')) return 'songs'
  if (pathname.startsWith('/recent')) return 'recent'
  if (pathname.startsWith('/artists')) return 'members'
  if (pathname.startsWith('/venues')) return 'venues'
  if (pathname.startsWith('/shows')) return 'shows'
  if (pathname.startsWith('/eras')) return 'eras'
  if (pathname.startsWith('/stats')) return 'stats'
  if (pathname.startsWith('/export')) return 'export'
  if (pathname.startsWith('/support')) return 'support'
  return 'home'
}

interface SpineProps {
  search: string
  setSearch: (v: string) => void
  folded: boolean
  setFolded: (v: boolean) => void
}

export function Spine({ search, setSearch, folded, setFolded }: SpineProps) {
  const pathname = usePathname()
  const router = useRouter()
  const activeId = getActiveId(pathname)
  const inputRef = useRef<HTMLInputElement>(null)

  // ⌘K focuses search (expands the spine first if folded); ⌘B toggles fold.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return
      const k = e.key.toLowerCase()
      if (k === 'k') {
        e.preventDefault()
        if (folded) { setFolded(false); requestAnimationFrame(() => inputRef.current?.focus()) }
        else inputRef.current?.focus()
      } else if (k === 'b') {
        e.preventDefault()
        setFolded(!folded)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [folded, setFolded])

  const onSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim()) router.push(`/search?q=${encodeURIComponent(search.trim())}`)
  }

  const supportHref = `/support?from=${encodeURIComponent(pathname)}`

  return (
    <div className="spine-wrap">
      <aside className="spine" aria-label="Chapter navigation">
        <Link href="/" className="spine-wm" aria-label="Steal Your Stats — home">
          {folded ? <>S<span className="your">y</span>S</> : <>Steal<span className="your">your</span>Stats</>}
        </Link>

        {folded ? (
          <button type="button" className="spine-search-icon" title="Search (⌘K)" aria-label="Search" onClick={() => router.push('/search')}>⌕</button>
        ) : (
          <label className="spine-search">
            <span className="g" aria-hidden="true">⌕</span>
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={onSearch}
              placeholder="search…"
              aria-label="Search songs, shows, venues"
            />
            <span className="kbd" aria-hidden="true">⌘K</span>
          </label>
        )}

        <nav className="spine-list">
          {CHAPTERS.map(c => (
            <Link
              key={c.id}
              href={c.href}
              className={activeId === c.id ? 'active' : ''}
              aria-current={activeId === c.id ? 'page' : undefined}
              title={folded ? c.label : undefined}
              aria-label={folded ? c.label : undefined}
            >
              <span className="num">{c.num}</span>
              {!folded && <span className="label">{c.label}</span>}
              {!folded && c.badge && <span className="badge">{c.badge}</span>}
            </Link>
          ))}
        </nav>

        <div className="spine-foot">
          <Link
            href={supportHref}
            className={activeId === 'support' ? 'active' : ''}
            aria-current={activeId === 'support' ? 'page' : undefined}
            title={folded ? 'Support & feedback' : undefined}
            aria-label={folded ? 'Support & feedback' : undefined}
          >
            {folded ? '✉' : 'Support & feedback'}
          </Link>
        </div>
      </aside>

      <button
        type="button"
        className="spine-notch"
        onClick={() => setFolded(!folded)}
        aria-label={folded ? 'Expand sidebar' : 'Fold sidebar'}
        aria-expanded={!folded}
        aria-keyshortcuts="Meta+B Control+B"
      >
        <span aria-hidden="true">{folded ? '›' : '‹'}</span>
        <span className="tip" role="tooltip">{folded ? 'Expand' : 'Fold'} <kbd>⌘B</kbd></span>
      </button>
    </div>
  )
}
