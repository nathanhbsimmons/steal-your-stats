import { render, screen } from '@testing-library/react'
import StyleguidePage from '../app/styleguide/page'

describe('StyleguidePage', () => {
  it('renders the styleguide title', () => {
    render(<StyleguidePage />)
    expect(screen.getByText('Styleguide')).toBeInTheDocument()
  })

  it('renders all major sections', () => {
    render(<StyleguidePage />)
    expect(screen.getByText('Colors & Tokens')).toBeInTheDocument()
    expect(screen.getByText('Typography')).toBeInTheDocument()
    expect(screen.getByText('Buttons')).toBeInTheDocument()
    expect(screen.getByText('Pills')).toBeInTheDocument()
    expect(screen.getByText('Cards')).toBeInTheDocument()
    expect(screen.getByText('Sidebar & NavItem')).toBeInTheDocument()
    expect(screen.getByText('Table')).toBeInTheDocument()
    expect(screen.getByText('Collapse', { selector: 'h2' })).toBeInTheDocument()
    expect(screen.getByText('Player (Docked)')).toBeInTheDocument()
    expect(screen.getByText('States')).toBeInTheDocument()
    expect(screen.getByText('Accessibility Demos')).toBeInTheDocument()
  })

  it('renders the halftone background utility demo', () => {
    render(<StyleguidePage />)
    expect(screen.getByText('Halftone Background Utility')).toBeInTheDocument()
    expect(screen.getByText('Halftone Background Demo')).toBeInTheDocument()
  })

  it('demonstrates typography tokens', () => {
    render(<StyleguidePage />)
    expect(screen.getByText(/H1 — Serif Display \(Playfair Display\)/)).toBeInTheDocument()
    expect(screen.getByText(/Body copy uses a clean sans-serif \(Inter\)/)).toBeInTheDocument()
    expect(screen.getByText(/Mono sample — code\/meta text \(IBM Plex Mono\)/)).toBeInTheDocument()
  })
})
