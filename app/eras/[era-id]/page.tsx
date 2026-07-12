import Link from 'next/link'
import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'
import { EraShowsPager } from '@/components/eras/era-shows-pager'

const ERA_DEFS = [
  {
    id: 'primal',
    name: 'Primal Dead',
    years: '1965 – 1971',
    startYear: 1965,
    endYear: 1971,
    tag: 'Pigpen era',
    description: 'The raw, exploratory years anchored by Pigpen\'s blues-drenched vocals. Long psychedelic jams, R&B roots, and the first hints of the Dead\'s unique improvisational language.',
    sigSongs: ['Viola Lee Blues', 'Lovelight', 'Dark Star', 'St. Stephen'],
  },
  {
    id: 'europe72',
    name: "Europe '72",
    years: '1972 – 1974',
    startYear: 1972,
    endYear: 1974,
    tag: 'wall-of-sound',
    description: 'Peak improvisational power and the Wall of Sound PA system. New songwriting from Garcia/Hunter and Weir/Barlow, legendary European tours, and some of the longest Dark Stars ever played.',
    sigSongs: ['Dark Star', 'Playing in the Band', 'Eyes of the World', 'He\'s Gone'],
  },
  {
    id: 'hiatus',
    name: 'Hiatus & Return',
    years: '1975 – 1979',
    startYear: 1975,
    endYear: 1979,
    tag: 'studio era',
    description: 'A year-long hiatus in 1975 followed by a triumphant return. Keith and Donna Godchaux, Terrapin Station, and a more polished sound balanced against continued exploration.',
    sigSongs: ['Estimated Prophet', 'Terrapin Station', 'Fire on the Mountain', 'Shakedown Street'],
  },
  {
    id: 'brent',
    name: 'Brent Years',
    years: '1980 – 1990',
    startYear: 1980,
    endYear: 1990,
    tag: 'arena Dead',
    description: 'Brent Mydland\'s keyboards defined the sound of a decade. The Dead went arena-scale, expanded their catalog, and became one of the top-grossing touring acts in America.',
    sigSongs: ['Throwing Stones', 'Hell in a Bucket', 'Victim or the Crime', 'Dear Mr. Fantasy'],
  },
  {
    id: 'final',
    name: 'Final Tours',
    years: '1991 – 1995',
    startYear: 1991,
    endYear: 1995,
    tag: 'Vince & Bruce',
    description: 'Vince Welnick and Bruce Hornsby brought new colors. Late-career gems like Lazy River Road and Days Between sat alongside enduring classics, right up to the final show at Soldier Field.',
    sigSongs: ['Lazy River Road', 'Days Between', 'So Many Roads', 'Eternity'],
  },
]

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
