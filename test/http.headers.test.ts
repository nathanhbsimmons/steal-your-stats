import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HttpClient } from '../lib/http'

// Mock the environment variables
vi.mock('../lib/env', () => ({
  env: {
    SETLISTFM_API_KEY: 'test-api-key',
    NODE_ENV: 'test'
  }
}))

vi.stubGlobal('fetch', vi.fn())

describe('HttpClient header injection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('adds x-api-key for setlist.fm', async () => {
    // @ts-expect-error mock
    fetch.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: new Headers(),
    }))
    const client = new HttpClient('https://api.setlist.fm/rest/1.0')
    const res = await client.get('/search/songs')
    expect(res.status).toBe(200)
    const call = vi.mocked(fetch).mock.calls[0]
    const opts = call[1]
    expect(opts?.headers?.['x-api-key']).toBe('test-api-key')
  })
})
