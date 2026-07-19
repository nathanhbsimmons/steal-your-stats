import Link from 'next/link'
import Image from 'next/image'
import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'
import { setlistClientImpl, mapSetlistsToMemberShows } from '@/lib/clients/setlist'
import { PlayShowButton } from '@/components/member/play-show-button'
import { MemberShowBrowser } from '@/components/member/member-show-browser'
import { MEMBERS, ERA_INFO } from '@/lib/members'

interface YearCount { year: number; count: number }

export const revalidate = 86400

export default async function MemberPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const member = MEMBERS[slug]

  if (!member) {
    return (
      <section className="col">
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-3)', fontStyle: 'italic' }}>
          Member not found.
        </div>
      </section>
    )
  }

  const memberAllYears: number[] = []
  for (let y = member.startYear; y <= member.endYear; y++) memberAllYears.push(y)

  const selectedYear = member.startYear + Math.floor((member.endYear - member.startYear) / 2)

  const [stats, browseResult] = await Promise.all([
    realtimeSongFactsService.getGlobalStats().catch(() => ({ showsPerYear: [] as YearCount[], leaderboard: [] })),
    setlistClientImpl.searchSetlistsByYear(selectedYear, 1).catch(() => ({ setlists: [], total: 0, itemsPerPage: 20 })),
  ])
  const initialBrowseShows = mapSetlistsToMemberShows(browseResult.setlists)
  const era = ERA_INFO[member.eraId]

  return (
    <section className="col">
      <div className="crumbs">
        <Link href="/">HOME</Link>
        <span className="sep">/</span>
        <Link href="/artists">BAND MEMBERS</Link>
        <span className="sep">/</span>
        <span className="cur">{member.name.toUpperCase()}</span>
      </div>

      {/* ── HERO ── */}
      <div className="member-hero">
        <div className="portrait-lg">
          {member.photo ? (
            <Image
              src={member.photo}
              alt={member.name}
              fill
              sizes="260px"
              style={{ objectFit: 'cover', objectPosition: 'top center' }}
              priority
            />
          ) : (
            <span className="mark">{member.mark}</span>
          )}
        </div>
        <div className="title-block">
          <div className="kicker">Band member · {member.core ? 'core' : member.slug === 'bruce-hornsby' || member.slug === 'branford-marsalis' ? 'special guest' : 'passing through'}</div>
          <h2>{member.name}</h2>
          <div className="role">{member.role}</div>
          <div className="facts">
            <div>
              <span className="k">Years</span>
              <span className="v">{member.yearsDisplay}</span>
            </div>
            <div>
              <span className="k">Shows</span>
              <span className="v rust">{member.shows.toLocaleString()}</span>
            </div>
            <div>
              <span className="k">Born</span>
              <span className="v">
                {member.born}
                {member.died && (
                  <span style={{ color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 11, paddingLeft: 6 }}>
                    † {member.died}
                  </span>
                )}
              </span>
            </div>
            <div>
              <span className="k">Mark</span>
              <span className="v" style={{ fontFamily: 'var(--serif-display)', color: 'var(--rust)' }}>{member.mark}</span>
            </div>
          </div>
          <div className="actions">
            <Link href={`/eras?focus=${member.eraId}`} className="btn primary">
              ⟶ View era · {era?.name ?? member.eraId}
            </Link>
            <PlayShowButton show={member.signatureShows[0]} label="▶ Play featured show" className="btn ghost" />
          </div>
        </div>
      </div>

      {/* ── BIO ── */}
      <div className="section-head">
        <h3>Bio</h3>
        <span className="meta">{member.core ? 'FOUNDING MEMBER' : 'GUEST CHAIR'}</span>
      </div>
      <p className="member-bio">{member.bio}</p>

      <MemberShowBrowser
        member={member}
        memberAllYears={memberAllYears}
        showsPerYear={stats.showsPerYear}
        initialSelectedYear={selectedYear}
        initialBrowseShows={initialBrowseShows}
        initialBrowseTotal={browseResult.total}
      />

      {/* ── SIGNATURE SHOWS ── */}
      <div className="section-head">
        <h3>Signature shows</h3>
        <div className="descr">— the nights worth knowing</div>
        <span className="meta">{member.signatureShows.length} highlights</span>
      </div>
      <div className="sig-shows">
        {member.signatureShows.map((s, i) => (
          <div key={s.date} className="sig-show">
            <PlayShowButton show={s} label="▶" className="sig-play" title="Play show" />
            <div className="meta">
              <div className="idx">№ {String(i + 1).padStart(2, '0')}</div>
              <div className="date">{s.date}</div>
              <div className="venue">{s.venue}<span className="city">{s.city}</span></div>
              {s.note && <div className="note">— {s.note}</div>}
            </div>
            <Link href={`/show/${s.date}`} className="setlist-link">Setlist ↗</Link>
          </div>
        ))}
      </div>

      {/* ── SONGS DEBUTED ── */}
      <div className="section-head">
        <h3>Songs debuted in this era</h3>
        <div className="descr">— {era?.name} · {era?.years}</div>
        <span className="meta">{member.debuts.length} debuts</span>
      </div>
      <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {member.debuts.map(p => (
          <Link key={p} href={`/song/${encodeURIComponent(p)}`} className="pill">{p}</Link>
        ))}
      </div>

      {/* ── SIGNATURE SONGS ── */}
      <div className="section-head">
        <h3>Signature songs</h3>
        <div className="descr">— what they&apos;re known for</div>
        <span className="meta">{member.signatureSongs.length} songs</span>
      </div>
      <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {member.signatureSongs.map(p => (
          <Link key={p} href={`/song/${encodeURIComponent(p)}`} className="pill">{p}</Link>
        ))}
      </div>
    </section>
  )
}
