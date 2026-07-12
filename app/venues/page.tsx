import React from 'react'
import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'
import { VenuesTable, type VenueStat } from '@/components/venues/venues-table'

export const revalidate = 86400

export default async function VenuesPage() {
  const venues = await realtimeSongFactsService.getVenueStats().catch(() => [] as VenueStat[])

  return (
    <section className="col">
      <VenuesTable initialVenues={venues} initialTotal={venues.length} />
    </section>
  )
}
