import { NextRequest, NextResponse } from 'next/server'
import { ArchiveClientImpl } from '@/lib/clients/archive'
import { parseArchiveSetlist } from '@/lib/parse-archive-setlist'

export async function POST(request: NextRequest) {
  try {
    const { date, venue, city, totalSongs } = await request.json()

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      )
    }

    const archiveClient = new ArchiveClientImpl()

    // Fetch all candidates for the date (sorted by venue/city match score)
    const candidates = await archiveClient.listArchiveShowCandidates({ date, venue, city })
    if (candidates.length === 0) {
      return NextResponse.json(
        { error: 'No Archive.org show found for this date' },
        { status: 404 }
      )
    }

    // Smart selection: if we know totalSongs, pick by coverage then quality.
    // Otherwise fall back to the top venue/city score match.
    let selectedIdentifier = candidates[0].identifier
    if (totalSongs && totalSongs > 0) {
      const best = await archiveClient.selectBestRecording(candidates, totalSongs)
      if (best.identifier) selectedIdentifier = best.identifier
    }

    // Fetch full metadata for the selected recording (single /metadata call)
    const meta = await archiveClient.getShowMetadata(selectedIdentifier)
    const archiveSongs = meta.description ? parseArchiveSetlist(meta.description) : []

    return NextResponse.json({
      identifier: selectedIdentifier,
      title: meta.title || selectedIdentifier,
      creator: meta.creator,
      date: meta.date,
      venue: meta.venue || 'Unknown Venue',
      city: meta.city || 'Unknown City',
      state: meta.state,
      country: meta.country,
      licenseurl: meta.licenseurl,
      rights: meta.rights,
      publicdate: meta.publicdate,
      description: meta.description ?? undefined,
      archiveSongs,
      candidates,
    })
  } catch (error) {
    console.error('Error resolving Archive show:', error)
    return NextResponse.json(
      {
        error: 'Failed to resolve Archive show',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
