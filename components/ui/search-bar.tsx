import * as React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Input } from "./input"
import { Button } from "./button"
import { cn } from "@/lib/utils"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  placeholder?: string
  label?: string
  className?: string
  disabled?: boolean
  "aria-describedby"?: string
}

function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = "Search...",
  label = "Search",
  className,
  disabled = false,
  "aria-describedby": ariaDescribedby,
  ...props
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(value)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Debounced onChange effect
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      onChange(internalValue)
    }, 300)

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [internalValue, onChange])

  // Sync external value changes
  useEffect(() => {
    setInternalValue(value)
  }, [value])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value)
  }, [])

  const handleClear = useCallback(() => {
    setInternalValue("")
    onClear()
  }, [onClear])

  return (
    <div className={cn("relative", className)}>
      <label htmlFor="search-input" className="sr-only">
        {label}
      </label>
      <div className="relative">
        <Input
          id="search-input"
          type="text"
          value={internalValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          aria-describedby={ariaDescribedby}
          role="combobox"
          aria-expanded={false}
          aria-autocomplete="list"
          className="pr-10"
          {...props}
        />
        {internalValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            aria-label="Clear search"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        )}
      </div>
    </div>
  )
}

export { SearchBar }
