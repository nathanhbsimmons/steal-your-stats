'use client'

import React, { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Icon, ICONS } from './icons'

interface TopBarProps {
  eyebrow?: string
  title?: string
  search?: boolean
  children?: React.ReactNode
}

export function TopBar({ eyebrow, title, search = true, children }: TopBarProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

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

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = (e.target as HTMLInputElement).value.trim()
      if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
    }
    if (e.key === 'Escape') {
      inputRef.current?.blur()
    }
  }

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '20px 28px 18px',
      flexShrink: 0,
    }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {eyebrow && <span className="t-eyebrow">{eyebrow}</span>}
        {title && <h1 className="t-display t-h2">{title}</h1>}
      </div>

      {search && (
        <div className="glass" style={{
          padding: '8px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
          borderRadius: 'var(--r-full)',
          minWidth: 320,
        }}>
          <span style={{ color: 'var(--fg-3)', flexShrink: 0 }}>
            <Icon d={ICONS.search} size={15} stroke={1.8} />
          </span>
          <input
            ref={inputRef}
            placeholder="Songs, venues, dates, eras…"
            onKeyDown={handleSearchKeyDown}
            style={{
              flex: 1, background: 'transparent', border: 0, outline: 'none',
              color: 'var(--fg)', fontSize: 13,
            }}
          />
          <span className="kbd">⌘K</span>
        </div>
      )}

      {children}
    </header>
  )
}
