// Stub client for setlist.fm API
/* eslint-disable @typescript-eslint/no-unused-vars */
export interface SetlistClient {
  searchSongs(query: string): Promise<unknown[]>
  getSetlistsByArtist(artistId: string): Promise<unknown[]>
  searchSetlistsBySong(songId: string): Promise<unknown[]>
}

export class SetlistClientImpl implements SetlistClient {
  async searchSongs(query: string): Promise<unknown[]> {
    // TODO: Implement actual API call
    return []
  }

  async getSetlistsByArtist(artistId: string): Promise<unknown[]> {
    // TODO: Implement actual API call
    return []
  }

  async searchSetlistsBySong(songId: string): Promise<unknown[]> {
    // TODO: Implement actual API call
    return []
  }
}
