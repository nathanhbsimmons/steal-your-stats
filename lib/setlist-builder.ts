import { toTitleCase } from './utils'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SetKey = 'set1' | 'set2' | 'encore'

export interface SetlistEntry {
  id: string
  title: string             // canonical lower-case key
  displayTitle: string      // title-cased for display
  durationSec?: number      // avg duration estimate
  segueIntoNext: boolean
}

export interface SetlistState {
  bandName: string
  date: string
  venue: string
  set1: SetlistEntry[]
  set2: SetlistEntry[]
  encore: SetlistEntry[]
}

export interface SongPairing {
  direction: 'before' | 'after' | 'suite'
  partner: string         // display name of partner song
  partnerKey: string      // canonical key of partner song
  label: string           // formatted label for UI
  alwaysWith: boolean
}

export interface SongHints {
  pairing?: SongPairing
  positionHints: {
    isCommonOpener: boolean
    isCommonCloser: boolean
    isCommonEncore: boolean
  }
  avgDurationSec?: number
}

// ─── Average durations (seconds) ─────────────────────────────────────────────

const AVG_DURATIONS: Record<string, number> = {
  'dark star': 1500,
  'playing in the band': 720,
  'drums': 900,
  'space': 600,
  'terrapin station': 840,
  'the other one': 720,
  'help on the way': 300,
  'slipknot!': 480,
  "franklin's tower": 540,
  'eyes of the world': 660,
  'estimated prophet': 540,
  'china cat sunflower': 480,
  'i know you rider': 360,
  'scarlet begonias': 540,
  'fire on the mountain': 660,
  'truckin': 480,
  'sugar magnolia': 480,
  'bertha': 300,
  'jack straw': 300,
  "uncle john's band": 300,
  'casey jones': 300,
  'friend of the devil': 300,
  'brokedown palace': 240,
  'ripple': 240,
  'me and my uncle': 180,
  'el paso': 180,
  'mama tried': 180,
  'deal': 300,
  'shakedown street': 420,
  'not fade away': 480,
  "goin' down the road feeling bad": 360,
  'st. stephen': 420,
  'the eleven': 480,
  'wharf rat': 480,
  'new speedway boogie': 300,
  'black peter': 420,
  'morning dew': 480,
  "he's gone": 540,
  'ship of fools': 360,
  'candyman': 300,
  'dire wolf': 240,
  'high time': 300,
  'easy wind': 300,
  'cold rain and snow': 240,
  'big river': 180,
  'mexicali blues': 180,
  'loser': 300,
  'tennessee jed': 300,
  'brown-eyed women': 240,
  'ramble on rose': 300,
  'alligator': 600,
  'caution (do not stop on tracks)': 720,
  'turn on your lovelight': 720,
  'and we bid you goodnight': 180,
  'attics of my life': 300,
  'promised land': 180,
  'one more saturday night': 180,
  'around and around': 240,
  "good lovin'": 600,
}

// ─── Common position hints ────────────────────────────────────────────────────

const COMMON_OPENERS = new Set([
  'bertha', 'jack straw', 'cold rain and snow', 'promised land', 'truckin',
  'greatest story ever told', 'hell in a bucket', 'touch of grey',
  'new minglewood blues', 'shakedown street', 'feel like a stranger',
  'alabama getaway',
])

const COMMON_CLOSERS = new Set([
  'sugar magnolia', 'casey jones', "good lovin'", 'one more saturday night',
  'around and around', 'not fade away', 'samson and delilah',
])

const COMMON_ENCORES = new Set([
  'brokedown palace', 'ripple', 'and we bid you goodnight', 'friend of the devil',
  'us blues', 'black muddy river', 'attics of my life',
  "uncle john's band", 'morning dew', 'sugar magnolia',
])

// ─── Song pairings ────────────────────────────────────────────────────────────

interface RawPairing {
  direction: 'before' | 'after' | 'suite'
  partner: string
  partnerKey: string
  alwaysWith: boolean
  labelOverride?: string
}

