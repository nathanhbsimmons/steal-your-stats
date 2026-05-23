'use client'

import React, { createContext, useContext } from 'react'
import { useAudioPlayer, UseAudioPlayerReturn } from '@/lib/hooks/use-audio-player'

const PlayerContext = createContext<UseAudioPlayerReturn | null>(null)

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const player = useAudioPlayer()
  return <PlayerContext.Provider value={player}>{children}</PlayerContext.Provider>
}

export function usePlayer(): UseAudioPlayerReturn {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}
