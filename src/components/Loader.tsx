import React from 'react';
import clsx from 'clsx';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  color = 'primary',
  text,
  fullScreen = false,
  className,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    primary: 'border-telegram-button',
    secondary: 'border-telegram-text opacity-60'
  };

  const spinner = (
    <div
      className={clsx(
        'border-2 border-t-transparent rounded-full animate-spin',
        sizeClasses[size],
        colorClasses[color]
      )}
    />
  );

  const content = (
    <div className={clsx(
      'flex flex-col items-center justify-center gap-4',
      className
    )}>
      {spinner}
      {text && (
        <p className="text-telegram-hint text-sm animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-telegram-bg flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return content;
};
