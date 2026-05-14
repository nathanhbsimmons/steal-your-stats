import { render, screen } from '@testing-library/react'
import Home from '../app/page'

describe('Home', () => {
  it('renders the app title', () => {
    render(<Home />)
    expect(screen.getByText('Steal Your Stats')).toBeInTheDocument()
  })

  it('renders the app description', () => {
    render(<Home />)
    expect(screen.getByText('Explore the complete performance history of your favorite songs with detailed statistics, audio playback, and comprehensive show data.')).toBeInTheDocument()
  })
})
