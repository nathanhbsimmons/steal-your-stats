import React from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from './scroll-area';

interface SidebarProps {
  children: React.ReactNode;
  className?: string;
}

export function Sidebar({ children, className }: SidebarProps) {
  return (
    <aside className={cn('h-full', className)} role="navigation" aria-label="Main navigation">
      <ScrollArea className="h-full">
        <div className="space-y-6 p-1">
          {children}
        </div>
      </ScrollArea>
    </aside>
  );
}

interface NavSectionProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function NavSection({ children, title, className }: NavSectionProps) {
  return (
    <div className={cn('mb-6', className)}>
      {title && (
        <h3 className="font-meta text-xs font-medium text-ink/60 uppercase tracking-wider mb-3 px-2">
          {title}
        </h3>
      )}
      <nav className="space-y-1">
        {children}
      </nav>
    </div>
  );
}

interface NavItemProps {
  children: React.ReactNode;
  href?: string;
  isActive?: boolean;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function NavItem({ 
  children, 
  href, 
  isActive = false, 
  icon, 
  className, 
  onClick 
}: NavItemProps) {
  const Component = href ? 'a' : 'button';
  
  return (
    <Component
      href={href}
      onClick={onClick}
      className={cn(
        'group flex items-center w-full px-3 py-2 text-sm font-body transition-colors',
        'border-2 border-transparent rounded-radius-md',
        'hover:border-ink/30 hover:bg-ink/5',
        'focus-visible:border-ink focus-visible:bg-ink/5 focus-visible:outline-none',
        isActive 
          ? 'border-ink bg-ink/10 text-ink font-medium' 
          : 'text-ink/70 hover:text-ink',
        className
      )}
    >
      {icon && (
        <span className="text-ink/50 group-hover:text-ink/70 group-focus-visible:text-ink/70 mr-3">
          {icon}
        </span>
      )}
      <span className="truncate">{children}</span>
    </Component>
  );
}
