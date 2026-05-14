'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from './button'

export interface CollapseProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  id?: string
  className?: string
}

export function Collapse({ 
  title, 
  children, 
  defaultOpen = false, 
  id,
  className = '' 
}: CollapseProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [height, setHeight] = useState<number | undefined>(defaultOpen ? undefined : 0)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0)
    }
  }, [isOpen])

  // Set initial height
  useEffect(() => {
    if (contentRef.current) {
      setHeight(defaultOpen ? contentRef.current.scrollHeight : 0)
    }
  }, [defaultOpen])

  const toggle = () => {
    setIsOpen(!isOpen)
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggle()
    }
  }

  return (
    <div className={`border-2 border-ink rounded-md ${className}`} id={id}>
      <Button
        variant="ghost"
        onClick={toggle}
        onKeyDown={handleKeyDown}
        className="w-full justify-between p-4 h-auto border-0 rounded-none border-b-2 border-ink last:border-b-0"
        aria-expanded={isOpen}
        aria-controls={id ? `${id}-content` : undefined}
      >
        <span className="font-medium text-left">{title}</span>
        <span 
          className={`transform transition-transform duration-200 ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
          aria-hidden="true"
        >
          ▼
        </span>
      </Button>
      
      <div
        id={id ? `${id}-content` : undefined}
        ref={contentRef}
        className="overflow-hidden transition-all duration-200 ease-in-out"
        style={{ height: height }}
        aria-hidden={!isOpen}
      >
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  )
}
