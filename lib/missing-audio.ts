export function hasMissingAudio(coveredIndices: Set<number> | null, totalSongs: number): boolean {
  if (coveredIndices === null) return false
  for (let i = 0; i < totalSongs; i++) {
    if (!coveredIndices.has(i)) return true
  }
  return false
}

export function missingAudioMessage({
  candidateCount,
  canOpenSetlist = false,
}: {
  candidateCount: number
  canOpenSetlist?: boolean
}): string {
  const base = "Some songs from this show don't have available audio."
  if (candidateCount > 1) return `${base} Try switching recordings above.`
  if (canOpenSetlist) return `${base} Open the full setlist to browse other recordings.`
  return base
}
