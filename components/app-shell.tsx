import React from 'react';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

interface AppShellNavigationProps {
  children: React.ReactNode;
  className?: string;
}

interface AppShellContentProps {
  children: React.ReactNode;
  className?: string;
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className={cn('min-h-screen bg-paper', className)}>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] min-h-screen">
        {children}
      </div>
    </div>
  );
}

export function AppShellNavigation({ children, className }: AppShellNavigationProps) {
  return (
    <nav
      className={cn(
        'border-r-2 border-ink bg-gray p-4 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto',
        className
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {children}
    </nav>
  );
}

export function AppShellContent({ children, className }: AppShellContentProps) {
  return (
    <main
      className={cn('p-4 lg:p-6', className)}
      role="main"
      id="main-content"
    >
      {children}
    </main>
  );
}
