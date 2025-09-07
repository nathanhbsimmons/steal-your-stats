import { HttpClient } from '../http'

export interface ArchiveShow {
  identifier: string
  title: string
  creator: string
  date: string
  description?: string
  venue?: string
  city?: string
  state?: string
  country?: string
  'publicdate': string
  'addeddate': string
  'updatedate': string
  'mediatype': string
  'collection': string[]
  'subject': string[]
  'language': string[]
  'licenseurl': string
  'rights': string
  'format': string[]
  'type': string
  'files': Array<{
    name: string
    source: string
    format: string
    length: string
    md5: string
    mtime: string
    size: string
    crc32: string
    sha1: string
  }>
}

export interface ArchiveTrack {
  name: string
  source: string
  format: string
  length: string
  md5: string
  mtime: string
  size: string
  crc32: string
  sha1: string
}

export interface ArchiveClient {
  searchShows(creator: string, date?: string): Promise<ArchiveShow[]>
  listTracks(identifier: string): Promise<ArchiveTrack[]>
}

export class ArchiveClientImpl implements ArchiveClient {
  private http: HttpClient

  constructor() {
    this.http = new HttpClient('https://archive.org', {
      'User-Agent': HttpClient.USER_AGENT,
    })
  }

  async searchShows(creator: string, date?: string): Promise<ArchiveShow[]> {
    const searchParams = new URLSearchParams({
      q: `creator:${creator}`,
      output: 'json',
      rows: '50',
    })
    
    if (date) {
      searchParams.set('date', date)
    }

    const response = await this.http.get<{
      response: {
        docs: ArchiveShow[]
        numFound: number
        start: number
      }
    }>(`/advancedsearch.php?${searchParams.toString()}`)

    return response.data.response.docs || []
  }

  async listTracks(identifier: string): Promise<ArchiveTrack[]> {
    const response = await this.http.get<{
      files: ArchiveTrack[]
    }>(`/${identifier}/_files.json`)

    // Filter for audio files only
    const audioFiles = (response.data.files || []).filter(file => 
      file.format && ['FLAC', 'MP3', 'VBR MP3', 'Ogg Vorbis'].includes(file.format)
    )

    return audioFiles
  }
}
