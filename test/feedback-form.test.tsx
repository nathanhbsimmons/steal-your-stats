import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { FeedbackForm } from '@/components/support/feedback-form'

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('from=%2Fsongs'),
}))

const fetchMock = vi.fn()

function fill({ type = 'Bug', message = 'The skip button does nothing.', email = '' } = {}) {
  if (type) fireEvent.click(screen.getByLabelText(type))
  fireEvent.change(screen.getByLabelText(/Message/), { target: { value: message } })
  if (email) fireEvent.change(screen.getByLabelText(/Email/), { target: { value: email } })
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }))
}

describe('FeedbackForm', () => {
  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => vi.unstubAllGlobals())

  it('blocks submit and counts client-side errors', async () => {
    render(<FeedbackForm />)
    fill({ type: '', message: 'short', email: 'nope' })
    submit()
    expect(await screen.findByText(/3 things to fix/)).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/Message/)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText(/Message/).getAttribute('aria-describedby')).toMatch(/message-err/)
  })

  it('moves focus to the status box on error', async () => {
    const { container } = render(<FeedbackForm />)
    submit()
    await waitFor(() => expect(document.activeElement).toBe(container.querySelector('.fb-status')))
  })

  it('posts the note with the page it came from', async () => {
    render(<FeedbackForm />)
    fill({ email: 'fan@example.com' })
    submit()
    await screen.findByText(/in the mailbag/)
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(sent).toMatchObject({ type: 'Bug', email: 'fan@example.com', page: '/songs', website: '' })
    expect(typeof sent.ts).toBe('number')
  })

  it('names the reply address on success', async () => {
    render(<FeedbackForm />)
    fill({ email: 'fan@example.com' })
    submit()
    expect(await screen.findByText('fan@example.com')).toBeInTheDocument()
  })

  it('says there will be no reply when no email is given', async () => {
    render(<FeedbackForm />)
    fill()
    submit()
    expect(await screen.findByText(/won't be a reply/)).toBeInTheDocument()
  })

  it('resets the form with "Send another"', async () => {
    render(<FeedbackForm />)
    fill()
    submit()
    fireEvent.click(await screen.findByRole('button', { name: 'Send another' }))
    expect(screen.getByLabelText(/Message/)).toHaveValue('')
  })

  it.each([
    [400, /didn't check out/],
    [429, /Too many notes/],
    [503, /mail room is closed/],
  ])('shows the %i message and keeps the values', async (status, copy) => {
    fetchMock.mockResolvedValue(new Response('{"ok":false}', { status }))
    render(<FeedbackForm />)
    fill()
    submit()
    expect(await screen.findByText(copy)).toBeInTheDocument()
    expect(screen.getByLabelText(/Message/)).toHaveValue('The skip button does nothing.')
  })

  it('shows server field errors under the matching field', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: false, fieldErrors: { message: 'Server says no.' } }), { status: 400 }),
    )
    render(<FeedbackForm />)
    fill()
    submit()
    expect(await screen.findByText('Server says no.')).toBeInTheDocument()
  })

  it('treats a network failure as the mail room being closed', async () => {
    fetchMock.mockRejectedValue(new Error('offline'))
    render(<FeedbackForm />)
    fill()
    submit()
    expect(await screen.findByText(/mail room is closed/)).toBeInTheDocument()
  })

  it('keeps ids unique when two forms are mounted', () => {
    const { container } = render(<><FeedbackForm /><FeedbackForm /></>)
    const ids = [...container.querySelectorAll('[id]')].map(el => el.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
