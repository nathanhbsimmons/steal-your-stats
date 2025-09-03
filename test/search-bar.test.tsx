import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SearchBar } from '@/components/ui/search-bar'

describe('SearchBar', () => {
  it('renders with label and placeholder', () => {
    const mockOnChange = vi.fn()
    const mockOnClear = vi.fn()
    
    render(
      <SearchBar
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
        placeholder="Search..."
        label="Search"
      />
    )
    
    const input = screen.getByRole('combobox')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('placeholder', 'Search...')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input).toHaveAttribute('aria-autocomplete', 'list')
  })

  it('calls onChange with debounced value', async () => {
    const mockOnChange = vi.fn()
    const mockOnClear = vi.fn()
    
    render(
      <SearchBar
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    )
    
    const input = screen.getByRole('combobox')
    fireEvent.change(input, { target: { value: 'test' } })
    
    // Should not call immediately
    expect(mockOnChange).not.toHaveBeenCalled()
    
    // Should call after debounce delay
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('test')
    }, { timeout: 500 })
  })

  it('shows clear button when value is present', () => {
    const mockOnChange = vi.fn()
    const mockOnClear = vi.fn()
    
    render(
      <SearchBar
        value="test"
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    )
    
    const clearButton = screen.getByLabelText('Clear search')
    expect(clearButton).toBeInTheDocument()
  })

  it('hides clear button when value is empty', () => {
    const mockOnChange = vi.fn()
    const mockOnClear = vi.fn()
    
    render(
      <SearchBar
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    )
    
    const clearButton = screen.queryByLabelText('Clear search')
    expect(clearButton).not.toBeInTheDocument()
  })

  it('calls onClear when clear button is clicked', () => {
    const mockOnChange = vi.fn()
    const mockOnClear = vi.fn()
    
    render(
      <SearchBar
        value="test"
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    )
    
    const clearButton = screen.getByLabelText('Clear search')
    fireEvent.click(clearButton)
    
    expect(mockOnClear).toHaveBeenCalled()
  })

  it('respects disabled state', () => {
    const mockOnChange = vi.fn()
    const mockOnClear = vi.fn()
    
    render(
      <SearchBar
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
        disabled={true}
      />
    )
    
    const input = screen.getByRole('combobox')
    expect(input).toBeDisabled()
  })

  it('supports aria-describedby', () => {
    const mockOnChange = vi.fn()
    const mockOnClear = vi.fn()
    
    render(
      <SearchBar
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
        aria-describedby="help-text"
      />
    )
    
    const input = screen.getByRole('combobox')
    expect(input).toHaveAttribute('aria-describedby', 'help-text')
  })
})
