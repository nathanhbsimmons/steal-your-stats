import Link from 'next/link'
import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'
import { EraShowsPager } from '@/components/eras/era-shows-pager'
import { ERA_DEFS } from '@/lib/eras'

export const revalidate = 86400

export default async function EraDetailPage({ params }: { params: Promise<{ 'era-id': string }> }) {
  const { 'era-id': eraId } = await params
  const era = ERA_DEFS.find(e => e.id === eraId)

  if (!era) {
    return (
      <section className="col">
        <div className="crumbs">
          <Link href="/">Home</Link>
          <span className="sep">/</span>
          <Link href="/eras">Eras</Link>
          <span className="sep">/</span>
          <span className="cur">Not found</span>
        </div>
        <div style={{ padding: '40px 0', fontFamily: 'var(--serif-body)', fontStyle: 'italic', color: 'var(--ink-3)' }}>
          Era not found. <Link href="/eras" style={{ color: 'var(--rust)' }}>Back to Eras</Link>
        </div>
      </section>
    )
  }

  const [showsResult, topSongs] = await Promise.all([
    realtimeSongFactsService.getShowsByYearRange(era.startYear, era.endYear, 1, 30).catch(() => ({ shows: [], total: 0 })),
    realtimeSongFactsService.getTopSongsByYearRange(era.startYear, era.endYear, 20).catch(() => []),
  ])
  const total = showsResult.total

  return (
    <section className="col">
      {/* Breadcrumbs */}
      <div className="crumbs">
        <Link href="/">Home</Link>
        <span className="sep">/</span>
        <Link href="/eras">Eras</Link>
        <span className="sep">/</span>
        <span className="cur">{era.name}</span>
      </div>

      {/* Page head */}
      <div className="page-head">
        <div>
          <div className="kicker">Eras · {era.tag}</div>
          <h2>{era.name} · <span style={{ color: 'var(--ink-3)', fontStyle: 'italic' }}>{era.years}</span></h2>
          <div className="lede" style={{ marginTop: 6 }}>{era.description}</div>
        </div>
        {total > 0 && (
          <div className="toolbar">
            <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--ink-3)' }}>{total} shows</span>
          </div>
        )}
      </div>

      <EraShowsPager era={era} initialShows={showsResult.shows} initialTotal={total} topSongs={topSongs} />
    </section>
  )
}
