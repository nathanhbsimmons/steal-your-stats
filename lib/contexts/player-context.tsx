'use client'

import React, { createContext, useContext, useMemo } from 'react'
import { useAudioPlayer, UseAudioPlayerReturn } from '@/lib/hooks/use-audio-player'

const PlayerContext = createContext<UseAudioPlayerReturn | null>(null)

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const {
    currentTrack, isPlaying, queue, play, pause, next, previous, selectTrack,
    addToQueue, prependToQueue, removeFromQueue, clearQueue, playEntireShow,
    enqueueEntireShow, enqueueShowTrack, playShowTrack, enqueueSongVersions,
  } = useAudioPlayer()

  const value = useMemo<UseAudioPlayerReturn>(() => ({
    currentTrack, isPlaying, queue, play, pause, next, previous, selectTrack,
    addToQueue, prependToQueue, removeFromQueue, clearQueue, playEntireShow,
    enqueueEntireShow, enqueueShowTrack, playShowTrack, enqueueSongVersions,
  }), [currentTrack, isPlaying, queue, play, pause, next, previous, selectTrack,
       addToQueue, prependToQueue, removeFromQueue, clearQueue, playEntireShow,
       enqueueEntireShow, enqueueShowTrack, playShowTrack, enqueueSongVersions])

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

export function usePlayer(): UseAudioPlayerReturn {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}
