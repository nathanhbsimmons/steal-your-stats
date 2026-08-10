import { describe, it, expect } from 'vitest'
import { offsetMonthDay, widenDateSearch } from '@/lib/date-offset'

describe('offsetMonthDay', () => {
  it('shifts forward within the same year', () => {
    expect(offsetMonthDay('07', '12', 1)).toEqual({ month: '07', day: '13' })
  })

  it('shifts backward within the same year', () => {
    expect(offsetMonthDay('07', '12', -1)).toEqual({ month: '07', day: '11' })
  })

  it('rolls forward across a year boundary', () => {
    expect(offsetMonthDay('12', '31', 1)).toEqual({ month: '01', day: '01' })
  })

  it('rolls backward across a year boundary', () => {
    expect(offsetMonthDay('01', '01', -1)).toEqual({ month: '12', day: '31' })
  })

  it('resolves Feb 29 forward using the leap-year anchor', () => {
    expect(offsetMonthDay('02', '28', 1)).toEqual({ month: '02', day: '29' })
  })

  it('resolves Feb 29 backward using the leap-year anchor', () => {
    expect(offsetMonthDay('03', '01', -1)).toEqual({ month: '02', day: '29' })
  })
})

describe('widenDateSearch', () => {
  it('yields outward from the center, closer distances first, excluding offset 0', () => {
    const results = [...widenDateSearch('07', '12', 3)]
    expect(results).toEqual([
      { offset: -1, month: '07', day: '11' },
      { offset: 1, month: '07', day: '13' },
      { offset: -2, month: '07', day: '10' },
      { offset: 2, month: '07', day: '14' },
      { offset: -3, month: '07', day: '09' },
      { offset: 3, month: '07', day: '15' },
    ])
  })

  it('yields nothing when maxOffsetDays is 0', () => {
    expect([...widenDateSearch('07', '12', 0)]).toEqual([])
  })
})
