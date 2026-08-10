export interface MonthDay { month: string; day: string } // zero-padded "MM"/"DD"

// Anchored to a fixed leap year (2000) so Feb 29 offsets resolve correctly
// regardless of the real current year.
export function offsetMonthDay(month: string, day: string, offsetDays: number): MonthDay {
  const shifted = new Date(Date.UTC(2000, Number(month) - 1, Number(day) + offsetDays))
  return {
    month: String(shifted.getUTCMonth() + 1).padStart(2, '0'),
    day: String(shifted.getUTCDate()).padStart(2, '0'),
  }
}

// Yields {offset, month, day} outward from the center in order of
// increasing distance, earlier date before later date at each distance
// tier (arbitrary but deterministic tiebreak). Excludes offset 0.
export function* widenDateSearch(month: string, day: string, maxOffsetDays: number) {
  for (let distance = 1; distance <= maxOffsetDays; distance++) {
    for (const offset of [-distance, distance]) {
      yield { offset, ...offsetMonthDay(month, day, offset) }
    }
  }
}
