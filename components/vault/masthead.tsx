'use client'

import React, { useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface MastheadProps {
  search: string
  setSearch: (v: string) => void
}

function toRomanDate(d: Date): string {
  const months: Record<number, string> = {
    0:'JAN',1:'FEB',2:'MAR',3:'APR',4:'MAY',5:'JUN',
    6:'JUL',7:'AUG',8:'SEP',9:'OCT',10:'NOV',11:'DEC',
  }
  const days = ['SUN','MON','TUE','WED','THU','FRI','SAT']
  const day = days[d.getDay()]
  const num = String(d.getDate()).padStart(2,'0')
  const mon = months[d.getMonth()]
  const y = d.getFullYear()
  // Roman numeral year (simple for MMXXVI range)
  const romanYear = toRomanYear(y)
  return `INDEXED ${day} ${num} ${mon} ${romanYear}`
}

function toRomanYear(y: number): string {
  const map: [number, string][] = [
    [1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],
    [100,'C'],[90,'XC'],[50,'L'],[40,'XL'],
    [10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I'],
  ]
  let n = y, result = ''
  for (const [val, sym] of map) {
    while (n >= val) { result += sym; n -= val }
  }
  return result
}

export function Masthead({ search, setSearch }: MastheadProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const now = new Date()
  const dateStr = toRomanDate(now)

  const { data: weather } = useSWR<{ temp: number | null; label: string | null }>(
    '/api/weather',
    fetcher,
    { refreshInterval: 600_000 }
  )

  const weatherStr = weather?.temp != null && weather?.label
    ? `${weather.temp}°F · ${weather.label}`
    : weather?.label === null
    ? ''
    : '…'

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const onSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search.trim())}`)
    }
  }

  return (
    <header className="masthead">
      <div className="left">{dateStr}</div>

      <div className="center">
        <h1 onClick={() => router.push('/')}>
          Steal<span className="your">your</span>Stats
        </h1>
        <div className="sub">
          The{' '}
          <span className="blackletter">Grateful Dead</span>{' '}
          Archive ·{' '}
          <i>compiled by hand, played through the deck</i>
        </div>
      </div>

      <div className="right">
        <div className="rcol">
          <div className="weather">{weatherStr}</div>
          <label className="search-box">
            <span style={{ color: 'var(--ink-3)' }}>⌕</span>
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={onSearch}
              placeholder="search songs, shows, venues…"
            />
            <span className="kbd">⌘K</span>
          </label>
        </div>
      </div>
    </header>
  )
}
