import { HttpClient } from '../http'

export interface MusicBrainzWork {
  id: string
  title: string
  type?: string
  'type-id'?: string
  disambiguation?: string
  aliases?: Array<{
    name: string
    'sort-name': string
    locale?: string
    primary?: boolean
  }>
  'artist-relation-list'?: Array<{
    type: string
    'target-type': string
    direction: string
    artist: {
      id: string
      name: string
    }
  }>
}

export interface MusicBrainzRecording {
  id: string
  title: string
  length?: number
  disambiguation?: string
  aliases?: Array<{
    name: string
    'sort-name': string
    locale?: string
    primary?: boolean
  }>
  'artist-credit': Array<{
    name: string
    artist: {
      id: string
      name: string
    }
  }>
  'release-list'?: Array<{
    id: string
    title: string
    'release-group': {
      id: string
      title: string
    }
  }>
}

export interface MusicBrainzClient {
  searchWorkByTitle(title: string): Promise<MusicBrainzWork[]>
  lookupRecordingAliases(recordingId: string): Promise<MusicBrainzRecording>
  getWorkDetails(workId: string): Promise<MusicBrainzWork>
}

export class MusicBrainzClientImpl implements MusicBrainzClient {
  private http: HttpClient

  constructor() {
    this.http = new HttpClient('https://musicbrainz.org/ws/2', {
      'Accept': 'application/json',
      'User-Agent': 'steal-your-stats/1.0 (contact@example.com)',
    })
  }

  async searchWorkByTitle(title: string): Promise<MusicBrainzWork[]> {
    const response = await this.http.get<{
      works: MusicBrainzWork[]
    }>(`/work?query=${encodeURIComponent(title)}&fmt=json&limit=25`)

    return response.data.works || []
  }

  async lookupRecordingAliases(recordingId: string): Promise<MusicBrainzRecording> {
    const response = await this.http.get<MusicBrainzRecording>(
      `/recording/${recordingId}?inc=aliases+artist-credits+releases&fmt=json`
    )

    return response.data
  }

  async getWorkDetails(workId: string): Promise<MusicBrainzWork> {
    const response = await this.http.get<MusicBrainzWork>(
      `/work/${workId}?inc=aliases+artist-rels&fmt=json`
    )

    return response.data
  }
}
