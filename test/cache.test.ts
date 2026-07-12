import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Cache } from '../lib/cache'

describe('Cache', () => {
  let cache: Cache<string>

  beforeEach(() => {
    cache = new Cache<string>()
  })

  it('should set and get values', () => {
    cache.set('key1', 'value1')
    expect(cache.get('key1')).toBe('value1')
  })

  it('should return undefined for non-existent keys', () => {
    expect(cache.get('nonexistent')).toBeUndefined()
  })

  it('should respect TTL', () => {
    const mockDate = new Date('2023-01-01T00:00:00Z')
    vi.setSystemTime(mockDate)
    
    cache.set('key1', 'value1', 1000) // 1 second TTL
    
    // Advance time by 2 seconds
    vi.setSystemTime(new Date('2023-01-01T00:00:02Z'))
    
    expect(cache.get('key1')).toBeUndefined()
    
    vi.useRealTimers()
  })

  it('should check if key exists', () => {
    cache.set('key1', 'value1')
    expect(cache.has('key1')).toBe(true)
    expect(cache.has('nonexistent')).toBe(false)
  })

  it('should delete keys', () => {
    cache.set('key1', 'value1')
    expect(cache.delete('key1')).toBe(true)
    expect(cache.get('key1')).toBeUndefined()
  })

  it('should clear all keys', () => {
    cache.set('key1', 'value1')
    cache.set('key2', 'value2')
    cache.clear()
    expect(cache.size()).toBe(0)
  })

  it('should return correct size', () => {
    expect(cache.size()).toBe(0)
    cache.set('key1', 'value1')
    expect(cache.size()).toBe(1)
    cache.set('key2', 'value2')
    expect(cache.size()).toBe(2)
  })

  it('should evict the oldest entry when maxEntries is exceeded', () => {
    const bounded = new Cache<string>(3)
    bounded.set('a', '1')
    bounded.set('b', '2')
    bounded.set('c', '3')
    bounded.set('d', '4')

    expect(bounded.size()).toBe(3)
    expect(bounded.has('a')).toBe(false)
    expect(bounded.has('b')).toBe(true)
    expect(bounded.has('c')).toBe(true)
    expect(bounded.has('d')).toBe(true)
  })

  it('should refresh recency on get, protecting a recently-read entry from eviction', () => {
    const bounded = new Cache<string>(3)
    bounded.set('a', '1')
    bounded.set('b', '2')
    bounded.set('c', '3')

    // touch 'a' so it becomes most-recently-used
    bounded.get('a')

    bounded.set('d', '4')

    expect(bounded.size()).toBe(3)
    expect(bounded.has('a')).toBe(true)
    expect(bounded.has('b')).toBe(false)
    expect(bounded.has('c')).toBe(true)
    expect(bounded.has('d')).toBe(true)
  })
})
