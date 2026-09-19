import { describe, it, expect } from 'vitest'
import { hasMissingAudio, missingAudioMessage } from '@/lib/missing-audio'

describe('hasMissingAudio', () => {
  it('is false while archive coverage is still loading', () => {
    expect(hasMissingAudio(null, 19)).toBe(false)
  })

  it('is false when every song is covered', () => {
    expect(hasMissingAudio(new Set([0, 1, 2]), 3)).toBe(false)
  })

  it('is true when any song index is missing', () => {
    expect(hasMissingAudio(new Set([0, 2]), 3)).toBe(true)
  })

  it('is true when the recording covers nothing', () => {
    expect(hasMissingAudio(new Set(), 3)).toBe(true)
  })
})

describe('missingAudioMessage', () => {
  it('suggests switching recordings when alternates exist', () => {
    expect(missingAudioMessage({ candidateCount: 3 }))
      .toBe("Some songs from this show don't have available audio. Try switching recordings above.")
  })

  it('omits the suggestion when there is only one recording', () => {
    expect(missingAudioMessage({ candidateCount: 1 }))
      .toBe("Some songs from this show don't have available audio.")
  })

  it('points at the full setlist when asked', () => {
    expect(missingAudioMessage({ candidateCount: 1, canOpenSetlist: true }))
      .toBe("Some songs from this show don't have available audio. Open the full setlist to browse other recordings.")
  })

  it('points down at the Archive.org Recording section when the switcher renders below', () => {
    expect(missingAudioMessage({ candidateCount: 3, switcherLocation: 'below' }))
      .toBe("Some songs from this show don't have available audio. Open the Archive.org Recording section below to switch recordings.")
  })
})
