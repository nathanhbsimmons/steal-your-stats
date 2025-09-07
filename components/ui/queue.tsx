'use client'

import React from 'react'
import { Card } from './card'
import { Button } from './button'
import { Track } from './audio-player-dock'

export interface QueueProps {
  tracks: Track[]
  currentTrackId?: string
  onTrackSelect: (track: Track) => void
  onTrackRemove: (trackId: string) => void
  onClearQueue: () => void
  onClearAndPlayEntireShow?: () => void
  className?: string
}

export function Queue({
  tracks,
  currentTrackId,
  onTrackSelect,
  onTrackRemove,
  onClearQueue,
  onClearAndPlayEntireShow,
  className = ''
}: QueueProps) {
  if (tracks.length === 0) {
    return (
      <Card className={`p-4 ${className}`}>
        <div className="text-center text-gray">
          <p className="text-sm">Queue is empty</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-ink">Queue ({tracks.length})</h3>
        <div className="flex items-center space-x-2">
          {onClearAndPlayEntireShow && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAndPlayEntireShow}
              className="text-xs"
            >
              Clear & Play Entire Show
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onClearQueue}
            disabled={tracks.length === 0}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {tracks.map((track, index) => (
          <div
            key={track.id}
            className={`flex items-center justify-between p-2 rounded border-2 transition-colors ${
              track.id === currentTrackId
                ? 'border-ink bg-gray bg-opacity-20'
                : 'border-gray hover:border-ink hover:bg-gray hover:bg-opacity-10'
            }`}
          >
            <div className="flex-1 min-w-0">
              <button
                onClick={() => onTrackSelect(track)}
                className="text-left w-full focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 rounded"
                aria-label={`Play track ${index + 1}: ${track.name}`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray font-mono w-6">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate" title={track.name}>
                      {track.name}
                    </p>
                    <p className="text-xs text-gray truncate">
                      {track.showDate} • {track.venue}, {track.city}
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onTrackRemove(track.id)}
              className="ml-2 flex-shrink-0"
              aria-label={`Remove track ${index + 1}: ${track.name}`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        ))}
      </div>
    </Card>
  )
}
