import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const ENV = {
  RESEND_API_KEY: 're_test',
  FEEDBACK_FROM_EMAIL: 'support@stealyourstats.com',
  FEEDBACK_TO_EMAIL: 'inbox@example.com',
}

const fetchMock = vi.fn()

async function loadPost() {
  // Fresh module per test so the in-memory rate limiter starts empty.
  vi.resetModules()
  return (await import('@/app/api/feedback/route')).POST
}

function body(overrides: Record<string, unknown> = {}) {
  return {
    type: 'Bug',
    message: 'The play button does nothing on the Deck tab.',
    page: '/songs',
    website: '',
    ts: Date.now() - 10_000,
    ...overrides,
  }
}

function req(payload: unknown, ip = '1.2.3.4') {
  return new Request('http://localhost/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip, 'user-agent': 'vitest' },
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
  })
}

describe('POST /api/feedback', () => {
  beforeEach(() => {
    for (const [k, v] of Object.entries(ENV)) vi.stubEnv(k, v)
    fetchMock.mockReset().mockResolvedValue(new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('sends the note through Resend with reply_to and a typed subject', async () => {
    const POST = await loadPost()
    const res = await POST(req(body({ email: 'fan@example.com' })))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.resend.com/emails')
    expect(init.headers.Authorization).toBe('Bearer re_test')
    const sent = JSON.parse(init.body)
    expect(sent.from).toBe(ENV.FEEDBACK_FROM_EMAIL)
    expect(sent.to).toBe(ENV.FEEDBACK_TO_EMAIL)
    expect(sent.reply_to).toBe('fan@example.com')
    expect(sent.subject).toBe('[SYS Bug] The play button does nothing on the Deck tab.')
    expect(sent.text).toContain('Page: /songs')
    expect(sent.text).toContain('User agent: vitest')
  })

  it('omits reply_to when no email is given', async () => {
    const POST = await loadPost()
    await POST(req(body()))
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(sent).not.toHaveProperty('reply_to')
  })

  it('returns 400 with field errors for an invalid body', async () => {
    const POST = await loadPost()
    const res = await POST(req(body({ type: 'Rant', message: 'short', email: 'nope' })))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.ok).toBe(false)
    expect(Object.keys(json.fieldErrors).sort()).toEqual(['email', 'message', 'type'])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns 400 for malformed JSON', async () => {
    const POST = await loadPost()
    const res = await POST(req('{not json'))
    expect(res.status).toBe(400)
  })

  it('silently accepts a filled honeypot without sending', async () => {
    const POST = await loadPost()
    const res = await POST(req(body({ website: 'http://spam.example' })))
    expect(res.status).toBe(200)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects a submission made under 3 seconds after render', async () => {
    const POST = await loadPost()
    const res = await POST(req(body({ ts: Date.now() - 500 })))
    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rate-limits to five notes per IP', async () => {
    const POST = await loadPost()
    for (let i = 0; i < 5; i++) expect((await POST(req(body()))).status).toBe(200)
    expect((await POST(req(body()))).status).toBe(429)
    expect((await POST(req(body(), '5.6.7.8'))).status).toBe(200)
  })

  it('returns 503 when mail settings are missing', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    const POST = await loadPost()
    const res = await POST(req(body()))
    expect(res.status).toBe(503)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns 503 when Resend rejects the request', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 500 }))
    const POST = await loadPost()
    expect((await POST(req(body()))).status).toBe(503)
  })

  it('returns 503 when Resend is unreachable', async () => {
    fetchMock.mockRejectedValue(new Error('network'))
    const POST = await loadPost()
    expect((await POST(req(body()))).status).toBe(503)
  })
})
