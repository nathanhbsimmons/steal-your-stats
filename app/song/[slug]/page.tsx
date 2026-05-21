'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import useSWR from 'swr'
import { Icon, ICONS } from '@/components/glass/icons'
import { CollapsibleHeader, ShowRow, AttributionFooter, GlassSkeleton } from '@/components/glass/primitives'
import { PlayerDock } from '@/components/glass/player-dock'
import { useAudioPlayer, formatArchiveTrackName } from '@/lib/hooks/use-audio-player'
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

function formatDate(iso: string) {
  return iso.replace(/-/g, '·')
}

function formatDuration(sec?: number): string {
  if (!sec) return '—'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

type SortKey = 'duration-desc' | 'date' | 'venue'

export default function SongPage() {
  const params = useParams()
  const router = useRouter()
  const songTitle = decodeURIComponent(params.slug as string)

  const [openOpener,   setOpenOpener]   = useState(true)
  const [openCloser,   setOpenCloser]   = useState(false)
  const [openEncore,   setOpenEncore]   = useState(false)
  const [openVersions, setOpenVersions] = useState(true)
  const [sortKey,      setSortKey]      = useState<SortKey>('duration-desc')
  const [shareLabel,   setShareLabel]   = useState<'Share' | 'Copied!'>('Share')
  const [starred,      setStarred]      = useState(false)
  const [playError,    setPlayError]    = useState<string | null>(null)

  const FAVORITES_KEY = 'steal-your-stats-favorites'

  // Load star state from localStorage
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
      const next = starred
        ? favs.filter(f => f !== key)
        : [...favs, key]
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
      setStarred(!starred)
    } catch {}
  }

  const POS_PAGE = 10
  const [openerPage,   setOpenerPage]   = useState(POS_PAGE)
  const [closerPage,   setCloserPage]   = useState(POS_PAGE)
  const [encorePage,   setEncorePage]   = useState(POS_PAGE)

  const { currentTrack, isPlaying, queue, play, pause, next, previous,
          selectTrack, addToQueue, removeFromQueue, clearQueue, enqueueEntireShow } = useAudioPlayer()

  const swrOpts = {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 24 * 60 * 60 * 1000,
    errorRetryCount: 3,
  }

  const { data, error, isLoading }                              = useSWR(`song-facts-${songTitle}`,    () => fetchSongFacts(songTitle),    swrOpts)
  const { data: posData, isLoading: posLoading }                = useSWR(`position-facts-${songTitle}`, () => fetchPositionFacts(songTitle), swrOpts)
  const { data: versData, isLoading: versLoading }              = useSWR(`versions-${songTitle}`,       () => fetchVersions(songTitle),       swrOpts)

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
      addToQueue([track])
      selectTrack(track)
    } else {
      // No pre-resolved URL — look up the Archive.org show and play the song from it
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
    try {
      const archiveShow = await resolveArchiveShow(showRef)
      if (!archiveShow) {
        setPlayError(`No Archive.org recording found for ${showRef.date} at ${showRef.venue}.`)
        setTimeout(() => setPlayError(null), 6000)
        return
      }
      const { tracks } = await fetchSongTracks(archiveShow.identifier, songTitle)
      const formatted: Track[] = tracks.map((t: { id: string; name: string; url: string; showDate: string; venue: string; city: string; archiveItemId: string }) => ({
        ...t,
        name: formatArchiveTrackName(t.name.replace(/\.[^.]+$/, '')),
        showDate: showRef.date,
        venue: showRef.venue,
        city: showRef.city,
        licenseUrl: archiveShow.licenseurl,
        rights: archiveShow.rights,
      }))
      if (formatted.length === 0) {
        setPlayError(`Show found but no playable tracks for "${songTitle}" on ${showRef.date}.`)
        setTimeout(() => setPlayError(null), 6000)
        return
      }
      addToQueue(formatted)
      if (!currentTrack && formatted.length > 0) selectTrack(formatted[0])
    } catch (err) {
      console.error('Failed to load show versions:', err)
      setPlayError('Could not load show from Archive.org. Try again in a moment.')
      setTimeout(() => setPlayError(null), 6000)
    }
  }

  const handleClearEntireShow = async () => {
    if (!data?.first) return
    try {
      clearQueue()
      await enqueueEntireShow(data.first, { clearExisting: true })
    } catch (err) {
      console.error(err)
    }
  }

  // Sort versions
  const sortedTracks = versData?.tracks ? [...versData.tracks].sort((a, b) => {
    if (sortKey === 'duration-desc') return (b.durationSec || 0) - (a.durationSec || 0)
    if (sortKey === 'date') return a.showDate.localeCompare(b.showDate)
    return a.venue.localeCompare(b.venue)
  }) : []

  return (
    <>
      {/* Breadcrumb row (replaces TopBar on this page) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 28px 0', flexShrink: 0 }}>
        <button className="btn icon" style={{ width: 32, height: 32 }} onClick={() => router.back()}>
          <Icon d={ICONS.chevLeft} size={14} />
        </button>
        <span className="t-eyebrow" style={{ fontSize: 10.5 }}>
          SONGS / {songTitle.toUpperCase()}
        </span>
        <span style={{ flex: 1 }} />
        <div className="glass" style={{
          padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 10,
          borderRadius: 'var(--r-full)', minWidth: 260,
        }}>
          <Icon d={ICONS.search} size={14} stroke={1.8} />
          <input
            placeholder="Songs, venues, dates…"
            style={{ flex: 1, background: 'transparent', border: 0, outline: 'none', color: 'var(--fg)', fontSize: 12.5 }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const q = (e.target as HTMLInputElement).value.trim()
                if (q) router.push(`/search?q=${encodeURIComponent(q)}`)
              }
            }}
          />
          <span className="kbd">⌘K</span>
        </div>
        <button
          className="btn icon"
          title={shareLabel}
          onClick={handleShare}
          style={{ color: shareLabel === 'Copied!' ? 'var(--accent)' : undefined }}
        >
          <Icon d={ICONS.share} size={14} />
        </button>
        <button
          className="btn icon"
          title={starred ? 'Remove from favorites' : 'Add to favorites'}
          onClick={handleStar}
          style={{ color: starred ? 'var(--accent)' : undefined }}
        >
          <Icon d={ICONS.star} size={14} fill={starred ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Song header */}
      <header style={{ padding: '20px 28px 18px', display: 'flex', alignItems: 'flex-end', gap: 24, flexShrink: 0 }}>
        {/* Artwork */}
        <div style={{
          width: 92, height: 92, flex: '0 0 92px',
          borderRadius: 'var(--r-lg)',
          background: 'radial-gradient(circle at 30% 30%, var(--accent), #6b3d12 70%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 12px 30px -10px rgba(240,176,74,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
          position: 'relative', overflow: 'hidden',
        }}>
          <svg width="92" height="92" viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, opacity: 0.35 }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <circle key={i} cx="50" cy="50" r={6 + i * 4} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.6" />
            ))}
          </svg>
          <Icon d={ICONS.bolt} size={36} stroke={1.2} />
        </div>

        {/* Title */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span className="t-eyebrow">Song · jam vehicle</span>
          <h1 className="t-display" style={{ fontSize: 56, letterSpacing: '-0.035em', lineHeight: 0.95 }}>
            {songTitle}
          </h1>
          {data?.aliases && data.aliases.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="t-small">Also known as:</span>
              {data.aliases.map((a: string) => (
                <span key={a} className="pill">{a}</span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={() => data?.first && handlePlayShowVersions(data.first)}>
              <Icon d={ICONS.planeTakeoff} size={14} /> First show
            </button>
            <button className="btn" onClick={() => data?.last && handlePlayShowVersions(data.last)}>
              <Icon d={ICONS.planeLand} size={14} /> Last show
            </button>
          </div>
          <button className="btn primary lg" onClick={handlePlayLongest}>
            <Icon d={ICONS.play} size={14} fill="currentColor" stroke={0} /> Play longest version
          </button>
          {playError && (
            <span className="t-small" style={{ color: 'var(--bad)', maxWidth: 320, textAlign: 'right' }}>
              {playError}
            </span>
          )}
        </div>
      </header>

      {/* Scrollable content */}
      <div className="scroll-hide" style={{ flex: 1, overflow: 'auto', padding: '0 28px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Performance Facts */}
        <section className="glass" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 className="t-h3">Performance Facts</h2>
            <span className="t-eyebrow">setlist.fm</span>
            <span style={{ flex: 1 }} />
            <span className="t-small" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--good)', display: 'inline-block' }} />
              cached 4m ago
            </span>
          </header>

          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 24 }}>
              <GlassSkeleton height={120} />
              <GlassSkeleton height={120} />
              <GlassSkeleton height={120} style={{ minWidth: 200 }} />
            </div>
          ) : error ? (
            <div className="t-small" style={{ color: 'var(--bad)' }}>Failed to load performance facts.</div>
          ) : data ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 24, alignItems: 'stretch' }}>
              {/* First */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 18px', background: 'var(--glass-bg-faint)', borderRadius: 'var(--r-md)', border: '1px solid var(--glass-border)' }}>
                <span className="t-eyebrow">First Performance</span>
                <span className="t-mono" style={{ fontSize: 22, color: 'var(--fg)', letterSpacing: '-0.02em' }}>
                  {data.first ? formatDate(data.first.date) : '—'}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                  <span style={{ fontSize: 13, color: 'var(--fg)' }}>{data.first?.venue ?? '—'}</span>
                  <span className="t-small">{data.first?.city}{data.first?.country ? ` · ${data.first.country}` : ''}</span>
                </div>
                {data.first?.url && (
                  <a href={data.first.url} target="_blank" rel="noopener noreferrer" className="t-small" style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 'auto' }}>
                    View setlist <Icon d={ICONS.external} size={11} />
                  </a>
                )}
              </div>

              {/* Last */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 18px', background: 'var(--glass-bg-faint)', borderRadius: 'var(--r-md)', border: '1px solid var(--glass-border)' }}>
                <span className="t-eyebrow">Last Performance</span>
                <span className="t-mono" style={{ fontSize: 22, color: 'var(--fg)', letterSpacing: '-0.02em' }}>
                  {data.last ? formatDate(data.last.date) : '—'}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                  <span style={{ fontSize: 13, color: 'var(--fg)' }}>{data.last?.venue ?? '—'}</span>
                  <span className="t-small">{data.last?.city}{data.last?.country ? ` · ${data.last.country}` : ''}</span>
                </div>
                {data.last?.url && (
                  <a href={data.last.url} target="_blank" rel="noopener noreferrer" className="t-small" style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 'auto' }}>
                    View setlist <Icon d={ICONS.external} size={11} />
                  </a>
                )}
              </div>

              {/* Total */}
              <div style={{
                display: 'flex', flexDirection: 'column', gap: 6, padding: '14px 26px',
                background: 'var(--accent-soft)', borderRadius: 'var(--r-md)',
                border: '1px solid rgba(240,176,74,0.28)', minWidth: 200,
              }}>
                <span className="t-eyebrow" style={{ color: 'var(--accent-strong)' }}>Total Performances</span>
                <span className="t-mono" style={{ fontSize: 56, color: 'var(--accent-strong)', letterSpacing: '-0.04em', lineHeight: 1, fontWeight: 500 }}>
                  {data.totalPerformances}
                </span>
                <span className="t-small">across {data.last && data.first ? new Date(data.last.date).getFullYear() - new Date(data.first.date).getFullYear() : 0} years</span>
                <svg className="spark" width="160" height="32" viewBox="0 0 160 32" style={{ marginTop: 6 }}>
                  <path className="spark-fill" d="M0,32 L0,22 L10,18 L20,12 L30,6 L40,9 L50,14 L60,11 L70,16 L80,12 L90,20 L100,18 L110,15 L120,22 L130,20 L140,25 L150,24 L160,28 L160,32 Z" />
                  <path d="M0,22 L10,18 L20,12 L30,6 L40,9 L50,14 L60,11 L70,16 L80,12 L90,20 L100,18 L110,15 L120,22 L130,20 L140,25 L150,24 L160,28" />
                </svg>
              </div>
            </div>
          ) : null}
        </section>

        {/* Position Facts */}
        <section className="glass" style={{ display: 'flex', flexDirection: 'column' }}>
          <header style={{ display: 'flex', alignItems: 'center', padding: '16px 22px 8px', gap: 12 }}>
            <h2 className="t-h3">Position Facts</h2>
            <span className="t-small">Where {songTitle} landed in the set</span>
          </header>

          {posLoading ? (
            <div style={{ padding: '8px 22px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <GlassSkeleton height={44} />
              <GlassSkeleton height={44} />
              <GlassSkeleton height={44} />
            </div>
          ) : (
            <>
              {([
                { key: 'opener', title: 'Opened the show', data: posData?.opener, open: openOpener, setOpen: setOpenOpener, page: openerPage, setPage: setOpenerPage, accent: true },
                { key: 'closer', title: 'Closed the show',  data: posData?.closer, open: openCloser, setOpen: setOpenCloser, page: closerPage, setPage: setCloserPage, accent: false },
                { key: 'encore', title: 'Played as encore', data: posData?.encore, open: openEncore, setOpen: setOpenEncore, page: encorePage, setPage: setEncorePage, accent: false },
              ] as const).map(({ key, title, data: posSection, open, setOpen, page, setPage, accent }) => (
                <div key={key} style={{ borderTop: '1px solid var(--glass-border)' }}>
                  <CollapsibleHeader
                    title={title}
                    count={posSection?.count ?? 0}
                    open={open}
                    accent={accent && open}
                    onClick={() => setOpen(o => !o)}
                  />
                  {open && posSection?.shows && (
                    <div style={{ padding: '0 18px 14px', display: 'flex', flexDirection: 'column' }}>
                      {posSection.shows.slice(0, page).map((s, i) => (
                        <ShowRow key={i} date={formatDate(s.date)} venue={s.venue} city={s.city} country={s.country} />
                      ))}
                      {posSection.shows.length > page && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
                          <button
                            className="btn"
                            style={{ padding: '6px 14px', fontSize: 12 }}
                            onClick={() => setPage(p => p + POS_PAGE)}
                          >
                            Load more ({posSection.shows.length - page} remaining) <Icon d={ICONS.chevDown} size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </section>

        {/* Versions */}
        <section className="glass" style={{ display: 'flex', flexDirection: 'column' }}>
          <header
            onClick={() => setOpenVersions(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 22px', cursor: 'pointer' }}
          >
            <span style={{ color: 'var(--fg-3)', display: 'inline-flex', transform: openVersions ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform .15s' }}>
              <Icon d={ICONS.chevRight} size={14} />
            </span>
            <h2 className="t-h3">Versions <span style={{ color: 'var(--fg-3)' }}>· Archive.org</span></h2>
            <span style={{ flex: 1 }} />
            <span className="t-mono" style={{ fontSize: 12, color: 'var(--fg-3)' }}>
              {versData?.tracks?.length ?? '…'} tracked
            </span>
          </header>

          {openVersions && (
            <div style={{ padding: '0 22px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {versLoading ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <GlassSkeleton height={80} />
                    <GlassSkeleton height={80} />
                  </div>
                  <GlassSkeleton height={200} />
                </>
              ) : versData?.extremes ? (
                <>
                  {/* Extremes */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      { label: '⟶ Longest', track: versData.extremes.longest, accent: true },
                      { label: '⟵ Shortest', track: versData.extremes.shortest, accent: false },
                    ].map(({ label, track, accent }) => track ? (
                      <div key={label} className="glass faint" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <button
                          className="play-mini"
                          style={{ width: 40, height: 40 }}
                          onClick={() => handlePlayTrack(track)}
                        >
                          <Icon d={ICONS.play} size={14} fill="currentColor" stroke={0} />
                        </button>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span className="t-eyebrow" style={{ color: accent ? 'var(--accent-strong)' : 'var(--fg-3)' }}>{label}</span>
                          <span className="t-mono" style={{ fontSize: 24, color: 'var(--fg)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                            {formatDuration(track.durationSec)}
                          </span>
                          <span className="t-small">{formatDate(track.showDate)} · {track.venue}</span>
                        </div>
                      </div>
                    ) : null)}
                  </div>

                  {/* Sort filters */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="t-eyebrow">Sort</span>
                    {(['duration-desc', 'date', 'venue'] as SortKey[]).map((key, i) => (
                      <button
                        key={key}
                        className="btn"
                        style={{ padding: '5px 11px', fontSize: 11.5, opacity: sortKey === key ? 1 : 0.65 }}
                        onClick={() => setSortKey(key)}
                      >
                        {['Duration ↓', 'Date', 'Venue'][i]}
                      </button>
                    ))}
                    <span style={{ flex: 1 }} />
                    <span className="t-small">Showing {Math.min(6, sortedTracks.length)} of {sortedTracks.length}</span>
                  </div>

                  {/* Versions table */}
                  <div className="glass faint" style={{ padding: 0, overflow: 'hidden', borderRadius: 'var(--r-md)' }}>
                    <table className="versions-table">
                      <thead>
                        <tr>
                          <th style={{ width: 32 }}></th>
                          <th>Date</th>
                          <th>Venue</th>
                          <th>City</th>
                          <th style={{ textAlign: 'right' }}>Duration</th>
                          <th style={{ width: 40 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedTracks.slice(0, 6).map((t, i) => {
                          const isLongest = versData.extremes?.longest?.archiveItemId === t.archiveItemId
                          const isShortest = versData.extremes?.shortest?.archiveItemId === t.archiveItemId
                          const isPeak = isLongest || isShortest
                          const isCurrentlyPlaying = currentTrack?.id.includes(t.id || '')
                          return (
                            <tr key={i} className={isPeak ? 'peak' : ''}>
                              <td>
                                <span className="t-mono" style={{ color: isPeak ? 'var(--accent)' : 'var(--fg-4)', fontSize: 11 }}>
                                  {String(i + 1).padStart(2, '0')}
                                </span>
                              </td>
                              <td className="t-mono">{formatDate(t.showDate)}</td>
                              <td>{t.venue}</td>
                              <td>{t.city}</td>
                              <td className="t-mono" style={{ textAlign: 'right', color: isPeak ? 'var(--accent-strong)' : 'var(--fg-2)' }}>
                                {formatDuration(t.durationSec)}
                              </td>
                              <td>
                                <button
                                  className={`play-mini${isCurrentlyPlaying ? ' playing' : ''}`}
                                  onClick={() => handlePlayTrack(t)}
                                >
                                  <Icon
                                    d={isCurrentlyPlaying && isPlaying ? ICONS.pause : ICONS.play}
                                    size={11} fill="currentColor" stroke={0}
                                  />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Quick-load buttons */}
                  {data && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn" onClick={() => data.first && handlePlayShowVersions(data.first)}>
                        <Icon d={ICONS.play} size={12} fill="currentColor" stroke={0} /> Play first-show versions
                      </button>
                      <button className="btn" onClick={() => data.last && handlePlayShowVersions(data.last)}>
                        <Icon d={ICONS.play} size={12} fill="currentColor" stroke={0} /> Play last-show versions
                      </button>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}
        </section>

        <AttributionFooter />
      </div>

      {/* Player dock */}
      <PlayerDock
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        queue={queue}
        onPlay={play}
        onPause={pause}
        onNext={next}
        onPrevious={previous}
        onSelectTrack={selectTrack}
        onRemoveFromQueue={removeFromQueue}
        onClearQueue={clearQueue}
        onClearAndPlayEntireShow={handleClearEntireShow}
      />
    </>
  )
}
