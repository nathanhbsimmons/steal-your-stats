import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AudioPlayerDock, Track } from '../components/ui/audio-player-dock'

// Mock HTMLAudioElement
const mockAudio = {
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  currentTime: 0,
  duration: 0,
  volume: 1
}

Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: mockAudio.play
})

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  writable: true,
  value: mockAudio.pause
})

Object.defineProperty(HTMLMediaElement.prototype, 'addEventListener', {
  writable: true,
  value: mockAudio.addEventListener
})

Object.defineProperty(HTMLMediaElement.prototype, 'removeEventListener', {
  writable: true,
  value: mockAudio.removeEventListener
})

describe('AudioPlayerDock', () => {
  const mockTrack: Track = {
    id: '1',
    name: 'Dark Star',
    url: 'https://example.com/dark-star.mp3',
    showDate: '1970-01-01',
    venue: 'Test Venue',
    city: 'Test City',
    archiveItemId: 'gd1970-01-01',
    licenseUrl: 'https://example.com/license',
    rights: 'Public Domain'
  }

  const defaultProps = {
    currentTrack: mockTrack,
    isPlaying: false,
    onPlay: vi.fn(),
    onPause: vi.fn(),
    onNext: vi.fn(),
    onPrevious: vi.fn(),
    onTrackSelect: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render track information', () => {
    render(<AudioPlayerDock {...defaultProps} />)

    expect(screen.getByText('Dark Star')).toBeInTheDocument()
    expect(screen.getByText('1970-01-01 • Test Venue, Test City')).toBeInTheDocument()
  })

  it('should render empty state when no track', () => {
    render(<AudioPlayerDock {...defaultProps} currentTrack={undefined} />)

    expect(screen.getByText('No track selected')).toBeInTheDocument()
  })

  it('should call onPlay when play button is clicked', () => {
    render(<AudioPlayerDock {...defaultProps} />)

    const playButton = screen.getByLabelText('Play')
    fireEvent.click(playButton)

    expect(defaultProps.onPlay).toHaveBeenCalled()
  })

  it('should call onPause when pause button is clicked', () => {
    render(<AudioPlayerDock {...defaultProps} isPlaying={true} />)

    const pauseButton = screen.getByLabelText('Pause')
    fireEvent.click(pauseButton)

    expect(defaultProps.onPause).toHaveBeenCalled()
  })

  it('should call onNext when next button is clicked', () => {
    render(<AudioPlayerDock {...defaultProps} />)

    const nextButton = screen.getByLabelText('Next track')
    fireEvent.click(nextButton)

    expect(defaultProps.onNext).toHaveBeenCalled()
  })

  it('should call onPrevious when previous button is clicked', () => {
    render(<AudioPlayerDock {...defaultProps} />)

    const prevButton = screen.getByLabelText('Previous track')
    fireEvent.click(prevButton)

    expect(defaultProps.onPrevious).toHaveBeenCalled()
  })

  it('should render license information when available', () => {
    render(<AudioPlayerDock {...defaultProps} />)

    expect(screen.getByText('Public Domain')).toBeInTheDocument()
    expect(screen.getByText('View License')).toBeInTheDocument()
  })

  it('should not render license information when not available', () => {
    const trackWithoutLicense = { ...mockTrack, licenseUrl: undefined, rights: undefined }
    
    render(<AudioPlayerDock {...defaultProps} currentTrack={trackWithoutLicense} />)

    expect(screen.queryByText('View License')).not.toBeInTheDocument()
  })

  it('should show play icon when not playing', () => {
    render(<AudioPlayerDock {...defaultProps} isPlaying={false} />)

    const playButton = screen.getByLabelText('Play')
    expect(playButton).toBeInTheDocument()
  })

  it('should show pause icon when playing', () => {
    render(<AudioPlayerDock {...defaultProps} isPlaying={true} />)

    const pauseButton = screen.getByLabelText('Pause')
    expect(pauseButton).toBeInTheDocument()
  })
})
