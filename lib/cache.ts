// Simple in-memory cache with TTL
export class Cache<T> {
  private cache = new Map<string, { value: T; expiry: number }>()

  set(key: string, value: T, ttlMs: number = 60000): void {
    const expiry = Date.now() + ttlMs
    this.cache.set(key, { value, expiry })
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key)
    if (!item) return undefined

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return undefined
    }

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
