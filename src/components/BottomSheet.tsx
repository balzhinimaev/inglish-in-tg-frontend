import React, { useEffect, useState, useRef, useCallback } from 'react';
import { hapticFeedback } from '../utils/telegram';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const lastYRef = useRef(0);

  // Close with animation
  const closeSheet = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setIsDragging(false); // Сбрасываем dragging сразу
    hapticFeedback.impact('light');
    
    // Сразу разблокируем body scroll
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
    
    setTimeout(() => {
      setIsVisible(false);
      setDragOffset(0);
      setIsAnimating(false);
      onClose();
    }, 300);
  }, [isAnimating, onClose]);

  // Handle drag start
  const handleDragStart = useCallback((clientY: number) => {
    if (isAnimating) return;
    
    setIsDragging(true);
    startYRef.current = clientY;
    lastYRef.current = clientY;
    hapticFeedback.selection();
  }, [isAnimating]);

  // Handle drag move
  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging || isAnimating) return;
    
    const deltaY = clientY - startYRef.current;
    const newOffset = Math.max(0, deltaY); // Only allow dragging down
    
    // Add resistance when dragging beyond certain point
    const resistance = newOffset > 150 ? 0.3 : 1;
    setDragOffset(newOffset * resistance);
    
    lastYRef.current = clientY;
  }, [isDragging, isAnimating]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (!isDragging || isAnimating) return;
    
    setIsDragging(false);
    
    const velocity = lastYRef.current - startYRef.current;
    const shouldClose = dragOffset > 120 || velocity > 50;
    
    if (shouldClose) {
      closeSheet();
    } else {
      // Snap back to original position
      setDragOffset(0);
      hapticFeedback.impact('light');
    }
  }, [isDragging, isAnimating, dragOffset, closeSheet]);

  // Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientY);
  }, [handleDragStart]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleDragMove(e.clientY);
  }, [handleDragMove]);

  const handleMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Предотвращаем скролл только если действительно перетаскиваем
    if (isDragging && !isAnimating) {
      e.preventDefault();
      handleDragMove(e.touches[0].clientY);
    }
  }, [handleDragMove, isDragging, isAnimating]);

  const handleTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Global event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current && !isAnimating) {
      closeSheet();
    }
  }, [closeSheet, isAnimating]);

  // Handle open/close animations
  useEffect(() => {
    if (isOpen && !isVisible) {
      // Opening animation
      setIsVisible(true);
      setIsAnimating(true);
      
      // Trigger entrance animation
      setTimeout(() => {
        setIsAnimating(false);
      }, 400);
    } else if (!isOpen && isVisible && !isAnimating) {
      // Closing when isOpen becomes false externally (e.g. "Может быть позже" button)
      setIsAnimating(true);
      
      // Immediately unlock body scroll
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      
      setTimeout(() => {
        setIsVisible(false);
        setDragOffset(0);
        setIsAnimating(false);
      }, 300);
    }
  }, [isOpen, isVisible, isAnimating]);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isVisible && !isAnimating) {
      // Блокируем только когда полностью открыт и не анимируется
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      // Разблокируем при закрытии или анимации
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    
    return () => {
      // Гарантируем разблокировку при размонтировании
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isVisible, isAnimating]);

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <div
      ref={overlayRef}
      className={`
        fixed inset-0 z-50 flex items-end justify-center
        transition-all duration-400 ease-out
        ${isOpen && !isAnimating ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'}
      `}
      onClick={handleBackdropClick}
    >
      <div
        ref={sheetRef}
        className={`
          relative w-full bg-telegram-bg rounded-t-3xl shadow-2xl
          flex flex-col overflow-hidden
          transition-transform duration-400 ease-out
          ${isDragging ? 'transition-none' : ''}
          ${isOpen && !isAnimating ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{
          height: '95vh',
          transform: isDragging ? `translateY(${dragOffset}px)` : undefined,
        }}
      >
        {/* Minimal header */}
        <div className="relative shrink-0">
          {/* Drag area - full width for better UX */}
          <div
            className="w-full py-2 cursor-grab active:cursor-grabbing touch-none"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            {/* Drag handle */}
            <div className="flex justify-center">
              <div className={`
                w-8 h-1 rounded-full transition-all duration-200
                ${isDragging ? 'bg-telegram-hint/70 scale-125' : 'bg-telegram-hint/25 hover:bg-telegram-hint/40'}
              `} />
            </div>
          </div>

          {/* Title and close - overlay style */}
          {title && (
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2 pointer-events-none">
              <h2 className="text-base font-medium text-telegram-text/80 truncate">
                {title}
              </h2>
              <button
                onClick={closeSheet}
                disabled={isAnimating}
                className="pointer-events-auto p-1 rounded-full hover:bg-telegram-secondary-bg/20 transition-colors disabled:opacity-50 ml-2"
              >
                <svg className="w-4 h-4 text-telegram-hint/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18"/>
                  <path d="M6 6l12 12"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
