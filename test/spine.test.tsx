import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useState } from 'react'
import { Spine, getActiveId } from '@/components/vault/spine'

let mockPathname = '/'
const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: mockPush }),
}))

function Harness({ initialFolded = false }: { initialFolded?: boolean }) {
  const [search, setSearch] = useState('')
  const [folded, setFolded] = useState(initialFolded)
  return <Spine search={search} setSearch={setSearch} folded={folded} setFolded={setFolded} />
}

describe('Spine', () => {
  beforeEach(() => {
    mockPathname = '/'
    mockPush.mockReset()
  })

  it.each([
    ['/', 'home'],
    ['/song/Dark%20Star', 'songs'],
    ['/artists', 'members'],
    ['/support', 'support'],
    ['/show/1977-05-08', 'home'],
  ])('maps %s to the %s chapter', (path, id) => {
    expect(getActiveId(path)).toBe(id)
  })

  it('marks the current chapter', () => {
    mockPathname = '/stats'
    render(<Harness />)
    expect(screen.getByText('Stats').closest('a')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('Home').closest('a')).not.toHaveAttribute('aria-current')
  })

  it('links support with the page it came from', () => {
    mockPathname = '/venues'
    render(<Harness />)
    expect(screen.getByText('Support & feedback')).toHaveAttribute('href', '/support?from=%2Fvenues')
  })

  it('pushes a search on Enter', () => {
    render(<Harness />)
    const input = screen.getByLabelText('Search songs, shows, venues')
    fireEvent.change(input, { target: { value: 'scarlet fire' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mockPush).toHaveBeenCalledWith('/search?q=scarlet%20fire')
  })

  it('focuses search on ⌘K', () => {
    render(<Harness />)
    fireEvent.keyDown(window, { key: 'k', metaKey: true })
    expect(document.activeElement).toBe(screen.getByLabelText('Search songs, shows, venues'))
  })

  it('toggles fold on Ctrl+B and from the notch', () => {
    render(<Harness />)
    expect(screen.getByText('Band Members')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'b', ctrlKey: true })
    expect(screen.queryByText('Band Members')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Band Members')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }))
    expect(screen.getByText('Band Members')).toBeInTheDocument()
  })
})
