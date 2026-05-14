'use client'

import React, { useState } from 'react'
import { ShowRef } from '@/lib/songFacts'
import { FactRow } from './fact-row'
import { Button } from './button'

export interface PositionListProps {
  shows: ShowRef[]
  count: number
  positionType: 'opener' | 'closer' | 'encore'
  className?: string
}

const ITEMS_PER_PAGE = 10

export function PositionList({ shows, count, positionType, className = '' }: PositionListProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(shows.length / ITEMS_PER_PAGE)
  
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentShows = shows.slice(startIndex, endIndex)

  const handleLoadMore = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages))
  }

  const handleShowAll = () => {
    setCurrentPage(totalPages)
  }

  if (count === 0) {
    return (
      <div className={`text-center py-4 text-gray ${className}`}>
        <p>No {positionType} performances found</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="mb-4">
        <p className="text-sm text-gray">
          Showing {Math.min(currentPage * ITEMS_PER_PAGE, shows.length)} of {count} {positionType} performances
        </p>
      </div>

      <div className="space-y-1 mb-4">
        {currentShows.map((show, index) => (
          <FactRow
            key={`${show.id}-${startIndex + index}`}
            label={`${startIndex + index + 1}.`}
            show={show}
          />
        ))}
      </div>

      {totalPages > 1 && currentPage < totalPages && (
        <div className="flex gap-2 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadMore}
            className="text-sm"
          >
            Load More ({Math.min(ITEMS_PER_PAGE, shows.length - currentPage * ITEMS_PER_PAGE)} more)
          </Button>
          
          {currentPage < totalPages - 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShowAll}
              className="text-sm"
            >
              Show All ({shows.length - currentPage * ITEMS_PER_PAGE} remaining)
            </Button>
          )}
        </div>
      )}

      {currentPage === totalPages && totalPages > 1 && (
        <div className="text-center text-sm text-gray">
          Showing all {count} {positionType} performances
        </div>
      )}
    </div>
  )
}
