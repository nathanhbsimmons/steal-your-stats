import { HttpClient } from '../http'

export interface SetlistSong {
  id: string
  name: string
  artist: {
    id: string
    name: string
  }
}

export interface Setlist {
  id: string
  eventDate: string
  url?: string
  venue: {
    id: string
    name: string
    city: {
      id: string
      name: string
      state?: string
      country: {
        code: string
        name: string
      }
    }
  }
  sets: {
    set: Array<{
      name?: string
      encore?: number
      song: Array<{
        name: string
        info?: string
        cover?: {
          name: string
          artist: {
            name: string
          }
        }
      }>
    }>
  }
}

export interface SetlistClient {
  searchSongs(query: string): Promise<SetlistSong[]>
  getSetlistsByArtist(artistId: string, page?: number): Promise<Setlist[]>
  searchSetlistsBySong(songName: string, page?: number): Promise<Setlist[]>
}

export class SetlistClientServer implements SetlistClient {
  private http: HttpClient

  constructor() {
    // Use process.env directly for server-side usage
    const apiKey = process.env.SETLISTFM_API_KEY
    if (!apiKey) console.warn('SETLISTFM_API_KEY not found in environment variables')
    this.http = new HttpClient('https://api.setlist.fm/rest/1.0', {
      'Accept': 'application/json',
      'x-api-key': apiKey ?? '',
    })
  }

  async searchSongs(query: string): Promise<SetlistSong[]> {
    // setlist.fm doesn't have a direct song search endpoint
    // Instead, we search for setlists containing the song and extract unique songs
    const response = await this.http.get<{
      setlist: Array<{
        id: string
        eventDate: string
        venue: {
          id: string
          name: string
          city: {
            id: string
            name: string
            state?: string
            country: {
              code: string
              name: string
            }
          }
        }
        sets: {
          set: Array<{
            name?: string
            song: Array<{
              name: string
              info?: string
              cover?: {
                name: string
                artist: {
                  name: string
                }
              }
            }>
          }>
        }
      }>
    }>(`/search/setlists?p=1&songName=${encodeURIComponent(query)}&artistMbid=6faa7ca7-0d99-4a5e-bfa6-1fd5037520c6`)

    // Extract unique songs from the setlists
    const songs = new Map<string, SetlistSong>()
    
    for (const setlist of response.data.setlist || []) {
      for (const set of setlist.sets.set) {
        for (const song of set.song) {
          if (song.name.toLowerCase().includes(query.toLowerCase())) {
            songs.set(song.name, {
              id: `${setlist.id}-${song.name}`,
              name: song.name,
              artist: {
                id: '6faa7ca7-0d99-4a5e-bfa6-1fd5037520c6',
                name: 'Grateful Dead'
              }
            })
          }
        }
      }
    }

    return Array.from(songs.values())
  }

  async getSetlistsByArtist(artistId: string, page: number = 1): Promise<Setlist[]> {
    const response = await this.http.get<{
      setlist: Setlist[]
    }>(`/artist/${artistId}/setlists?p=${page}`)

    return response.data.setlist || []
  }

  async searchSetlistsBySong(songName: string, page: number = 1): Promise<Setlist[]> {
    const response = await this.http.get<{
      setlist: Setlist[]
    }>(`/search/setlists?p=${page}&songName=${encodeURIComponent(songName)}&artistMbid=6faa7ca7-0d99-4a5e-bfa6-1fd5037520c6`)

    return response.data.setlist || []
  }

  async getArtistSetlists(artistId: string, page: number = 1, year?: number): Promise<Setlist[]> {
    const searchParams: Record<string, string> = { p: page.toString() }
    if (year) searchParams.year = year.toString()

    const response = await this.http.get<{
      setlist: Setlist[]
    }>(`/artist/${artistId}/setlists?${new URLSearchParams(searchParams).toString()}`)

    return response.data.setlist || []
  }
}
