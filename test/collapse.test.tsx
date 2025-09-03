import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Collapse } from '@/components/ui/collapse'

describe('Collapse', () => {
  it('renders with title and children', () => {
    render(
      <Collapse title="Test Title">
        <div>Test content</div>
      </Collapse>
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('starts closed by default', () => {
    render(
      <Collapse title="Test Title">
        <div>Test content</div>
      </Collapse>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('starts open when defaultOpen is true', () => {
    render(
      <Collapse title="Test Title" defaultOpen={true}>
        <div>Test content</div>
      </Collapse>
    )

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })

  it('toggles open/closed when clicked', () => {
    render(
      <Collapse title="Test Title">
        <div>Test content</div>
      </Collapse>
    )

    const button = screen.getByRole('button')

    // Initially closed
    expect(button).toHaveAttribute('aria-expanded', 'false')

    // Click to open
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')

    // Click to close
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('toggles with keyboard (Enter)', () => {
    render(
      <Collapse title="Test Title">
        <div>Test content</div>
      </Collapse>
    )

    const button = screen.getByRole('button')

    // Initially closed
    expect(button).toHaveAttribute('aria-expanded', 'false')

    // Press Enter to open
    fireEvent.keyDown(button, { key: 'Enter' })
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })

  it('toggles with keyboard (Space)', () => {
    render(
      <Collapse title="Test Title">
        <div>Test content</div>
      </Collapse>
    )

    const button = screen.getByRole('button')

    // Initially closed
    expect(button).toHaveAttribute('aria-expanded', 'false')

    // Press Space to open
    fireEvent.keyDown(button, { key: ' ' })
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })

  it('has proper ARIA attributes', () => {
    render(
      <Collapse title="Test Title" id="test-collapse">
        <div>Test content</div>
      </Collapse>
    )

    const button = screen.getByRole('button')

    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveAttribute('aria-controls', 'test-collapse-content')
  })

  it('updates ARIA attributes when toggled', () => {
    render(
      <Collapse title="Test Title" id="test-collapse">
        <div>Test content</div>
      </Collapse>
    )

    const button = screen.getByRole('button')

    // Initially closed
    expect(button).toHaveAttribute('aria-expanded', 'false')

    // Click to open
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })
})
