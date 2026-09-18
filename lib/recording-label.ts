const TYPE_WORDS: Record<string, string> = {
  sbd: 'Soundboard',
  aud: 'Audience',
  matrix: 'Matrix',
  mtx: 'Matrix',
}

// Archive identifiers are dot-delimited: a date, a numeric item id, then a
// loose mix of source, mic, format and taper tokens. Only the taper-ish
// words are worth showing, so everything we can recognise gets dropped.
// Taper surnames (miller, hicks, seamons, dalton…) must never be listed here.
const NOISE = new Set([
  'sbd', 'aud', 'mtx', 'matrix', 'fob', 'dsbd', 'sbeok', 'shnf', 'shorten',
  'flac', 'flacf', 'mp3', 'vbr', 'set1', 'set2',
  'unknown', 'sbefail', 'dts', 'pcm', 'gems', 'ultramatrix',
])

// Mic models and format suffixes are alphanumeric mixes; taper surnames are not.
function isNoiseToken(token: string): boolean {
  if (token.length < 3) return true
  if (/^\d+$/.test(token)) return true          // item ids
  if (/^gd?\d/.test(token)) return true          // gd1977-05-08
  if (/\d/.test(token)) return true              // akg414, flac1644, sbeok24
  return NOISE.has(token)
}

export function recordingLabel(c: { identifier: string; recordingType?: string }): {
  primary: string
  detail: string
} {
  const typeWord = TYPE_WORDS[c.recordingType ?? ''] ?? 'Recording'
  const names = c.identifier
    .toLowerCase()
    .split('.')
    .slice(1)
    .filter(t => !isNoiseToken(t))

  return {
    primary: names.length > 0 ? `${typeWord} · ${names.join(', ')}` : typeWord,
    detail: c.identifier,
  }
}
