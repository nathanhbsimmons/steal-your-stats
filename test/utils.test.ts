import { describe, it, expect } from 'vitest'
import { computeExtremes, formatDuration, fromSetlistDate, toSetlistDate } from '../lib/utils'
import { VersionTrack } from '../lib/songFacts'

describe('computeExtremes', () => {
  it('returns undefined extremes for empty tracks', () => {
    const result = computeExtremes([])
    expect(result.longest).toBeUndefined()
    expect(result.shortest).toBeUndefined()
  })

  it('returns undefined extremes for tracks without duration', () => {
    const tracks: VersionTrack[] = [
      {
        id: '1',
        showDate: '2023-01-01',
        venue: 'Test Venue',
        city: 'Test City',
        country: 'Test Country'
      }
    ]
    const result = computeExtremes(tracks)
    expect(result.longest).toBeUndefined()
    expect(result.shortest).toBeUndefined()
  })

  it('returns correct extremes for tracks with duration', () => {
    const tracks: VersionTrack[] = [
      {
        id: '1',
        showDate: '2023-01-01',
        venue: 'Test Venue',
        city: 'Test City',
        country: 'Test Country',
        durationSec: 300 // 5 minutes
      },
      {
        id: '2',
        showDate: '2023-01-02',
        venue: 'Test Venue',
        city: 'Test City',
        country: 'Test Country',
        durationSec: 600 // 10 minutes
      },
      {
        id: '3',
        showDate: '2023-01-03',
        venue: 'Test Venue',
        city: 'Test City',
        country: 'Test Country',
        durationSec: 120 // 2 minutes
      }
    ]
    const result = computeExtremes(tracks)
    expect(result.shortest?.id).toBe('3')
    expect(result.longest?.id).toBe('2')
  })

  it('excludes outliers when includeOutliers is false', () => {
    // Need enough data points for the 2-stddev algorithm to detect outliers
    const tracks: VersionTrack[] = [
      {
        id: '1',
        showDate: '2023-01-01',
        venue: 'Test Venue',
        city: 'Test City',
        country: 'Test Country',
        durationSec: 300 // 5 minutes
      },
      {
        id: '2',
        showDate: '2023-01-02',
        venue: 'Test Venue',
        city: 'Test City',
        country: 'Test Country',
        durationSec: 320 // 5.33 minutes
      },
      {
        id: '3',
        showDate: '2023-01-03',
        venue: 'Test Venue',
        city: 'Test City',
        country: 'Test Country',
        durationSec: 310 // 5.17 minutes
      },
      {
        id: '4',
        showDate: '2023-01-04',
        venue: 'Test Venue',
        city: 'Test City',
        country: 'Test Country',
        durationSec: 290 // 4.83 minutes
      },
      {
        id: '5',
        showDate: '2023-01-05',
        venue: 'Test Venue',
        city: 'Test City',
        country: 'Test Country',
        durationSec: 305 // 5.08 minutes
      },
      {
        id: '6',
        showDate: '2023-01-06',
        venue: 'Test Venue',
        city: 'Test City',
        country: 'Test Country',
        durationSec: 315 // 5.25 minutes
      },
      {
        id: '7',
        showDate: '2023-01-07',
        venue: 'Test Venue',
        city: 'Test City',
        country: 'Test Country',
        durationSec: 10000 // extreme outlier
      }
    ]
    const result = computeExtremes(tracks, false)

    // Should exclude the extreme outlier (10000 seconds)
    expect(result.shortest?.id).toBe('4') // 290 seconds
    expect(result.longest?.id).toBe('2') // 320 seconds, the highest non-outlier
  })

  it('includes outliers when includeOutliers is true', () => {
    const tracks: VersionTrack[] = [
      {
        id: '1',
        showDate: '2023-01-01',
        venue: 'Test Venue',
        city: 'Test City',
        country: 'Test Country',
        durationSec: 300 // 5 minutes
      },
      {
        id: '2',
        showDate: '2023-01-02',
        venue: 'Test Venue',
        city: 'Test City',
        country: 'Test Country',
        durationSec: 320 // 5.33 minutes
      },
      {
        id: '4',
        showDate: '2023-01-04',
        venue: 'Test Venue',
        city: 'Test City',
        country: 'Test Country',
        durationSec: 1800 // 30 minutes (outlier)
      }
    ]
    const result = computeExtremes(tracks, true)
    // Should include the outlier
    expect(result.shortest?.id).toBe('1')
    expect(result.longest?.id).toBe('4')
  })

  it('handles tracks with mixed duration data', () => {
    const tracks: VersionTrack[] = [
      {
        id: '1',
        showDate: '2023-01-01',
        venue: 'Test Venue',
        city: 'Test City',
        country: 'Test Country',
        durationSec: 300
      },
      {
        id: '2',
        showDate: '2023-01-02',
        venue: 'Test Venue',
        city: 'Test City',
        country: 'Test Country'
        // No duration
      },
      {
        id: '3',
        showDate: '2023-01-03',
        venue: 'Test Venue',
        city: 'Test City',
        country: 'Test Country',
        durationSec: 600
      }
    ]
    const result = computeExtremes(tracks)
    expect(result.shortest?.id).toBe('1')
    expect(result.longest?.id).toBe('3')
  })
})

describe('formatDuration', () => {
  it('formats seconds correctly', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(30)).toBe('0:30')
    expect(formatDuration(60)).toBe('1:00')
    expect(formatDuration(90)).toBe('1:30')
    expect(formatDuration(3661)).toBe('61:01')
  })

  it('handles decimal seconds', () => {
    expect(formatDuration(30.7)).toBe('0:30')
    expect(formatDuration(90.9)).toBe('1:30')
  })
})

describe('fromSetlistDate', () => {
  it('converts DD-MM-YYYY to YYYY-MM-DD', () => {
    expect(fromSetlistDate('08-05-1977')).toBe('1977-05-08')
    expect(fromSetlistDate('01-01-1968')).toBe('1968-01-01')
    expect(fromSetlistDate('29-03-1995')).toBe('1995-03-29')
  })

  it('returns the input unchanged when already YYYY-MM-DD', () => {
    expect(fromSetlistDate('1977-05-08')).toBe('1977-05-08')
  })

  it('returns the input unchanged for unexpected formats', () => {
    expect(fromSetlistDate('invalid')).toBe('invalid')
  })
})

describe('toSetlistDate', () => {
  it('converts YYYY-MM-DD to DD-MM-YYYY', () => {
    expect(toSetlistDate('1977-05-08')).toBe('08-05-1977')
    expect(toSetlistDate('1968-01-01')).toBe('01-01-1968')
  })

  it('returns the input unchanged when already DD-MM-YYYY', () => {
    expect(toSetlistDate('08-05-1977')).toBe('08-05-1977')
  })
})
