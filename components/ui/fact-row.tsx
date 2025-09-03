import React from 'react'
import { cn } from '@/lib/utils'
import { ShowRef } from '@/lib/songFacts'

export interface FactRowProps {
  label: string
  show: ShowRef | null
  className?: string
}

export function FactRow({ label, show, className }: FactRowProps) {
  if (!show) {
    return (
      <div className={cn('flex items-center justify-between py-3 border-b-2 border-gray', className)}>
        <span className="text-ink font-medium">{label}</span>
        <span className="text-gray italic">No data available</span>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    try {
      // Parse as local date to avoid timezone issues
      const [year, month, day] = dateString.split('-').map(Number)
      const date = new Date(year, month - 1, day)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const formatLocation = (show: ShowRef) => {
    const parts = [show.venue, show.city]
    if (show.state) parts.push(show.state)
    parts.push(show.country)
    return parts.join(', ')
  }

  return (
    <div className={cn('flex items-center justify-between py-3 border-b-2 border-gray', className)}>
      <span className="text-ink font-medium">{label}</span>
      <div className="text-right">
        <div className="text-ink font-medium">
          {formatDate(show.date)}
        </div>
        <div className="text-sm text-gray">
          {formatLocation(show)}
        </div>
        <a
          href={show.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-ink hover:text-gray transition-colors mt-1"
        >
          <span>View on {show.source}</span>
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </div>
  )
}
