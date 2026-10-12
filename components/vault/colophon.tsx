'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Colophon() {
  const pathname = usePathname()
  return (
    <footer className="colophon">
      <span>© MMXXVI · Steal Your Stats</span>
      <span className="center">
        <span className="glyph">❦</span>
        &nbsp;&nbsp;If you get confused, listen to the music play&nbsp;&nbsp;
        <span className="glyph">❦</span>
      </span>
      <span>
        <Link href={`/support?from=${encodeURIComponent(pathname)}`}>Send feedback · tip the operator</Link>
      </span>
    </footer>
  )
}
