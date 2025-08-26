import { render, screen } from '@testing-library/react'
import Home from '../app/page'

describe('Home', () => {
  it('renders the app title', () => {
    render(<Home />)
    expect(screen.getByText('Steal Your Stats')).toBeInTheDocument()
  })

  it('renders the app description', () => {
    render(<Home />)
    expect(screen.getByText('App shell ready for development.')).toBeInTheDocument()
  })
})
