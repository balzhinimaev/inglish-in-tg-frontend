import React from 'react';
import clsx from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  clickable?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  padding = 'md',
  clickable = false,
  onClick,
}) => {
  const baseClasses = [
    'neumorphism-raised',
    'rounded-ultra-soft',
    'transition-glow',
    'backdrop-blur-sm'
  ];

  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const clickableClasses = clickable
    ? [
        'cursor-pointer',
        'hover:scale-[1.02] hover:shadow-glow',
        'active:scale-[0.98] active:shadow-neumorphism-pressed',
        'hover:bg-telegram-card-bg/80',
        'transition-all duration-200 ease-out'
      ]
    : [];

  return (
    <div
      className={clsx(
        baseClasses,
        paddingClasses[padding],
        clickableClasses,
        className
      )}
      onClick={clickable ? onClick : undefined}
    >
      {children}
    </div>
  );
};
