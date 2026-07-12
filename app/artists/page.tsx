import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { realtimeSongFactsService } from '@/lib/services/realtime-song-facts'

export const revalidate = 86400

interface YearCount { year: number; count: number }

const CORE_SIX = [
  { name: 'Jerry Garcia',    role: 'Lead guitar · vocals',      initial: 'JG', years: '1965 – 1995', mark: 'J', href: '/member/jerry-garcia',    photo: '/members/jerry_garcia.jpg'    },
  { name: 'Bob Weir',        role: 'Rhythm guitar · vocals',    initial: 'BW', years: '1965 – 1995', mark: 'B', href: '/member/bob-weir',         photo: '/members/bob_weir.jpg'         },
  { name: 'Phil Lesh',       role: 'Bass · vocals',             initial: 'PL', years: '1965 – 1995', mark: 'P', href: '/member/phil-lesh',        photo: '/members/phil_lesh.gif'        },
  { name: 'Bill Kreutzmann', role: 'Drums',                     initial: 'BK', years: '1965 – 1995', mark: 'K', href: '/member/bill-kreutzmann',  photo: '/members/bill_kreutzmann.gif'  },
  { name: 'Mickey Hart',     role: 'Drums · percussion',        initial: 'MH', years: '1967 – 1995', mark: 'M', href: '/member/mickey-hart',      photo: '/members/mickey_hart.jpg'      },
  { name: 'Pigpen',          role: 'Keys · harmonica · vocals', initial: 'PP', years: '1965 – 1972', mark: 'R', href: '/member/pigpen',           photo: '/members/pigpen.jpg'           },
]

const PASSING_THROUGH = [
  // { name: 'Tom Constanten',  role: 'Keys · electronics', initial: 'TC', years: '1968 – 1970', mark: 'T', href: '/member/tom-constanten'  },
  { name: 'Keith Godchaux',  role: 'Keys',          initial: 'KG', years: '1971 – 1979', mark: 'K', href: '/member/keith-godchaux',  photo: '/members/keith_godchaux.jpg'  },
  { name: 'Donna Godchaux',  role: 'Vocals',        initial: 'DG', years: '1972 – 1979', mark: 'D', href: '/member/donna-godchaux',  photo: '/members/donna_godchaux.jpeg' },
  { name: 'Brent Mydland',   role: 'Keys · vocals', initial: 'BM', years: '1979 – 1990', mark: 'B', href: '/member/brent-mydland',   photo: '/members/brent_mydland.jpg'   },
  { name: 'Vince Welnick',   role: 'Keys · vocals', initial: 'VW', years: '1990 – 1995', mark: 'V', href: '/member/vince-welnick',   photo: '/members/vince_welnick.jpeg'  },
]

const SPECIAL_GUESTS = [
  { name: 'Bruce Hornsby',     role: 'Piano · accordion',  initial: 'BH', years: '1988 – 1995', mark: 'H', href: '/member/bruce-hornsby'    },
  { name: 'Branford Marsalis', role: 'Saxophone',          initial: 'BM', years: '1988 – 1994', mark: 'M', href: '/member/branford-marsalis' },
]

function sumYears(data: YearCount[], from: number, to: number): number {
  return data.filter(d => d.year >= from && d.year <= to).reduce((s, d) => s + d.count, 0)
}

interface MemberEntry {
  name: string
  role: string
  initial: string
  years: string
  mark: string
  href: string
  photo?: string
}

function MemberCard({
  member,
  shows,
  minor,
}: {
  member: MemberEntry
  shows: number
  minor?: boolean
}) {
  return (
    <Link
      href={member.href}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <div className={`member-card${minor ? ' minor' : ''}`} style={{ cursor: 'pointer' }}>
        <div className="portrait">
          {member.photo ? (
            <Image
              src={member.photo}
              alt={member.name}
              fill
              sizes="(max-width: 600px) 50vw, 200px"
              style={{ objectFit: 'cover', objectPosition: 'top center' }}
            />
          ) : (
            <span className="mark">{member.mark}</span>
          )}
        </div>
        <div className="name">{member.name}</div>
        <div className="role">{member.role}</div>
        <div className="stats">
          <div>
            Shows<span className="n">{shows > 0 ? shows.toLocaleString() : '—'}</span>
          </div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)', alignSelf: 'end' }}>
            {member.years}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default async function ArtistsPage() {
  const stats = await realtimeSongFactsService.getGlobalStats().catch(() => ({ showsPerYear: [] as YearCount[], leaderboard: [] }))
  const yearData = stats.showsPerYear

  return (
    <section className="col">
      <div className="page-head">
        <div>
          <div className="kicker">Band Members · V</div>
          <h2>The <span className="italic">lineup,</span> assembled.</h2>
          <div className="lede">
            Ten people sat in a Grateful Dead lineup between 1965 and 1995. Six core, four just passing through.
          </div>
        </div>
      </div>

      <div className="section-head">
        <h3>The core six</h3>
        <span className="descr">— the founding lineup</span>
        <span className="meta">1965 — 1995</span>
      </div>
      <div className="member-grid">
        {CORE_SIX.map(m => {
          const [from, to] = m.years.split(' – ').map(Number)
          const shows = sumYears(yearData, from, to)
          return <MemberCard key={m.name} member={m} shows={shows} />
        })}
      </div>

      <div className="section-head" style={{ marginTop: 32 }}>
        <h3>Passing through</h3>
        <span className="descr">— brief official members</span>
        <span className="meta">1968 — 1995</span>
      </div>
      <div className="member-grid">
        {PASSING_THROUGH.map(m => {
          const [from, to] = m.years.split(' – ').map(Number)
          const shows = sumYears(yearData, from, to)
          return <MemberCard key={m.name} member={m} shows={shows} minor />
        })}
      </div>

      {/* Special guests section — hidden until photos/bios are ready
      <div className="section-head" style={{ marginTop: 32 }}>
        <h3>Special guests</h3>
        <span className="descr">— regular sit-ins</span>
        <span className="meta">1968 — 1995</span>
      </div>
      <div className="member-grid">
        {SPECIAL_GUESTS.map(m => (
          <MemberCard key={m.name} member={m} shows={0} minor />
        ))}
      </div>
      */}
    </section>
  )
}
