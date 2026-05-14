import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FactRow } from '../components/ui/fact-row'
import { ShowRef } from '../lib/songFacts'

describe('FactRow', () => {
  const mockShow: ShowRef = {
    id: 'setlist1',
    date: '1965-05-05',
    venue: 'Fillmore Auditorium',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    url: 'https://www.setlist.fm/setlist/setlist1',
    source: 'setlist.fm',
  }

  it('should render show data when show is provided', () => {
    render(<FactRow label="First Performance" show={mockShow} />)
    
    expect(screen.getByText('First Performance')).toBeInTheDocument()
    expect(screen.getByText('May 5, 1965')).toBeInTheDocument()
    expect(screen.getByText('Fillmore Auditorium, San Francisco, CA, USA')).toBeInTheDocument()
    expect(screen.getByText('View on setlist.fm')).toBeInTheDocument()
  })

  it('should render "No data available" when show is null', () => {
    render(<FactRow label="First Performance" show={null} />)
    
    expect(screen.getByText('First Performance')).toBeInTheDocument()
    expect(screen.getByText('No data available')).toBeInTheDocument()
  })

  it('should format date correctly', () => {
    render(<FactRow label="Test" show={mockShow} />)
    
    expect(screen.getByText('May 5, 1965')).toBeInTheDocument()
  })

  it('should handle shows without state', () => {
    const showWithoutState: ShowRef = {
      ...mockShow,
      state: undefined,
    }
    
    render(<FactRow label="Test" show={showWithoutState} />)
    
    expect(screen.getByText('Fillmore Auditorium, San Francisco, USA')).toBeInTheDocument()
  })

  it('should create external link with correct attributes', () => {
    render(<FactRow label="Test" show={mockShow} />)
    
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', 'https://www.setlist.fm/setlist/setlist1')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('should apply custom className', () => {
    const { container } = render(<FactRow label="Test" show={mockShow} className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('should handle invalid date gracefully', () => {
    const showWithInvalidDate: ShowRef = {
      ...mockShow,
      date: 'invalid-date',
    }
    
    render(<FactRow label="Test" show={showWithInvalidDate} />)
    
    // The component should display "Invalid Date" when the date parsing fails
    expect(screen.getByText('Invalid Date')).toBeInTheDocument()
  })
})