const RAW_PAIRINGS: Record<string, RawPairing> = {
  'china cat sunflower': {
    direction: 'before', partner: 'I Know You Rider', partnerKey: 'i know you rider', alwaysWith: true,
  },
  'i know you rider': {
    direction: 'after', partner: 'China Cat Sunflower', partnerKey: 'china cat sunflower', alwaysWith: true,
  },
  'scarlet begonias': {
    direction: 'before', partner: 'Fire on the Mountain', partnerKey: 'fire on the mountain', alwaysWith: true,
  },
  'fire on the mountain': {
    direction: 'after', partner: 'Scarlet Begonias', partnerKey: 'scarlet begonias', alwaysWith: true,
  },
  'help on the way': {
    direction: 'suite', partner: "Slipknot! → Franklin's Tower", partnerKey: 'slipknot!', alwaysWith: true,
  },
  'slipknot!': {
    direction: 'suite', partner: "Help on the Way / Franklin's Tower", partnerKey: 'help on the way', alwaysWith: true,
  },
  "franklin's tower": {
    direction: 'after', partner: "Slipknot!", partnerKey: 'slipknot!', alwaysWith: false,
  },
  'drums': {
    direction: 'before', partner: 'Space', partnerKey: 'space', alwaysWith: true,
  },
  'space': {
    direction: 'after', partner: 'Drums', partnerKey: 'drums', alwaysWith: true,
  },
  'estimated prophet': {
    direction: 'before', partner: 'Eyes of the World', partnerKey: 'eyes of the world', alwaysWith: false,
  },
  'eyes of the world': {
    direction: 'after', partner: 'Estimated Prophet', partnerKey: 'estimated prophet', alwaysWith: false,
  },
  'not fade away': {
    direction: 'before', partner: "Goin' Down the Road Feeling Bad", partnerKey: "goin' down the road feeling bad", alwaysWith: false,
  },
  "goin' down the road feeling bad": {
    direction: 'after', partner: 'Not Fade Away', partnerKey: 'not fade away', alwaysWith: false,
  },
  'st. stephen': {
    direction: 'before', partner: 'The Eleven', partnerKey: 'the eleven', alwaysWith: false,
  },
  'the eleven': {
    direction: 'after', partner: 'St. Stephen', partnerKey: 'st. stephen', alwaysWith: false,
  },
  'playing in the band': {
    direction: 'suite', partner: 'Playing in the Band (Reprise)', partnerKey: 'playing in the band',
    alwaysWith: false, labelOverride: 'Often returns as reprise later in set',
  },
  'sugar magnolia': {
    direction: 'suite', partner: 'Sunshine Daydream', partnerKey: 'sugar magnolia',
    alwaysWith: true, labelOverride: 'Always ends with Sunshine Daydream',
  },
  'terrapin station': {
    direction: 'before', partner: 'Drums', partnerKey: 'drums', alwaysWith: false,
  },
  'the other one': {
    direction: 'suite', partner: 'Drums / Wharf Rat', partnerKey: 'drums', alwaysWith: false,
  },
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function getSongHints(songTitle: string): SongHints {
  const key = songTitle.toLowerCase().trim()
  const raw = RAW_PAIRINGS[key]

  let pairing: SongPairing | undefined
  if (raw) {
    let label: string
    if (raw.labelOverride) {
      label = raw.labelOverride
    } else if (raw.direction === 'before') {
      label = `→ ${raw.partner}${raw.alwaysWith ? ' (always)' : ' (often)'}`
    } else if (raw.direction === 'after') {
      label = `← ${raw.partner}${raw.alwaysWith ? ' (always)' : ' (often)'}`
    } else {
      label = `Suite with ${raw.partner}`
    }
    pairing = {
      direction: raw.direction,
      partner: raw.partner,
      partnerKey: raw.partnerKey,
      label,
      alwaysWith: raw.alwaysWith,
    }
  }

  return {
    pairing,
    positionHints: {
      isCommonOpener: COMMON_OPENERS.has(key),
      isCommonCloser: COMMON_CLOSERS.has(key),
      isCommonEncore: COMMON_ENCORES.has(key),
    },
    avgDurationSec: AVG_DURATIONS[key],
  }
}

export function formatDurationShort(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function totalDuration(entries: SetlistEntry[]): number {
  return entries.reduce((sum, e) => sum + (e.durationSec ?? 0), 0)
}

export function makeEntry(title: string): SetlistEntry {
  const hints = getSongHints(title)
  return {
    id: Math.random().toString(36).slice(2, 9),
    title: title.toLowerCase().trim(),
    displayTitle: toTitleCase(title),
    durationSec: hints.avgDurationSec,
    segueIntoNext: false,
  }
}

export const EMPTY_SETLIST: SetlistState = {
  bandName: '',
  date: '',
  venue: '',
  set1: [],
  set2: [],
  encore: [],
}

export const SETLIST_STORAGE_KEY = 'steal-your-stats-setlist'
