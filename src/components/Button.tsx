import React from 'react';
import clsx from 'clsx';
import { hapticFeedback } from '../utils/telegram';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  haptic?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  haptic = true,
  className,
  disabled,
  onClick,
  ...props
}) => {
  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-semibold rounded-ultra-soft',
    'transition-glow',
    'focus:outline-none',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
    'btn-active',
    'relative overflow-hidden'
  ];

  const variantClasses = {
    primary: [
      'bg-telegram-button text-telegram-button-text',
      'shadow-neumorphism-raised border border-white/10',
      'hover:shadow-glow-hover hover:scale-105',
      'active:shadow-neumorphism-pressed active:scale-95',
      'focus:shadow-glow',
      'font-bold'
    ],
    secondary: [
      'bg-telegram-card-bg text-telegram-text',
      'shadow-soft border border-white/10',
      'hover:bg-telegram-secondary-bg hover:shadow-neumorphism-raised',
      'active:shadow-neumorphism-pressed',
      'focus:shadow-glow'
    ],
    ghost: [
      'text-telegram-accent bg-telegram-secondary-bg',
      'hover:bg-telegram-hint/30 hover:shadow-soft',
      'active:scale-95',
      'border-none'
    ],
    outline: [
      'text-telegram-accent bg-transparent',
      'hover:bg-telegram-accent/10 hover:shadow-soft',
      'active:scale-95',
      'border-2 border-telegram-accent/60 hover:border-telegram-accent'
    ]
  };

  const sizeClasses = {
    sm: 'px-4 py-3 text-sm min-h-[44px]',
    md: 'px-6 py-4 text-base min-h-[52px]',
    lg: 'px-8 py-5 text-lg min-h-[60px]'
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (haptic && !disabled && !isLoading) {
      hapticFeedback.impact('light');
    }
    onClick?.(e);
  };

  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || isLoading}
      onClick={handleClick}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
          <span className="animate-pulse">Загрузка...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};
