import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PaginatedPositionList } from '../components/ui/paginated-position-list'

// Mock SWR — the component should not trigger fetches when hasMore is false
vi.mock('swr', () => ({
  default: vi.fn().mockReturnValue({ data: undefined, error: undefined, isLoading: false, mutate: vi.fn() })
}))

describe('PaginatedPositionList', () => {
  it('renders empty state without error when totalCount is 0', () => {
    render(
      <PaginatedPositionList
        songTitle="Dark Star"
        positionType="opener"
        initialShows={[]}
        totalCount={0}
      />
    )
    expect(screen.queryByText(/Failed to fetch position page/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Load More/)).not.toBeInTheDocument()
  })

  it('hides Load More when initialShows equals totalCount', () => {
    const shows = [
      { id: '1', date: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca', country: 'US', url: '', source: 'setlist.fm' as const }
    ]
    render(
      <PaginatedPositionList
        songTitle="Dark Star"
        positionType="opener"
        initialShows={shows}
        totalCount={1}
      />
    )
    expect(screen.queryByText(/Load More/)).not.toBeInTheDocument()
  })

  it('shows Load More when initialShows is less than totalCount', () => {
    const shows = [
      { id: '1', date: '1977-05-08', venue: 'Barton Hall', city: 'Ithaca', country: 'US', url: '', source: 'setlist.fm' as const }
    ]
    render(
      <PaginatedPositionList
        songTitle="Dark Star"
        positionType="opener"
        initialShows={shows}
        totalCount={5}
      />
    )
    expect(screen.getByText('Load More')).toBeInTheDocument()
  })
})
