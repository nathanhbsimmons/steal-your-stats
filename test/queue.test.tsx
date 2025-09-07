import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Queue } from '../components/ui/queue'
import { Track } from '../components/ui/audio-player-dock'

describe('Queue', () => {
  const mockTracks: Track[] = [
    {
      id: '1',
      name: 'Dark Star',
      url: 'https://example.com/dark-star.mp3',
      showDate: '1970-01-01',
      venue: 'Test Venue',
      city: 'Test City',
      archiveItemId: 'gd1970-01-01'
    },
    {
      id: '2',
      name: 'Sugar Magnolia',
      url: 'https://example.com/sugar-magnolia.mp3',
      showDate: '1970-01-01',
      venue: 'Test Venue',
      city: 'Test City',
      archiveItemId: 'gd1970-01-01'
    }
  ]

  const defaultProps = {
    tracks: mockTracks,
    currentTrackId: '1',
    onTrackSelect: vi.fn(),
    onTrackRemove: vi.fn(),
    onClearQueue: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render empty state when no tracks', () => {
    render(<Queue {...defaultProps} tracks={[]} />)

    expect(screen.getByText('Queue is empty')).toBeInTheDocument()
  })

  it('should render track list', () => {
    render(<Queue {...defaultProps} />)

    expect(screen.getByText('Queue (2)')).toBeInTheDocument()
    expect(screen.getByText('Dark Star')).toBeInTheDocument()
    expect(screen.getByText('Sugar Magnolia')).toBeInTheDocument()
  })

  it('should highlight current track', () => {
    render(<Queue {...defaultProps} currentTrackId="1" />)

    // Find the track container by looking for the element with border-ink class
    const trackContainer = screen.getByText('Dark Star').closest('[class*="border-ink"]')
    expect(trackContainer).toHaveClass('border-ink')
  })

  it('should call onTrackSelect when track is clicked', () => {
    render(<Queue {...defaultProps} />)

    const darkStarButton = screen.getByLabelText('Play track 1: Dark Star')
    fireEvent.click(darkStarButton)

    expect(defaultProps.onTrackSelect).toHaveBeenCalledWith(mockTracks[0])
  })

  it('should call onTrackRemove when remove button is clicked', () => {
    render(<Queue {...defaultProps} />)

    const removeButton = screen.getByLabelText('Remove track 1: Dark Star')
    fireEvent.click(removeButton)

    expect(defaultProps.onTrackRemove).toHaveBeenCalledWith('1')
  })

  it('should call onClearQueue when clear button is clicked', () => {
    render(<Queue {...defaultProps} />)

    const clearButton = screen.getByText('Clear')
    fireEvent.click(clearButton)

    expect(defaultProps.onClearQueue).toHaveBeenCalled()
  })

  it('should not render clear button when queue is empty', () => {
    render(<Queue {...defaultProps} tracks={[]} />)

    expect(screen.queryByText('Clear')).not.toBeInTheDocument()
  })

  it('should render track numbers', () => {
    render(<Queue {...defaultProps} />)

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('should render track details', () => {
    render(<Queue {...defaultProps} />)

    expect(screen.getAllByText('1970-01-01 • Test Venue, Test City')).toHaveLength(2)
  })
})
