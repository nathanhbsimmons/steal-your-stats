import Link from 'next/link'
import { fetchShowDetail } from '@/lib/services/show-detail'
import { ShowDetailClient } from '@/components/show/show-detail-client'

export const revalidate = 86400

export default async function ShowPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  const show = await fetchShowDetail(date)

  if (!show) {
    return (
      <section className="col">
        <div className="crumbs">
          <Link href="/">Home</Link>
          <span className="sep">/</span>
          <span className="cur">{date}</span>
        </div>
        <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: 'var(--serif-body)', fontStyle: 'italic', color: 'var(--ink-3)' }}>
          <div style={{ fontFamily: 'var(--serif-display)', fontSize: 28, color: 'var(--ink)', marginBottom: 8 }}>
            Show not found
          </div>
          No setlist data available for {date}.{' '}
          <Link href="/" style={{ color: 'var(--rust)', textDecoration: 'underline' }}>
            Go home
          </Link>
        </div>
      </section>
    )
  }

  return <ShowDetailClient date={date} initialShow={show} />
}
