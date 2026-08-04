'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { ParsedToken } from '@/lib/search/query-parser'
import type { RailFilters } from './use-search-state'
import type { FacetOption } from './types'
import { buildCategories, type Category, type CategoryGroup, type CategorySetters } from './categories'

function OptRow({ cat, group, opt }: { cat: Category; group: CategoryGroup; opt: Category['groups'][number]['options'][number] }) {
  const inputId = `fx-opt-${cat.id}-${group.key}-${opt.value}`
  return (
    <div className="fx-opt">
      <input
        id={inputId}
        className="box"
        type={group.kind}
        name={group.kind === 'radio' ? `fx-${cat.id}-${group.key}` : undefined}
        checked={opt.checked}
        onChange={opt.onToggle}
      />
      <label htmlFor={inputId} className="lb">{opt.label}</label>
      <span className="ct">{opt.count}</span>
    </div>
  )
}

function Popover({ cat, onClose, id }: { cat: Category; onClose: () => void; id: string }) {
  const [q, setQ] = useState('')
  return (
    <div
      id={id}
      role="group"
      aria-label={cat.name}
      className={'fx-pop' + (cat.wide ? ' wide' : '')}
      style={{ '--cc': `var(${cat.ccVar})` } as React.CSSProperties}
      onClick={e => e.stopPropagation()}
    >
      <div className="ph">
        <div className="t"><span className="cd" />{cat.name}</div>
        <button type="button" onClick={() => { cat.onReset(); onClose() }}>reset</button>
      </div>
      {cat.groups.map(g => {
        const opts = g.find && q ? g.options.filter(o => o.label.toLowerCase().includes(q.toLowerCase())) : g.options
        return (
          <div key={g.key}>
            <div className="fx-sub">{g.sub}</div>
            {g.find && (
              <div className="fx-search find">
                <span className="gl">⌕</span>
                <input value={q} onChange={e => setQ(e.target.value)} placeholder={`filter ${g.sub}…`} />
              </div>
            )}
            <div className={'fx-opts' + (g.find ? ' scroll' : '')} style={{ '--cols': cat.cols } as React.CSSProperties}>
              {opts.map(o => <OptRow key={o.value} cat={cat} group={g} opt={o} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function FilterRail({
  filters,
  facets,
  toggleBoolean,
  setRecordingType,
  toggleArrayField,
  setSingle,
  setFields,
  clearField,
  setYearRange,
  resultCount,
  tokens,
}: CategorySetters & {
  filters: RailFilters
  facets: Record<string, FacetOption[]>
  resultCount?: number
  tokens?: ParsedToken[]
}) {
  const categories = buildCategories(filters, facets, { toggleBoolean, setRecordingType, toggleArrayField, setSingle, setFields, clearField, setYearRange }, tokens)
  const [open, setOpen] = useState<string | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const closeAndFocus = useCallback((id: string) => {
    setOpen(null)
    triggerRefs.current[id]?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAndFocus(open)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, closeAndFocus])

  return (
    <div className="fx-line" ref={wrapRef}>
      {categories.map(cat => {
        const isOpen = open === cat.id
        const popId = `fx-pop-${cat.id}`
        return (
          <div
            key={cat.id}
            className={'fx-cat' + (cat.selectedCount ? ' has' : '') + (isOpen ? ' open' : '')}
            style={{ '--cc': `var(${cat.ccVar})` } as React.CSSProperties}
          >
            <button
              type="button"
              ref={el => { triggerRefs.current[cat.id] = el }}
              aria-expanded={isOpen}
              aria-controls={popId}
              onClick={() => setOpen(isOpen ? null : cat.id)}
            >
              <span className="sw" />{cat.name}
              <span className="cv">{cat.selectedCount}</span>
              <span className="car">▾</span>
            </button>
            {isOpen && <Popover cat={cat} onClose={() => closeAndFocus(cat.id)} id={popId} />}
          </div>
        )
      })}
      {resultCount !== undefined && (
        <div className="fx-tail">
          <span className="fx-count" aria-live="polite">shows · <b>{resultCount}</b></span>
        </div>
      )}
    </div>
  )
}
