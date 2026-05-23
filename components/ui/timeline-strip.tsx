'use client'

import React from 'react'
import { usePlayer } from '@/lib/contexts/player-context'

interface ShowSet {
  name: string
  encore: boolean
  songs: string[]
}

interface TimelineStripProps {
  sets: ShowSet[]
  showDate: string
  onPlayFrom?: (flatIdx: number) => void | Promise<void>
}

export function TimelineStrip({ sets, showDate, onPlayFrom }: TimelineStripProps) {
  const { currentTrack, queue, selectTrack } = usePlayer()

  const flatSongs: Array<{ song: string; setIdx: number }> = []
  sets.forEach((set, si) => {
    set.songs.forEach(song => flatSongs.push({ song, setIdx: si }))
  })

  const totalTracks = flatSongs.length
  if (totalTracks === 0) return null

  // Determine if this show's tracks are currently in the queue
  const isThisShowQueued = queue.length > 0 && queue[0]?.showDate === showDate
  const currentQueueIdx = isThisShowQueued && currentTrack
    ? queue.findIndex(t => t.id === currentTrack.id)
    : -1

  const handleSliceClick = (flatIdx: number) => {
    if (isThisShowQueued && queue[flatIdx]) {
      selectTrack(queue[flatIdx])
    } else if (onPlayFrom) {
      onPlayFrom(flatIdx)
    }
  }

  return (
    <>
      <div className="duration-axis">
        {sets.map((set, si) => {
          const pct = (set.songs.length / totalTracks * 100).toFixed(1)
          const label = set.encore ? 'Encore' : (set.name || `Set ${si + 1}`)
          return (
            <span
              key={si}
              className={`axis-seg set-${Math.min(si, 2)}`}
              style={{ flexBasis: `${pct}%` }}
            >
              {label} · {set.songs.length}
            </span>
          )
        })}
      </div>
      <div className="duration-timeline">
        {flatSongs.map((item, idx) => {
          const isCurrent = currentQueueIdx === idx
          const isQueued = isThisShowQueued && !isCurrent && idx < queue.length
          const setClass = `set-${Math.min(item.setIdx, 2)}`
          return (
            <div
              key={idx}
              className={`slice ${setClass}${isCurrent ? ' playing' : ''}${isQueued ? ' queued' : ''}`}
              title={item.song}
              onClick={() => handleSliceClick(idx)}
            >
              <span className="num">{String(idx + 1).padStart(2, '0')}</span>
              <span className="ttl">{item.song}</span>
            </div>
          )
        })}
      </div>
    </>
  )
}
