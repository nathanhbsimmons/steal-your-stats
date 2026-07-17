import Link from 'next/link'
import Image from 'next/image'
import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'
import { setlistClientImpl, mapSetlistsToMemberShows } from '@/lib/clients/setlist'
import { PlayShowButton } from '@/components/member/play-show-button'
import { MemberShowBrowser } from '@/components/member/member-show-browser'

interface YearCount { year: number; count: number }

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
  primal: { name: 'Primal Dead', years: '1965–1971' },
  europe72: { name: "Europe '72", years: '1972–1974' },
  hiatus: { name: 'Hiatus & Return', years: '1975–1979' },
  brent: { name: 'Brent Years', years: '1980–1990' },
  final: { name: 'Final Tours', years: '1991–1995' },
}

const MEMBERS: Record<string, MemberDef> = {
  'jerry-garcia': {
    name: 'Jerry Garcia', slug: 'jerry-garcia',
    role: 'Lead guitar · vocals',
    yearsDisplay: '1965–1995', startYear: 1965, endYear: 1995,
    shows: 2328, core: true, born: 1942, mark: '▲',
    photo: '/members/jerry_garcia.jpg',
    eraId: 'europe72',
    bio: "Jerome John Garcia: guitarist, singer, reluctant figurehead. Wandered in from the Palo Alto folk scene in 1965 with banjo fingers, and cycled through Strats and SGs and worse before Doug Irwin built him Wolf, then Tiger. Over thirty years his lead-guitar voice, singing, conversational, halfway to a pedal-steel sigh, defined whatever a Grateful Dead song was. He wrote most of the catalog with Robert Hunter, took the longest solos, and held the band together by drift. He died in his sleep at a rehab clinic on August 9th, 1995, a month after the last show.",
    signatureShows: [
      { date: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca, NY', note: 'the canonical Cornell · 13-min Morning Dew' },
      { date: '1973-02-09', venue: 'Maples Pavilion', city: 'Stanford, CA', note: 'the Stanford Eyes · first outing' },
      { date: '1977-05-19', venue: 'Fox Theatre', city: 'Atlanta, GA', note: "this volume's featured Peggy-O" },
      { date: '1995-07-09', venue: 'Soldier Field', city: 'Chicago, IL', note: 'his last show on earth' },
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
    bio: "Robert Hall Weir: rhythm guitar, occasional lead, the cowboy songs. Joined at 16 after Garcia heard him goof a Jorma part. He turned the rhythm-guitar role on its head: no chord pads, just inverted voicings and counterlines that argued with Garcia all night. The Bobby ballads, Looks Like Rain, Cassidy, Estimated Prophet, anchor the back half of any setlist. He died on January 10, 2026, at 78, not long after his final performance at a Grateful Dead 60th anniversary run in Golden Gate Park the previous August.",
    signatureShows: [
      { date: '1972-05-26', venue: 'Strand Lyceum', city: 'London, England', note: 'the 32-minute Dark Star bridge' },
      { date: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca, NY', note: 'Estimated > Eyes' },
      { date: '1989-10-09', venue: 'Hampton Coliseum', city: 'Hampton, VA', note: 'the formal Dark Star revival' },
      { date: '1990-03-29', venue: 'Nassau Coliseum', city: 'Uniondale, NY', note: "Help > Slip > Franklin's, definitive" },
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
    bio: "Philip Chapman Lesh: bassist, trained on classical trumpet, no rock experience whatsoever when Garcia handed him a Fender Jazz in 1965. Played bass like a lead instrument, full chordal runs, walking up against Kreutzmann's drums. Wrote Box of Rain about his dying father; that was about all he wrote for the band, but it was enough. After Jerry he ran Phil Lesh & Friends in Marin for two decades. He died on October 25, 2024.",
    signatureShows: [
      { date: '1974-06-23', venue: 'Jai-Alai Fronton', city: 'Miami, FL', note: 'Wall-of-Sound era · low end you can feel' },
      { date: '1972-05-03', venue: 'Olympia Theatre', city: 'Paris, France', note: "Europe '72 · Truckin'" },
      { date: '1973-11-11', venue: 'Winterland Arena', city: 'San Francisco, CA', note: 'the 16-min Eyes' },
      { date: '1995-07-09', venue: 'Soldier Field', city: 'Chicago, IL', note: 'his Box of Rain encore' },
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
    bio: "William Kreutzmann Jr.: the band's first drummer, only drummer for the first two years and the back half of the run. A swing-feel jazz player at heart, more Elvin Jones than Keith Moon, which is what let Garcia stretch song forms into thirty-minute conversations. Held the floor through every roster change. He retired to Hawai'i after decades of holding the floor and is the last surviving member of the Grateful Dead's original lineup.",
    signatureShows: [
      { date: '1970-05-02', venue: 'Harpur College', city: 'Binghamton, NY', note: 'acoustic + electric · classic Bill' },
      { date: '1972-05-26', venue: 'Strand Lyceum', city: 'London, England', note: 'Bertha opener · drives the whole set' },
      { date: '1977-05-19', venue: 'Fox Theatre', city: 'Atlanta, GA', note: 'Scarlet > Fire pocket' },
      { date: '1991-09-10', venue: 'Madison Square Garden', city: 'New York, NY', note: 'Bruce Hornsby tour · Bill loose' },
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
    bio: "Mickey Hart: the second drummer. Sat in at the Straight Theater in San Francisco on September 29, 1967, and stayed twenty-eight years. Brought the band tabla, dumbek, the Beast, a wall of timpani and gongs that became Rhythm Devils. Took a leave from 1971 to 1974 after his father embezzled the band's money. Wrote a stack of books about percussion as world ritual. Without Mickey there is no Drums > Space.",
    signatureShows: [
      { date: '1968-08-24', venue: 'Shrine Exposition Hall', city: 'Los Angeles, CA', note: 'first months with the band' },
      { date: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca, NY', note: 'Drums > Space, formative' },
      { date: '1985-06-30', venue: 'Merriweather Post Pavilion', city: 'Columbia, MD', note: 'the Beast in full' },
      { date: '1990-03-29', venue: 'Nassau Coliseum', city: 'Uniondale, NY', note: 'Rhythm Devils, peak arrangement' },
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
    bio: "Ron 'Pigpen' McKernan: keys, harmonica, raconteur, the band's blues conscience. Grew up soaking in R&B through his father, a Bay Area radio DJ who spun that music for a living. Sang Lovelight, Caution, Smokestack Lightning until they were sermons. Drank himself into liver failure and died at 27 on March 8th, 1973. The band stopped playing his songs the night he died and never really started again.",
    signatureShows: [
      { date: '1969-02-27', venue: 'Fillmore West', city: 'San Francisco, CA', note: 'Live/Dead · the document' },
      { date: '1970-05-02', venue: 'Harpur College', city: 'Binghamton, NY', note: 'Lovelight in full sermon mode' },
      { date: '1971-04-29', venue: 'Fillmore East', city: 'New York, NY', note: 'last great Pig run · NFA > GDTRFB' },
      { date: '1972-05-26', venue: 'Strand Lyceum', city: 'London, England', note: 'his last European show' },
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
    bio: "Keith Godchaux: piano, joined in late 1971 when his wife Donna walked up to Garcia after a show and said her husband should be the next keyboardist. He was. A precise, jazz-leaning player; his fills under Garcia in the '72-'74 stretch are the conversational peak of the band. By 1979 his playing had drifted; he was let go and died in a car crash in 1980.",
    signatureShows: [
      { date: '1972-05-03', venue: 'Olympia Theatre', city: 'Paris, France', note: "Europe '72 · canonical Keith" },
      { date: '1973-02-09', venue: 'Maples Pavilion', city: 'Stanford, CA', note: 'first Eyes · piano definitional' },
      { date: '1974-06-23', venue: 'Jai-Alai Fronton', city: 'Miami, FL', note: "Wall-of-Sound, piano fully mic'd" },
      { date: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca, NY', note: 'the Scarlet > Fire' },
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
    bio: "Donna Jean Godchaux: vocals, formerly a Muscle Shoals session singer (her voice is on Suspicious Minds and When a Man Loves a Woman). Eight years on stage with the band; her harmonies on Sunrise, Playing in the Band, Stella Blue. Left with Keith in 1979. Still records and tours in Alabama with the Donna Jean Godchaux Band.",
    signatureShows: [
      { date: '1973-02-09', venue: 'Maples Pavilion', city: 'Stanford, CA', note: 'Eyes of the World · first call-and-response' },
      { date: '1974-06-23', venue: 'Jai-Alai Fronton', city: 'Miami, FL', note: 'Playing in the Band · soaring' },
      { date: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca, NY', note: 'Morning Dew harmony' },
      { date: '1978-04-22', venue: 'Nassau Veterans Memorial Coliseum', city: 'Uniondale, NY', note: 'Sunrise · her composition' },
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
    bio: "Brent Mydland: Hammond, Rhodes, lead vocals on his own songs. Eleven years, the longest tenure of any non-original member. A gruff, melodic singer; wrote Hell in a Bucket, Far From Me, Just a Little Light. Struggled with depression and chemistry; died of a speedball overdose on July 26th, 1990, days after his last show. The band never sounded the same without his harmony stack.",
    signatureShows: [
      { date: '1981-03-22', venue: 'Rainbow Theatre', city: 'London, England', note: 'early Brent · still learning the book' },
      { date: '1985-06-30', venue: 'Merriweather Post Pavilion', city: 'Columbia, MD', note: 'peak Brent · the B3 wail' },
      { date: '1989-10-09', venue: 'Hampton Coliseum', city: 'Hampton, VA', note: 'Dark Star revival · Brent leads the modulation' },
      { date: '1990-03-29', venue: 'Nassau Coliseum', city: 'Uniondale, NY', note: 'his last great run' },
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
    bio: "Vince Welnick: keys, harmonies, former Tubes synth player. Auditioned the week Brent died and was on stage six weeks later when the fall tour opened on September 7th. Five years of holding the keys chair through Garcia's decline. Took the band's dissolution hard; left music for years, then took his own life in 2006. Samba in the Rain and Way to Go Home are his. He deserved more.",
    signatureShows: [
      { date: '1991-09-10', venue: 'Madison Square Garden', city: 'New York, NY', note: 'first MSG run · Vince finds the seat' },
      { date: '1993-06-26', venue: 'Sandstone Amphitheatre', city: 'Bonner Springs, KS', note: 'Lazy River Road · the late grace note' },
      { date: '1994-10-04', venue: 'Boston Garden', city: 'Boston, MA', note: 'Days Between, gorgeous' },
      { date: '1995-07-09', venue: 'Soldier Field', city: 'Chicago, IL', note: 'the last show ever played' },
    ],
    debuts: ['Lazy River Road', 'Days Between', 'So Many Roads', 'Samba in the Rain', 'Easy Answers'],
    signatureSongs: ['Lazy River Road', 'Days Between', 'So Many Roads', 'Way to Go Home', 'Samba in the Rain'],
  },
  'tom-constanten': {
    name: 'Tom Constanten', slug: 'tom-constanten',
    role: 'Keys · electronics · prepared piano',
    yearsDisplay: '1968–1970', startYear: 1968, endYear: 1970,
    shows: 73, core: false, born: 1944, mark: 'T',
    photo: '',
    eraId: 'primal',
    bio: "Thomas Charles Constanten: concert pianist turned cosmic tinkerer. He and Phil Lesh were classmates under Luciano Berio in Oakland, and when the band needed a full-time keyboardist in late 1968 they called TC. His approach was nothing like Pigpen's blues-organ stomp: he brought tape-splice electronics, prepared piano (stuffing objects between the strings mid-song), and classical counterpoint into the mix. He left in early 1970, returning to his solo classical career and occasional Dead guest appearances. His playing can be heard all through Live/Dead and on much of Aoxomoxoa.",
    signatureShows: [
      { date: '1969-08-16', venue: 'Woodstock', city: 'Bethel, NY', note: 'the Woodstock set — TC on keys' },
      { date: '1968-11-02', venue: 'Shrine Auditorium', city: 'Los Angeles, CA', note: "TC's first show with the band" },
    ],
    debuts: ['Dark Star', 'St. Stephen', 'The Eleven', 'Cosmic Charlie'],
    signatureSongs: ['Dark Star', 'St. Stephen', 'The Eleven', 'China Cat Sunflower'],
  },
  'bruce-hornsby': {
    name: 'Bruce Hornsby', slug: 'bruce-hornsby',
    role: 'Piano · accordion · vocals',
    yearsDisplay: '1988–1995', startYear: 1988, endYear: 1995,
    shows: 100, core: false, born: 1954, mark: 'H',
    photo: '',
    eraId: 'final',
    bio: "Bruce Randall Hornsby: pianist from Williamsburg, Virginia. Already famous for 'The Way It Is' when he first sat in with the Dead in 1988, he became the band's most frequent guest — and effectively a sixth member — in the years between Brent Mydland's death in July 1990 and Vince Welnick's hire later that year. He continued sitting in through 1995, playing piano and diatonic accordion, often during Space or when Vince stepped back. His style — dense, gospel-laced chords — pushed the band into territory neither organ nor synthesizer could reach. He played over 100 shows in total.",
    signatureShows: [
      { date: '1990-09-20', venue: 'Madison Square Garden', city: 'New York, NY', note: 'first full-run sit-in after Brent\'s death' },
      { date: '1991-09-10', venue: 'Madison Square Garden', city: 'New York, NY', note: 'Hornsby + Vince double-keyboard night' },
    ],
    debuts: [],
    signatureSongs: ['Terrapin Station', 'He\'s Gone', 'Truckin\'', 'Eyes of the World', 'Estimated Prophet'],
  },
  'branford-marsalis': {
    name: 'Branford Marsalis', slug: 'branford-marsalis',
    role: 'Soprano & tenor saxophone',
    yearsDisplay: '1988–1994', startYear: 1988, endYear: 1994,
    shows: 15, core: false, born: 1960, mark: 'M',
    photo: '',
    eraId: 'final',
    bio: "Branford Marsalis: jazz saxophone titan from Breaux Bridge, Louisiana. He first sat in with the Dead at an outdoor show in 1988 and returned several times over the following years, most famously for a run at the Meadows Music Theatre in Hartford in 1990. His soprano saxophone slipped through the Dead's textures in a way that felt both jarring and inevitable — jazz time grafted onto Grateful Dead space. The tapes from those shows circulated widely. He appeared at enough shows to have a devoted following among Dead fans, and each appearance was anticipated the way a new lineup change used to be.",
    signatureShows: [
      { date: '1990-09-20', venue: 'Madison Square Garden', city: 'New York, NY', note: 'legendary saxophone sit-in' },
      { date: '1988-09-16', venue: 'Madison Square Garden', city: 'New York, NY', note: "Branford's first Dead appearance" },
    ],
    debuts: [],
    signatureSongs: ['Eyes of the World', 'Dark Star', 'Terrapin Station'],
  },
}

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
