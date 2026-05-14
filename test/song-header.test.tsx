import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SongHeader } from '../components/ui/song-header'

describe('SongHeader', () => {
  it('should render song title', () => {
    render(<SongHeader title="Dark Star" />)
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Dark Star')
  })

  it('should render aliases when provided', () => {
    const aliases = ['Dark Star', 'dark star', 'Darkstar']
    render(<SongHeader title="Dark Star" aliases={aliases} />)
    
    expect(screen.getByText('Also known as:')).toBeInTheDocument()
    // Only "Darkstar" should be shown since "dark star" is filtered out (same as title when lowercased)
    expect(screen.getByText('Darkstar')).toBeInTheDocument()
  })

  it('should not render aliases section when no unique aliases', () => {
    const aliases = ['Dark Star', 'Dark Star'] // Same as title
    render(<SongHeader title="Dark Star" aliases={aliases} />)
    
    expect(screen.queryByText('Also known as:')).not.toBeInTheDocument()
  })

  it('should limit aliases to 5 items', () => {
    const aliases = ['Dark Star', 'dark star', 'Darkstar', 'Dark Star Jam', 'Dark Star Reprise', 'Dark Star Outro']
    render(<SongHeader title="Dark Star" aliases={aliases} />)
    
    // Should show 5 aliases (excluding the title itself)
    const aliasElements = screen.getAllByText(/dark star|darkstar|jam|reprise|outro/i)
    expect(aliasElements).toHaveLength(5)
  })

  it('should apply custom className', () => {
    const { container } = render(<SongHeader title="Dark Star" className="custom-class" />)
    
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
