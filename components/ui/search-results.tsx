import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Card, CardContent } from "./card"
import { cn } from "@/lib/utils"

export interface SearchResult {
  id: string
  title: string
  subtitle?: string
  description?: string
}

export type SearchState = "idle" | "loading" | "empty" | "error" | "success"

interface SearchResultsProps {
  results: SearchResult[]
  state: SearchState
  onSelect: (result: SearchResult) => void
  className?: string
  "aria-labelledby"?: string
  "aria-describedby"?: string
}

function SearchResults({
  results,
  state,
  onSelect,
  className,
  "aria-labelledby": ariaLabelledby,
  "aria-describedby": ariaDescribedby,
}: SearchResultsProps) {
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(-1)
  }, [results])

  // Focus management
  useEffect(() => {
    if (selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.focus()
    }
  }, [selectedIndex])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (state !== "success" || results.length === 0) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0))
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1))
          break
        case "Enter":
          e.preventDefault()
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            onSelect(results[selectedIndex])
          }
          break
        case "Escape":
          e.preventDefault()
          setSelectedIndex(-1)
          break
      }
    },
    [state, results, selectedIndex, onSelect]
  )

  const handleItemClick = useCallback(
    (result: SearchResult) => {
      onSelect(result)
    },
    [onSelect]
  )

  const handleItemMouseEnter = useCallback((index: number) => {
    setSelectedIndex(index)
  }, [])

  const renderContent = () => {
    switch (state) {
      case "idle":
        return (
          <div className="px-6 py-8 text-center">
            <p className="text-muted-foreground text-sm">
              Start typing to search for items
            </p>
          </div>
        )

      case "loading":
        return (
          <div className="px-6 py-8">
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        )

      case "empty":
        return (
          <div className="px-6 py-8 text-center">
            <p className="text-muted-foreground text-sm">
              No results found. Try different search terms.
            </p>
          </div>
        )

      case "error":
        return (
          <div className="px-6 py-8 text-center">
            <p className="text-destructive text-sm">
              Something went wrong. Please try again.
            </p>
          </div>
        )

      case "success":
        if (results.length === 0) {
          return (
            <div className="px-6 py-8 text-center">
              <p className="text-muted-foreground text-sm">
                No results found. Try different search terms.
              </p>
            </div>
          )
        }

        return (
          <div className="p-2">
            {results.map((result, index) => (
              <button
                key={result.id}
                ref={(el) => {
                  itemRefs.current[index] = el
                }}
                onClick={() => handleItemClick(result)}
                onMouseEnter={() => handleItemMouseEnter(index)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-md border-2 border-transparent transition-all",
                  "hover:bg-accent hover:border-accent-foreground/20",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  selectedIndex === index &&
                    "bg-accent border-accent-foreground/20 ring-2 ring-ring ring-offset-2"
                )}
                aria-selected={selectedIndex === index}
                role="option"
              >
                <div className="space-y-1">
                  <div className="font-medium text-sm">{result.title}</div>
                  {result.subtitle && (
                    <div className="text-muted-foreground text-xs">
                      {result.subtitle}
                    </div>
                  )}
                  {result.description && (
                    <div className="text-muted-foreground text-xs">
                      {result.description}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card
      className={cn("shadow-window", className)}
      role="listbox"
      aria-labelledby={ariaLabelledby}
      aria-describedby={ariaDescribedby}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <CardContent className="p-0">
        {renderContent()}
      </CardContent>
    </Card>
  )
}

export { SearchResults }
