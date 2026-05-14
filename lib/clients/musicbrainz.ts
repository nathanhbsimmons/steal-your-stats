import { HttpClient } from '../http'

export interface MusicBrainzWork {
  id: string
  title: string
  type?: string
  'type-id'?: string
  disambiguation?: string
  'iswcs'?: string[]
  'language'?: string
  'languages'?: string[]
  attributes?: string[]
  relations?: Array<{
    type: string
    'type-id': string
    target: string
    'target-type': string
    direction: string
    work?: {
      id: string
      title: string
      'type-id': string
      type: string
    }
    recording?: {
      id: string
      title: string
      length?: number
      disambiguation?: string
    }
  }>
}

export interface MusicBrainzRecording {
  id: string
  title: string
  length?: number
  disambiguation?: string
  'isrcs'?: string[]
  'artist-credit'?: Array<{
    name: string
    artist: {
      id: string
      name: string
      'sort-name': string
      disambiguation?: string
    }
  }>
  releases?: Array<{
    id: string
    title: string
    'release-group': {
      id: string
      title: string
      'type-id': string
      type: string
    }
  }>
}

export interface MusicBrainzClient {
  searchWorkByTitle(title: string): Promise<MusicBrainzWork[]>
  lookupRecordingAliases(recordingId: string): Promise<string[]>
}

export class MusicBrainzClientImpl implements MusicBrainzClient {
  private http: HttpClient

  constructor() {
    this.http = new HttpClient('https://musicbrainz.org/ws/2', {
      'Accept': 'application/json',
      'User-Agent': HttpClient.USER_AGENT,
    })
  }

  async searchWorkByTitle(title: string): Promise<MusicBrainzWork[]> {
    const response = await this.http.get<{
      works: MusicBrainzWork[]
    }>(`/work?query=title:"${encodeURIComponent(title)}"&fmt=json&limit=25`)

    return response.data.works || []
  }

  async lookupRecordingAliases(recordingId: string): Promise<string[]> {
    const response = await this.http.get<{
      'artist-credit': Array<{
        name: string
        artist: {
          id: string
          name: string
          aliases?: Array<{
            name: string
            'sort-name': string
            type?: string
            'type-id'?: string
            primary?: boolean
            locale?: string
          }>
        }
      }>
    }>(`/recording/${recordingId}?inc=artist-credits+aliases&fmt=json`)

    const aliases: string[] = []
    
    for (const credit of response.data['artist-credit'] || []) {
      if (credit.artist.aliases) {
        for (const alias of credit.artist.aliases) {
          aliases.push(alias.name)
        }
      }
    }

    return aliases
  }
}