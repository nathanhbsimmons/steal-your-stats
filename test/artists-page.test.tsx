import { describe, it, expect } from 'vitest'
import { MEMBERS } from '@/lib/members'

describe('band member show counts', () => {
  it('does not give every 1965-1995 member the same count', () => {
    const fullRun = Object.values(MEMBERS).filter(m => m.startYear === 1965 && m.endYear === 1995)
    const counts = new Set(fullRun.map(m => m.shows))
    expect(fullRun.length).toBeGreaterThan(1)
    expect(counts.size).toBeGreaterThan(0)
  })

  it('keeps per-member counts distinct where history says they differ', () => {
    expect(MEMBERS['mickey-hart'].shows).not.toBe(MEMBERS['jerry-garcia'].shows)
    expect(MEMBERS['pigpen'].shows).toBeLessThan(MEMBERS['jerry-garcia'].shows)
  })
})
