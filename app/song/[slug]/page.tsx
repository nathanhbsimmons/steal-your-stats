'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import useSWR from 'swr'
import { usePlayer } from '@/lib/contexts/player-context'
import { formatArchiveTrackName } from '@/lib/hooks/use-audio-player'
import { Track } from '@/components/ui/audio-player-dock'
import { FirstLastFacts, PositionFacts, VersionsFacts, VersionTrack } from '@/lib/songFacts'

async function fetchSongFacts(songTitle: string): Promise<FirstLastFacts> {
  const r = await fetch(`/api/song-facts?songTitle=${encodeURIComponent(songTitle)}`)
  if (!r.ok) throw new Error(`${r.status}`)
  return r.json()
}

async function fetchPositionFacts(songTitle: string): Promise<PositionFacts> {
  const r = await fetch(`/api/position-facts?songTitle=${encodeURIComponent(songTitle)}`)
  if (!r.ok) throw new Error(`${r.status}`)
  return r.json()
}

async function fetchVersions(songTitle: string): Promise<VersionsFacts> {
  const r = await fetch(`/api/versions?songTitle=${encodeURIComponent(songTitle)}`)
  if (!r.ok) throw new Error(`${r.status}`)
  return r.json()
}

async function resolveArchiveShow(showRef: { date: string; venue: string; city: string }) {
  const r = await fetch('/api/archive/resolve-show', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(showRef),
  })
  if (!r.ok) throw new Error(`${r.status}`)
  return r.json()
}

async function fetchSongTracks(itemId: string, songTitle: string) {
  const r = await fetch('/api/archive/song-tracks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId, songTitle }),
  })
  if (!r.ok) throw new Error(`${r.status}`)
  return r.json()
}

function formatDate(iso: string) { return iso.replace(/-/g, ' · ') }

function ordinal(n: number): string {
  const s = String(n)
  if (s.endsWith('11') || s.endsWith('12') || s.endsWith('13')) return s + 'th'
  if (s.endsWith('1')) return s + 'st'
  if (s.endsWith('2')) return s + 'nd'
  if (s.endsWith('3')) return s + 'rd'
  return s + 'th'
}

