// Stub client for MusicBrainz API
/* eslint-disable @typescript-eslint/no-unused-vars */
export interface MusicBrainzClient {
  searchWorkByTitle(title: string): Promise<unknown[]>
  lookupRecordingAliases(recordingId: string): Promise<unknown[]>
  getWorkDetails(workId: string): Promise<unknown>
}

export class MusicBrainzClientImpl implements MusicBrainzClient {
  async searchWorkByTitle(title: string): Promise<unknown[]> {
    // TODO: Implement actual API call
    return []
  }

  async lookupRecordingAliases(recordingId: string): Promise<unknown[]> {
    // TODO: Implement actual API call
    return []
  }

  async getWorkDetails(workId: string): Promise<unknown> {
    // TODO: Implement actual API call
    return {}
  }
}
