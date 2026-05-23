'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { usePlayer } from '@/lib/contexts/player-context'

interface YearCount { year: number; count: number }

interface MemberShow {
  date: string
  venue: string
  city: string
  state?: string
  country: string
  songCount: number
}

interface MemberDef {
  name: string
  slug: string
  role: string
  yearsDisplay: string
  startYear: number
  endYear: number
  shows: number
  core: boolean
  born: number
  died?: number
  mark: string
  photo: string
  eraId: string
  bio: string
  signatureShows: { date: string; venue: string; city: string; note: string }[]
  debuts: string[]
  signatureSongs: string[]
}

const ERA_INFO: Record<string, { name: string; years: string }> = {
  primal:   { name: 'Primal Dead',      years: '1965–1971' },
  europe72: { name: "Europe '72",        years: '1972–1974' },
  hiatus:   { name: 'Hiatus & Return',   years: '1975–1979' },
  brent:    { name: 'Brent Years',       years: '1980–1990' },
  final:    { name: 'Final Tours',       years: '1991–1995' },
}

const MEMBERS: Record<string, MemberDef> = {
  'jerry-garcia': {
    name: 'Jerry Garcia', slug: 'jerry-garcia',
    role: 'Lead guitar · vocals',
    yearsDisplay: '1965–1995', startYear: 1965, endYear: 1995,
    shows: 2328, core: true, born: 1942, mark: '▲',
    photo: '/members/jerry_garcia.jpg',
    eraId: 'europe72',
    bio: "Jerome John Garcia — guitarist, singer, reluctant figurehead. Wandered in from the Palo Alto folk scene in 1965 with banjo fingers and never put the Stratocaster down. Over thirty years his lead-guitar voice — singing, conversational, halfway to a pedal-steel sigh — defined whatever a Grateful Dead song was. He wrote most of the catalog with Robert Hunter, took the longest solos, and held the band together by drift. He died in his sleep at a rehab clinic on August 9th, 1995, five weeks after the last show.",
    signatureShows: [
      { date: '1977-05-08', venue: 'Barton Hall',     city: 'Ithaca, NY',    note: 'the canonical Cornell · 13-min Morning Dew' },
      { date: '1973-02-09', venue: 'Maples Pavilion', city: 'Stanford, CA',  note: 'the Stanford Eyes · first outing' },
      { date: '1977-05-19', venue: 'Fox Theatre',     city: 'Atlanta, GA',   note: "this volume's featured Peggy-O" },
      { date: '1995-07-09', venue: 'Soldier Field',   city: 'Chicago, IL',   note: 'his last show on earth' },
    ],
    debuts: ['Sugaree', 'Bertha', 'Loser', 'Eyes of the World', 'Scarlet Begonias', 'Althea', 'Lazy River Road', 'Brokedown Palace'],
    signatureSongs: ['Eyes of the World', 'Sugaree', 'Althea', 'Morning Dew', 'Bird Song', 'Stella Blue', 'Terrapin Station', 'Brokedown Palace'],
  },
  'bob-weir': {
    name: 'Bob Weir', slug: 'bob-weir',
    role: 'Rhythm guitar · vocals',
    yearsDisplay: '1965–1995', startYear: 1965, endYear: 1995,
    shows: 2328, core: true, born: 1947, mark: '■',
    photo: '/members/bob_weir.jpg',
    eraId: 'brent',
    bio: "Robert Hall Weir — rhythm guitar, occasional lead, the cowboy songs. Joined at 16 after Garcia heard him goof a Jorma part. He turned the rhythm-guitar role on its head: no chord pads, just inverted voicings and counterlines that argued with Garcia all night. The Bobby ballads — Looks Like Rain, Cassidy, Estimated Prophet — anchor the back half of any setlist. He outlasted everybody and is still on the road with Dead & Company.",
    signatureShows: [
      { date: '1972-05-26', venue: 'Strand Lyceum',   city: 'London, England', note: 'the 32-minute Dark Star bridge' },
      { date: '1977-05-08', venue: 'Barton Hall',     city: 'Ithaca, NY',      note: 'Estimated > Eyes' },
      { date: '1989-10-09', venue: 'Hampton Coliseum', city: 'Hampton, VA',    note: 'the formal Dark Star revival' },
      { date: '1990-03-29', venue: 'Nassau Coliseum', city: 'Uniondale, NY',   note: "Help > Slip > Franklin's, definitive" },
    ],
    debuts: ['Estimated Prophet', 'Jack Straw', 'Looks Like Rain', 'Hell in a Bucket', 'Throwing Stones', 'Cassidy', 'Black-Throated Wind'],
    signatureSongs: ['Estimated Prophet', 'Looks Like Rain', 'Jack Straw', 'Cassidy', 'Sugar Magnolia', 'Hell in a Bucket', 'Throwing Stones'],
  },
  'phil-lesh': {
    name: 'Phil Lesh', slug: 'phil-lesh',
    role: 'Bass · vocals',
    yearsDisplay: '1965–1995', startYear: 1965, endYear: 1995,
    shows: 2328, core: true, born: 1940, mark: '◆',
    photo: '/members/phil_lesh.gif',
    eraId: 'europe72',
    bio: "Philip Chapman Lesh — bassist, trained on classical trumpet, no rock experience whatsoever when Garcia handed him a Fender Jazz in 1965. Played bass like a lead instrument, full chordal runs, walking up against Kreutzmann's drums. Wrote Box of Rain about his dying father; that was about all he wrote for the band, but it was enough. After Jerry he ran Phil Lesh & Friends in Marin for two decades.",
    signatureShows: [
      { date: '1974-06-23', venue: 'Jai-Alai Fronton', city: 'Miami, FL',          note: 'Wall-of-Sound era · low end you can feel' },
      { date: '1972-05-03', venue: 'Olympia Theatre',  city: 'Paris, France',      note: "Europe '72 · Truckin'" },
      { date: '1973-11-11', venue: 'Winterland Arena', city: 'San Francisco, CA',  note: 'the 16-min Eyes' },
      { date: '1995-07-09', venue: 'Soldier Field',    city: 'Chicago, IL',        note: 'his Box of Rain encore' },
    ],
    debuts: ['Box of Rain', 'Unbroken Chain', 'Pride of Cucamonga'],
    signatureSongs: ['Box of Rain', "Truckin'", 'The Other One', 'Unbroken Chain', 'Dark Star'],
  },
  'bill-kreutzmann': {
    name: 'Bill Kreutzmann', slug: 'bill-kreutzmann',
    role: 'Drums',
    yearsDisplay: '1965–1995', startYear: 1965, endYear: 1995,
    shows: 2328, core: true, born: 1946, mark: '●',
    photo: '/members/bill_kreutzmann.gif',
    eraId: 'europe72',
    bio: "William Kreutzmann Jr. — the band's first drummer, only drummer for the first two years and the back half of the run. A swing-feel jazz player at heart, more Elvin Jones than Keith Moon, which is what let Garcia stretch song forms into thirty-minute conversations. Held the floor through every roster change. Today he plays around Hawai'i with whoever passes through.",
    signatureShows: [
      { date: '1970-05-02', venue: 'Harpur College',      city: 'Binghamton, NY',  note: 'acoustic + electric · classic Bill' },
      { date: '1972-05-26', venue: 'Strand Lyceum',       city: 'London, England', note: 'Bertha opener · drives the whole set' },
      { date: '1977-05-19', venue: 'Fox Theatre',         city: 'Atlanta, GA',     note: 'Scarlet > Fire pocket' },
      { date: '1991-09-10', venue: 'Madison Square Garden', city: 'New York, NY',  note: 'Bruce Hornsby tour · Bill loose' },
    ],
    debuts: ['Drums', "King Solomon's Marbles"],
    signatureSongs: ['Drums', 'The Other One', 'Bertha', 'Playing in the Band', "Truckin'"],
  },
  'mickey-hart': {
    name: 'Mickey Hart', slug: 'mickey-hart',
    role: 'Drums · percussion',
    yearsDisplay: '1967–1995', startYear: 1967, endYear: 1995,
    shows: 2205, core: true, born: 1943, mark: '○',
    photo: '/members/mickey_hart.jpg',
    eraId: 'brent',
    bio: "Mickey Hart — the second drummer. Sat in on a Halloween in 1967 and stayed twenty-eight years. Brought the band tabla, dumbek, the Beast — a wall of timpani and gongs that became Rhythm Devils. Took a leave from 1971–1974 after his father embezzled the band's money. Wrote a stack of books about percussion as world ritual. Without Mickey there is no Drums > Space.",
    signatureShows: [
      { date: '1968-08-24', venue: 'Shrine Exposition Hall',    city: 'Los Angeles, CA', note: 'first months with the band' },
      { date: '1977-05-08', venue: 'Barton Hall',               city: 'Ithaca, NY',      note: 'Drums > Space, formative' },
      { date: '1985-06-30', venue: 'Merriweather Post Pavilion', city: 'Columbia, MD',   note: 'the Beast in full' },
      { date: '1990-03-29', venue: 'Nassau Coliseum',           city: 'Uniondale, NY',   note: 'Rhythm Devils, peak arrangement' },
    ],
    debuts: ['Space', 'Fire on the Mountain', 'Samson and Delilah', 'Iko Iko'],
    signatureSongs: ['Drums', 'Space', 'Fire on the Mountain', 'Samson and Delilah', 'Iko Iko'],
  },
  'pigpen': {
    name: "Ron 'Pigpen' McKernan", slug: 'pigpen',
    role: 'Keys · harmonica · vocals',
    yearsDisplay: '1965–1972', startYear: 1965, endYear: 1972,
    shows: 815, core: true, born: 1945, died: 1973, mark: '✕',
    photo: '/members/pigpen.jpg',
    eraId: 'primal',
    bio: "Ron 'Pigpen' McKernan — keys, harmonica, raconteur, the band's blues conscience. Grew up listening to his father's R&B record collection in San Bruno. Sang Lovelight, Caution, Smokestack Lightning until they were sermons. Drank himself into liver failure and died at 27 on March 8th, 1973. The band stopped playing his songs the night he died and never really started again.",
    signatureShows: [
      { date: '1969-02-27', venue: 'Fillmore West',  city: 'San Francisco, CA', note: 'Live/Dead · the document' },
      { date: '1970-05-02', venue: 'Harpur College', city: 'Binghamton, NY',    note: 'Lovelight in full sermon mode' },
      { date: '1971-04-29', venue: 'Fillmore East',  city: 'New York, NY',      note: 'last great Pig run · NFA > GDTRFB' },
      { date: '1972-05-26', venue: 'Strand Lyceum',  city: 'London, England',   note: 'his last European show' },
    ],
    debuts: ['Lovelight', 'Caution', 'Smokestack Lightning', 'Hard to Handle', 'Mr. Charlie', 'Operator'],
    signatureSongs: ['Lovelight', 'Caution', 'Hard to Handle', "Good Lovin'", 'Smokestack Lightning', 'Mr. Charlie'],
  },
  'keith-godchaux': {
    name: 'Keith Godchaux', slug: 'keith-godchaux',
    role: 'Piano',
    yearsDisplay: '1971–1979', startYear: 1971, endYear: 1979,
    shows: 685, core: false, born: 1948, died: 1980, mark: '+',
    photo: '/members/keith_godchaux.jpg',
    eraId: 'hiatus',
    bio: "Keith Godchaux — piano, joined in late 1971 when his wife Donna walked up to Garcia after a show and said her husband should be the next keyboardist. He was. A precise, jazz-leaning player; his fills under Garcia in the '72–'74 stretch are the conversational peak of the band. By 1979 his playing had drifted; he was let go and died in a car crash in 1980.",
    signatureShows: [
      { date: '1972-05-03', venue: 'Olympia Theatre',  city: 'Paris, France',  note: "Europe '72 · canonical Keith" },
      { date: '1973-02-09', venue: 'Maples Pavilion',  city: 'Stanford, CA',  note: 'first Eyes · piano definitional' },
      { date: '1974-06-23', venue: 'Jai-Alai Fronton', city: 'Miami, FL',     note: "Wall-of-Sound, piano fully mic'd" },
      { date: '1977-05-08', venue: 'Barton Hall',       city: 'Ithaca, NY',   note: 'the Scarlet > Fire' },
    ],
    debuts: ["He's Gone", 'Stella Blue', 'Eyes of the World', 'Row Jimmy', 'Wave That Flag'],
    signatureSongs: ['Eyes of the World', 'Stella Blue', "He's Gone", 'Row Jimmy', 'Brown-Eyed Women'],
  },
  'donna-godchaux': {
    name: 'Donna Jean Godchaux', slug: 'donna-godchaux',
    role: 'Vocals',
    yearsDisplay: '1972–1979', startYear: 1972, endYear: 1979,
    shows: 502, core: false, born: 1947, mark: '*',
    photo: '/members/donna_godchaux.jpeg',
    eraId: 'hiatus',
    bio: "Donna Jean Godchaux — vocals, formerly a Muscle Shoals session singer (her voice is on Suspicious Minds and When a Man Loves a Woman). Eight years on stage with the band; her harmonies on Sunrise, Playing in the Band, Stella Blue. Left with Keith in 1979. Still records and tours in Alabama with the Donna Jean Godchaux Band.",
    signatureShows: [
      { date: '1973-02-09', venue: 'Maples Pavilion',  city: 'Stanford, CA', note: 'Eyes of the World · first call-and-response' },
      { date: '1974-06-23', venue: 'Jai-Alai Fronton', city: 'Miami, FL',    note: 'Playing in the Band · soaring' },
      { date: '1977-05-08', venue: 'Barton Hall',       city: 'Ithaca, NY',  note: 'Morning Dew harmony' },
      { date: '1978-04-22', venue: 'Spring Tour Civic', city: 'Nassau, NY',  note: 'Sunrise · her composition' },
    ],
    debuts: ['Sunrise', 'From the Heart of Me'],
    signatureSongs: ['Sunrise', 'Playing in the Band', 'Eyes of the World', 'Stella Blue', 'Loose Lucy'],
  },
  'brent-mydland': {
    name: 'Brent Mydland', slug: 'brent-mydland',
    role: 'Keys · vocals',
    yearsDisplay: '1979–1990', startYear: 1979, endYear: 1990,
    shows: 968, core: false, born: 1952, died: 1990, mark: '†',
    photo: '/members/brent_mydland.jpg',
    eraId: 'brent',
    bio: "Brent Mydland — Hammond, Rhodes, lead vocals on his own songs. Eleven years, the longest tenure of any non-original member. A gruff, melodic singer; wrote Hell in a Bucket, Far From Me, Just a Little Light. Struggled with depression and chemistry; died of a speedball overdose on July 26th, 1990, days after his last show. The band never sounded the same without his harmony stack.",
    signatureShows: [
      { date: '1981-03-22', venue: 'Rainbow Theatre',          city: 'London, England', note: 'early Brent · still learning the book' },
      { date: '1985-06-30', venue: 'Merriweather Post Pavilion', city: 'Columbia, MD',  note: 'peak Brent · the B3 wail' },
      { date: '1989-10-09', venue: 'Hampton Coliseum',         city: 'Hampton, VA',     note: 'Dark Star revival · Brent leads the modulation' },
      { date: '1990-03-29', venue: 'Nassau Coliseum',          city: 'Uniondale, NY',   note: 'his last great run' },
    ],
    debuts: ['Hell in a Bucket', 'Throwing Stones', 'Far From Me', 'Just a Little Light', 'I Will Take You Home', 'Blow Away'],
    signatureSongs: ['Hell in a Bucket', 'Far From Me', 'Just a Little Light', 'Throwing Stones', 'I Will Take You Home'],
  },
  'vince-welnick': {
    name: 'Vince Welnick', slug: 'vince-welnick',
    role: 'Keys · vocals',
    yearsDisplay: '1990–1995', startYear: 1990, endYear: 1995,
    shows: 290, core: false, born: 1951, died: 2006, mark: '‡',
    photo: '/members/vince_welnick.jpeg',
    eraId: 'final',
    bio: "Vince Welnick — keys, harmonies, former Tubes synth player. Auditioned the week Brent died and was on stage in two weeks. Five years of holding the keys chair through Garcia's decline. Took the band's dissolution hard; left music for years, then took his own life in 2006. The Way You Do is his. He deserved more.",
    signatureShows: [
      { date: '1991-09-10', venue: 'Madison Square Garden',   city: 'New York, NY',       note: 'first MSG run · Vince finds the seat' },
      { date: '1993-06-26', venue: 'Sandstone Amphitheatre',  city: 'Bonner Springs, KS', note: 'Lazy River Road · the late grace note' },
      { date: '1994-10-04', venue: 'Boston Garden',           city: 'Boston, MA',         note: 'Days Between, gorgeous' },
      { date: '1995-07-09', venue: 'Soldier Field',           city: 'Chicago, IL',        note: 'the last show ever played' },
    ],
    debuts: ['Lazy River Road', 'Days Between', 'So Many Roads', 'Samba in the Rain', 'Easy Answers'],
    signatureSongs: ['Lazy River Road', 'Days Between', 'So Many Roads', 'Way to Go Home', 'Samba in the Rain'],
  },
}

