'use client'

import Link from 'next/link'
import { ReleaseBadge } from '@/components/ui/release-badge'
import type { OfficialRelease } from '@/lib/official-releases'
import type { SearchSongResult, SearchVenueResult, SearchReleaseResult } from './types'
import type { ShowIndexEntry } from '@/lib/services/show-index'

function Skeleton({ n, height = 40 }: { n: number; height?: number }) {
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="skeleton-vault" style={{ height, marginBottom: 4 }} />
      ))}
    </>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: '20px 0', color: 'var(--ink-3)', fontStyle: 'italic' }}>{children}</div>
}

export function SongsSection({ songs, loading }: { songs: SearchSongResult[]; loading: boolean }) {
  return (
    <div className="result-col">
      <h4>Songs {songs.length > 0 ? `· ${songs.length}` : ''}</h4>
      {loading ? <Skeleton n={5} /> : songs.length === 0 ? <Empty>No songs found.</Empty> : (
        songs.map(s => (
          <Link key={s.title} href={`/song/${encodeURIComponent(s.displayTitle)}`} className="row" style={{ textDecoration: 'none' }}>
            <span className="t">{s.displayTitle}</span>
            {s.aliases.length > 0 && <span className="s">{s.aliases.slice(0, 1).join(', ')}</span>}
          </Link>
        ))
      )}
    </div>
  )
}

export function VenuesSection({ venues, loading }: { venues: SearchVenueResult[]; loading: boolean }) {
  return (
    <div className="result-col">
      <h4>Venues {venues.length > 0 ? `· ${venues.length}` : ''}</h4>
      {loading ? <Skeleton n={5} /> : venues.length === 0 ? <Empty>No venues found.</Empty> : (
        venues.map(v => (
          <Link
            key={`${v.name}-${v.city}`}
            href={`/search?q=${encodeURIComponent(v.name)}`}
            className="row"
            style={{ textDecoration: 'none' }}
          >
            <span className="t">{v.name}</span>
            <span className="s">{v.city}{v.state ? `, ${v.state}` : ''} · {v.showCount} shows · {v.firstYear}–{v.lastYear}</span>
          </Link>
        ))
      )}
    </div>
  )
}

export function ReleasesSection({ releases, loading }: { releases: SearchReleaseResult[]; loading: boolean }) {
  return (
    <div className="result-col">
      <h4>Releases {releases.length > 0 ? `· ${releases.length}` : ''}</h4>
      {loading ? <Skeleton n={5} /> : releases.length === 0 ? <Empty>No releases found.</Empty> : (
        releases.map(r => (
          <Link key={r.title} href={`/show/${r.date}`} className="row" style={{ textDecoration: 'none' }}>
            <span className="t">{r.title}</span>
            <span className="s">{r.series} · {r.date}</span>
          </Link>
        ))
      )}
    </div>
  )
}

export function ShowsSection({
  shows,
  total,
  loading,
  loadingMore,
  onLoadMore,
}: {
  shows: ShowIndexEntry[]
  total: number
  loading: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
}) {
  const hasMore = !loading && shows.length < total
  return (
    <div className="result-col" style={{ gridColumn: '1 / -1' }}>
      <h4>Shows {total > 0 ? `· ${total}` : ''}</h4>
      {loading ? <Skeleton n={8} /> : shows.length === 0 ? <Empty>No shows found.</Empty> : (
        <>
          {shows.map(s => {
            const releases: OfficialRelease[] = s.releases
            return (
              <Link key={s.id} href={`/show/${s.date}`} className="row" style={{ textDecoration: 'none' }}>
                <span className="t" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {s.hasAudio && <span title={s.recordingType} style={{ color: 'var(--forest)', fontSize: 12 }}>▶</span>}
                  {s.venue}
                  {releases.length > 0 && <ReleaseBadge releases={releases} size="xs" />}
                </span>
                <span className="s">{s.date} · {s.city}{s.state ? `, ${s.state}` : ''}</span>
              </Link>
            )
          })}
          {hasMore && (
            <div style={{ paddingTop: 14 }}>
              <button className="btn ghost" onClick={onLoadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading…' : `Load more (${total - shows.length} remaining)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
