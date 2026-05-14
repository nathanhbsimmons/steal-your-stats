import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PositionList } from '@/components/ui/position-list'
import { ShowRef } from '@/lib/songFacts'

const mockShows: ShowRef[] = [
  {
    id: '1',
    date: '1970-01-01',
    venue: 'Test Venue 1',
    city: 'Test City 1',
    state: 'CA',
    country: 'USA',
    url: 'https://example.com/1',
    source: 'setlist.fm'
  },
  {
    id: '2',
    date: '1970-01-02',
    venue: 'Test Venue 2',
    city: 'Test City 2',
    state: 'NY',
    country: 'USA',
    url: 'https://example.com/2',
    source: 'setlist.fm'
  },
  {
    id: '3',
    date: '1970-01-03',
    venue: 'Test Venue 3',
    city: 'Test City 3',
    country: 'USA',
    url: 'https://example.com/3',
    source: 'setlist.fm'
  }
]

describe('PositionList', () => {
  it('renders empty state when no shows', () => {
    render(
      <PositionList
        shows={[]}
        count={0}
        positionType="opener"
      />
    )

    expect(screen.getByText('No opener performances found')).toBeInTheDocument()
  })

  it('renders shows with correct count', () => {
    render(
      <PositionList
        shows={mockShows}
        count={3}
        positionType="opener"
      />
    )

    expect(screen.getByText('Showing 3 of 3 opener performances')).toBeInTheDocument()
    expect(screen.getByText('1.')).toBeInTheDocument()
    expect(screen.getByText('2.')).toBeInTheDocument()
    expect(screen.getByText('3.')).toBeInTheDocument()
  })

  it('shows load more button when there are more items', () => {
    const manyShows = Array.from({ length: 15 }, (_, i) => ({
      id: `${i + 1}`,
      date: `1970-01-${String(i + 1).padStart(2, '0')}`,
      venue: `Test Venue ${i + 1}`,
      city: `Test City ${i + 1}`,
      country: 'USA',
      url: `https://example.com/${i + 1}`,
      source: 'setlist.fm' as const
    }))

    render(
      <PositionList
        shows={manyShows}
        count={15}
        positionType="opener"
      />
    )

    expect(screen.getByText('Showing 10 of 15 opener performances')).toBeInTheDocument()
    expect(screen.getByText('Load More (5 more)')).toBeInTheDocument()
  })

  it('loads more items when load more is clicked', () => {
    const manyShows = Array.from({ length: 15 }, (_, i) => ({
      id: `${i + 1}`,
      date: `1970-01-${String(i + 1).padStart(2, '0')}`,
      venue: `Test Venue ${i + 1}`,
      city: `Test City ${i + 1}`,
      country: 'USA',
      url: `https://example.com/${i + 1}`,
      source: 'setlist.fm' as const
    }))

    render(
      <PositionList
        shows={manyShows}
        count={15}
        positionType="opener"
      />
    )

    // Initially shows 10 items
    expect(screen.getByText('Showing 10 of 15 opener performances')).toBeInTheDocument()

    // Click load more
    fireEvent.click(screen.getByText('Load More (5 more)'))

    // Now shows all 15 items
    expect(screen.getByText('Showing all 15 opener performances')).toBeInTheDocument()
  })

  it('shows show all button when there are many remaining items', () => {
    const manyShows = Array.from({ length: 25 }, (_, i) => ({
      id: `${i + 1}`,
      date: `1970-01-${String(i + 1).padStart(2, '0')}`,
      venue: `Test Venue ${i + 1}`,
      city: `Test City ${i + 1}`,
      country: 'USA',
      url: `https://example.com/${i + 1}`,
      source: 'setlist.fm' as const
    }))

    render(
      <PositionList
        shows={manyShows}
        count={25}
        positionType="opener"
      />
    )

    expect(screen.getByText('Load More (10 more)')).toBeInTheDocument()
    expect(screen.getByText('Show All (15 remaining)')).toBeInTheDocument()
  })

  it('shows all items when show all is clicked', () => {
    const manyShows = Array.from({ length: 25 }, (_, i) => ({
      id: `${i + 1}`,
      date: `1970-01-${String(i + 1).padStart(2, '0')}`,
      venue: `Test Venue ${i + 1}`,
      city: `Test City ${i + 1}`,
      country: 'USA',
      url: `https://example.com/${i + 1}`,
      source: 'setlist.fm' as const
    }))

    render(
      <PositionList
        shows={manyShows}
        count={25}
        positionType="opener"
      />
    )

    // Click show all
    fireEvent.click(screen.getByText('Show All (15 remaining)'))

    // Now shows all 25 items
    expect(screen.getByText('Showing all 25 opener performances')).toBeInTheDocument()
  })

  it('renders different position types correctly', () => {
    const { rerender } = render(
      <PositionList
        shows={[]}
        count={0}
        positionType="closer"
      />
    )

    expect(screen.getByText('No closer performances found')).toBeInTheDocument()

    rerender(
      <PositionList
        shows={[]}
        count={0}
        positionType="encore"
      />
    )

    expect(screen.getByText('No encore performances found')).toBeInTheDocument()
  })
})
