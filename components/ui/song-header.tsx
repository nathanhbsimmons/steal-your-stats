import React from 'react'
import { cn } from '@/lib/utils'

export interface SongHeaderProps {
  title: string
  aliases?: string[]
  className?: string
}

export function SongHeader({ title, aliases = [], className }: SongHeaderProps) {
  const hasAliases = aliases.length > 0 && aliases.some(alias => alias !== title)

  return (
    <div className={cn('space-y-2', className)}>
      <h1 className="text-3xl font-serif font-bold text-ink">
        {title}
      </h1>
      
      {hasAliases && (
        <div className="space-y-1">
          <p className="text-sm text-gray font-medium">Also known as:</p>
          <div className="flex flex-wrap gap-2">
            {aliases
              .filter(alias => alias !== title && alias.toLowerCase() !== title.toLowerCase())
              .slice(0, 5) // Limit to 5 aliases to avoid clutter
              .map((alias, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-paper border-2 border-gray rounded-md text-ink font-mono"
                >
                  {alias}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
