// MusicBrainz IDs for artists
export const GRATEFUL_DEAD_MBID = '6faa7ca7-0d99-4a5e-bfa6-1fd5037520c6'

// Common song title variations and aliases
const SONG_ALIASES: Record<string, string[]> = {
  'dark star': ['dark star', 'darkstar', 'darkstar (live)', 'dark star (live)'],
  'truckin': ['truckin', 'truckin\'', 'truckin\' (live)', 'truckin (live)'],
  'sugar magnolia': ['sugar magnolia', 'sugar magnolia (live)', 'sugar mag'],
  'casey jones': ['casey jones', 'casey jones (live)'],
  'friend of the devil': ['friend of the devil', 'friend of the devil (live)', 'fotd'],
  'uncle john\'s band': ['uncle john\'s band', 'uncle johns band', 'ujb', 'uncle john\'s band (live)'],
  'china cat sunflower': ['china cat sunflower', 'china cat', 'china cat sunflower (live)'],
  'i know you rider': ['i know you rider', 'i know you rider (live)', 'rider'],
  'the other one': ['the other one', 'other one', 'the other one (live)'],
  'st. stephen': ['st. stephen', 'st stephen', 'saint stephen', 'st. stephen (live)'],
  'fire on the mountain': ['fire on the mountain', 'fire on the mountain (live)', 'fotm'],
  'scarlet begonias': ['scarlet begonias', 'scarlet begonias (live)', 'scarlet'],
  'eyes of the world': ['eyes of the world', 'eyes of the world (live)', 'eyes'],
  'terrapin station': ['terrapin station', 'terrapin station (live)', 'terrapin'],
  'help on the way': ['help on the way', 'help on the way (live)', 'help'],
  'slipknot!': ['slipknot!', 'slipknot', 'slipknot! (live)', 'slipknot (live)'],
  'franklin\'s tower': ['franklin\'s tower', 'franklins tower', 'franklin\'s tower (live)', 'franklin'],
  'shakedown street': ['shakedown street', 'shakedown street (live)', 'shakedown'],
  'i need a miracle': ['i need a miracle', 'i need a miracle (live)', 'miracle'],
  'bertha': ['bertha', 'bertha (live)'],
  'good lovin\'': ['good lovin\'', 'good lovin', 'good lovin\' (live)', 'good lovin (live)'],
  'playing in the band': ['playing in the band', 'playing in the band (live)', 'pitb'],
  'drums': ['drums', 'drums (live)', 'drum solo'],
  'space': ['space', 'space (live)', 'space jam'],
  'not fade away': ['not fade away', 'not fade away (live)', 'nfa'],
  'goin\' down the road feeling bad': ['goin\' down the road feeling bad', 'going down the road feeling bad', 'gdtrfb', 'goin\' down the road feeling bad (live)'],
  'and we bid you goodnight': ['and we bid you goodnight', 'and we bid you goodnight (live)', 'goodnight'],
  'the eleven': ['the eleven', 'eleven', 'the eleven (live)'],
  'alligator': ['alligator', 'alligator (live)'],
  'caution (do not stop on tracks)': ['caution (do not stop on tracks)', 'caution', 'caution (do not stop on tracks) (live)'],
  'feedback': ['feedback', 'feedback (live)'],
  'turn on your lovelight': ['turn on your lovelight', 'turn on your lovelight (live)', 'lovelight'],
  'good morning little schoolgirl': ['good morning little schoolgirl', 'good morning little schoolgirl (live)', 'schoolgirl'],
  'it hurts me too': ['it hurts me too', 'it hurts me too (live)', 'hurts me too'],
  'smokestack lightning': ['smokestack lightning', 'smokestack lightning (live)', 'smokestack'],
  'big boss man': ['big boss man', 'big boss man (live)', 'boss man'],
  'next time you see me': ['next time you see me', 'next time you see me (live)', 'next time'],
  'big railroad blues': ['big railroad blues', 'big railroad blues (live)', 'railroad blues'],
  'cold rain and snow': ['cold rain and snow', 'cold rain and snow (live)', 'cold rain'],
  'me and my uncle': ['me and my uncle', 'me and my uncle (live)', 'uncle'],
  'big river': ['big river', 'big river (live)'],
  'el paso': ['el paso', 'el paso (live)'],
  'mama tried': ['mama tried', 'mama tried (live)'],
  'mexicali blues': ['mexicali blues', 'mexicali blues (live)', 'mexicali'],
  'tennessee jed': ['tennessee jed', 'tennessee jed (live)', 'tennessee'],
  'jack straw': ['jack straw', 'jack straw (live)'],
  'deal': ['deal', 'deal (live)'],
  'loser': ['loser', 'loser (live)'],
  'new speedway boogie': ['new speedway boogie', 'new speedway boogie (live)', 'speedway'],
  'candyman': ['candyman', 'candyman (live)'],
  'dire wolf': ['dire wolf', 'dire wolf (live)'],
  'high time': ['high time', 'high time (live)'],
  'easy wind': ['easy wind', 'easy wind (live)'],
  'brokedown palace': ['brokedown palace', 'brokedown palace (live)', 'brokedown'],
  'ripple': ['ripple', 'ripple (live)'],
  'attics of my life': ['attics of my life', 'attics of my life (live)', 'attics'],
}

export function getSongCatalog(): { title: string; displayTitle: string; aliases: string[] }[] {
  return Object.entries(SONG_ALIASES).map(([key, aliases]) => {
    const displayAliases = aliases
      .filter(a => a !== key && !a.toLowerCase().includes('(live)'))
    return { title: key, displayTitle: key, aliases: displayAliases }
  }).sort((a, b) => a.title.localeCompare(b.title))
}

export interface SongResolution {
  normalizedTitle: string
  aliases: string[]
  musicbrainzId?: string
}

/**
 * Resolve a song title to its canonical form and aliases
 */
export function resolveSong({ title }: { title: string }): SongResolution {
  const normalizedTitle = title.toLowerCase().trim()
  
  // Find matching aliases
  const aliases: string[] = []
  let canonicalTitle = normalizedTitle
  
  for (const [canonical, variations] of Object.entries(SONG_ALIASES)) {
    if (variations.some(variation => variation.toLowerCase() === normalizedTitle)) {
      canonicalTitle = canonical
      aliases.push(...variations)
      break
    }
  }
  
  // If no exact match found, use the input title as canonical
  if (aliases.length === 0) {
    aliases.push(title)
  }
  
  return {
    normalizedTitle: canonicalTitle,
    aliases: [...new Set(aliases)], // Remove duplicates
  }
}