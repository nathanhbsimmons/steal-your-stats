import { NextRequest, NextResponse } from 'next/server'
import { ArchiveClientImpl } from '@/lib/clients/archive'

export async function POST(request: NextRequest) {
  try {
    const { date, venue, city } = await request.json()

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      )
    }

    const archiveClient = new ArchiveClientImpl()
    const show = await archiveClient.resolveArchiveShow({ date, venue, city })

    if (!show) {
      return NextResponse.json(
        { error: 'No Archive.org show found for this date' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      identifier: show.identifier,
      title: show.title,
      creator: show.creator,
      date: show.date,
      venue: show.venue || 'Unknown Venue',
      city: show.city || 'Unknown City',
      state: show.state,
      country: show.country,
      licenseurl: show.licenseurl || '',
      rights: show.rights || '',
      publicdate: show.publicdate
    })
  } catch (error) {
    console.error('Error resolving Archive show:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json(
      { 
        error: 'Failed to resolve Archive show',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
