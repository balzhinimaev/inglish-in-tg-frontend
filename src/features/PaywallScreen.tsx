import React, { useEffect, useState } from 'react';
import { Screen, Card, Button, Loader } from '../components';
import { usePaywallProducts, useCreatePayment } from '../services';
import { useAppNavigation } from '../hooks/useAppNavigation';
import { tracking } from '../services/tracking';
import { APP_STATES } from '../utils/constants';

export const PaywallScreen: React.FC = () => {
  const { navigateTo, setupBackButton } = useAppNavigation();
  
  const { data: products = [], isLoading } = usePaywallProducts();
  const createPaymentMutation = useCreatePayment();
  const [isProcessing, setIsProcessing] = useState(false);

  // Setup navigation
  useEffect(() => {
    setupBackButton();
  }, [setupBackButton]);

  // Track paywall view
  useEffect(() => {
    if (products.length > 0) {
      tracking.paywallViewed(products);
    }
  }, [products]);

  const handlePurchase = async (productId: string, price: number, currency: string) => {
    try {
      setIsProcessing(true);
      
    // Track purchase initiation
    tracking.purchaseInitiated(productId, price, currency);

      // Map product duration to API product type
      const product = products.find(p => p.id === productId);
      if (!product) {
        throw new Error('Product not found');
      }

      const productType = product.duration === 'month' ? 'monthly' : 
                         product.duration === 'quarter' ? 'quarterly' : 'yearly';

      // Get return URL from environment or use current URL
      const returnUrl = import.meta.env.VITE_PAYMENT_RETURN_URL || window.location.origin;

      // Create payment
      const paymentData = await createPaymentMutation.mutateAsync({
        product: productType,
        returnUrl: returnUrl,
      });

      // Track successful payment creation
      tracking.paymentCreated(productId, paymentData.paymentId);

      // Open payment URL in new tab/window
      window.open(paymentData.paymentUrl, '_blank');
      
    } catch (error) {
      console.error('Payment creation failed:', error);
      alert('Ошибка при создании платежа. Попробуйте еще раз.');
      
      // Track payment error
      tracking.paymentError(productId, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsProcessing(false);
    }
  };


  if (isLoading) {
    return (
      <Screen className="flex items-center justify-center">
        <Loader size="lg" text="Загрузка тарифов..." />
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="max-w-md mx-auto px-6 pb-6">
        {/* Hero section */}
        <div className="text-center mb-5 pt-2">
          <div className="text-4xl mb-3">🎯</div>
          
          {/* Special offer badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-600 text-xs font-bold px-3 py-1 rounded-full mb-2 border border-purple-500/20">
            ЛУЧШЕЕ ПРЕДЛОЖЕНИЕ
          </div>
          
          <h1 className="text-2xl font-bold text-telegram-text mb-2">
            Изучайте без ограничений
          </h1>
          <p className="text-telegram-hint text-sm mb-3">
            Более 500+ уроков, персональный план и поддержка
          </p>
          
          {/* Urgency message */}
          <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-600 text-xs font-medium px-3 py-1 rounded-full mb-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            Ограниченное время: скидка 58%
          </div>
          
          <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-600 text-xs font-medium px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Сейчас активны 1,247 пользователей
          </div>
        </div>

        {/* Benefits section */}
        <div className="mb-6">
          <h3 className="text-base font-medium text-telegram-text mb-3">
            Что вы получите:
          </h3>
          
          <div className="space-y-3">
            {[
              { icon: '🔓', text: 'Доступ ко всем модулям и урокам' },
              { icon: '⚡', text: 'Безлимитное количество попыток' },
              { icon: '📈', text: 'Отслеживание результатов и достижений' },
              { icon: '🎯', text: 'Персональные рекомендации' },
              { icon: '🤝', text: 'Помощь и поддержка когда нужна' },
              { icon: '🎲', text: 'Изучение уроков в любом порядке' },
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-2xl">{benefit.icon}</span>
                <span className="text-telegram-text">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Limited time offer */}
        <div className="mb-4 p-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/20">
          <div className="text-center">
            <div className="text-orange-500 font-bold text-sm">⏰ ОГРАНИЧЕННОЕ ПРЕДЛОЖЕНИЕ</div>
            <div className="text-telegram-text text-xs mt-1">Скидка 58% действует только сегодня!</div>
          </div>
        </div>

        {/* Pricing plans */}
        <div className="space-y-4 sm:space-y-3 mb-6">
          {/* Annual plan - Default selected with super attractive effects */}
          <Card className="relative border-2 border-telegram-accent bg-gradient-to-r from-telegram-accent/15 to-blue-500/15 shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse-slow animate-glow-pulse hover:scale-[1.02]">
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-telegram-accent via-purple-500 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md animate-triple-gradient">
                💎 ЛУЧШИЙ ВЫБОР
              </span>
            </div>
            
            {/* Floating particles around the card */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-floating-particles animation-delay-100 opacity-60"></div>
            <div className="absolute top-1/2 -left-1 w-2 h-2 bg-blue-400 rounded-full animate-floating-particles animation-delay-300 opacity-50"></div>
            <div className="absolute -bottom-1 left-1/4 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-floating-particles animation-delay-500 opacity-70"></div>
            
            <div className="pt-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-lg font-bold text-telegram-text">Годовая подписка</h4>
                  <div className="flex items-center gap-2">
                    <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                      ЭКОНОМИЯ 58%
                    </span>
                    <span className="text-telegram-hint text-sm">≈240₽/мес</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-telegram-text">₽2,880</div>
                  <div className="text-telegram-hint text-sm line-through">₽6,840</div>
                </div>
              </div>
              
              <div className="relative">
                {/* Subtle glow - no blur */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-telegram-accent to-blue-500 rounded-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
                
                {/* Super attractive main button */}
                <button
                  onClick={() => handlePurchase('yearly', 2880, 'RUB')}
                  disabled={isProcessing || createPaymentMutation.isPending}
                  className="relative w-full flex items-center justify-center gap-3 px-5 py-3 bg-gradient-to-r from-telegram-accent via-purple-500 to-blue-500 hover:from-telegram-accent/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white font-bold text-base rounded-lg shadow-2xl hover:shadow-glow transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-out border border-white/20 animate-triple-gradient overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {/* Clean shimmer effect */}
                  <div className="absolute inset-0 rounded-xl overflow-hidden opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent transform -skew-x-12 animate-shimmer" />
                  </div>
                  
                  {/* Content */}
                  <div className="relative flex flex-col items-center justify-center z-10">
                    {/* Main attractive text */}
                    <span className="text-white font-bold text-lg tracking-wide drop-shadow-lg leading-none mb-1">
                      {isProcessing || createPaymentMutation.isPending ? '⏳ Создание платежа...' : '💎 Получить доступ'}
                    </span>
                    
                    {/* Savings and monthly cost */}
                    {!(isProcessing || createPaymentMutation.isPending) && (
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-300 font-bold text-sm drop-shadow-sm leading-none">
                          всего 240₽/мес
                        </span>
                        <span className="text-green-300 font-bold text-sm drop-shadow-sm leading-none">
                          экономия 73%
                      </span>
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </Card>

          {/* Quarterly plan - Simple and clean */}
          <Card className="relative border-2 border-green-500/60 bg-gradient-to-r from-green-50/30 to-emerald-50/30 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
              <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-2 sm:px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                🎯 ОПТИМАЛЬНО ДЛЯ СТАРТА
              </span>
            </div>
            
            <div className="pt-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-base font-bold text-telegram-text">3 месяца</h4>
                  <div className="flex items-center gap-2">
                    <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                      ЭКОНОМИЯ 16%
                    </span>
                    <span className="text-telegram-hint text-sm">≈497₽/мес</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-telegram-text">₽1,490</div>
                  <div className="text-telegram-hint text-sm line-through">₽1,770</div>
                </div>
              </div>
              
              <button
                onClick={() => handlePurchase('quarterly', 1490, 'RUB')}
                disabled={isProcessing || createPaymentMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-base rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isProcessing || createPaymentMutation.isPending ? '⏳ Создание платежа...' : '🚀 Начать 90-дневный план'}
              </button>
            </div>
          </Card>

          {/* Monthly plan - collapsed by default */}
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-center py-2 text-telegram-hint text-sm hover:text-telegram-text transition-colors">
                <span>Ещё планы</span>
                <svg className="w-4 h-4 ml-1 transform group-open:rotate-180 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            </summary>
            
            <div className="mt-2">
              <Card className="border border-telegram-secondary-bg/30">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-base font-bold text-telegram-text">Месячная подписка</h4>
                    <p className="text-telegram-hint text-sm">Для тестирования</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-telegram-text">₽590</div>
                    <div className="text-telegram-hint text-sm line-through">₽690</div>
                  </div>
                </div>
                
                <Button
                  fullWidth
                  variant="ghost"
                  onClick={() => handlePurchase('monthly', 590, 'RUB')}
                  disabled={isProcessing || createPaymentMutation.isPending}
                  className="border border-telegram-secondary-bg text-telegram-text hover:bg-telegram-secondary-bg/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing || createPaymentMutation.isPending ? '⏳ Создание платежа...' : 'Выбрать план'}
                </Button>
              </Card>
            </div>
          </details>
        </div>

        {/* Trust indicators */}
        <div className="text-center space-y-2 mb-4">
          <div className="flex items-center justify-center gap-4 text-telegram-hint text-sm">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V5l-9-4z"/>
              </svg>
              Безопасная оплата
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Единоразовая оплата
            </span>
          </div>
          
          <p className="text-telegram-hint text-xs">
            Оплачиваете один раз и пользуетесь весь период подписки.
          </p>
        </div>

        {/* Back to lesson */}
        <Button
          variant="ghost"
          fullWidth
          onClick={() => navigateTo(APP_STATES.MODULES)}
          className="mt-4 text-telegram-hint"
        >
          Может быть позже
        </Button>
      </div>
    </Screen>
  );
};
