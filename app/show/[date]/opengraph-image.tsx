import { ImageResponse } from 'next/og'
import { fetchShowDetail } from '@/lib/services/show-detail'

export const revalidate = 86400
export const alt = 'Grateful Dead show setlist'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { date: string } }) {
  const show = await fetchShowDetail(params.date)

  const location = show ? `${show.city}${show.state ? `, ${show.state}` : ''}` : ''

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
            Grateful Dead · Setlist
          </div>
          <div style={{ fontFamily: 'serif', fontSize: 80, color: '#1a140c', marginTop: 24, lineHeight: 1.05, display: 'flex' }}>
            {params.date}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', borderTop: '3px solid #1a140c', paddingTop: 24 }}>
          <div style={{ fontFamily: 'serif', fontSize: 40, color: '#3a2d1c', display: 'flex' }}>
            {show ? show.venue : 'Setlist details'}
          </div>
          <div style={{ fontFamily: 'serif', fontSize: 26, fontStyle: 'italic', color: '#6b5535', marginTop: 4, display: 'flex' }}>
            {show ? `${location}${show.totalSongs ? ` · ${show.totalSongs} songs` : ''}` : ''}
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 20, color: '#6b5535', marginTop: 16 }}>
            stealyourstats.com
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
