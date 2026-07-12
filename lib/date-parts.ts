const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export interface DateParts {
  weekday: string
  monthName: string
  day: number
  year: number
  ordinalDay: string
}

export function ordinal(n: number): string {
  const s = String(n)
  if (s.endsWith('11') || s.endsWith('12') || s.endsWith('13')) return s + 'th'
  const r = n % 10
  return s + (r === 1 ? 'st' : r === 2 ? 'nd' : r === 3 ? 'rd' : 'th')
}

// iso must be "YYYY-MM-DD" — parsed as UTC so the result never shifts with
// the server/browser's local timezone. Always derives from the date's own
// true historical weekday, never from the caller's current clock.
export function getDateParts(iso: string): DateParts {
  const [year, month, day] = iso.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, day))
  return {
    weekday: WEEKDAY_NAMES[d.getUTCDay()],
    monthName: MONTH_NAMES[d.getUTCMonth()],
    day,
    year,
    ordinalDay: ordinal(day),
  }
}
