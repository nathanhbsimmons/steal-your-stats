// Shared shapes for the aggregated show-of-the-day payload.
// Kept free of server-only imports so client components can import them.

export interface ShowOnThisDay {
  date: string
  year: number
  venue: string
  city: string
  state?: string
  country: string
  songs: string[]
  setlistUrl?: string
}

export interface ShowSet {
  name: string
  encore: boolean
  songs: string[]
  segues: boolean[]
}

export interface ShowDetail {
  date: string
  venue: string
  city: string
  state?: string
  country: string
  sets: ShowSet[]
  setlistUrl?: string
  totalSongs: number
}

export interface ArchiveTrackPayload {
  id: string
  name: string
  title?: string
  url: string
  duration?: number
  archiveItemId: string
}

export interface ShowOfTheDayPayload {
  dateKey: string
  shows: ShowOnThisDay[]
  featured: ShowOnThisDay | null
  showDetail: ShowDetail | null
  archive: { identifier: string; tracks: ArchiveTrackPayload[] } | null
  complete: boolean
  computedAt: number
}
