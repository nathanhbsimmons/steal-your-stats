import { render, screen } from '@testing-library/react'
import { PlayerProvider } from '@/lib/contexts/player-context'
import Home from '../app/page'

// Mock fetch for all home-page API calls
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ shows: [], date: '1977-05-08' }),
})

function renderHome() {
  return render(
    <PlayerProvider>
      <Home />
    </PlayerProvider>
  )
}

describe('Home', () => {
  it('renders the On This Day heading', () => {
    renderHome()
    expect(screen.getByText(/On This Day/)).toBeInTheDocument()
  })

  it('renders a loading state initially', () => {
    renderHome()
    const skeletons = document.querySelectorAll('.skeleton-vault')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})
