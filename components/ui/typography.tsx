import React from 'react';
import { cn } from '@/lib/utils';

interface DisplayHeadingProps {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  className?: string;
}

export function DisplayHeading({ 
  children, 
  as: Component = 'h1', 
  className 
}: DisplayHeadingProps) {
  return (
    <Component
      className={cn(
        'font-display font-bold text-ink leading-tight',
        'tracking-tight',
        className
      )}
    >
      {children}
    </Component>
  );
}

interface SubheadProps {
  children: React.ReactNode;
  as?: 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p';
  className?: string;
}

export function Subhead({ 
  children, 
  as: Component = 'h2', 
  className 
}: SubheadProps) {
  return (
    <Component
      className={cn(
        'font-body text-ink/80 leading-relaxed',
        'italic',
        className
      )}
    >
      {children}
    </Component>
  );
}

interface BodyTextProps {
  children: React.ReactNode;
  as?: 'p' | 'div' | 'span';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BodyText({ 
  children, 
  as: Component = 'p', 
  size = 'md',
  className 
}: BodyTextProps) {
  return (
    <Component
      className={cn(
        'font-body text-ink leading-relaxed',
        'max-w-prose', // ~65ch comfortable measure
        size === 'sm' && 'text-sm',
        size === 'md' && 'text-base',
        size === 'lg' && 'text-lg',
        className
      )}
    >
      {children}
    </Component>
  );
}
