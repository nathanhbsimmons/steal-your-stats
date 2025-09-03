import { HttpClient } from '../http'
import { env } from '../env'

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
}

export interface SetlistClient {
  searchSongs(query: string): Promise<SetlistSong[]>
  getSetlistsByArtist(artistId: string, page?: number): Promise<Setlist[]>
  searchSetlistsBySong(songId: string, page?: number): Promise<Setlist[]>
}

export class SetlistClientImpl implements SetlistClient {
  private http: HttpClient

  constructor() {
    this.http = new HttpClient('https://api.setlist.fm/rest/1.0', {
      'Accept': 'application/json',
      'x-api-key': env.SETLISTFM_API_KEY || '',
    })
  }

  async searchSongs(query: string): Promise<SetlistSong[]> {
    const response = await this.http.get<{
      setlist: Array<{
        id: string
        name: string
        artist: {
          id: string
          name: string
        }
      }>
    }>(`/search/songs?p=1&songName=${encodeURIComponent(query)}`)

    return response.data.setlist || []
  }

  async getSetlistsByArtist(artistId: string, page: number = 1): Promise<Setlist[]> {
    const response = await this.http.get<{
      setlist: Setlist[]
    }>(`/artist/${artistId}/setlists?p=${page}`)

    return response.data.setlist || []
  }

  async searchSetlistsBySong(songId: string, page: number = 1): Promise<Setlist[]> {
    const response = await this.http.get<{
      setlist: Setlist[]
    }>(`/search/setlists?p=${page}&songId=${songId}`)

    return response.data.setlist || []
  }
}
