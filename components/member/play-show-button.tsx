'use client'

import React from 'react'
import { usePlayer } from '@/lib/contexts/player-context'

export function PlayShowButton({
  show,
  label,
  className,
  title,
}: {
  show: { date: string; venue: string; city: string }
  label: React.ReactNode
  className?: string
  title?: string
}) {
  const { enqueueEntireShow } = usePlayer()

  const handlePlayShow = async () => {
    try {
      await enqueueEntireShow({ date: show.date, venue: show.venue, city: show.city }, { clearExisting: true })
    } catch {}
  }

  return (
    <button className={className} title={title} onClick={handlePlayShow}>
      {label}
    </button>
  )
}
