'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { PlayerProvider } from '@/lib/contexts/player-context'
import { Spine } from './spine'
import { TopBand } from './top-band'
import { Colophon } from './colophon'
import { VaultPlayer } from './vault-player'
import { MobileShell } from '@/components/mobile/mobile-shell'

const WIDE_ROUTES = new Set([
  '/search', '/songs', '/stats', '/venues', '/eras', '/artists', '/recent', '/export', '/shows', '/support',
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

const FOLD_KEY = 'sys:spine-folded'

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [search, setSearch] = useState('')
  const [folded, setFoldedState] = useState(false)
  const wide = isWideRoute(pathname)

  useEffect(() => {
    try { setFoldedState(localStorage.getItem(FOLD_KEY) === '1') } catch {}
  }, [])
  const setFolded = useCallback((v: boolean) => {
    setFoldedState(v)
    try { localStorage.setItem(FOLD_KEY, v ? '1' : '0') } catch {}
  }, [])

  return (
    <div className={`vault-page spine-layout${folded ? ' folded' : ''}`}>
      <Spine search={search} setSearch={setSearch} folded={folded} setFolded={setFolded} />
      <main className="vault-main">
        <TopBand />
        <div className={`page-grid${wide ? ' wide' : ''}`}>
          {children}
        </div>
        <Colophon />
      </main>
    </div>
  )
}

export function VaultShell({ children }: { children: React.ReactNode }) {
  return (
    <PlayerProvider>
      <ShellInner>{children}</ShellInner>
      <MobileShell />
      {/* VaultPlayer lives outside .vault-page so its <audio> element is never
          inside a display:none ancestor on mobile. The mobile shell (z-index 999)
          visually covers the desktop player UI on small screens. */}
      <VaultPlayer />
    </PlayerProvider>
  )
}
