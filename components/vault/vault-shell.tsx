'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
import { PlayerProvider } from '@/lib/contexts/player-context'
import { Masthead } from './masthead'
import { EditionStrip } from './edition-strip'
import { Chapters } from './chapters'
import { Colophon } from './colophon'
import { VaultPlayer } from './vault-player'
import { MobileShell } from '@/components/mobile/mobile-shell'

const WIDE_ROUTES = new Set([
  '/search', '/songs', '/stats', '/venues', '/eras', '/artists', '/recent', '/export',
])

function isWideRoute(pathname: string): boolean {
  if (WIDE_ROUTES.has(pathname)) return true
  for (const r of WIDE_ROUTES) {
    if (pathname.startsWith(r + '/')) return true
  }
  if (pathname.startsWith('/song/')) return true
  if (pathname.startsWith('/show/')) return true
  if (pathname.startsWith('/member/')) return true
  return false
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [search, setSearch] = useState('')
  const wide = isWideRoute(pathname)

  const handleSearch = (q: string) => {
    setSearch(q)
  }

  return (
    <div className="vault-page">
      <Masthead search={search} setSearch={handleSearch} />
      <EditionStrip />
      <Chapters />

      <div className={`page-grid${wide ? ' wide' : ''}`}>
        {children}
      </div>

      <Colophon />
      <VaultPlayer />
    </div>
  )
}

export function VaultShell({ children }: { children: React.ReactNode }) {
  return (
    <PlayerProvider>
      <ShellInner>{children}</ShellInner>
      <MobileShell />
    </PlayerProvider>
  )
}
