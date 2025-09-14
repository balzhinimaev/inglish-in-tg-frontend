import React, { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Screen, Card, Button, Loader, PaywallBottomSheet } from '../components';
import { useModules } from '../services/content';
import apiClient from '../services/api';
import { useUserStore } from '../store/user';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { APP_STATES } from '../utils/constants';
import { tracking } from '../services/tracking';
import { hapticFeedback, hideBackButton, getTelegramUser } from '../utils/telegram';
import type { ModuleItem, LessonsResponse } from '../types';
import { API_ENDPOINTS, SUPPORTED_LANGUAGES } from '../utils/constants';

export const ModulesScreen: React.FC = () => {
  const { user, entitlement, hasActiveSubscription } = useUserStore();
  const telegramUser = getTelegramUser();
  const { navigateTo } = useAppNavigation();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const lastScrollYRef = useRef(0);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const modulesPerPage = 6; // Количество модулей на странице
  const screenRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useModules({ lang: SUPPORTED_LANGUAGES.RU });
  const allModules = Array.isArray(data?.modules) ? data.modules : [];

  // Группируем модули по уровням для отображения (можно использовать для фильтрации)
  // const modulesByLevel = allModules.reduce((acc, module) => {
  //   if (!acc[module.level]) {
  //     acc[module.level] = [];
  //   }
  //   acc[module.level].push(module);
  //   return acc;
  // }, {} as Record<string, ModuleItem[]>);

  const debugLog = (...args: unknown[]) => {
    if (import.meta.env.VITE_ENABLE_DEBUG_LOGGING) {
      console.log(...args);
    }
  };

  // Debug logging
  debugLog('Modules API response:', { data, isLoading, error, allModules });

  // Debug subscription and availability
  debugLog('Debug button visibility:', {
    hasActiveSubscription: hasActiveSubscription(),
    entitlement: entitlement,
    lockedModules: Array.isArray(allModules) ? allModules.filter(m => !m.isAvailable) : [],
    hasLockedModules: Array.isArray(allModules) ? allModules.some(m => !m.isAvailable) : false,
    shouldShowButtons: !hasActiveSubscription()
  });
  
  // Вычисляем модули для текущей страницы
  const totalPages = Math.ceil((Array.isArray(allModules) ? allModules.length : 0) / modulesPerPage);
  const startIndex = (currentPage - 1) * modulesPerPage;
  const endIndex = startIndex + modulesPerPage;
  const modules = Array.isArray(allModules) ? allModules.slice(startIndex, endIndex) : [];

  useEffect(() => {
    // Hide back button on modules screen
    hideBackButton();
  }, []);

  // Preload likely next screens' code-split chunks in background
  useEffect(() => {
    // Do not block UI; fire-and-forget
    import('./LessonsListScreen');
    import('./LessonScreen');
    import('./PaywallScreen');
    import('./ProfileScreen');
  }, []);

  // Prefetch lessons lists for top modules to speed up navigation
  useEffect(() => {
    if (!modules || modules.length === 0) return;
    const toPrefetch = modules.slice(0, 3);
    toPrefetch.forEach((m) => {
      const moduleRef = m.moduleRef;
      queryClient.prefetchQuery({
        queryKey: ['lessons', moduleRef, 'ru'],
        queryFn: async (): Promise<LessonsResponse> => {
          try {
            const query = new URLSearchParams();
            query.set('moduleRef', moduleRef);
            query.set('lang', 'ru');
            const url = `${API_ENDPOINTS.CONTENT.LESSONS}?${query.toString()}`;
            const response = await apiClient.get(url);
            return response.data as LessonsResponse;
          } catch {
            return { lessons: [] } as LessonsResponse;
          }
        },
        staleTime: 5 * 60 * 1000,
      });
    });
  }, [modules, queryClient]);

  // Simplified floating button scroll logic - show on scroll up, hide on scroll down
  useEffect(() => {
    debugLog('🔧 useEffect triggered - setting up scroll listener');
    
    let ticking = false;
    let screenElement: HTMLDivElement | null = null;

    const handleScroll = () => {
      debugLog('🎯 handleScroll called!');
      if (ticking || !screenElement) return;

      ticking = true;
      requestAnimationFrame(() => {
        debugLog('🎯 requestAnimationFrame executing...');
        ticking = false;

        // Always hide if user has active subscription
        if (hasActiveSubscription()) {
          setShowFloatingButton(false);
          return;
        }

        const currentScrollY = screenElement!.scrollTop;
        const scrollHeight = screenElement!.scrollHeight;
        const clientHeight = screenElement!.clientHeight;
        
        // Calculate scroll direction - lower threshold for testing
        const scrollDelta = currentScrollY - lastScrollYRef.current;
        const isScrollingUp = scrollDelta < -2; // Lower threshold for more sensitivity
        const isScrollingDown = scrollDelta > 2;
        
        // Check positions - only show floating button when main CTA is out of view
        const isAtTop = false; // Hide until main button scrolls out of view
        const isNearBottom = currentScrollY >= (scrollHeight - clientHeight - 120); // Hide when main CTA button is visible
        const canScroll = scrollHeight > clientHeight; // Content is scrollable
        
        // Temporary debug to understand the issue - log EVERY scroll event
        debugLog('🐛 EVERY SCROLL:', {
          scrollY: Math.round(currentScrollY),
          delta: Math.round(scrollDelta),
          scrollUp: isScrollingUp,
          scrollDown: isScrollingDown,
          canScroll,
          isAtTop,
          isNearBottom,
          scrollHeight: Math.round(scrollHeight),
          clientHeight: Math.round(clientHeight),
          distanceFromBottom: Math.round(scrollHeight - clientHeight - currentScrollY),
          shouldShow: canScroll && !isAtTop && !isNearBottom && isScrollingUp,
          currentVisible: showFloatingButton
        });

        // Simple logic: Show on scroll up, hide on scroll down or at edges
        if (canScroll && !isAtTop && !isNearBottom) {
          if (isScrollingUp) {
            setShowFloatingButton(true);
          } else if (isScrollingDown) {
            setShowFloatingButton(false);
          }
        } else {
          // Hide at top, bottom, or if no scrollable content
          setShowFloatingButton(false);
        }
        
        lastScrollYRef.current = currentScrollY;
      });
    };
    
    // Retry logic to find Screen element - try multiple times with increasing delays
    let retryTimeouts: NodeJS.Timeout[] = [];
    let retries = 0;
    const maxRetries = 10;
    
    const trySetupListener = () => {
      screenElement = screenRef.current;
      debugLog(`🔧 Attempt ${retries + 1}: screenElement:`, screenElement);
      
      if (screenElement) {
        debugLog('✅ Adding scroll listener to:', screenElement);
        screenElement.addEventListener('scroll', handleScroll, { passive: true });
        debugLog('✅ Scroll listener added successfully');
        return;
      }
      
      retries++;
      if (retries < maxRetries) {
        const delay = 50 * retries; // 50ms, 100ms, 150ms, etc.
        debugLog(`⏳ Retry ${retries}/${maxRetries} in ${delay}ms...`);
        const timeoutId = globalThis.setTimeout(trySetupListener, delay);
        retryTimeouts.push(timeoutId);
      } else {
        debugLog('❌ Failed to find screenElement after all retries');
      }
    };
    
    // Start first attempt
    const initialTimeout = globalThis.setTimeout(trySetupListener, 50);
    retryTimeouts.push(initialTimeout);
    
    return () => {
      debugLog('🧹 Cleaning up scroll listener and all timeouts');
      retryTimeouts.forEach(id => clearTimeout(id));
      if (screenElement) {
        screenElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [hasActiveSubscription]);

  // Track impressions
  useEffect(() => {
    if (modules.length > 0) {
      modules.forEach((m) => {
        tracking.moduleView(m.moduleRef, m.requiresPro, m.isAvailable);
      });
    }
  }, [modules]);

  const handleModuleClick = (module: ModuleItem) => {
    tracking.moduleClick(
      module.moduleRef,
      module.requiresPro,
      module.isAvailable,
      module.isAvailable ? 'module_opened' : 'paywall_shown'
    );

    if (module.isAvailable) {
      // Navigate to lessons list for this module
      navigateTo(APP_STATES.LESSONS_LIST, {
        moduleRef: module.moduleRef,
        moduleTitle: module.title
      });
    } else {
      setIsPaywallOpen(true);
    }
  };

  if (isLoading) {
    return (
      <Screen className="flex items-center justify-center">
        <Loader size="lg" text="Загрузка модулей..." />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen className="flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-red-500 text-lg mb-2">Ошибка загрузки модулей</div>
          <div className="text-telegram-hint text-sm">{error?.message || 'Неизвестная ошибка'}</div>
        </div>
      </Screen>
    );
  }

  if (!Array.isArray(allModules) || allModules.length === 0) {
    return (
      <Screen className="flex items-center justify-center">
        <div className="text-center px-4">
          <div className="text-telegram-text text-lg mb-2">Модули не найдены</div>
          <div className="text-telegram-hint text-sm">Попробуйте перезагрузить страницу</div>
        </div>
      </Screen>
    );
  }

  return (
    <>
      <Screen ref={screenRef}>
        <div className="max-w-md mx-auto">
        {/* Profile Button - Above Header */}
        <div className="flex justify-center mb-4 max-[300px]:mb-2">
          <button
            onClick={() => {
              hapticFeedback.impact('light');
              tracking.custom('modules_profile_button_clicked');
              navigateTo(APP_STATES.PROFILE);
            }}
            className="flex items-center gap-2 px-3 py-2 bg-telegram-card-bg hover:bg-telegram-secondary-bg border border-telegram-hint/20 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm group max-[300px]:px-2 max-[300px]:py-1.5 max-[300px]:gap-1"
          >
            {/* Avatar */}
            <div className="relative">
              {user?.photoUrl ? (
                <img 
                  src={user.photoUrl} 
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2 border-telegram-hint/30 max-[300px]:w-6 max-[300px]:h-6 max-[300px]:border"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-telegram-accent to-blue-500 rounded-full flex items-center justify-center max-[300px]:w-6 max-[300px]:h-6">
                  <span className="text-white text-sm font-semibold max-[300px]:text-xs">
                    {(telegramUser?.first_name?.[0] || user?.firstName?.[0] || 'У').toUpperCase()}
                  </span>
                </div>
              )}
              
              {/* Subscription indicator */}
              {hasActiveSubscription() && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-telegram-accent rounded-full border-2 border-telegram-bg flex items-center justify-center max-[300px]:w-2 max-[300px]:h-2 max-[300px]:border">
                  <svg className="w-1.5 h-1.5 text-white max-[300px]:w-1 max-[300px]:h-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 12l2 2 4-4"/>
                  </svg>
                </div>
              )}
            </div>
            
            {/* User info */}
            <div className="hidden sm:flex flex-col items-start min-w-0 max-[300px]:hidden">
              <span className="text-sm font-medium text-telegram-text truncate max-w-20">
                {telegramUser?.first_name || user?.firstName || 'Профиль'}
              </span>
              <span className="text-xs text-telegram-hint">
                {user?.proficiencyLevel === 'beginner' ? 'A1-A2' :
                 user?.proficiencyLevel === 'intermediate' ? 'B1-B2' :
                 user?.proficiencyLevel === 'advanced' ? 'C1-C2' : 'Новичок'}
              </span>
            </div>
            
            {/* Arrow icon */}
            <svg className="w-4 h-4 text-telegram-hint group-hover:text-telegram-text transition-colors max-[300px]:w-3 max-[300px]:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8 max-[300px]:mb-4">
          <h1 className="text-2xl font-bold text-telegram-text mb-3 max-[300px]:text-xl max-[300px]:mb-2">Модули</h1>
          <p className="text-telegram-hint text-lg max-[300px]:text-base max-[300px]:px-2">Выберите модуль для продолжения</p>
        </div>


        <div className="space-y-4 max-[300px]:space-y-2">
          {modules.map((m) => {
            const locked = !m.isAvailable;
            const proBadge = m.requiresPro;
            const progressRatio = m.progress ? Math.min(1, Math.max(0, (m.progress.completed + m.progress.inProgress) / Math.max(1, m.progress.total))) : 0;

            return (
              <Card key={m.moduleRef} clickable onClick={() => handleModuleClick(m)} className={`${locked ? 'opacity-60 bg-telegram-secondary-bg border-telegram-secondary-bg' : ''} max-[300px]:px-3 max-[300px]:py-3`}>
                <div className="flex items-start gap-4 max-[300px]:gap-2.5">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${locked ? 'bg-telegram-card-bg' : 'bg-telegram-button'} max-[300px]:w-8 max-[300px]:h-8`}>
                    {locked ? (
                      <svg className="w-6 h-6 text-telegram-hint max-[300px]:w-4 max-[300px]:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <circle cx="12" cy="7" r="4"/>
                        <path d="M12 1v6"/>
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-telegram-button-text max-[300px]:w-4 max-[300px]:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 max-[300px]:mb-0.5">
                      <h3 className={`font-semibold text-lg ${locked ? 'text-telegram-hint' : 'text-telegram-text'} max-[300px]:text-base max-[300px]:leading-tight truncate`}>{m.title}</h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${locked ? 'bg-telegram-card-bg text-telegram-hint' : 'bg-telegram-button text-telegram-button-text'} max-[300px]:px-1.5 max-[300px]:text-xs`}>
                        {m.level}
                      </span>
                      {proBadge && (
                        <span className="ml-2 px-2 py-0.5 text-[10px] rounded-full bg-telegram-card-bg text-telegram-accent border border-white/10 max-[300px]:px-1.5 max-[300px]:py-0.5 max-[300px]:text-[9px] max-[300px]:ml-1 shrink-0">
                          PRO
                        </span>
                      )}
                    </div>
                    <div className={`text-sm mb-3 ${locked ? 'text-telegram-hint opacity-70' : 'text-telegram-hint'} max-[300px]:text-xs max-[300px]:mb-2 max-[300px]:leading-tight`}>{m.description}</div>

                    {/* Progress */}
                    {m.progress && (
                      <div className="w-full h-2 rounded-full bg-telegram-secondary-bg overflow-hidden border border-white/10 max-[300px]:h-1.5">
                        <div
                          className="h-full bg-telegram-accent rounded-full transition-all"
                          style={{ width: `${Math.round(progressRatio * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Right chevron or lock */}
                  <div className="pt-1 shrink-0">
                    {locked ? (
                      <svg className="w-5 h-5 text-telegram-hint max-[300px]:w-4 max-[300px]:h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-telegram-hint max-[300px]:w-4 max-[300px]:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Pagination - OnboardingScreen style */}
        {totalPages > 1 && (
          <div className="mt-8 flex flex-col items-center max-[300px]:mt-4">
            {/* Page indicators (like step indicators) */}
            <div className="flex items-center gap-2 mb-4 max-[300px]:mb-2 max-[300px]:gap-1">
              {/* Previous button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  hapticFeedback.selection();
                  setCurrentPage(prev => Math.max(1, prev - 1));
                }}
                disabled={currentPage === 1}
                className="p-2 opacity-70 hover:opacity-100 max-[300px]:p-1.5"
              >
                <svg className="w-4 h-4 max-[300px]:w-3 max-[300px]:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </Button>

              {/* Page bars */}
              <div className="flex items-center gap-1 max-[300px]:gap-0.5">
                {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => {
                  let pageIndex;
                  const maxPages = 8;
                  if (totalPages <= maxPages) {
                    pageIndex = i;
                  } else {
                    // Smart pagination for many pages
                    const start = Math.max(0, currentPage - Math.floor(maxPages/2));
                    const end = Math.min(totalPages, start + maxPages);
                    pageIndex = start + i;
                    if (pageIndex >= end) return null;
                  }
                  
                  const pageNumber = pageIndex + 1;
                  const isCurrent = pageNumber === currentPage;
                  
                  return (
                    <div
                      key={pageNumber}
                      onClick={() => {
                        hapticFeedback.selection();
                        setCurrentPage(pageNumber);
                      }}
                      className={`
                        h-1 w-8 rounded-full transition-all duration-300 cursor-pointer
                        ${isCurrent 
                          ? 'bg-telegram-accent shadow-glow scale-105' 
                          : 'bg-telegram-secondary-bg border border-telegram-hint/50 hover:bg-telegram-accent/60 hover:scale-105'
                        }
                        max-[300px]:w-5 max-[300px]:h-0.5
                      `}
                    />
                  );
                })}
              </div>

              {/* Next button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  hapticFeedback.selection();
                  setCurrentPage(prev => Math.min(totalPages, prev + 1));
                }}
                disabled={currentPage === totalPages}
                className="p-2 opacity-70 hover:opacity-100 max-[300px]:p-1.5"
              >
                <svg className="w-4 h-4 max-[300px]:w-3 max-[300px]:h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </Button>
            </div>
            
            {/* Page counter (like step counter) */}
            <div className="text-xs text-telegram-hint font-medium mb-2 max-[300px]:text-[10px] max-[300px]:mb-1">
              {currentPage} / {totalPages}
            </div>
            
            {/* Additional info */}
            <div className="text-center max-[300px]:hidden">
              <p className="text-telegram-hint text-xs opacity-70">
                Всего модулей: {Array.isArray(allModules) ? allModules.length : 0}
              </p>
            </div>
          </div>
        )}

        {/* Enhanced CTA if no subscription */}
        {!hasActiveSubscription() && (
          <div className="mt-8 mb-4 max-[300px]:mt-4 max-[300px]:mb-2">
            <div className="relative group">
              {/* Glow effect background */}
              <div className="absolute -inset-1 bg-gradient-to-r from-telegram-accent via-blue-500 to-purple-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-all duration-500 animate-pulse max-[300px]:rounded-xl max-[300px]:-inset-0.5" />
              
              {/* Main button */}
              <button
                onClick={() => {
                  hapticFeedback.impact('heavy');
                  tracking.custom('main_cta_clicked', { 
                    page: 'modules',
                    position: 'bottom' 
                  });
                  setIsPaywallOpen(true);
                }}
                onMouseEnter={() => hapticFeedback.selection()}
                className="relative w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-telegram-accent via-blue-500 to-purple-500 hover:from-telegram-accent/90 hover:via-blue-500/90 hover:to-purple-500/90 text-white font-bold text-lg rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-out border border-white/20 backdrop-blur-sm group-hover:border-white/30 max-[300px]:px-4 max-[300px]:py-3 max-[300px]:gap-2 max-[300px]:text-base max-[300px]:rounded-xl"
              >
                {/* Animated background pattern */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden max-[300px]:rounded-xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 transform -skew-x-12 group-hover:animate-shimmer" />
                </div>
                
                {/* Content */}
                <div className="relative flex items-center gap-3 max-[300px]:gap-2">
                  {/* Animated icon */}
                  <div className="flex items-center justify-center w-6 h-6 max-[300px]:w-5 max-[300px]:h-5">
                    <svg 
                      className="w-5 h-5 transform group-hover:rotate-12 transition-transform duration-300 max-[300px]:w-4 max-[300px]:h-4" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5"
                    >
                      <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                      <path d="M9 12l2 2 4-4"/>
                    </svg>
                  </div>
                  
                  {/* Text */}
                  <span className="tracking-wide max-[300px]:text-sm max-[300px]:tracking-normal">
                    Открыть полный доступ
                  </span>
                  
                  {/* Arrow */}
                  <div className="flex items-center justify-center w-5 h-5 max-[300px]:w-4 max-[300px]:h-4">
                    <svg 
                      className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300 max-[300px]:w-3 max-[300px]:h-3" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5"
                    >
                      <path d="M5 12h14"/>
                      <path d="M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
                
                {/* Multiple sparkle effects */}
                <div className="absolute -top-2 -left-2 w-4 h-4 max-[300px]:-top-1 max-[300px]:-left-1 max-[300px]:w-3 max-[300px]:h-3">
                  <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-60" />
                  <div className="absolute inset-0 bg-yellow-300 rounded-full animate-pulse" />
                </div>
                
                <div className="absolute -top-1 -right-3 w-3 h-3 max-[300px]:-top-0.5 max-[300px]:-right-2 max-[300px]:w-2 max-[300px]:h-2">
                  <div className="absolute inset-0 bg-pink-400 rounded-full animate-ping opacity-60 animation-delay-300" />
                  <div className="absolute inset-0 bg-pink-300 rounded-full animate-pulse animation-delay-300" />
                </div>
                
                <div className="absolute -bottom-2 right-8 w-2 h-2 max-[300px]:-bottom-1 max-[300px]:right-6 max-[300px]:w-1.5 max-[300px]:h-1.5">
                  <div className="absolute inset-0 bg-cyan-400 rounded-full animate-ping opacity-60 animation-delay-600" />
                  <div className="absolute inset-0 bg-cyan-300 rounded-full animate-pulse animation-delay-600" />
                </div>
              </button>
              
              {/* Floating particles effect */}
              <div className="absolute inset-0 pointer-events-none max-[300px]:hidden">
                <div className="absolute top-2 left-4 w-1 h-1 bg-white/40 rounded-full animate-bounce animation-delay-100" />
                <div className="absolute top-4 right-6 w-1 h-1 bg-white/40 rounded-full animate-bounce animation-delay-300" />
                <div className="absolute bottom-3 left-8 w-1 h-1 bg-white/40 rounded-full animate-bounce animation-delay-500" />
              </div>
            </div>
            
            {/* Subtitle */}
            <p className="text-center text-telegram-hint text-sm mt-3 px-4 max-[300px]:text-xs max-[300px]:mt-2 max-[300px]:px-2">
              ✨ Получите доступ ко всем модулям и функциям
            </p>
          </div>
        )}
        </div>
      </Screen>

      {/* Beautiful Floating Action Button - Matching main CTA styling */}
      <div className={`
        fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 
        transition-all duration-300 ease-out
        ${showFloatingButton 
          ? 'translate-y-0 opacity-100 scale-100' 
          : 'translate-y-16 opacity-0 scale-95 pointer-events-none'
        }
        max-[300px]:bottom-4
      `}>
        <div className="relative group">
          {/* Glow effect background - matching main CTA */}
          <div className="absolute -inset-1 bg-gradient-to-r from-telegram-accent via-blue-500 to-purple-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-all duration-500 animate-pulse max-[300px]:-inset-0.5" />
          
          {/* Main button - matching main CTA */}
          <button
            onClick={() => {
              hapticFeedback.impact('heavy');
              tracking.custom('floating_cta_clicked', { 
                page: 'modules',
                scroll_position: screenRef.current?.scrollTop || 0
              });
              setIsPaywallOpen(true);
            }}
            onMouseEnter={() => hapticFeedback.selection()}
            className="relative flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-telegram-accent via-blue-500 to-purple-500 hover:from-telegram-accent/90 hover:via-blue-500/90 hover:to-purple-500/90 text-white font-bold text-base rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-out border border-white/20 backdrop-blur-sm group-hover:border-white/30 whitespace-nowrap max-[300px]:px-4 max-[300px]:py-2.5 max-[300px]:gap-1.5 max-[300px]:text-sm"
          >
            {/* Animated background pattern - matching main CTA */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 transform -skew-x-12 group-hover:animate-shimmer" />
            </div>
            
            {/* Content */}
            <div className="relative flex items-center gap-2 max-[300px]:gap-1.5">
              {/* Animated icon - matching main CTA */}
              <div className="flex items-center justify-center w-5 h-5 max-[300px]:w-4 max-[300px]:h-4">
                <svg 
                  className="w-4 h-4 transform group-hover:rotate-12 transition-transform duration-300 max-[300px]:w-3 max-[300px]:h-3" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5"
                >
                  <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                  <path d="M9 12l2 2 4-4"/>
                </svg>
              </div>
              
              {/* Text */}
              <span className="tracking-wide max-[300px]:text-xs max-[300px]:tracking-normal">
                Открыть полный доступ
              </span>
              
              {/* Arrow - matching main CTA */}
              <div className="flex items-center justify-center w-4 h-4 max-[300px]:w-3 max-[300px]:h-3">
                <svg 
                  className="w-3 h-3 transform group-hover:translate-x-1 transition-transform duration-300 max-[300px]:w-2.5 max-[300px]:h-2.5" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5"
                >
                  <path d="M5 12h14"/>
                  <path d="M12 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
            
            {/* Multiple sparkle effects - matching main CTA */}
            <div className="absolute -top-2 -left-2 w-4 h-4 max-[300px]:-top-1 max-[300px]:-left-1 max-[300px]:w-3 max-[300px]:h-3">
              <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-60" />
              <div className="absolute inset-0 bg-yellow-300 rounded-full animate-pulse" />
            </div>
            
            <div className="absolute -top-1 -right-3 w-3 h-3 max-[300px]:-top-0.5 max-[300px]:-right-2 max-[300px]:w-2 max-[300px]:h-2">
              <div className="absolute inset-0 bg-pink-400 rounded-full animate-ping opacity-60 animation-delay-300" />
              <div className="absolute inset-0 bg-pink-300 rounded-full animate-pulse animation-delay-300" />
            </div>
            
            <div className="absolute -bottom-2 right-8 w-2 h-2 max-[300px]:-bottom-1 max-[300px]:right-6 max-[300px]:w-1.5 max-[300px]:h-1.5">
              <div className="absolute inset-0 bg-cyan-400 rounded-full animate-ping opacity-60 animation-delay-600" />
              <div className="absolute inset-0 bg-cyan-300 rounded-full animate-pulse animation-delay-600" />
            </div>
          </button>
          
          {/* Floating particles effect - matching main CTA */}
          <div className="absolute inset-0 pointer-events-none max-[300px]:hidden">
            <div className="absolute top-2 left-4 w-1 h-1 bg-white/40 rounded-full animate-bounce animation-delay-100" />
            <div className="absolute top-4 right-6 w-1 h-1 bg-white/40 rounded-full animate-bounce animation-delay-300" />
            <div className="absolute bottom-3 left-8 w-1 h-1 bg-white/40 rounded-full animate-bounce animation-delay-500" />
          </div>
        </div>
      </div>

      {/* Paywall Bottom Sheet */}
      <PaywallBottomSheet
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
      />
    </>
  );
};


