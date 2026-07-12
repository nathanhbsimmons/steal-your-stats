// Simple in-memory cache with TTL and LRU eviction
export class Cache<T> {
  private cache = new Map<string, { value: T; expiry: number }>()

  constructor(private maxEntries: number = 500) {}

  set(key: string, value: T, ttlMs: number = 60000): void {
    if (this.cache.has(key)) this.cache.delete(key)
    this.cache.set(key, { value, expiry: Date.now() + ttlMs })

    if (this.cache.size > this.maxEntries) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey !== undefined) this.cache.delete(oldestKey)
    }
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key)
    if (!item) return undefined

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return undefined
    }

    // refresh recency
    this.cache.delete(key)
    this.cache.set(key, item)
    return item.value
  }

  has(key: string): boolean {
    return this.get(key) !== undefined
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}
