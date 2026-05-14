'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { VersionTrack } from '@/lib/songFacts'
import { formatDuration } from '@/lib/utils'
import { Button } from './button'

export interface VersionsTableProps {
  tracks: VersionTrack[]
  onPlayTrack?: (track: VersionTrack) => void
  longestTrack?: VersionTrack
  shortestTrack?: VersionTrack
  className?: string
}

type SortField = 'date' | 'duration' | 'venue'
type SortDirection = 'asc' | 'desc'

export function VersionsTable({ 
  tracks, 
  onPlayTrack, 
  longestTrack, 
  shortestTrack,
  className = '' 
}: VersionsTableProps) {
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1)

  // Sort tracks based on current sort settings
  const sortedTracks = React.useMemo(() => {
    const sorted = [...tracks].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'date':
          comparison = a.showDate.localeCompare(b.showDate)
          break
        case 'duration':
          const aDuration = a.durationSec || 0
          const bDuration = b.durationSec || 0
          comparison = aDuration - bDuration
          break
        case 'venue':
          const aVenue = `${a.venue}, ${a.city}`
          const bVenue = `${b.venue}, ${b.city}`
          comparison = aVenue.localeCompare(bVenue)
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [tracks, sortField, sortDirection])

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }, [sortField])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        setFocusedRowIndex(prev => Math.max(0, prev - 1))
        break
      case 'ArrowDown':
        e.preventDefault()
        setFocusedRowIndex(prev => Math.min(sortedTracks.length - 1, prev + 1))
        break
      case 'Enter':
        e.preventDefault()
        if (focusedRowIndex >= 0 && focusedRowIndex < sortedTracks.length && onPlayTrack) {
          onPlayTrack(sortedTracks[focusedRowIndex])
        }
        break
      case 's':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          // Cycle through sort fields: date -> duration -> venue -> date
          const fields: SortField[] = ['date', 'duration', 'venue']
          const currentIndex = fields.indexOf(sortField)
          const nextField = fields[(currentIndex + 1) % fields.length]
          handleSort(nextField)
        }
        break
    }
  }, [focusedRowIndex, sortedTracks, onPlayTrack, sortField, handleSort])

  // Reset focused row when tracks change
  useEffect(() => {
    setFocusedRowIndex(-1)
  }, [tracks])

  if (tracks.length === 0) {
    return (
      <div className={`text-center py-8 text-gray ${className}`}>
        <p>No versions found</p>
      </div>
    )
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕'
    return sortDirection === 'asc' ? '↑' : '↓'
  }


  const getExtremeBadge = (track: VersionTrack) => {
    if (track.id === longestTrack?.id) {
      return <span className="px-2 py-1 bg-ink text-paper text-xs rounded">Longest</span>
    }
    if (track.id === shortestTrack?.id) {
      return <span className="px-2 py-1 bg-gray text-ink text-xs rounded">Shortest</span>
    }
    return null
  }

  return (
    <div className={className}>
      <div 
        className="border-2 border-ink rounded-lg overflow-hidden"
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="table"
        aria-label="Song versions table"
      >
        <div className="bg-gray">
          <div className="grid grid-cols-12 gap-2 p-3 text-sm font-medium text-ink border-b-2 border-ink">
            <div 
              className="col-span-3 cursor-pointer hover:text-gray flex items-center gap-1"
              onClick={() => handleSort('date')}
              role="columnheader"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleSort('date')}
            >
              Date {getSortIcon('date')}
            </div>
            <div 
              className="col-span-5 cursor-pointer hover:text-gray flex items-center gap-1"
              onClick={() => handleSort('venue')}
              role="columnheader"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleSort('venue')}
            >
              Venue {getSortIcon('venue')}
            </div>
            <div 
              className="col-span-2 cursor-pointer hover:text-gray flex items-center gap-1"
              onClick={() => handleSort('duration')}
              role="columnheader"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleSort('duration')}
            >
              Duration {getSortIcon('duration')}
            </div>
            <div className="col-span-2 text-center">
              Actions
            </div>
          </div>
        </div>

        <div className="bg-paper">
          {sortedTracks.map((track, index) => (
            <div
              key={track.id}
              className={`grid grid-cols-12 gap-2 p-3 text-sm border-b border-gray last:border-b-0 hover:bg-gray/10 ${
                focusedRowIndex === index ? 'bg-ink/5 ring-2 ring-ink' : ''
              }`}
              role="row"
              tabIndex={focusedRowIndex === index ? 0 : -1}
              onClick={() => setFocusedRowIndex(index)}
            >
              <div className="col-span-3 flex items-center gap-2">
                <span className="text-ink font-medium">{track.showDate}</span>
                {getExtremeBadge(track)}
              </div>
              
              <div className="col-span-5 text-ink">
                <div className="font-medium">{track.venue}</div>
                <div className="text-gray text-xs">
                  {track.city}
                  {track.state && `, ${track.state}`}
                </div>
              </div>
              
              <div className="col-span-2 flex items-center">
                {track.durationSec ? (
                  <span className="font-mono text-ink">
                    {formatDuration(track.durationSec)}
                  </span>
                ) : (
                  <span className="text-gray">—</span>
                )}
              </div>
              
              <div className="col-span-2 flex justify-center">
                {onPlayTrack && track.url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onPlayTrack(track)
                    }}
                    className="text-xs"
                  >
                    Play
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 text-xs text-gray">
        <p>
          Use arrow keys to navigate, Enter to play, Ctrl/Cmd+S to cycle sort fields.
          Showing {tracks.length} version{tracks.length !== 1 ? 's' : ''}.
        </p>
      </div>
    </div>
  )
}
