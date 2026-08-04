'use client'

import { useEffect, useRef, useState } from 'react'
import { buildCategories, type CategorySetters } from './categories'
import type { RailFilters } from './use-search-state'
import type { FacetOption } from './types'
import type { ParsedToken } from '@/lib/search/query-parser'

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function FilterSheet({
  open,
  onClose,
  filters,
  facets,
  resultCount,
  clearAll,
  toggleBoolean,
  setRecordingType,
  toggleArrayField,
  setSingle,
  setFields,
  clearField,
  setYearRange,
  tokens,
}: CategorySetters & {
  open: boolean
  onClose: () => void
  filters: RailFilters
  facets: Record<string, FacetOption[]>
  resultCount: number
  clearAll: () => void
  tokens?: ParsedToken[]
}) {
  const categories = buildCategories(filters, facets, { toggleBoolean, setRecordingType, toggleArrayField, setSingle, setFields, clearField, setYearRange }, tokens)
  const [openGroup, setOpenGroup] = useState<string | null>('release')
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    sheetRef.current?.focus()

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab' || !sheetRef.current) return
      const focusable = sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div className="mfx-scrim" onClick={onClose} />
      <div className="mfx-sheet" role="dialog" aria-modal="true" aria-label="Filters" ref={sheetRef} tabIndex={-1}>
        <div className="grab" />
        <div className="sh">
          <div className="t">Filters</div>
          <button type="button" onClick={onClose}>close ×</button>
        </div>
        <div className="mfx-body">
          {categories.map(cat => {
            const isOpen = openGroup === cat.id
            return (
              <div className="mfx-group" key={cat.id} style={{ '--cc': `var(${cat.ccVar})` } as React.CSSProperties}>
                <button
                  type="button"
                  className="gh"
                  aria-expanded={isOpen}
                  onClick={() => setOpenGroup(isOpen ? null : cat.id)}
                >
                  <span className="sw" />{cat.name}
                  {cat.selectedCount > 0 && <span className="n">{cat.selectedCount}</span>}
                  <span className="car">{isOpen ? '▲' : '▼'}</span>
                </button>
                {isOpen && (
                  <div className="gb">
                    {cat.groups.map(g => (
                      <div key={g.key}>
                        <div className="fx-sub">{g.sub}</div>
                        <div className="mfx-pills">
                          {g.options.map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              className={'mfx-pill' + (opt.checked ? ' on' : '')}
                              onClick={opt.onToggle}
                              aria-pressed={opt.checked}
                            >
                              {opt.label} <span className="ct">{opt.count}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div className="mfx-foot">
          <button type="button" className="reset" onClick={clearAll}>reset</button>
          <button type="button" className="apply" onClick={onClose}>Show {resultCount} shows</button>
        </div>
      </div>
    </>
  )
}
