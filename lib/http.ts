import { Cache } from './cache'

export interface HttpOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: string
  cache?: boolean
  cacheTtl?: number
  retries?: number
  retryDelay?: number
  timeout?: number
}

export interface HttpResponse<T = unknown> {
  data: T
  status: number
  headers: Record<string, string>
  rateLimitRemaining?: number
  rateLimitReset?: number
}

export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export class HttpClient {
  private cache = new Cache<HttpResponse>(1000)
  private baseUrl: string
  private defaultHeaders: Record<string, string>

  /**
   * Public courtesy: MusicBrainz & Archive.org request a descriptive UA.
   * Add your email/website for contact per their guidelines.
   */
  static USER_AGENT = 'StealYourStats/1.0 (contact: you@example.com)'

  constructor(
    baseUrl: string = '',
    defaultHeaders: Record<string, string> = {}
  ) {
    this.baseUrl = baseUrl
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': HttpClient.USER_AGENT,
      ...defaultHeaders,
    }
  }

  async request<T = unknown>(
    url: string,
    options: HttpOptions = {}
  ): Promise<HttpResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      cache = true,
      cacheTtl = 300000, // 5 minutes default
      retries = 3,
      retryDelay = 1000,
      timeout = 10000,
    } = options

    const fullUrl = this.baseUrl + url
    const cacheKey = `${method}:${fullUrl}:${body || ''}`

    // Check cache for GET requests
    if (cache && method === 'GET') {
      const cached = this.cache.get(cacheKey)
      if (cached) {
        return cached as HttpResponse<T>
      }
    }

    const requestHeaders = {
      ...this.defaultHeaders,
      ...headers,
    }

    let lastError: Error | null = null

    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      try {
        // Inject auth header for setlist.fm automatically by host match.
        const host = (() => {
          try { return new URL(fullUrl).host } catch { return '' }
        })()

        const dynamicHeaders: Record<string, string> = { ...requestHeaders }
        if (host.endsWith('api.setlist.fm')) {
          // Setlist.fm requires x-api-key; value comes from env loader.
          try {
            const { env } = await import('./env')
            const apiKey = env.SETLISTFM_API_KEY || process.env.SETLISTFM_API_KEY
            if (apiKey) {
              dynamicHeaders['x-api-key'] = apiKey
            } else {
              console.warn('SETLISTFM_API_KEY not found in environment variables')
            }
          } catch (error) {
            console.warn('Failed to load environment variables:', error)
            const apiKey = process.env.SETLISTFM_API_KEY
            if (apiKey) {
              dynamicHeaders['x-api-key'] = apiKey
            }
          }
          // Setlist recommends Accept header versioning; JSON by default:
          dynamicHeaders['Accept'] = 'application/json'
        }

        const response = await fetch(fullUrl, {
          method,
          headers: dynamicHeaders,
          body,
          signal: controller.signal,
        })

        // Log rate limit headers
        const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining')
        const rateLimitReset = response.headers.get('X-RateLimit-Reset')
        
        if (rateLimitRemaining) {
          console.log(`Rate limit remaining: ${rateLimitRemaining}`)
        }
        if (rateLimitReset) {
          console.log(`Rate limit resets at: ${new Date(parseInt(rateLimitReset) * 1000)}`)
        }

        if (!response.ok) {
          // Handle rate limiting with exponential backoff
          if (response.status === 429 && attempt < retries) {
            const retryAfter = response.headers.get('Retry-After')
            const delay = retryAfter 
              ? parseInt(retryAfter) * 1000 
              : retryDelay * Math.pow(2, attempt)
            
            console.log(`Rate limited, retrying after ${delay}ms`)
            await this.delay(delay)
            continue
          }

          throw new HttpError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            response
          )
        }

        const data = await response.json()
        const headersObj: Record<string, string> = {}
        response.headers.forEach((value, key) => {
          headersObj[key] = value
        })

        const result: HttpResponse<T> = {
          data,
          status: response.status,
          headers: headersObj,
          rateLimitRemaining: rateLimitRemaining ? parseInt(rateLimitRemaining) : undefined,
          rateLimitReset: rateLimitReset ? parseInt(rateLimitReset) : undefined,
        }

        // Cache successful GET requests
        if (cache && method === 'GET') {
          this.cache.set(cacheKey, result, cacheTtl)
        }

        return result
      } catch (error) {
        const isTimeout = error instanceof Error && error.name === 'AbortError'
        lastError = isTimeout
          ? new Error(`Request timed out after ${timeout}ms: ${fullUrl}`)
          : (error as Error)

        // Don't retry on client errors (4xx) except 429
        if (lastError instanceof HttpError && lastError.status >= 400 && lastError.status < 500 && lastError.status !== 429) {
          throw lastError
        }

        // Don't retry on timeout — a slow-but-legitimate response just needs
        // more time, not a fresh attempt with the same cap; retrying only
        // compounds the wait (up to retries+1 timeouts back-to-back).
        if (isTimeout) {
          throw lastError
        }

        // Retry on network errors or server errors
        if (attempt < retries) {
          const delay = retryDelay * Math.pow(2, attempt)
          console.log(`Request failed, retrying after ${delay}ms:`, lastError)
          await this.delay(delay)
        }
      } finally {
        clearTimeout(timeoutId)
      }
    }

    throw lastError || new Error('Request failed after all retries')
  }

  async get<T = unknown>(url: string, options: Omit<HttpOptions, 'method'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' })
  }

  async post<T = unknown>(url: string, body?: unknown, options: Omit<HttpOptions, 'method' | 'body'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Cache management
  clearCache(): void {
    this.cache.clear()
  }

  getCacheSize(): number {
    return this.cache.size()
  }
}

// Convenience factories (optional)
export const setlistClient = new HttpClient('https://api.setlist.fm/rest/1.0')
export const musicbrainzClient = new HttpClient('https://musicbrainz.org')
export const archiveClient = new HttpClient('https://archive.org')
