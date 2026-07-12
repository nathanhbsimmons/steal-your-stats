import React from 'react'
import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'
import { ErasBoard } from '@/components/eras/eras-board'

interface YearCount { year: number; count: number }

export const revalidate = 86400

export default async function ErasPage() {
  const stats = await realtimeSongFactsService.getGlobalStats().catch(() => ({ showsPerYear: [] as YearCount[], leaderboard: [] }))

  return (
    <section className="col">
      <div className="page-head">
        <div>
          <div className="kicker">Eras · VII</div>
          <h2>The band&apos;s <span className="italic">five lives.</span></h2>
          <div className="lede">From the Acid Tests to Soldier Field — three decades, in five chapters.</div>
        </div>
        <div className="toolbar">
          <span>2,328 shows · 1965–1995</span>
        </div>
      </div>

      <ErasBoard showsPerYear={stats.showsPerYear} />
    </section>
  )
}
