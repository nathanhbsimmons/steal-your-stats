import { ImageResponse } from 'next/og'
import { getSongPageData } from '@/lib/services/song-page-data'
import { resolveSong } from '@/lib/ids'

export const revalidate = 86400
export const alt = 'Grateful Dead song stats'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { slug: string } }) {
  const songTitle = resolveSong({ title: decodeURIComponent(params.slug) }).displayTitle
  const { facts } = await getSongPageData(songTitle)

  const firstYear = facts.first?.date.slice(0, 4)
  const lastYear = facts.last?.date.slice(0, 4)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#f1e6cf',
          padding: 64,
          border: '14px solid #1a140c',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 22, letterSpacing: 4, color: '#a8391f', textTransform: 'uppercase' }}>
            Grateful Dead · Song Stats
          </div>
          <div style={{ fontFamily: 'serif', fontSize: 88, color: '#1a140c', marginTop: 24, lineHeight: 1.05, display: 'flex' }}>
            {songTitle}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', borderTop: '3px solid #1a140c', paddingTop: 24 }}>
          {facts.totalPerformances > 0 ? (
            <div style={{ fontFamily: 'serif', fontSize: 36, color: '#3a2d1c', display: 'flex' }}>
              Played {facts.totalPerformances} times{firstYear && lastYear ? ` · ${firstYear}–${lastYear}` : ''}
            </div>
          ) : (
            <div style={{ fontFamily: 'serif', fontSize: 36, color: '#3a2d1c', display: 'flex' }}>
              Performance history &amp; stats
            </div>
          )}
          <div style={{ fontFamily: 'monospace', fontSize: 20, color: '#6b5535', marginTop: 8 }}>
            stealyourstats.com
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
