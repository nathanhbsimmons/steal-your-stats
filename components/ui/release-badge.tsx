import type { OfficialRelease } from '@/lib/official-releases'
import { ReleaseIcon, releaseSeriesStyle, RELEASE_SERIES_ORDER } from '@/components/ui/release-icons'

export function ReleaseBadge({
  releases,
  size = 'sm',
  variant = 'chip',
}: {
  releases: OfficialRelease[]
  size?: 'sm' | 'xs'
  variant?: 'chip' | 'icon'
}) {
  if (releases.length === 0) return null

  const [primary, ...rest] = releases
  const { color } = releaseSeriesStyle(primary.series)

  if (variant === 'icon') {
    return (
      <span title={releases.map(r => r.title).join(', ')} style={{ display: 'inline-flex', alignItems: 'center' }}>
        <ReleaseIcon series={primary.series} size={size === 'xs' ? 11 : 13} />
      </span>
    )
  }

  const label = rest.length > 0 ? `${primary.title} +${rest.length}` : primary.title

  return (
    <span
      title={releases.map(r => r.title).join(', ')}
      style={{
        fontFamily: 'var(--mono)',
        fontSize: size === 'xs' ? 9 : 9.5,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color,
        border: `1px solid ${color}`,
        padding: '2px 6px',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        verticalAlign: 'middle',
        width: 'max-content',
      }}
    >
      <ReleaseIcon series={primary.series} size={size === 'xs' ? 11 : 12} />
      {label}
    </span>
  )
}

export function ReleaseLegend({ releases }: { releases: OfficialRelease[] }) {
  const present = new Set(releases.map(r => r.series))
  const series = RELEASE_SERIES_ORDER.filter(s => present.has(s))

  if (series.length === 0) return null

  return (
    <div className="release-legend">
      {series.map(s => {
        const { color } = releaseSeriesStyle(s)
        return (
          <span key={s} style={{ color }}>
            <ReleaseIcon series={s} size={11} /> - {s}
          </span>
        )
      })}
    </div>
  )
}
