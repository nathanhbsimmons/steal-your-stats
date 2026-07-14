import type { OfficialRelease } from '@/lib/official-releases'
import { ReleaseIcon, releaseSeriesStyle } from '@/components/ui/release-icons'

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
      <ReleaseIcon series={primary.series} size={size === 'xs' ? 9 : 10} />
      {label}
    </span>
  )
}