function formatDuration(sec?: number): string {
  if (!sec) return '—'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

type SortKey = 'duration-desc' | 'date' | 'date-desc' | 'venue'

export default function SongPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const songTitle = decodeURIComponent(params.slug as string)
  const venueFilter = searchParams.get('venue')

  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [starred, setStarred] = useState(false)
  const [shareLabel, setShareLabel] = useState<'Share' | 'Copied!'>('Share')
  const [playError, setPlayError] = useState<string | null>(null)
  const [playErrorDate, setPlayErrorDate] = useState<string | null>(null)
  const [firstShowLoading, setFirstShowLoading] = useState(false)
  const [lastShowLoading, setLastShowLoading] = useState(false)
  const [showAllOpener, setShowAllOpener] = useState(false)
  const [showAllCloser, setShowAllCloser] = useState(false)
  const [showAllSet1Closer, setShowAllSet1Closer] = useState(false)
  const [showAllSet2Opener, setShowAllSet2Opener] = useState(false)
  const [showAllEncore, setShowAllEncore] = useState(false)
  const [showAllVersions, setShowAllVersions] = useState(false)

  const FAVORITES_KEY = 'steal-your-stats-favorites'

  useEffect(() => {
    try {
      const favs: string[] = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
      setStarred(favs.includes(songTitle.toLowerCase()))
    } catch {}
  }, [songTitle])

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: songTitle, url }) } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      setShareLabel('Copied!')
      setTimeout(() => setShareLabel('Share'), 2000)
    }
  }

  const handleStar = () => {
    try {
      const favs: string[] = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]')
      const key = songTitle.toLowerCase()
      const next = starred ? favs.filter(f => f !== key) : [...favs, key]
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
      setStarred(!starred)
    } catch {}
  }

  const { currentTrack, isPlaying, addToQueue, prependToQueue, selectTrack } = usePlayer()

  const swrOpts = {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 24 * 60 * 60 * 1000,
    errorRetryCount: 3,
  }

  const { data, error, isLoading }               = useSWR(`song-facts-${songTitle}`,     () => fetchSongFacts(songTitle),     swrOpts)
  const { data: posData, isLoading: posLoading } = useSWR(`position-facts-${songTitle}`, () => fetchPositionFacts(songTitle), swrOpts)
  const { data: versData, isLoading: versLoading } = useSWR(`versions-${songTitle}`,     () => fetchVersions(songTitle),      swrOpts)
  const { data: timelineData } = useSWR(
    `song-timeline-${songTitle}`,
    () => fetch(`/api/song-timeline?songTitle=${encodeURIComponent(songTitle)}`).then(r => r.ok ? r.json() : null),
    swrOpts,
  )

  const handlePlayTrack = async (vt: VersionTrack) => {
    if (vt.url) {
      const track: Track = {
        id: `${vt.id}-${Date.now()}`,
        name: `${songTitle} (${vt.showDate})`,
        url: vt.url,
        duration: vt.durationSec,
        showDate: vt.showDate,
        venue: vt.venue,
        city: vt.city,
        archiveItemId: vt.archiveItemId || '',
      }
      prependToQueue([track])
      selectTrack(track)
    } else {
      await handlePlayShowVersions({ date: vt.showDate, venue: vt.venue, city: vt.city })
    }
  }

  const handlePlayLongest = () => {
    if (!versData?.tracks?.length) return
    const sorted = [...versData.tracks].sort((a, b) => (b.durationSec || 0) - (a.durationSec || 0))
    handlePlayTrack(sorted[0])
  }

  const handlePlayShowVersions = async (showRef: { date: string; venue: string; city: string }) => {
    setPlayError(null)
    setPlayErrorDate(null)
    try {
      const archiveShow = await resolveArchiveShow(showRef)
      if (!archiveShow) {
        setPlayError(`No Archive.org recording found for this show.`)
        setPlayErrorDate(showRef.date)
        return
      }
      const { tracks } = await fetchSongTracks(archiveShow.identifier, songTitle)
      const formatted: Track[] = tracks.map((t: { id: string; name: string; url: string; showDate: string; venue: string; city: string; archiveItemId: string }) => ({
        ...t,
        name: `${songTitle} (${showRef.date})`,
        showDate: showRef.date,
        venue: showRef.venue,
        city: showRef.city,
        licenseUrl: archiveShow.licenseurl,
        rights: archiveShow.rights,
      }))
      if (formatted.length === 0) {
        setPlayError(`Show found but no playable tracks for "${songTitle}" on ${showRef.date}.`)
        setPlayErrorDate(showRef.date)
        return
      }
      prependToQueue(formatted)
      selectTrack(formatted[0])
    } catch (err) {
      if (err instanceof Error && err.message === '404') {
        setPlayError('No Archive.org recording found for this show.')
        setPlayErrorDate(showRef.date)
      } else {
        setPlayError('Could not reach Archive.org — check your connection and try again.')
      }
    }
  }

  // Map each show date to its 1-based performance number across all setlist.fm appearances
  const performanceNumberByDate = new Map<string, number>(
    (timelineData?.performances ?? []).map((p: { date: string }, i: number) => [p.date, i + 1])
  )

  const sortedTracks = versData?.tracks ? [...versData.tracks]
    .filter(t => !venueFilter || t.venue.toLowerCase() === venueFilter.toLowerCase())
    .sort((a, b) => {
      if (sortKey === 'duration-desc') return (b.durationSec || 0) - (a.durationSec || 0)
      if (sortKey === 'date') return a.showDate.localeCompare(b.showDate)
      if (sortKey === 'date-desc') return b.showDate.localeCompare(a.showDate)
      return a.venue.localeCompare(b.venue) || a.showDate.localeCompare(b.showDate)
    }) : []

  const VERSIONS_PREVIEW = 8
  const displayTracks = (venueFilter || showAllVersions) ? sortedTracks : sortedTracks.slice(0, VERSIONS_PREVIEW)

  const POS_PREVIEW = 5
  const hasPosData = posData != null && [posData.opener, posData.closer, posData.set1Closer, posData.set2Opener, posData.encore].some(d => (d?.shows?.length ?? 0) > 0)

  return (
    <section className="col">
      {/* Breadcrumbs */}
      <div className="crumbs">
        <Link href="/">Home</Link>
        <span className="sep">/</span>
        <Link href="/songs">Songs</Link>
        <span className="sep">/</span>
        <span className="cur">{songTitle}</span>
        <span style={{ flex: 1 }} />
        <button
          onClick={handleShare}
          style={{
            background: 'none', border: 0, cursor: 'pointer',
            fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: shareLabel === 'Copied!' ? 'var(--forest)' : 'var(--ink-3)',
          }}
        >
          {shareLabel}
        </button>
        <button
          onClick={handleStar}
          style={{
            background: 'none', border: 0, cursor: 'pointer',
            fontFamily: 'var(--mono)', fontSize: 14,
            color: starred ? 'var(--rust)' : 'var(--ink-3)',
          }}
          title={starred ? 'Remove from favorites' : 'Add to favorites'}
        >
          {starred ? '★' : '☆'}
        </button>
      </div>

      {/* Song hero */}
      <div className="song-hero">
        <div>
          <div className="kicker">Song · jam vehicle</div>
          <h2>{songTitle}</h2>
          {data?.aliases && data.aliases.length > 0 && (
            <div className="aliases">
              Also known as: {data.aliases.slice(0, 3).join(', ')}
            </div>
          )}
        </div>
        <div className="actions">
          <button
            className="btn"
            disabled={firstShowLoading || isLoading}
            onClick={async () => {
              if (!data?.first) return
              setFirstShowLoading(true)
              try { await handlePlayShowVersions(data.first) } finally { setFirstShowLoading(false) }
            }}
          >
            {firstShowLoading ? '⟵ Loading…' : '⟵ First show'}
          </button>
          <button
            className="btn"
            disabled={lastShowLoading || isLoading}
            onClick={async () => {
              if (!data?.last) return
              setLastShowLoading(true)
              try { await handlePlayShowVersions(data.last) } finally { setLastShowLoading(false) }
            }}
          >
            {lastShowLoading ? 'Loading… ⟶' : 'Last show ⟶'}
          </button>
          <button className="btn primary" onClick={handlePlayLongest}>
            <span className="play-tri">▶</span> Play longest version
          </button>
          {playError && (
            <span style={{ fontFamily: 'var(--serif-body)', fontStyle: 'italic', fontSize: 13, color: 'var(--bad, #a83919)', lineHeight: 1.3 }}>
              {playError}
              {playErrorDate && (
                <Link
                  href={`/show/${playErrorDate}`}
                  style={{ marginLeft: 8, color: 'var(--rust)', fontStyle: 'normal', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.06em' }}
                >
                  View setlist →
                </Link>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Performance facts grid */}
      {isLoading ? (
        <div className="skeleton-vault" style={{ height: 120 }} />
      ) : error ? (
        <div style={{ padding: '20px 0', fontFamily: 'var(--serif-body)', fontStyle: 'italic', color: 'var(--ink-3)' }}>
          Failed to load performance facts.
        </div>
      ) : data ? (
        <div className="facts-grid">
          <div className="fcell">
            <div className="label">First Performance</div>
            <div className="date">{data.first ? formatDate(data.first.date) : '—'}</div>
            <div className="where">
              {data.first?.venue}
              {data.first?.city ? ` · ${data.first.city}` : ''}
            </div>
            {data.first?.date && (
              <Link href={`/show/${data.first.date}`}
                style={{ display: 'inline-block', marginTop: 8, fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--rust)', textDecoration: 'none' }}>
                Go to show →
              </Link>
            )}
          </div>
          <div className="fcell">
            <div className="label">Last Performance</div>
            <div className="date">{data.last ? formatDate(data.last.date) : '—'}</div>
            <div className="where">
              {data.last?.venue}
              {data.last?.city ? ` · ${data.last.city}` : ''}
            </div>
            {data.last?.date && (
              <Link href={`/show/${data.last.date}`}
                style={{ display: 'inline-block', marginTop: 8, fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--rust)', textDecoration: 'none' }}>
                Go to show →
              </Link>
            )}
          </div>
          <div className="fcell">
            <div className="label">Total Performances</div>
            <div className="big">{data.totalPerformances}</div>
            <div className="sub">
              across {data.last && data.first
                ? new Date(data.last.date).getFullYear() - new Date(data.first.date).getFullYear()
                : 0} years
            </div>
          </div>
        </div>
      ) : null}

      {/* Two-column layout: Versions (left 2/3) + Position facts (right 1/3) — collapse to 1 col when no position data */}
      <div style={{ display: 'grid', gridTemplateColumns: hasPosData ? '2fr 1fr' : '1fr', gap: '0 40px', alignItems: 'start', marginTop: 8 }}>

        {/* LEFT: Versions table */}
        <div>
          {versLoading ? (
            <div style={{ marginTop: 22 }}>
              <div className="skeleton-vault" style={{ height: 36, marginBottom: 4 }} />
              <div className="skeleton-vault" style={{ height: 200 }} />
            </div>
          ) : versData?.tracks?.length ? (
            <>
              <div className="section-head">
                <h3>Versions</h3>
                <div className="descr">— Archive.org recordings</div>
                <span className="meta">{sortedTracks.length} tracked</span>
              </div>

              {venueFilter && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  background: 'var(--paper-3)', border: '1.5px solid var(--ink)',
                  padding: '6px 12px', marginBottom: 14,
                  fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>
                  <span style={{ color: 'var(--ink-3)' }}>Venue</span>
                  <span style={{ color: 'var(--ink)' }}>{venueFilter}</span>
                  <Link
                    href={`/song/${encodeURIComponent(songTitle)}`}
                    style={{ color: 'var(--rust)', textDecoration: 'none', marginLeft: 4 }}
                    title="Clear venue filter"
                  >×</Link>
                </div>
              )}

              {/* Sort filters */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Sort</span>
                {([
                  { key: 'date' as const,          label: sortKey === 'date' ? 'Date ↑' : sortKey === 'date-desc' ? 'Date ↓' : 'Date ↑' },
                  { key: 'venue' as const,         label: 'Venue' },
                  { key: 'duration-desc' as const, label: 'Duration ↓' },
                ] as const).map(({ key, label }) => {
                  const isDateBtn = key === 'date'
                  const isActive = isDateBtn ? (sortKey === 'date' || sortKey === 'date-desc') : sortKey === key
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        if (isDateBtn) {
                          setSortKey(sortKey === 'date' ? 'date-desc' : 'date')
                        } else {
                          setSortKey(key)
                        }
                      }}
                      style={{
                        background: isActive ? 'var(--ink)' : 'var(--paper)',
                        border: '1px solid var(--ink)',
                        color: isActive ? 'var(--paper)' : 'var(--ink)',
                        fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.08em',
                        padding: '4px 10px', cursor: 'pointer',
                      }}
                    >{label}</button>
                  )
                })}
                <span style={{ flex: 1 }} />
                {!venueFilter && sortedTracks.length > VERSIONS_PREVIEW && (
                  <button
                    onClick={() => setShowAllVersions(v => !v)}
                    style={{
                      background: 'none', border: 0, cursor: 'pointer',
                      fontFamily: 'var(--mono)', fontSize: 10.5, letterSpacing: '0.1em',
                      textTransform: 'uppercase', color: 'var(--rust)', marginRight: 10,
                    }}
                  >
                    {showAllVersions ? 'Show fewer ↑' : `Show all ${sortedTracks.length} ↓`}
                  </button>
                )}
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)' }}>
                  Showing {displayTracks.length}{!venueFilter && !showAllVersions && sortedTracks.length > VERSIONS_PREVIEW ? ` of ${sortedTracks.length}` : ''}
                </span>
              </div>

              {/* Versions table — no # column, always show Nth */}
              <table className="tbl">
                <thead>
                  <tr>
                    {performanceNumberByDate.size > 0 && <th style={{ color: 'var(--rust)' }}>Nth</th>}
                    <th>Date</th>
                    <th>Venue</th>
                    <th>City</th>
                    <th className="r">Duration</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {displayTracks.map((t, i) => {
                    const isLongest = versData.extremes?.longest?.archiveItemId === t.archiveItemId
                    const isCurrentlyPlaying = currentTrack?.id?.includes(t.id || '')
                    const nthPerformance = performanceNumberByDate.get(t.showDate)
                    return (
                      <tr
                        key={i}
                        className={isLongest ? 'hi' : ''}
                        style={{ cursor: 'pointer' }}
                        onClick={() => router.push(`/show/${t.showDate}`)}
                      >
                        {performanceNumberByDate.size > 0 && (
                          <td style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--rust)', whiteSpace: 'nowrap' }}>
                            {nthPerformance ? ordinal(nthPerformance) : '—'}
                          </td>
                        )}
                        <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{formatDate(t.showDate)}</td>
                        <td><span className="tbl-title">{t.venue}</span></td>
                        <td style={{ fontFamily: 'var(--serif-body)', fontSize: 13, color: 'var(--ink-3)' }}>{t.city}</td>
                        <td className="r" style={{ color: isLongest ? 'var(--rust)' : undefined }}>
                          {formatDuration(t.durationSec)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className={`tbl-play${isCurrentlyPlaying && isPlaying ? ' playing' : ''}`}
                            onClick={e => { e.stopPropagation(); handlePlayTrack(t) }}
                          >
                            {isCurrentlyPlaying && isPlaying ? '❚❚' : '▶'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </>
          ) : null}

          {/* Attribution */}
          <div className="margin-note" style={{ marginTop: 22 }}>
            <span className="head">Provenance</span>
            Performance data from <a href="https://www.setlist.fm" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rust)' }}>setlist.fm</a>.
            Audio recordings via <a href="https://archive.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rust)' }}>Archive.org</a> — community-contributed tapes.
          </div>
        </div>

        {/* RIGHT: Position facts sidebar — only rendered when there is at least one position entry */}
        {hasPosData && <div style={{ borderLeft: '1px solid var(--rule)', paddingLeft: 28 }}>
          {posLoading ? (
            <div style={{ marginTop: 8 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton-vault" style={{ height: 44, marginBottom: 4 }} />
              ))}
            </div>
          ) : posData ? (
            <>
              {[
                { key: 'opener' as const,     title: 'Opened show',   data: posData.opener,     open: showAllOpener,     toggle: () => setShowAllOpener(v => !v) },
                { key: 'closer' as const,     title: 'Closed show',   data: posData.closer,     open: showAllCloser,     toggle: () => setShowAllCloser(v => !v) },
                { key: 'set1Closer' as const, title: 'Closed Set I',  data: posData.set1Closer, open: showAllSet1Closer, toggle: () => setShowAllSet1Closer(v => !v) },
                { key: 'set2Opener' as const, title: 'Opened Set II', data: posData.set2Opener, open: showAllSet2Opener, toggle: () => setShowAllSet2Opener(v => !v) },
                { key: 'encore' as const,     title: 'Encore',        data: posData.encore,     open: showAllEncore,     toggle: () => setShowAllEncore(v => !v) },
              ].map(({ key, title, data, open, toggle }) => {
                const allShows = data?.shows ?? []
                const shows = venueFilter
                  ? allShows.filter(s => s.venue.toLowerCase() === venueFilter.toLowerCase())
                  : allShows
                const count = shows.length
                if (!count) return null
                const displayShows = open ? shows : shows.slice(0, POS_PREVIEW)
                return (
                  <div key={key} style={{ marginBottom: 22 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8, paddingBottom: 4, borderBottom: '1.5px solid var(--ink)' }}>
                      <span style={{ fontFamily: 'var(--serif-display)', fontSize: 16, fontWeight: 700 }}>{title}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>
                        {count}×
                      </span>
                      {count > POS_PREVIEW && (
                        <button
                          onClick={toggle}
                          style={{
                            marginLeft: 'auto', background: 'none', border: 0, cursor: 'pointer',
                            fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '0.1em',
                            textTransform: 'uppercase', color: 'var(--rust)', display: 'flex',
                            alignItems: 'center', gap: 4,
                          }}
                        >
                          {open ? 'Collapse all ↑' : 'Show all ↓'}
                        </button>
                      )}
                    </div>
                    {displayShows.map((s, i) => (
                      <Link
                        key={i}
                        href={`/show/${s.date}`}
                        style={{
                          display: 'block', padding: '5px 0',
                          borderBottom: '1px dotted var(--rule-soft)',
                          textDecoration: 'none',
                        }}
                      >
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.04em', display: 'block' }}>{formatDate(s.date)}</span>
                        <span style={{ fontFamily: 'var(--serif-body)', fontSize: 13, color: 'var(--ink)', lineHeight: 1.3 }}>
                          {s.venue}{s.city ? ` · ${s.city}` : ''}
                        </span>
                      </Link>
                    ))}
                  </div>
                )
              })}
            </>
          ) : null}
        </div>}

      </div>
    </section>
  )
}
