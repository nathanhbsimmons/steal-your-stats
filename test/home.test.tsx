import { render, screen } from '@testing-library/react'
import Home from '../app/page'

// Mock fetch for the on-this-day API call
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ shows: [], date: '1977-05-08' }),
})

describe('Home', () => {
  it('renders the On This Day heading', () => {
    render(<Home />)
    expect(screen.getByText('On This Day')).toBeInTheDocument()
  })

  it('renders a loading state initially', () => {
    render(<Home />)
    // Loading skeleton elements should be present while fetch resolves
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
