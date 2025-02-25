import React from 'react';
import { useViewport } from '@/hooks/use-viewport';
import { cn } from '@/lib/utils';

type DynamicContentProps = {
  children: React.ReactNode;
  className?: string;
};

export function DynamicContent({ children, className }: DynamicContentProps) {
  const { orientation, isMobile, scale } = useViewport();

  const dynamicStyles: React.CSSProperties = {
    transform: isMobile ? `scale(${orientation === 'landscape' ? Math.min(scale * 1.2, 1) : scale})` : 'none',
    transformOrigin: 'top center',
    height: orientation === 'portrait' ? '100dvh' : 'auto',
    minHeight: orientation === 'landscape' ? '100dvh' : 'auto',
    overflowY: 'auto',
    overflowX: 'hidden',
    WebkitOverflowScrolling: 'touch',
  };

  return (
    <div 
      className={cn('w-full transition-transform duration-200', className)}
      style={dynamicStyles}
    >
      {children}
    </div>
  );
}