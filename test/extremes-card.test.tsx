import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExtremesCard } from '../components/ui/extremes-card'
import { VersionTrack } from '../lib/songFacts'

const mockTracks: VersionTrack[] = [
  {
    id: '1',
    showDate: '2023-01-01',
    venue: 'Test Venue 1',
    city: 'Test City',
    country: 'Test Country',
    durationSec: 300
  },
  {
    id: '2',
    showDate: '2023-01-02',
    venue: 'Test Venue 2',
    city: 'Test City',
    country: 'Test Country',
    durationSec: 600
  },
  {
    id: '3',
    showDate: '2023-01-03',
    venue: 'Test Venue 3',
    city: 'Test City',
    country: 'Test Country',
    durationSec: 180
  },
  {
    id: '4',
    showDate: '2023-01-04',
    venue: 'Test Venue 4',
    city: 'Test City',
    country: 'Test Country',
    durationSec: 10000 // Outlier - needs to be extreme with more data points
  },
  {
    id: '5',
    showDate: '2023-01-05',
    venue: 'Test Venue 5',
    city: 'Test City',
    country: 'Test Country',
    durationSec: 400
  },
  {
    id: '6',
    showDate: '2023-01-06',
    venue: 'Test Venue 6',
    city: 'Test City',
    country: 'Test Country',
    durationSec: 500
  },
  {
    id: '7',
    showDate: '2023-01-07',
    venue: 'Test Venue 7',
    city: 'Test City',
    country: 'Test Country',
    durationSec: 350
  }
]

describe('ExtremesCard', () => {
  it('renders empty state when no tracks with duration', () => {
    const tracksWithoutDuration = mockTracks.map(track => ({ ...track, durationSec: undefined }))
    render(<ExtremesCard tracks={tracksWithoutDuration} />)
    
    expect(screen.getByText('Duration Extremes')).toBeInTheDocument()
    expect(screen.getByText('No duration data available')).toBeInTheDocument()
  })

  it('displays shortest and longest tracks', () => {
    render(<ExtremesCard tracks={mockTracks} />)
    
    expect(screen.getByText('Shortest:')).toBeInTheDocument()
    expect(screen.getByText('Longest:')).toBeInTheDocument()
    
    // Should show shortest track (180 seconds = 3:00)
    expect(screen.getByText('3:00')).toBeInTheDocument()
    expect(screen.getByText('2023-01-03')).toBeInTheDocument()
    expect(screen.getByText(/Test Venue 3/)).toBeInTheDocument()
    
    // Should show longest track (600 seconds = 10:00)
    expect(screen.getByText('10:00')).toBeInTheDocument()
    expect(screen.getByText('2023-01-02')).toBeInTheDocument()
    expect(screen.getByText(/Test Venue 2/)).toBeInTheDocument()
  })

  it('shows outlier toggle when more than 2 tracks', () => {
    render(<ExtremesCard tracks={mockTracks} />)
    
    expect(screen.getByText('Include outliers')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
  })

  it('does not show outlier toggle when 2 or fewer tracks', () => {
    const fewTracks = mockTracks.slice(0, 2)
    render(<ExtremesCard tracks={fewTracks} />)
    
    expect(screen.queryByText('Include outliers')).not.toBeInTheDocument()
  })

  it('excludes outliers by default', () => {
    render(<ExtremesCard tracks={mockTracks} />)

    // Should not include the outlier (10000 seconds)
    expect(screen.getByText('10:00')).toBeInTheDocument() // 600 seconds (longest non-outlier)
    expect(screen.queryByText('166:40')).not.toBeInTheDocument() // 10000 seconds (outlier)
  })

  it('includes outliers when toggle is checked', () => {
    render(<ExtremesCard tracks={mockTracks} />)

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    // Should now include the outlier
    expect(screen.getByText('166:40')).toBeInTheDocument() // 10000 seconds (outlier)
  })

  it('calls onPlayTrack when play buttons are clicked', () => {
    const mockOnPlayTrack = vi.fn()
    render(<ExtremesCard tracks={mockTracks} onPlayTrack={mockOnPlayTrack} />)
    
    const playButtons = screen.getAllByText('Play')
    expect(playButtons).toHaveLength(2) // One for shortest, one for longest
    
    fireEvent.click(playButtons[0]) // Click shortest play button
    fireEvent.click(playButtons[1]) // Click longest play button
    
    expect(mockOnPlayTrack).toHaveBeenCalledTimes(2)
  })

  it('shows track count information', () => {
    render(<ExtremesCard tracks={mockTracks} />)
    
    expect(screen.getByText(/Showing.*of.*tracks with duration data/)).toBeInTheDocument()
    expect(screen.getByText(/excluding.*outliers/)).toBeInTheDocument()
  })

  it('shows correct count when outliers are included', () => {
    render(<ExtremesCard tracks={mockTracks} />)

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(screen.getByText(/Showing 7 of 7 tracks with duration data/)).toBeInTheDocument()
    expect(screen.queryByText(/excluding/)).not.toBeInTheDocument()
  })

  it('handles tracks with state information', () => {
    const tracksWithState = mockTracks.map(track => ({ ...track, state: 'CA' }))
    render(<ExtremesCard tracks={tracksWithState} />)

    // Both shortest and longest tracks should show state info
    const matches = screen.getAllByText(/Test City.*CA/)
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('formats duration correctly', () => {
    render(<ExtremesCard tracks={mockTracks} />)

    // Check duration format with outliers excluded (default)
    expect(screen.getByText('3:00')).toBeInTheDocument() // 180 seconds (shortest)
    expect(screen.getByText('10:00')).toBeInTheDocument() // 600 seconds (longest non-outlier)

    // Toggle to include outliers and check extreme duration format
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    expect(screen.getByText('166:40')).toBeInTheDocument() // 10000 seconds (outlier)
  })

  it('handles empty tracks array', () => {
    render(<ExtremesCard tracks={[]} />)
    
    expect(screen.getByText('No duration data available')).toBeInTheDocument()
  })
})
