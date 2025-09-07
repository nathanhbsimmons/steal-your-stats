'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { Window, WindowHeader, WindowBody } from '@/components/ui/window'
import { SongHeader } from '@/components/ui/song-header'
import { FactRow } from '@/components/ui/fact-row'
import { Card } from '@/components/ui/card'
import { FirstLastFacts, PositionFacts } from '@/lib/songFacts'
import { Collapse } from '@/components/ui/collapse'
import { PaginatedPositionList } from '@/components/ui/paginated-position-list'

// SWR fetcher functions
async function fetchSongFacts(songTitle: string): Promise<FirstLastFacts> {
  const response = await fetch(`/api/song-facts?songTitle=${encodeURIComponent(songTitle)}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch song facts: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

async function fetchPositionFacts(songTitle: string): Promise<PositionFacts> {
  const response = await fetch(`/api/position-facts?songTitle=${encodeURIComponent(songTitle)}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch position facts: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

// Loading skeleton component
function SongFactsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 bg-gray animate-pulse rounded"></div>
      <div className="space-y-3">
        <div className="h-16 bg-gray animate-pulse rounded"></div>
        <div className="h-16 bg-gray animate-pulse rounded"></div>
      </div>
    </div>
  )
}

// Error component
function SongFactsError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="text-center py-8">
      <div className="text-red-600 mb-4">
        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p className="font-medium">Failed to load song facts</p>
        <p className="text-sm text-gray mt-1">{error.message}</p>
      </div>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-ink text-paper border-2 border-ink rounded-md hover:bg-paper hover:text-ink transition-colors"
      >
        Try Again
      </button>
    </div>
  )
}

// Empty state component
function SongFactsEmpty({ songTitle }: { songTitle: string }) {
  return (
    <div className="text-center py-8">
      <div className="text-gray mb-4">
        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="font-medium">No performance data found</p>
        <p className="text-sm text-gray mt-1">
          No setlist data available for &ldquo;{songTitle}&rdquo;
        </p>
      </div>
    </div>
  )
}

export default function SongPage() {
  const params = useParams()
  const slug = params.slug as string
  
  // Decode the slug to get the song title
  const songTitle = decodeURIComponent(slug)
  
  // SWR hooks with 24h cache as specified
  const { data, error, isLoading, mutate } = useSWR(
    `song-facts-${songTitle}`,
    () => fetchSongFacts(songTitle),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 24 * 60 * 60 * 1000, // 24 hours
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  )

  const { 
    data: positionData, 
    error: positionError, 
    isLoading: positionLoading, 
    mutate: mutatePositions 
  } = useSWR(
    `position-facts-${songTitle}`,
    () => fetchPositionFacts(songTitle),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 24 * 60 * 60 * 1000, // 24 hours
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  )

  return (
    <Window>
      <WindowHeader>
        <h1 className="text-lg font-serif font-bold">Song: {songTitle}</h1>
      </WindowHeader>
      <WindowBody>
        <div className="space-y-6">
          {isLoading && <SongFactsSkeleton />}
          
          {error && (
            <SongFactsError 
              error={error} 
              onRetry={() => mutate()} 
            />
          )}
          
          {data && (
            <>
              <div className="flex items-center justify-between">
                <SongHeader 
                  title={data.songTitle} 
                  aliases={data.aliases} 
                />
                <button
                  onClick={() => {
                    mutate()
                    mutatePositions()
                  }}
                  className="px-3 py-1 text-xs bg-ink text-paper border-2 border-ink rounded-md hover:bg-paper hover:text-ink transition-colors"
                >
                  Refresh Data
                </button>
              </div>
              
              <Card className="p-6">
                <h2 className="text-xl font-serif font-bold text-ink mb-4">
                  Performance Facts
                </h2>
                
                {data.totalPerformances === 0 ? (
                  <SongFactsEmpty songTitle={data.songTitle} />
                ) : (
                  <div className="space-y-1">
                    <FactRow 
                      label="First Performance" 
                      show={data.first} 
                    />
                    <FactRow 
                      label="Last Performance" 
                      show={data.last} 
                    />
                    
                    <div className="flex items-center justify-between py-3 border-b-2 border-gray">
                      <span className="text-ink font-medium">Total Performances</span>
                      <span className="text-ink font-bold text-lg">
                        {data.totalPerformances.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </Card>

              {/* Position Facts Sections */}
              {positionLoading && (
                <div className="space-y-4">
                  <div className="h-12 bg-gray animate-pulse rounded"></div>
                  <div className="h-12 bg-gray animate-pulse rounded"></div>
                  <div className="h-12 bg-gray animate-pulse rounded"></div>
                </div>
              )}

              {positionError && (
                <Card className="p-6">
                  <div className="text-center">
                    <div className="text-red-600 mb-4">
                      <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <p className="font-medium">Failed to load position data</p>
                      <p className="text-sm text-gray mt-1">{positionError.message}</p>
                    </div>
                    <button
                      onClick={() => mutatePositions()}
                      className="px-4 py-2 bg-ink text-paper border-2 border-ink rounded-md hover:bg-paper hover:text-ink transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </Card>
              )}

              {positionData && (
                <div className="space-y-4">
                  <Collapse 
                    title={`Opener (${positionData.opener.count})`}
                    id="opener-section"
                    defaultOpen={false}
                  >
                    <PaginatedPositionList
                      songTitle={songTitle}
                      positionType="opener"
                      initialCount={positionData.opener.count}
                      initialShows={positionData.opener.shows}
                    />
                  </Collapse>

                  <Collapse 
                    title={`Closer (${positionData.closer.count})`}
                    id="closer-section"
                    defaultOpen={false}
                  >
                    <PaginatedPositionList
                      songTitle={songTitle}
                      positionType="closer"
                      initialCount={positionData.closer.count}
                      initialShows={positionData.closer.shows}
                    />
                  </Collapse>

                  <Collapse 
                    title={`Encore (${positionData.encore.count})`}
                    id="encore-section"
                    defaultOpen={false}
                  >
                    <PaginatedPositionList
                      songTitle={songTitle}
                      positionType="encore"
                      initialCount={positionData.encore.count}
                      initialShows={positionData.encore.shows}
                    />
                  </Collapse>
                </div>
              )}
              
              <div className="text-xs text-gray text-center">
                <p>
                  Data provided by{' '}
                  <a 
                    href="https://www.setlist.fm" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-ink transition-colors"
                  >
                    setlist.fm
                  </a>
                  {' '}• Cached for 24 hours
                </p>
              </div>
            </>
          )}
        </div>
      </WindowBody>
    </Window>
  )
}
