'use client'

import React, { useState, useCallback } from 'react'
import useSWR from 'swr'
import { ShowRef } from '@/lib/songFacts'
import { PositionList } from './position-list'
import { Button } from './button'

interface PaginatedPositionListProps {
  songTitle: string
  positionType: 'opener' | 'closer' | 'encore'
  initialCount: number
  initialShows: ShowRef[]
}

interface PositionPageData {
  shows: ShowRef[]
  hasMore: boolean
  totalCount: number
  page: number
  positionType: string
}

// SWR fetcher for paginated position data
async function fetchPositionPage(
  songTitle: string, 
  positionType: string, 
  page: number
): Promise<PositionPageData> {
  const response = await fetch(
    `/api/position-facts/page?songTitle=${encodeURIComponent(songTitle)}&positionType=${positionType}&page=${page}`
  )
  if (!response.ok) {
    throw new Error(`Failed to fetch position page: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

export function PaginatedPositionList({ 
  songTitle, 
  positionType, 
  initialCount, 
  initialShows 
}: PaginatedPositionListProps) {
  const [allShows, setAllShows] = useState<ShowRef[]>(initialShows)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const { data, error, isLoading, mutate } = useSWR(
    hasMore ? `position-page-${songTitle}-${positionType}-${currentPage + 1}` : null,
    () => fetchPositionPage(songTitle, positionType, currentPage + 1),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 24 * 60 * 60 * 1000, // 24 hours
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  )

  const handleLoadMore = useCallback(() => {
    if (data) {
      setAllShows(prev => [...prev, ...data.shows])
      setCurrentPage(prev => prev + 1)
      setHasMore(data.hasMore)
    }
  }, [data])

  const handleRetry = useCallback(() => {
    mutate()
  }, [mutate])

  if (error) {
    return (
      <div className="text-center py-4">
        <div className="text-red-600 mb-4">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="font-medium">Failed to load more data</p>
          <p className="text-sm text-gray mt-1">{error.message}</p>
        </div>
        <Button
          onClick={handleRetry}
          className="px-4 py-2 bg-ink text-paper border-2 border-ink rounded-md hover:bg-paper hover:text-ink transition-colors"
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PositionList
        shows={allShows}
        count={allShows.length}
        positionType={positionType}
      />
      
      {hasMore && (
        <div className="text-center">
          <Button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="px-6 py-2 bg-ink text-paper border-2 border-ink rounded-md hover:bg-paper hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-paper border-t-transparent rounded-full animate-spin"></div>
                <span>Loading...</span>
              </div>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

