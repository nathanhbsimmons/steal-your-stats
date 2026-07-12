import React from 'react'
import { getSongCatalog } from '@/lib/ids'
import { SongsFilterList } from '@/components/songs/songs-filter-list'

export default function SongsPage() {
  const allSongs = getSongCatalog()

  return (
    <section className="col">
      <SongsFilterList allSongs={allSongs} />
    </section>
  )
}
