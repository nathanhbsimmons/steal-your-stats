import React from 'react';
import { cn } from '@/lib/utils';

interface WindowProps {
  children: React.ReactNode;
  className?: string;
}

interface WindowHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface WindowBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface WindowFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function Window({ children, className }: WindowProps) {
  return (
    <div
      className={cn(
        'bg-paper border-2 border-ink rounded-radius-xl shadow-window',
        className
      )}
    >
      {children}
    </div>
  );
}

export function WindowHeader({ children, className }: WindowHeaderProps) {
  return (
    <header
      className={cn(
        'border-b-2 border-ink bg-ink text-paper px-4 py-3 rounded-t-radius-xl',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Stripe pattern for retro chrome look */}
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-paper rounded-sm"></div>
            <div className="w-3 h-3 bg-paper rounded-sm"></div>
            <div className="w-3 h-3 bg-paper rounded-sm"></div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {children}
        </div>
      </div>
    </header>
  );
}

export function WindowBody({ children, className }: WindowBodyProps) {
  return (
    <main className={cn('p-4', className)}>
      {children}
    </main>
  );
}

export function WindowFooter({ children, className }: WindowFooterProps) {
  return (
    <footer
      className={cn(
        'border-t-2 border-ink bg-gray px-4 py-3 rounded-b-radius-xl',
        className
      )}
    >
      {children}
    </footer>
  );
}
