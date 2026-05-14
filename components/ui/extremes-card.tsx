'use client'

import React, { useState } from 'react'
import { Card } from './card'
import { Button } from './button'
import { VersionTrack } from '@/lib/songFacts'
import { formatDuration } from '@/lib/utils'

export interface ExtremesCardProps {
  tracks: VersionTrack[]
  onPlayTrack?: (track: VersionTrack) => void
  className?: string
}

export function ExtremesCard({ tracks, onPlayTrack, className = '' }: ExtremesCardProps) {
  const [includeOutliers, setIncludeOutliers] = useState(false)
  
  // Compute extremes based on current outlier setting
  const tracksWithDuration = tracks.filter(track => track.durationSec !== undefined)
  
  if (tracksWithDuration.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <h3 className="text-lg font-serif font-bold text-ink mb-4">
          Duration Extremes
        </h3>
        <div className="text-center py-4 text-gray">
          <p>No duration data available</p>
        </div>
      </Card>
    )
  }

  // Calculate extremes
  let filteredTracks = tracksWithDuration
  
  if (!includeOutliers && tracksWithDuration.length > 2) {
    // Calculate mean and standard deviation
    const durations = tracksWithDuration.map(track => track.durationSec!)
    const mean = durations.reduce((sum, d) => sum + d, 0) / durations.length
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length
    const stdDev = Math.sqrt(variance)
    
    // Filter out outliers beyond 2 standard deviations
    filteredTracks = tracksWithDuration.filter(track => {
      const duration = track.durationSec!
      return Math.abs(duration - mean) <= 2 * stdDev
    })
  }
  
  const sortedByDuration = [...filteredTracks].sort((a, b) => (a.durationSec || 0) - (b.durationSec || 0))
  const shortest = sortedByDuration[0]
  const longest = sortedByDuration[sortedByDuration.length - 1]

  const handlePlayShortest = () => {
    if (onPlayTrack && shortest) {
      onPlayTrack(shortest)
    }
  }

  const handlePlayLongest = () => {
    if (onPlayTrack && longest) {
      onPlayTrack(longest)
    }
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-serif font-bold text-ink">
          Duration Extremes
        </h3>
        
        {tracksWithDuration.length > 2 && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeOutliers}
              onChange={(e) => setIncludeOutliers(e.target.checked)}
              className="rounded border-2 border-ink"
            />
            <span className="text-ink">Include outliers</span>
          </label>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Shortest */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray">Shortest:</span>
            <span className="px-2 py-1 bg-gray text-ink text-xs font-mono rounded">
              {shortest ? formatDuration(shortest.durationSec!) : '—'}
            </span>
          </div>
          
          {shortest && (
            <div className="text-sm text-ink">
              <div className="font-medium">{shortest.showDate}</div>
              <div className="text-gray">
                {shortest.venue}, {shortest.city}
                {shortest.state && `, ${shortest.state}`}
              </div>
              
              {onPlayTrack && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePlayShortest}
                  className="mt-2 text-xs"
                >
                  Play
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Longest */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray">Longest:</span>
            <span className="px-2 py-1 bg-gray text-ink text-xs font-mono rounded">
              {longest ? formatDuration(longest.durationSec!) : '—'}
            </span>
          </div>
          
          {longest && (
            <div className="text-sm text-ink">
              <div className="font-medium">{longest.showDate}</div>
              <div className="text-gray">
                {longest.venue}, {longest.city}
                {longest.state && `, ${longest.state}`}
              </div>
              
              {onPlayTrack && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePlayLongest}
                  className="mt-2 text-xs"
                >
                  Play
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t-2 border-gray">
        <p className="text-xs text-gray">
          Showing {filteredTracks.length} of {tracksWithDuration.length} tracks with duration data
          {!includeOutliers && tracksWithDuration.length > filteredTracks.length && (
            <span className="ml-1">
              (excluding {tracksWithDuration.length - filteredTracks.length} outliers)
            </span>
          )}
        </p>
      </div>
    </Card>
  )
}
