import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HttpClient, HttpError } from '../lib/http'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('HttpClient', () => {
  let client: HttpClient

  beforeEach(() => {
    client = new HttpClient('https://api.example.com')
    mockFetch.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map([
          ['content-type', 'application/json'],
          ['x-rate-limit-remaining', '100'],
        ]),
        json: vi.fn().mockResolvedValue({ data: 'test' }),
      }
      mockFetch.mockResolvedValue(mockResponse)

      const result = await client.get('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'User-Agent': 'StealYourStats/1.0 (contact: you@example.com)',
          }),
        })
      )
      expect(result.data).toEqual({ data: 'test' })
      expect(result.status).toBe(200)
    })

    it('should handle rate limiting with retry', async () => {
      const rateLimitResponse = {
        ok: false,
        status: 429,
        headers: new Map([['retry-after', '1']]),
      }
      const successResponse = {
        ok: true,
        status: 200,
        headers: new Map(),
        json: vi.fn().mockResolvedValue({ data: 'success' }),
      }

      mockFetch
        .mockResolvedValueOnce(rateLimitResponse)
        .mockResolvedValueOnce(successResponse)

      const result = await client.get('/test')

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result.data).toEqual({ data: 'success' })
    })

    it('should throw HttpError for client errors', async () => {
      const errorResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Map(),
      }
      mockFetch.mockResolvedValue(errorResponse)

      await expect(client.get('/test')).rejects.toThrow(HttpError)
    })
  })

  describe('caching', () => {
    it('should cache GET requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map(),
        json: vi.fn().mockResolvedValue({ data: 'cached' }),
      }
      mockFetch.mockResolvedValue(mockResponse)

      // First request
      await client.get('/cache-test')
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Second request should use cache
      const result2 = await client.get('/cache-test')
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(result2.data).toEqual({ data: 'cached' })
    })

    it('should not cache non-GET requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map(),
        json: vi.fn().mockResolvedValue({ data: 'posted' }),
      }
      mockFetch.mockResolvedValue(mockResponse)

      await client.post('/test', { data: 'test' })
      await client.post('/test', { data: 'test' })

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('retry logic', () => {
    it('should retry on network errors', async () => {
      const networkError = new Error('Network error')
      const successResponse = {
        ok: true,
        status: 200,
        headers: new Map(),
        json: vi.fn().mockResolvedValue({ data: 'success' }),
      }

      mockFetch
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(successResponse)

      const result = await client.get('/test')

      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(result.data).toEqual({ data: 'success' })
    })

    it('should not retry on client errors', async () => {
      const errorResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Map(),
      }
      mockFetch.mockResolvedValue(errorResponse)

      await expect(client.get('/test')).rejects.toThrow(HttpError)
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('timeout', () => {
    it('should abort a hung request after the timeout and retry', async () => {
      vi.useFakeTimers()
      let callCount = 0
      mockFetch.mockImplementation((_url: string, opts: RequestInit) => {
        callCount++
        if (callCount === 1) {
          return new Promise((_resolve, reject) => {
            opts.signal?.addEventListener('abort', () => {
              const err = new Error('Aborted')
              err.name = 'AbortError'
              reject(err)
            })
          })
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Map(),
          json: vi.fn().mockResolvedValue({ data: 'ok' }),
        })
      })

      const resultPromise = client.get('/hangs', { timeout: 50, retryDelay: 1 })

      await vi.advanceTimersByTimeAsync(50) // trigger the timeout abort
      await vi.advanceTimersByTimeAsync(1) // trigger the retry backoff delay

      const result = await resultPromise
      expect(result.data).toEqual({ data: 'ok' })
      expect(mockFetch).toHaveBeenCalledTimes(2)

      vi.useRealTimers()
    })
  })

  describe('cache management', () => {
    it('should clear cache', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Map(),
        json: vi.fn().mockResolvedValue({ data: 'test' }),
      }
      mockFetch.mockResolvedValue(mockResponse)

      await client.get('/test')
      expect(client.getCacheSize()).toBe(1)

      client.clearCache()
      expect(client.getCacheSize()).toBe(0)
    })
  })
})
