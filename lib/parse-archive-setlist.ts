/**
 * Parses the free-text description embedded in an Archive.org GD item
 * into an ordered list of song names.
 *
 * Common description formats:
 *   "Don't Ease Me In, Truckin', China Cat-> I Know You Rider, ..."
 *   "Set I: Truckin', Sugar Mag\nSet II: Dark Star\nEncore: Casey Jones"
 *   "Dark Star, St. Stephen\n\nSource: SBD > DAT\nRecorded by..."
 */

// Signals the start of recording notes — everything from here on is dropped.
const METADATA_RE =
  /\n\s*\n|(?:^|\n)\s*(?:source|recorded|transfer|lineage|notes|taper|master|equipment|disc\s+\d|d\d+t\d)\s*:/im

// Set/encore header labels to strip before splitting on commas.
const SET_HEADER_RE =
  /\b(?:set\s+(?:i{1,3}|iv|v|\d+|one|two|three))\s*[:.\-]\s*|\bencore\s*[:.\-]?\s*|\be\s*:\s*/gi

export function parseArchiveSetlist(description: string): string[] {
  if (!description?.trim()) return []

  // Convert <br> tags to commas — they're used as song separators in some items
  let text = description.replace(/<br\s*\/?>/gi, ', ')
  // Strip remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ')

  // Truncate at recording metadata
  const metaIdx = text.search(METADATA_RE)
  if (metaIdx > 0) text = text.slice(0, metaIdx)

  // Replace line breaks with commas so multi-line setlists split uniformly
  text = text.replace(/\r?\n/g, ', ')

  // Collapse excess whitespace
  text = text.replace(/\s{2,}/g, ' ').trim()

  // Strip set/encore header labels
  text = text.replace(SET_HEADER_RE, ' ')

  const songs: string[] = []
  for (const part of text.split(',')) {
    // Each comma token may be a segue chain: "China Cat-> I Know You Rider"
    for (const seg of part.split(/\s*-+>\s*|\s+>\s+/)) {
      const cleaned = seg
        .replace(/^[\s>-]+/, '')   // strip leading junk / trailing arrow remnants
        .replace(/[\s>-]+$/, '')
        .trim()
      // Must be plausibly a song title (2–80 chars)
      if (cleaned.length >= 2 && cleaned.length <= 80) {
        songs.push(cleaned)
      }
    }
  }

  return songs
}
