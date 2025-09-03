import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SearchResults, SearchResult } from '@/components/ui/search-results'

const mockResults: SearchResult[] = [
  {
    id: '1',
    title: 'Test Song 1',
    subtitle: 'Track • 4:32',
    description: 'A test song description'
  },
  {
    id: '2',
    title: 'Test Song 2',
    subtitle: 'Track • 3:45',
    description: 'Another test song'
  }
]

describe('SearchResults', () => {
  it('renders idle state', () => {
    const mockOnSelect = vi.fn()
    
    render(
      <SearchResults
        results={[]}
        state="idle"
        onSelect={mockOnSelect}
      />
    )
    
    expect(screen.getByText('Start typing to search for items')).toBeInTheDocument()
  })

  it('renders loading state with skeleton', () => {
    const mockOnSelect = vi.fn()
    
    render(
      <SearchResults
        results={[]}
        state="loading"
        onSelect={mockOnSelect}
      />
    )
    
    // Should have skeleton loading elements
    const skeletons = screen.getAllByRole('generic')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders empty state', () => {
    const mockOnSelect = vi.fn()
    
    render(
      <SearchResults
        results={[]}
        state="empty"
        onSelect={mockOnSelect}
      />
    )
    
    expect(screen.getByText('No results found. Try different search terms.')).toBeInTheDocument()
  })

  it('renders error state', () => {
    const mockOnSelect = vi.fn()
    
    render(
      <SearchResults
        results={[]}
        state="error"
        onSelect={mockOnSelect}
      />
    )
    
    expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
  })

  it('renders success state with results', () => {
    const mockOnSelect = vi.fn()
    
    render(
      <SearchResults
        results={mockResults}
        state="success"
        onSelect={mockOnSelect}
      />
    )
    
    expect(screen.getByText('Test Song 1')).toBeInTheDocument()
    expect(screen.getByText('Test Song 2')).toBeInTheDocument()
    expect(screen.getByText('Track • 4:32')).toBeInTheDocument()
    expect(screen.getByText('A test song description')).toBeInTheDocument()
  })

  it('calls onSelect when result is clicked', () => {
    const mockOnSelect = vi.fn()
    
    render(
      <SearchResults
        results={mockResults}
        state="success"
        onSelect={mockOnSelect}
      />
    )
    
    const firstResult = screen.getByText('Test Song 1').closest('button')
    fireEvent.click(firstResult!)
    
    expect(mockOnSelect).toHaveBeenCalledWith(mockResults[0])
  })

  it('handles keyboard navigation', () => {
    const mockOnSelect = vi.fn()
    
    render(
      <SearchResults
        results={mockResults}
        state="success"
        onSelect={mockOnSelect}
      />
    )
    
    const container = screen.getByRole('listbox')
    
    // Arrow down should select first item
    fireEvent.keyDown(container, { key: 'ArrowDown' })
    const firstButton = screen.getByText('Test Song 1').closest('button')
    expect(firstButton).toHaveAttribute('aria-selected', 'true')
    
    // Arrow down again should select second item
    fireEvent.keyDown(container, { key: 'ArrowDown' })
    const secondButton = screen.getByText('Test Song 2').closest('button')
    expect(secondButton).toHaveAttribute('aria-selected', 'true')
    expect(firstButton).toHaveAttribute('aria-selected', 'false')
    
    // Arrow up should go back to first item
    fireEvent.keyDown(container, { key: 'ArrowUp' })
    expect(firstButton).toHaveAttribute('aria-selected', 'true')
    expect(secondButton).toHaveAttribute('aria-selected', 'false')
  })

  it('calls onSelect when Enter is pressed on selected item', () => {
    const mockOnSelect = vi.fn()
    
    render(
      <SearchResults
        results={mockResults}
        state="success"
        onSelect={mockOnSelect}
      />
    )
    
    const container = screen.getByRole('listbox')
    
    // Select first item and press Enter
    fireEvent.keyDown(container, { key: 'ArrowDown' })
    fireEvent.keyDown(container, { key: 'Enter' })
    
    expect(mockOnSelect).toHaveBeenCalledWith(mockResults[0])
  })

  it('handles Escape key to clear selection', () => {
    const mockOnSelect = vi.fn()
    
    render(
      <SearchResults
        results={mockResults}
        state="success"
        onSelect={mockOnSelect}
      />
    )
    
    const container = screen.getByRole('listbox')
    
    // Select first item
    fireEvent.keyDown(container, { key: 'ArrowDown' })
    const firstButton = screen.getByText('Test Song 1').closest('button')
    expect(firstButton).toHaveAttribute('aria-selected', 'true')
    
    // Press Escape
    fireEvent.keyDown(container, { key: 'Escape' })
    expect(firstButton).toHaveAttribute('aria-selected', 'false')
  })

  it('wraps around when navigating past boundaries', () => {
    const mockOnSelect = vi.fn()
    
    render(
      <SearchResults
        results={mockResults}
        state="success"
        onSelect={mockOnSelect}
      />
    )
    
    const container = screen.getByRole('listbox')
    
    // Arrow up from no selection should go to last item
    fireEvent.keyDown(container, { key: 'ArrowUp' })
    const lastButton = screen.getByText('Test Song 2').closest('button')
    expect(lastButton).toHaveAttribute('aria-selected', 'true')
    
    // Arrow down from last item should go to first item
    fireEvent.keyDown(container, { key: 'ArrowDown' })
    const firstButton = screen.getByText('Test Song 1').closest('button')
    expect(firstButton).toHaveAttribute('aria-selected', 'true')
    expect(lastButton).toHaveAttribute('aria-selected', 'false')
  })

  it('supports aria-labelledby and aria-describedby', () => {
    const mockOnSelect = vi.fn()
    
    render(
      <SearchResults
        results={[]}
        state="idle"
        onSelect={mockOnSelect}
        aria-labelledby="search-label"
        aria-describedby="search-description"
      />
    )
    
    const container = screen.getByRole('listbox')
    expect(container).toHaveAttribute('aria-labelledby', 'search-label')
    expect(container).toHaveAttribute('aria-describedby', 'search-description')
  })
})
