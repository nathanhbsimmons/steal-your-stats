import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReleaseLegend } from '@/components/ui/release-badge'
import type { OfficialRelease } from '@/lib/official-releases'

const releases: OfficialRelease[] = [
  { date: '1977-05-08', series: "Dave's Picks", title: "Dave's Picks Vol. 28" },
  { date: '1976-06-09', series: 'Road Trips', title: 'Road Trips Vol. 4 No. 5' },
]

describe('ReleaseLegend', () => {
  it('lists each distinct series present', () => {
    render(<ReleaseLegend releases={releases} />)
    expect(screen.getByText(/Dave's Picks/)).toBeInTheDocument()
    expect(screen.getByText(/Road Trips/)).toBeInTheDocument()
  })

  it('renders nothing when there are no releases', () => {
    const { container } = render(<ReleaseLegend releases={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('does not repeat a series that appears on several shows', () => {
    render(<ReleaseLegend releases={[...releases, releases[0]]} />)
    expect(screen.getAllByText(/Dave's Picks/)).toHaveLength(1)
  })
})
