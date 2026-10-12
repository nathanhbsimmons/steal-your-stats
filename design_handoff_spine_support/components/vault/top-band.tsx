'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

// Replaces components/vault/masthead.tsx + edition-strip.tsx.
// Wordmark and search moved to the spine; date line removed.
export function TopBand() {
  const { data: weather } = useSWR<{ temp: number | null; label: string | null }>(
    '/api/weather',
    fetcher,
    { refreshInterval: 600_000 }
  )
  const temp = weather?.temp != null ? `${weather.temp}°F` : weather ? '' : '…'
  const label = weather?.label ?? ''

  return (
    <header className="top-band">
      <span className="wx l">{temp}</span>
      <div className="sub">
        The <span className="blackletter">Grateful Dead</span> Archive
      </div>
      <span className="wx r" title={label}>{label}</span>
    </header>
  )
}
