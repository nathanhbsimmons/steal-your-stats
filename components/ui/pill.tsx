import React from 'react';
import { cn } from '@/lib/utils';

interface PillProps {
  children: React.ReactNode;
  variant?: 'active' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export function Pill({ 
  children, 
  variant = 'outline', 
  size = 'md', 
  className 
}: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-meta font-medium rounded-full',
        'border-2 transition-colors',
        size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        variant === 'active'
          ? 'border-ink bg-ink text-paper'
          : 'border-ink/30 text-ink/70 hover:border-ink/50 hover:text-ink',
        className
      )}
    >
      {children}
    </span>
  );
}
