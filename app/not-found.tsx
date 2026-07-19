import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="col">
      <div className="crumbs">
        <Link href="/">Home</Link>
        <span className="sep">/</span>
        <span className="cur">Not found</span>
      </div>
      <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: 'var(--serif-body)', fontStyle: 'italic', color: 'var(--ink-3)' }}>
        <div style={{ fontFamily: 'var(--serif-display)', fontSize: 28, color: 'var(--ink)', marginBottom: 8 }}>
          Page not found
        </div>
        No data available at this address.{' '}
        <Link href="/" style={{ color: 'var(--rust)', textDecoration: 'underline' }}>
          Go home
        </Link>
      </div>
    </section>
  )
}