export default function MemberPage() {
  const params = useParams()
  const slug = params.slug as string
  const member = MEMBERS[slug]

  const memberAllYears = useMemo(() => {
    if (!member) return []
    const years: number[] = []
    for (let y = member.startYear; y <= member.endYear; y++) years.push(y)
    return years
  }, [member?.startYear, member?.endYear]) // eslint-disable-line react-hooks/exhaustive-deps

  const [showsPerYear, setShowsPerYear] = useState<YearCount[]>([])
  const [selectedYear, setSelectedYear] = useState(() => {
    if (!member) return 0
    return member.startYear + Math.floor((member.endYear - member.startYear) / 2)
  })
  const [browsePage, setBrowsePage] = useState(1)
  const [browseShows, setBrowseShows] = useState<MemberShow[]>([])
  const [browseTotal, setBrowseTotal] = useState(0)
  const [browseLoading, setBrowseLoading] = useState(false)

  const { enqueueEntireShow } = usePlayer()

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.showsPerYear) setShowsPerYear(d.showsPerYear) })
      .catch(() => {})
  }, [])

  const fetchBrowse = useCallback(async (year: number, page: number) => {
    if (!year) return
    setBrowseLoading(true)
    try {
      const r = await fetch(`/api/member-shows?year=${year}&page=${page}`)
      if (r.ok) {
        const d = await r.json()
        setBrowseShows(d.shows ?? [])
        setBrowseTotal(d.total ?? 0)
      }
    } finally {
      setBrowseLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedYear) fetchBrowse(selectedYear, browsePage)
  }, [selectedYear, browsePage, fetchBrowse])

  const handlePlayShow = async (show: { date: string; venue: string; city: string }) => {
    try {
      await enqueueEntireShow({ date: show.date, venue: show.venue, city: show.city }, { clearExisting: true })
    } catch {}
  }

  const jumpToYear = (year: number) => {
    setSelectedYear(year)
    setBrowsePage(1)
    setTimeout(() => {
      const el = document.getElementById('browse-shows')
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 40, behavior: 'smooth' })
    }, 30)
  }

  if (!member) {
    return (
      <section className="col">
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-3)', fontStyle: 'italic' }}>
          Member not found.
        </div>
      </section>
    )
  }

  const yi = memberAllYears.indexOf(selectedYear)
  const prevYear = yi > 0 ? memberAllYears[yi - 1] : null
  const nextYear = yi < memberAllYears.length - 1 ? memberAllYears[yi + 1] : null

  const memberYearData = memberAllYears.map(y => ({
    year: y,
    count: showsPerYear.find(d => d.year === y)?.count ?? 0,
  }))
  const maxCount = Math.max(...memberYearData.map(d => d.count), 1)
  const totalBrowsePages = Math.ceil(browseTotal / 20)
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
          <Image
            src={member.photo}
            alt={member.name}
            fill
            sizes="260px"
            style={{ objectFit: 'cover', objectPosition: 'top center' }}
            priority
          />
        </div>
        <div className="title-block">
          <div className="kicker">Band member · {member.core ? 'core' : 'passing through'}</div>
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
            <button className="btn ghost" onClick={() => handlePlayShow(member.signatureShows[0])}>
              ▶ Play featured show
            </button>
          </div>
        </div>
      </div>

      {/* ── BIO ── */}
      <div className="section-head">
        <h3>Bio</h3>
        <div className="descr">— compiled by the vault operator</div>
        <span className="meta">{member.core ? 'FOUNDING MEMBER' : 'GUEST CHAIR'}</span>
      </div>
      <p className="member-bio">{member.bio}</p>

      {/* ── SHOWS PER YEAR ── */}
      <div className="section-head">
        <h3>Shows per year</h3>
        <div className="descr">— click any bar to jump to that year below</div>
        <span className="meta">N ≈ {member.shows.toLocaleString()}</span>
      </div>
      <div className="barchart member-chart">
        {memberYearData.map(({ year, count }) => (
          <div
            key={year}
            className={`bar${year === selectedYear ? ' peak' : ''}`}
            style={{ height: count > 0 ? `${(count / maxCount) * 100}%` : '2%' }}
            onClick={() => jumpToYear(year)}
            title={`${year} · ${count} shows`}
          >
            <span className="val">{count || ''}</span>
          </div>
        ))}
      </div>
      <div className="barchart-axis-dense">
        {memberYearData.map(({ year }) => (
          <span
            key={year}
            className={year === selectedYear ? 'on' : ''}
            onClick={() => jumpToYear(year)}
          >
            &apos;{String(year).slice(2)}
          </span>
        ))}
      </div>

      {/* ── SIGNATURE SHOWS ── */}
      <div className="section-head">
        <h3>Signature shows</h3>
        <div className="descr">— the nights worth knowing</div>
        <span className="meta">{member.signatureShows.length} highlights</span>
      </div>
      <div className="sig-shows">
        {member.signatureShows.map((s, i) => (
          <div key={s.date} className="sig-show">
            <button className="sig-play" onClick={() => handlePlayShow(s)} title="Play show">▶</button>
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

      {/* ── BROWSE SHOWS ── */}
      <div id="browse-shows" className="section-head" style={{ marginTop: 28 }}>
        <h3>Browse shows</h3>
        <div className="descr">— full archive, paged one year at a time</div>
        <span className="meta">{selectedYear} · {browseShows.length} of {browseTotal || '?'}</span>
      </div>

      {/* ── YEAR PAGER ── */}
      <div className="year-pager">
        <button
          className={`pg${prevYear ? '' : ' muted'}`}
          onClick={() => prevYear && setSelectedYear(prevYear)}
          disabled={!prevYear}
        >
          <span className="arrow">⟵</span>
          <span className="col">
            <span className="lbl">{prevYear ? 'previous year' : 'start of run'}</span>
            <span className="yr">{prevYear ?? '—'}</span>
          </span>
        </button>
        <span className="current-year">
          <span className="lbl">viewing</span>
          <span className="yr">{selectedYear}</span>
        </span>
        <button
          className={`pg right${nextYear ? '' : ' muted'}`}
          onClick={() => nextYear && setSelectedYear(nextYear)}
          disabled={!nextYear}
        >
          <span className="col">
            <span className="lbl">{nextYear ? 'next year' : 'end of run'}</span>
            <span className="yr">{nextYear ?? '—'}</span>
          </span>
          <span className="arrow">⟶</span>
        </button>
      </div>

      {browseLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton-vault" style={{ height: 44 }} />
          ))}
        </div>
      ) : browseShows.length === 0 ? (
        <div style={{ padding: '20px 0', fontFamily: 'var(--serif-body)', fontStyle: 'italic', color: 'var(--ink-3)' }}>
          No setlist data found for {selectedYear}.
        </div>
      ) : (
        <>
          <table className="tbl member-tbl">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Venue · City</th>
                <th className="r">Songs</th>
                <th className="r">Play</th>
                <th className="r">Setlist</th>
              </tr>
            </thead>
            <tbody>
              {browseShows.map((show, i) => (
                <tr key={show.date}>
                  <td className="num">{String((browsePage - 1) * 20 + i + 1).padStart(2, '0')}</td>
                  <td><span className="title">{show.date}</span></td>
                  <td>
                    <span style={{ fontFamily: 'var(--serif-body)', fontStyle: 'italic', fontSize: 14 }}>{show.venue}</span>
                    <span className="sub">{show.city}{show.state ? `, ${show.state}` : ''}</span>
                  </td>
                  <td className="r">{show.songCount || '—'}</td>
                  <td className="r">
                    <button className="row-play" onClick={() => handlePlayShow(show)} title="Play show">▶</button>
                  </td>
                  <td className="r">
                    <Link href={`/show/${show.date}`} className="row-link">open ↗</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalBrowsePages > 1 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
              <button
                className="btn ghost"
                style={{ padding: '4px 10px', fontSize: 13 }}
                disabled={browsePage <= 1}
                onClick={() => setBrowsePage(p => p - 1)}
              >
                ← Prev
              </button>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--ink-3)' }}>
                {browsePage} / {totalBrowsePages}
              </span>
              <button
                className="btn ghost"
                style={{ padding: '4px 10px', fontSize: 13 }}
                disabled={browsePage >= totalBrowsePages}
                onClick={() => setBrowsePage(p => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      <div className="year-strip">
        {memberAllYears.map(y => (
          <button
            key={y}
            className={`year-tab${y === selectedYear ? ' on' : ''}`}
            onClick={() => setSelectedYear(y)}
          >
            {y}
          </button>
        ))}
      </div>

    </section>
  )
}
