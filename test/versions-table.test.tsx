import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VersionsTable } from '../components/ui/versions-table'
import { VersionTrack } from '../lib/songFacts'

const mockTracks: VersionTrack[] = [
  {
    id: '1',
    showDate: '2023-01-01',
    venue: 'Test Venue 1',
    city: 'Test City',
    country: 'Test Country',
    durationSec: 300,
    url: 'http://example.com/track1.mp3'
  },
  {
    id: '2',
    showDate: '2023-01-02',
    venue: 'Test Venue 2',
    city: 'Test City',
    country: 'Test Country',
    durationSec: 600,
    url: 'http://example.com/track2.mp3'
  },
  {
    id: '3',
    showDate: '2023-01-03',
    venue: 'Test Venue 3',
    city: 'Test City',
    country: 'Test Country',
    durationSec: 180,
    url: 'http://example.com/track3.mp3'
  }
]

describe('VersionsTable', () => {
  it('renders empty state when no tracks', () => {
    render(<VersionsTable tracks={[]} />)
    expect(screen.getByText('No versions found')).toBeInTheDocument()
  })

  it('renders tracks with proper formatting', () => {
    render(<VersionsTable tracks={mockTracks} />)
    
    expect(screen.getByText('2023-01-01')).toBeInTheDocument()
    expect(screen.getByText('2023-01-02')).toBeInTheDocument()
    expect(screen.getByText('2023-01-03')).toBeInTheDocument()
    
    expect(screen.getByText('Test Venue 1')).toBeInTheDocument()
    expect(screen.getByText('Test Venue 2')).toBeInTheDocument()
    expect(screen.getByText('Test Venue 3')).toBeInTheDocument()
    
    expect(screen.getByText('5:00')).toBeInTheDocument()
    expect(screen.getByText('10:00')).toBeInTheDocument()
    expect(screen.getByText('3:00')).toBeInTheDocument()
  })

  it('shows play buttons for tracks with URLs', () => {
    const mockOnPlayTrack = vi.fn()
    render(<VersionsTable tracks={mockTracks} onPlayTrack={mockOnPlayTrack} />)
    
    const playButtons = screen.getAllByText('Play')
    expect(playButtons).toHaveLength(3)
  })

  it('does not show play buttons for tracks without URLs', () => {
    const tracksWithoutUrls = mockTracks.map(track => ({ ...track, url: undefined }))
    render(<VersionsTable tracks={tracksWithoutUrls} />)
    
    expect(screen.queryByText('Play')).not.toBeInTheDocument()
  })

  it('shows extreme badges for longest and shortest tracks', () => {
    const longestTrack = mockTracks[1] // 600 seconds
    const shortestTrack = mockTracks[2] // 180 seconds
    
    render(
      <VersionsTable 
        tracks={mockTracks} 
        longestTrack={longestTrack}
        shortestTrack={shortestTrack}
      />
    )
    
    expect(screen.getByText('Longest')).toBeInTheDocument()
    expect(screen.getByText('Shortest')).toBeInTheDocument()
  })

  it('sorts by date when date header is clicked', () => {
    render(<VersionsTable tracks={mockTracks} />)
    
    const dateHeader = screen.getByText('Date ↓')
    fireEvent.click(dateHeader)
    
    // Should now be sorted ascending by date (after clicking to change direction)
    const dateCells = screen.getAllByText(/2023-01-/)
    expect(dateCells[0]).toHaveTextContent('2023-01-01')
    expect(dateCells[1]).toHaveTextContent('2023-01-02')
    expect(dateCells[2]).toHaveTextContent('2023-01-03')
  })

  it('sorts by duration when duration header is clicked', () => {
    render(<VersionsTable tracks={mockTracks} />)
    
    const durationHeader = screen.getByText('Duration ↕')
    fireEvent.click(durationHeader)
    
    // Should be sorted ascending by duration (shortest first)
    const durationCells = screen.getAllByText(/:\d{2}/)
    expect(durationCells[0]).toHaveTextContent('3:00') // 180 seconds
    expect(durationCells[1]).toHaveTextContent('5:00') // 300 seconds
    expect(durationCells[2]).toHaveTextContent('10:00') // 600 seconds
  })

  it('sorts by venue when venue header is clicked', () => {
    render(<VersionsTable tracks={mockTracks} />)
    
    const venueHeader = screen.getByText('Venue ↕')
    fireEvent.click(venueHeader)
    
    // Should be sorted alphabetically by venue
    const venueCells = screen.getAllByText(/Test Venue \d/)
    expect(venueCells[0]).toHaveTextContent('Test Venue 1')
    expect(venueCells[1]).toHaveTextContent('Test Venue 2')
    expect(venueCells[2]).toHaveTextContent('Test Venue 3')
  })

  it('calls onPlayTrack when play button is clicked', () => {
    const mockOnPlayTrack = vi.fn()
    render(<VersionsTable tracks={mockTracks} onPlayTrack={mockOnPlayTrack} />)
    
    const playButtons = screen.getAllByText('Play')
    fireEvent.click(playButtons[0])
    
    // The table sorts by date descending by default, so the first play button corresponds to the last track
    expect(mockOnPlayTrack).toHaveBeenCalledWith(mockTracks[2]) // 2023-01-03 (last in sorted order)
  })

  it('handles keyboard navigation', () => {
    render(<VersionsTable tracks={mockTracks} />)
    
    const table = screen.getByRole('table')
    fireEvent.keyDown(table, { key: 'ArrowDown' })
    fireEvent.keyDown(table, { key: 'ArrowDown' })
    
    // Focus should be on the second row
    const focusedRow = document.activeElement
    expect(focusedRow).toHaveTextContent('2023-01-02')
  })

  it('handles Enter key to play track', () => {
    const mockOnPlayTrack = vi.fn()
    render(<VersionsTable tracks={mockTracks} onPlayTrack={mockOnPlayTrack} />)
    
    const table = screen.getByRole('table')
    fireEvent.keyDown(table, { key: 'ArrowDown' })
    fireEvent.keyDown(table, { key: 'Enter' })
    
    // The table sorts by date descending by default, so the first focused row corresponds to the last track
    expect(mockOnPlayTrack).toHaveBeenCalledWith(mockTracks[2]) // 2023-01-03 (last in sorted order)
  })

  it('handles Ctrl+S to cycle sort fields', () => {
    render(<VersionsTable tracks={mockTracks} />)
    
    const table = screen.getByRole('table')
    fireEvent.keyDown(table, { key: 's', ctrlKey: true })
    
    // Should cycle from date to duration
    expect(screen.getByText('Duration ↑')).toBeInTheDocument()
  })

  it('shows duration as dash when duration is undefined', () => {
    const tracksWithoutDuration = mockTracks.map(track => ({ ...track, durationSec: undefined }))
    render(<VersionsTable tracks={tracksWithoutDuration} />)
    
    const dashes = screen.getAllByText('—')
    expect(dashes).toHaveLength(3) // One for each track
  })

  it('displays track count in help text', () => {
    render(<VersionsTable tracks={mockTracks} />)
    
    expect(screen.getByText(/Showing 3 version/)).toBeInTheDocument()
  })
})
