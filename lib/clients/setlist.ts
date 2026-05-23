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

export interface SetlistSearchResult {
  setlists: Setlist[]
  total: number
  page: number
  itemsPerPage: number
}

export interface SetlistClient {
  searchSongs(query: string): Promise<SetlistSong[]>
  getSetlistsByArtist(artistId: string, page?: number): Promise<Setlist[]>
  searchSetlistsBySong(songName: string, page?: number): Promise<Setlist[]>
  searchSetlistsBySongPage(songName: string, page?: number): Promise<SetlistSearchResult>
  searchSetlistsByVenue(venueName: string, page?: number): Promise<Setlist[]>
  searchSetlistsByYear(year: number, page?: number): Promise<{ setlists: Setlist[]; total: number; itemsPerPage: number }>
  getSetlistsByDate(date: string): Promise<Setlist[]>
}

export class SetlistClientImpl implements SetlistClient {
  private http: HttpClient

  constructor() {
    this.http = new HttpClient('https://api.setlist.fm/rest/1.0', {
      'Accept': 'application/json',
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

  async getArtistSetlistsPage(artistId: string, page: number = 1): Promise<{ setlists: Setlist[]; total: number; itemsPerPage: number }> {
    const response = await this.http.get<{
      setlist: Setlist[]
      total: number
      itemsPerPage: number
    }>(`/artist/${artistId}/setlists?p=${page}`)

    return {
      setlists: response.data.setlist || [],
      total: response.data.total || 0,
      itemsPerPage: response.data.itemsPerPage || 20,
    }
  }

  async searchSetlistsBySong(songName: string, page: number = 1): Promise<Setlist[]> {
    const result = await this.searchSetlistsBySongPage(songName, page)
    return result.setlists
  }

  async searchSetlistsBySongPage(songName: string, page: number = 1): Promise<SetlistSearchResult> {
    const response = await this.http.get<{
      setlist: Setlist[]
      total: number
      page: number
      itemsPerPage: number
    }>(`/search/setlists?p=${page}&songName=${encodeURIComponent(songName)}&artistMbid=6faa7ca7-0d99-4a5e-bfa6-1fd5037520c6`)

    return {
      setlists: response.data.setlist || [],
      total: response.data.total || 0,
      page: response.data.page || page,
      itemsPerPage: response.data.itemsPerPage || 20,
    }
  }

  async searchSetlistsByVenue(venueName: string, page: number = 1): Promise<Setlist[]> {
    try {
      const response = await this.http.get<{
        setlist: Setlist[]
        total: number
        page: number
        itemsPerPage: number
      }>(`/search/setlists?p=${page}&venueName=${encodeURIComponent(venueName)}&artistMbid=6faa7ca7-0d99-4a5e-bfa6-1fd5037520c6`)
      return response.data.setlist || []
    } catch {
      return []
    }
  }

  async searchSetlistsByYear(year: number, page: number = 1): Promise<{ setlists: Setlist[]; total: number; itemsPerPage: number }> {
    try {
      const response = await this.http.get<{
        setlist: Setlist[]
        total: number
        page: number
        itemsPerPage: number
      }>(`/search/setlists?p=${page}&artistMbid=6faa7ca7-0d99-4a5e-bfa6-1fd5037520c6&year=${year}`)
      return {
        setlists: response.data.setlist || [],
        total: response.data.total || 0,
        itemsPerPage: response.data.itemsPerPage || 20,
      }
    } catch {
      return { setlists: [], total: 0, itemsPerPage: 20 }
    }
  }

  async getSetlistsByDate(date: string): Promise<Setlist[]> {
    // date must be in DD-MM-YYYY format
    try {
      const response = await this.http.get<{
        setlist: Setlist[]
        total: number
        page: number
        itemsPerPage: number
      }>(`/search/setlists?artistMbid=6faa7ca7-0d99-4a5e-bfa6-1fd5037520c6&date=${encodeURIComponent(date)}`)
      return response.data.setlist || []
    } catch {
      return []
    }
  }
}