'use client'

import React, { useCallback, useMemo, useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { usePlayer } from '@/lib/contexts/player-context'
import { TimelineStrip } from '@/components/ui/timeline-strip'
import { getVenueTidbit } from '@/lib/venue-tidbits'
import { formatDuration } from '@/lib/utils'
import { getDateParts } from '@/lib/date-parts'
import { formatBonusTrackTitle, deriveBonusSectionLabel } from '@/lib/archive-track-match'
import { fetcher, swrOpts } from '@/lib/swr-fetcher'
import type { ArchiveSetlistMatch, ArchiveTrackPayload } from '@/lib/show-of-the-day-types'
import { getOfficialReleasesForDate } from '@/lib/official-releases'
import { ReleaseBadge } from '@/components/ui/release-badge'

interface ShowOnThisDay {
  date: string
  year: number
  venue: string
  city: string
  state?: string
  country: string
  songs: string[]
}

interface ShowSet {
  name: string
  encore: boolean
  songs: string[]
  segues?: boolean[]
}

interface ShowDetail {
  date: string
  venue: string
  city: string
  state?: string
  country: string
  sets: ShowSet[]
  totalSongs: number
}

interface SummaryStats {
  totalShows: number
  uniqueSongs: number
  hoursArchived: number
  lastUpdated: number | null
}

interface MostPlayed {
  name: string
  count: number
  pct: number
}

interface ShowOfTheDayPayload {
  shows?: ShowOnThisDay[]
  featured?: ShowOnThisDay | null
  showDetail?: ShowDetail | null
  archive?: { identifier?: string; description?: string | null }
  archiveMatch?: ArchiveSetlistMatch | null
}

export default function HomePage() {
  const { enqueueEntireShow, enqueueShowTrack, playShowTrack, prependToQueue, selectTrack, addToQueue } = usePlayer()

  const { data: kpi } = useSWR<SummaryStats>('/api/stats/summary', fetcher, swrOpts)
  const { data: statsData } = useSWR<{ leaderboard: MostPlayed[] }>('/api/stats', fetcher, swrOpts)
  const mostPlayed = statsData?.leaderboard?.slice(0, 8) ?? []

  // Single aggregated fetch: the server precomputes shows, featured pick,
  // setlist detail, and the archive/setlist track match once per day.
  const { data: dayPayload, isLoading: loading } = useSWR<ShowOfTheDayPayload>('/api/show-of-the-day', fetcher, swrOpts)
  const shows = dayPayload?.shows ?? []
  const featured = dayPayload?.featured ?? null
  const showDetail = dayPayload?.showDetail ?? null
  const archiveIdentifier = dayPayload?.archive?.identifier
  const archiveDescription = dayPayload?.archive?.description ?? null
  const archiveMatch = dayPayload?.archiveMatch ?? null
  const archiveLoaded = !loading

  const [queuedSet, setQueuedSet] = useState<Set<number>>(new Set())
  const [flashIdx, setFlashIdx] = useState<number | null>(null)
  const [isEnqueuing, setIsEnqueuing] = useState(false)
  const [showBonus, setShowBonus] = useState(false)

  // Which flat song indices have a matched archive track.
  // null = archive not yet loaded (show pending shimmer on rows).
  // Empty set = archive loaded, no matches (or archive unavailable).
  const archiveCoveredIndices = useMemo((): Set<number> | null => {
    if (!archiveLoaded) return null
    if (!archiveMatch) return new Set<number>()
    return new Set(archiveMatch.matched.filter(m => m.track).map(m => m.flatIdx))
  }, [archiveLoaded, archiveMatch])

  const archiveSegueIndices = useMemo((): Set<number> => {
    if (!archiveMatch) return new Set()
    return new Set(
      archiveMatch.matched.filter(m => m.track?.title?.trim().endsWith('>')).map(m => m.flatIdx)
    )
  }, [archiveMatch])

  const archiveDurations = useMemo((): Map<number, number> => {
    if (!archiveMatch) return new Map()
    return new Map(
      archiveMatch.matched.filter(m => m.track?.duration).map(m => [m.flatIdx, m.track!.duration!])
    )
  }, [archiveMatch])

  const handlePlayAncillaryTrack = useCallback((archiveTrack: ArchiveTrackPayload) => {
    if (!featured) return
    const track = {
      id: archiveTrack.id,
      name: formatBonusTrackTitle(archiveTrack),
      url: archiveTrack.url,
      duration: archiveTrack.duration,
      showDate: featured.date,
      venue: featured.venue,
      city: featured.city,
      archiveItemId: archiveTrack.archiveItemId,
    }
    prependToQueue([track])
    selectTrack(track)
  }, [featured, prependToQueue, selectTrack])

  const handleAddBonusTrack = useCallback((e: React.MouseEvent, archiveTrack: ArchiveTrackPayload) => {
    e.stopPropagation()
    if (!featured) return
    addToQueue([{
      id: archiveTrack.id,
      name: formatBonusTrackTitle(archiveTrack),
      url: archiveTrack.url,
      duration: archiveTrack.duration,
      showDate: featured.date,
      venue: featured.venue,
      city: featured.city,
      archiveItemId: archiveTrack.archiveItemId,
    }])
  }, [featured, addToQueue])

  const handlePlayShow = async (startFrom?: number) => {
    if (!featured) return
    setIsEnqueuing(true)
    try {
      const songs = showDetail?.sets.flatMap(s => s.songs) ?? featured.songs
      await enqueueEntireShow(
        { date: featured.date, venue: featured.venue, city: featured.city, identifier: archiveIdentifier },
        { clearExisting: true, songs, startFrom }
      )
    } catch {} finally {
      setIsEnqueuing(false)
    }
  }

  const handleAddToQueue = useCallback(async (e: React.MouseEvent, flatIdx: number) => {
    e.stopPropagation()
    if (!featured) return
    setFlashIdx(flatIdx)
    setQueuedSet(prev => new Set([...prev, flatIdx]))
    setTimeout(() => setFlashIdx(null), 700)
    try {
      const songs = showDetail?.sets.flatMap(s => s.songs) ?? featured.songs
      await enqueueShowTrack(
        { date: featured.date, venue: featured.venue, city: featured.city, identifier: archiveIdentifier },
        flatIdx,
        songs,
      )
    } catch {}
  }, [featured, showDetail, archiveIdentifier, enqueueShowTrack])

  const handlePlaySingleSong = useCallback(async (flatIdx: number) => {
    if (!featured) return
    setIsEnqueuing(true)
    try {
      const songs = showDetail?.sets.flatMap(s => s.songs) ?? featured.songs
      await playShowTrack(
        { date: featured.date, venue: featured.venue, city: featured.city, identifier: archiveIdentifier },
        flatIdx,
        songs,
      )
    } catch {} finally {
      setIsEnqueuing(false)
    }
  }, [featured, showDetail, archiveIdentifier, playShowTrack])

  // Format the featured date for display — use the show's own historical
  // weekday/month/day, not today's real-world weekday.
  const dateParts = featured ? getDateParts(featured.date) : null
  const weekday = dateParts?.weekday ?? ''
  const monthName = dateParts?.monthName ?? ''
  const year = featured?.year ?? 0
  const yearsAgo = new Date().getFullYear() - year
  const venue = featured?.venue ?? ''
  const location = featured
    ? `${featured.city}${featured.state ? `, ${featured.state}` : ''}`
    : ''

  const venueTidbit = featured ? getVenueTidbit(featured.venue, featured.city) : null
  const releases = featured ? getOfficialReleasesForDate(featured.date) : []

  const totalSongs = showDetail?.totalSongs ?? featured?.songs?.length ?? 0
  const opener = showDetail?.sets?.[0]?.songs?.[0] ?? featured?.songs?.[0] ?? ''
  const lastSet = showDetail?.sets ? [...showDetail.sets].reverse().find(s => !s.encore) : null
  const closer = lastSet?.songs?.slice(-1)[0] ?? ''

  // Format last updated
  const lastRefresh = kpi?.lastUpdated
    ? (() => {
        const m = Math.round((Date.now() - kpi.lastUpdated) / 60000)
        return m < 60 ? `${m}m ago` : `${Math.round(m / 60)}h ago`
      })()
    : '—'

  return (
    <>
      {/* Main content column */}
      <section className="col">
        <div className="gutter-label gutter-label-lg">
          <span>Featured · On This Day</span>
          <span className="mono">{year ? `PG. ${year}` : ''}</span>
        </div>

        <div className="feature">
          <span className="tag">
            <span className="pulse" />
            On this day · {yearsAgo > 0 ? `${yearsAgo} years gone` : 'today'}
          </span>

          {loading ? (
            <div className="skeleton-vault" style={{ height: 120, marginTop: 14 }} />
          ) : featured ? (
            <>
              <h2>
                <span style={{ fontSize: '0.75em' }}>
                  {weekday}, the {dateParts?.ordinalDay ?? ''}{' '}
                  <span className="italic">of</span>{' '}
                  {monthName}
                </span>
                {' '}
                <span style={{ fontSize: '0.90em', color: 'var(--ink-3)', fontStyle: 'italic' }}>
                  {year}
                </span>
              </h2>

              <div className="venue-line" style={{ display: 'flex', alignItems: 'baseline', gap: 18, flexWrap: 'wrap' }}>
                <span><strong>{venue}</strong>{location ? ` · ${location}` : ''}</span>
                {releases.length > 0 && (
                  <span style={{ fontStyle: 'normal' }}>
                    <ReleaseBadge releases={releases} />
                  </span>
                )}
              </div>

              {venueTidbit && (
                <div style={{ fontStyle: 'italic', fontSize: 13, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.55, maxWidth: 540 }}>
                  {venueTidbit}
                </div>
              )}

              <div className="meta-row">
                {totalSongs > 0 && (
                  <div className="item">Tracks<strong>{totalSongs}</strong></div>
                )}
                {opener && (
                  <div className="item rust">
                    Opener<strong style={{ fontSize: 19 }}>{opener}</strong>
                  </div>
                )}
                {closer && closer !== opener && (
                  <div className="item">
                    Closer<strong style={{ fontSize: 19 }}>{closer}</strong>
                  </div>
                )}
                <div className="actions">
                  <button className="btn primary" onClick={() => handlePlayShow()} disabled={isEnqueuing || !archiveLoaded} style={(isEnqueuing || !archiveLoaded) ? { opacity: 0.7 } : undefined}>
                    <span className="play-tri">{isEnqueuing ? '…' : '▶'}</span> {isEnqueuing ? 'Loading…' : !archiveLoaded ? 'Loading…' : 'Play entire show'}
                  </button>
                  <Link href={`/show/${featured.date}`} className="btn ghost">
                    Open setlist ↗
                  </Link>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: '22px 0', color: 'var(--ink-3)', fontStyle: 'italic' }}>
              No shows found for today&apos;s date in the archive.
            </div>
          )}
        </div>

        {/* Timeline strip */}
        {(showDetail?.sets?.length ?? 0) > 0 && (
          <TimelineStrip
            sets={showDetail!.sets}
            showDate={featured?.date ?? ''}
            onPlayFrom={handlePlayShow}
          />
        )}

        {/* Setlist from the show detail */}
        {(showDetail?.sets?.length ?? 0) > 0 && (() => {
          let flatOffset = 0
          return (
            <div className="setlist">
              {showDetail!.sets.map((set, si) => {
                const romanNumerals = ['I', 'II', 'III', 'IV', 'E.']
                const isEncore = set.encore
                const roman = isEncore ? 'E.' : romanNumerals[si] ?? String(si + 1)
                const setOffset = flatOffset
                flatOffset += set.songs.length
                return (
                  <div key={set.name} className={`set-block${si === 1 ? ' alt' : ''}`}>
                    <div className="set-head">
                      <h3>
                        <span className="roman">{roman}</span>
                        {set.name}
                      </h3>
                      <div className="duration">{set.songs.length} songs</div>
                    </div>
                    {set.songs.map((song, ji) => {
                      const globalNum = setOffset + ji
                      const pending = archiveCoveredIndices === null
                      const inArchive = !pending && archiveCoveredIndices!.has(globalNum)
                      const hasSegue = set.segues?.[ji] === true || archiveSegueIndices.has(globalNum)
                      return (
                        <div
                          key={`s${si}-${ji}`}
                          className={`track${pending ? ' pending' : ''}`}
                          onClick={inArchive ? () => handlePlaySingleSong(globalNum) : undefined}
                          style={!inArchive && !pending ? { cursor: 'default', opacity: 0.4 } : undefined}
                        >
                          <span className="num">{String(ji + 1).padStart(2, '0')}</span>
                          <span className="play-dot" style={!inArchive && !pending ? { visibility: 'hidden' } : undefined}>▶</span>
                          <Link
                            href={`/song/${encodeURIComponent(song)}`}
                            className="title"
                            onClick={e => e.stopPropagation()}
                            style={{ textDecoration: 'none', display: 'block' }}
                          >
                            {song}{hasSegue && <span style={{ fontFamily: 'var(--mono)', fontSize: 16, color: 'var(--rust)', marginLeft: 8, fontWeight: 500 }}>→</span>}
                          </Link>
                          <Link
                            href={`/song/${encodeURIComponent(song)}`}
                            className="chev"
                            onClick={e => e.stopPropagation()}
                          >go to song ↗</Link>
                          <span className="dur">
                            {archiveDurations.has(globalNum) ? formatDuration(archiveDurations.get(globalNum)!) : ''}
                          </span>
                          {inArchive ? (
                            <button
                              className={`add-q${flashIdx === globalNum ? ' flash' : queuedSet.has(globalNum) ? ' queued' : ''}`}
                              title="Add to queue"
                              onClick={e => handleAddToQueue(e, globalNum)}
                            >+</button>
                          ) : (
                            <span style={{ width: 26, display: 'inline-block' }} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )
        })()}

        {/* Bonus tracks (soundcheck, banter, etc.) bundled in the recording but not part of the setlist */}
        {archiveMatch && archiveMatch.bonus.length > 0 && (
          <div className="bonus-tracks" style={{ marginTop: 8 }}>
            <button
              className="bonus-toggle"
              onClick={() => setShowBonus(s => !s)}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',
                background: 'none', border: '2px solid var(--gray)', borderRadius: 12, padding: '10px 14px',
                cursor: 'pointer', font: 'inherit', fontSize: 14,
              }}
            >
              <span>+ {deriveBonusSectionLabel(archiveMatch.bonus, archiveDescription)} ({archiveMatch.bonus.length} tracks)</span>
              <span>{showBonus ? '▲' : '▼'}</span>
            </button>
            {showBonus && (
              <div className="setlist" style={{ marginTop: 4 }}>
                <div className="set-block">
                  {archiveMatch.bonus.map(track => (
                    <div
                      key={track.id}
                      className="track"
                      onClick={() => handlePlayAncillaryTrack(track)}
                    >
                      <span className="num" style={{ opacity: 0.35, fontSize: 13 }}>·</span>
                      <span className="play-dot">▶</span>
                      <span className="title" style={{ fontStyle: 'italic', display: 'block' }}>{formatBonusTrackTitle(track)}</span>
                      <span className="chev" />
                      <span className="dur">{track.duration ? formatDuration(track.duration) : ''}</span>
                      <button
                        className="add-q"
                        title="Add to queue"
                        onClick={e => handleAddBonusTrack(e, track)}
                      >+</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fallback: song list from on-this-day when no detail */}
        {!showDetail && featured && featured.songs.length > 0 && (
          <div className="setlist">
            <div className="set-block">
              <div className="set-head">
                <h3><span className="roman">—</span>Setlist</h3>
                <div className="duration">{featured.songs.length} songs</div>
              </div>
              {featured.songs.map((song, i) => (
                <div key={i} className="track" onClick={() => handlePlaySingleSong(i)}>
                  <span className="num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="play-dot">▶</span>
                  <Link
                    href={`/song/${encodeURIComponent(song)}`}
                    className="title"
                    onClick={e => e.stopPropagation()}
                    style={{ textDecoration: 'none', display: 'block' }}
                  >
                    {song}
                  </Link>
                  <Link
                    href={`/song/${encodeURIComponent(song)}`}
                    className="chev"
                    onClick={e => e.stopPropagation()}
                  >go to song ↗</Link>
                  <span className="dur" />
                  <button
                    className={`add-q${flashIdx === i ? ' flash' : queuedSet.has(i) ? ' queued' : ''}`}
                    title="Add to queue"
                    onClick={e => handleAddToQueue(e, i)}
                  >+</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recording mismatch warning for home page — only when setlist songs
            are actually missing from the tape, not when the tape just has
            extra bonus material (handled by the bonus section above). */}
        {archiveMatch && archiveMatch.matched.filter(m => !m.track).length > 2 && (
          <div className="margin-note" style={{ marginTop: 8, borderColor: 'var(--rust)' }}>
            <span className="head" style={{ color: 'var(--rust)' }}>Recording note</span>
            {archiveMatch.matched.filter(m => !m.track).length} of {archiveMatch.matched.length} songs
            couldn&apos;t be matched to a track on this recording.{' '}
            {featured && (
              <Link href={`/show/${featured.date}`} style={{ color: 'var(--rust)' }}>
                Open full setlist ↗
              </Link>
            )}{' '}
            to browse other available recordings and switch between them.
          </div>
        )}

        <div className="margin-note" style={{ marginTop: 8 }}>
          <span className="head">About this archive</span>
          Setlists from setlist.fm. Audio streamed from Archive.org from community-contributed
          soundboard and audience tapes.{' '}
          {featured && (
            <Link href={`/show/${featured.date}`} style={{ color: 'var(--rust)' }}>
              Open full setlist ↗
            </Link>
          )}{' '}
          to browse all available recordings for this show and switch between them.
          {archiveIdentifier && (
            <><br />Playing: <strong>{archiveIdentifier}</strong></>
          )}
        </div>
      </section>

      {/* Right ledger column */}
      <aside className="col right-col">
        {/* Stats hero */}
        <div className="gutter-label">
          <span>The Ledger · Stats</span>
          <span className="mono">MMXXVI</span>
        </div>
        <div className="ledger-hero">
          <div className="cell">
            <div className="label">Shows Indexed</div>
            <div className="val">{kpi?.totalShows?.toLocaleString() ?? '—'}</div>
            <div className="annot">from setlist.fm</div>
          </div>
          <div className="cell">
            <div className="label">Hours Archived</div>
            <div className="val rust">{kpi?.hoursArchived?.toLocaleString() ?? '—'}</div>
            <div className="annot">est. at 2.7h / show</div>
          </div>
        </div>
        <ul className="ledger">
          <li>
            <div className="label">Unique Songs<span className="annot">GD catalog</span></div>
            <div className="val forest">{kpi?.uniqueSongs?.toLocaleString() ?? '—'}</div>
          </li>
          <li>
            <div className="label">Last Refresh<span className="annot">auto-refreshes daily</span></div>
            <div className="val" style={{ fontSize: 14 }}>{lastRefresh}</div>
          </li>
        </ul>

        {/* Most played */}
        {mostPlayed.length > 0 && (
          <>
            <div className="gutter-label" style={{ marginTop: 18 }}>
              <span>Most Played · All-Time</span>
              <span className="mono">N={kpi?.totalShows?.toLocaleString() ?? '—'}</span>
            </div>
            <ul className="toptable">
              {mostPlayed.map((m, i) => (
                <li key={m.name}>
                  <Link href={`/song/${encodeURIComponent(m.name)}`} style={{ textDecoration: 'none' }}>
                    <div className="row1">
                      <span className="rank">{String(i + 1).padStart(2, '0')}.</span>
                      <span>{m.name}</span>
                      <span className="plays">{m.count}</span>
                    </div>
                    <div className="bar">
                      <div className="fill" style={{ width: `${m.pct}%` }} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Also on this day */}
        {shows.length > 1 && (
          <>
            <div className="gutter-label" style={{ marginTop: 18 }}>
              <span>Also On This Day</span>
              <span className="mono">{shows.length} SHOWS</span>
            </div>
            <ul className="alsolist">
              {shows.slice(0, 6).map((show, i) => (
                <li key={`${show.date}-${show.venue}-${i}`}>
                  <Link href={`/show/${show.date}`} style={{ display: 'contents' }}>
                    <span className="yr">{show.year}</span>
                    <span className="where">
                      {show.venue}
                      <span className="city">{show.city}{show.state ? `, ${show.state}` : ''}</span>
                    </span>
                    <span className="ext">↗</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <div className="cartouche">
          <div className="quote">If you get confused, just listen to the music play.</div>
          <div className="cite">— Franklin&apos;s Tower, R. Hunter</div>
        </div>
      </aside>
    </>
  )
}
