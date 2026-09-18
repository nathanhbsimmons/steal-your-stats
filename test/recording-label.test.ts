import { describe, it, expect } from 'vitest'
import { recordingLabel } from '@/lib/recording-label'

describe('recordingLabel', () => {
  it('names the source type in plain words', () => {
    expect(recordingLabel({ identifier: 'gd1977-05-08.sbd.hicks.4982.sbeok.shnf', recordingType: 'sbd' }).primary)
      .toMatch(/^Soundboard/)
    expect(recordingLabel({ identifier: 'gd1987-09-16.141891.fob.akg414.dalton.miller.flac1644', recordingType: 'aud' }).primary)
      .toMatch(/^Audience/)
    expect(recordingLabel({ identifier: 'gd1972-05-26.mtx.seamons.16793.sbeok.flacf', recordingType: 'matrix' }).primary)
      .toMatch(/^Matrix/)
  })

  it('surfaces taper names from the identifier', () => {
    expect(recordingLabel({ identifier: 'gd1987-09-16.141891.fob.akg414.dalton.miller.flac1644', recordingType: 'aud' }).primary)
      .toBe('Audience · dalton, miller')
  })

  it('drops format, mic and numeric tokens', () => {
    const label = recordingLabel({ identifier: 'gd1977-05-08.sbd.hicks.4982.sbeok.shnf', recordingType: 'sbd' }).primary
    expect(label).toBe('Soundboard · hicks')
    expect(label).not.toMatch(/shnf|sbeok|4982/)
  })

  it('falls back to Recording when the type is unknown', () => {
    expect(recordingLabel({ identifier: 'gd1980-01-13.unknown.12345' }).primary).toMatch(/^Recording/)
  })

  it('always returns the raw identifier as detail', () => {
    const id = 'gd1977-05-08.sbd.hicks.4982.sbeok.shnf'
    expect(recordingLabel({ identifier: id }).detail).toBe(id)
  })

  it('survives an identifier with no dotted segments', () => {
    expect(recordingLabel({ identifier: 'gd1977-05-08' }).primary).toBe('Recording')
  })
})
