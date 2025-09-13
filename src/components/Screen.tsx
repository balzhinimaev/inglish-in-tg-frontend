import React, { forwardRef } from 'react';
import clsx from 'clsx';

interface ScreenProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export const Screen = forwardRef<HTMLDivElement, ScreenProps>(({
  children,
  className,
  padding = true,
}, ref) => {
  return (
    <div
      ref={ref}
      className={clsx(
        'text-telegram-text relative h-screen overflow-y-auto',
        'bg-gradient-to-br from-telegram-bg to-telegram-secondary-bg',
        padding && 'px-6 py-8',
        className
      )}
    >
      {/* Ambient lighting effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-telegram-accent/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-telegram-accent-secondary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>
      
      {/* Content with relative positioning */}
      <div className="relative z-10 animate-fade-in">
        {children}
      </div>
    </div>
  );
});
