import React, { useState, useEffect } from 'react';
import { BottomSheet } from './BottomSheet';
import { Button, Card, CurrencySwitch } from './';
import { hapticFeedback } from '../utils/telegram';
import { tracking } from '../services/tracking';
import { useCreatePayment, usePaywallData, useCreateStarsPayment } from '../services';
import { getCohortPricing, getCohortOffer, validatePromoCode, determineUserCohort } from '../utils/cohorts';
import { formatPriceWithCurrency, kopecksToRubles, kopecksToStars } from '../utils/price';
import { usePricing } from '../hooks/usePricing';
import type { UserCohort, PromoCode, PaymentCurrency } from '../types';

interface PaywallBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  userCohort?: UserCohort;
  userData?: {
    isFirstOpen?: boolean;
    lastActiveDate?: string;
    lessonCount?: number;
    hasSubscription?: boolean;
    subscriptionExpired?: boolean;
  };
}

export const PaywallBottomSheet: React.FC<PaywallBottomSheetProps> = ({
  isOpen,
  onClose,
  userCohort: propCohort,
  userData
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<PaymentCurrency>('RUB');
  
  const createPaymentMutation = useCreatePayment();
  const createStarsPaymentMutation = useCreateStarsPayment();
  const { data: paywallData } = usePaywallData();

  // Determine user cohort
  const cohort = propCohort || (userData ? determineUserCohort(userData) : 'default');
  const pricing = paywallData?.pricing || getCohortPricing(cohort);
  const specialOffer = getCohortOffer(cohort);
  const products = paywallData?.products || [];
  
  // Use pricing hook for currency calculations
  const { productsWithCalculatedPrices, getDisplayPrice, getDisplayOriginalPrice, getDisplayMonthlyEquivalent } = usePricing({
    products,
    selectedCurrency
  });

  // Auto-apply cohort promo code if available
  useEffect(() => {
    if (pricing.promoCode && !appliedPromo) {
      const autoPromo = validatePromoCode(pricing.promoCode, cohort, 'yearly');
      if (autoPromo) {
        setAppliedPromo(autoPromo);
        setPromoCode(pricing.promoCode);
      }
    }
  }, [pricing.promoCode, cohort, appliedPromo]);

  const handlePromoSubmit = () => {
    const validPromo = validatePromoCode(promoCode, cohort, 'yearly');
    if (validPromo) {
      setAppliedPromo(validPromo);
      hapticFeedback.notification('success');
      tracking.custom('promo_applied', { code: promoCode, cohort });
    } else {
      hapticFeedback.notification('error');
      alert('Промокод недействителен или не подходит для вашего тарифа');
    }
  };


  const handleSubscribe = async (productId: string) => {
    try {
      setIsProcessing(true);
      
      // Find product by ID
      const product = products.find(p => p.id === productId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Convert kopecks to rubles for tracking
      const priceInRubles = kopecksToRubles(product.price);
      const originalPriceInRubles = product.originalPrice ? kopecksToRubles(product.originalPrice) : priceInRubles;
      
      hapticFeedback.impact('heavy');
      tracking.custom('subscription_selected', { 
        plan: productId,
        originalPrice: originalPriceInRubles,
        finalPrice: priceInRubles,
        promoCode: appliedPromo?.code,
        cohort,
        source: 'bottom_sheet',
        currency: selectedCurrency
      });
      
      // Track currency selection
      tracking.custom('payment_currency_selected', {
        productId,
        currency: selectedCurrency,
        priceInRubles,
        priceInStars: selectedCurrency === 'STARS' ? (product.priceInStars || kopecksToStars(product.price)) : null,
        source: 'bottom_sheet'
      });

      // Map product duration to API product type
      const productType = product.duration === 'month' ? 'monthly' : 
                         product.duration === 'quarter' ? 'quarterly' : 'yearly';

      if (selectedCurrency === 'STARS') {
        // Handle Telegram Stars payment
        const priceInStars = product.priceInStars || kopecksToStars(product.price);
        
        const starsPaymentData = await createStarsPaymentMutation.mutateAsync({
          product: productType,
          priceInStars: priceInStars,
          description: `Подписка ${product.name} - ${product.description}`
        });

        if (!starsPaymentData.success) {
          throw new Error(starsPaymentData.error || 'Failed to create Telegram Stars payment');
        }

        // Track successful payment creation
        tracking.paymentCreated(productId, 'telegram-stars-payment');
        
      } else {
        // Handle regular YooKassa payment
        const returnUrl = import.meta.env.VITE_PAYMENT_RETURN_URL || window.location.origin;

        const paymentData = await createPaymentMutation.mutateAsync({
          product: productType,
          returnUrl: returnUrl,
          currency: selectedCurrency,
        });

        // Track successful payment creation
        tracking.paymentCreated(productId, paymentData.paymentId);

        // Open payment URL in new tab/window
        window.open(paymentData.paymentUrl, '_blank');
      }
      
    } catch (error) {
      console.error('Payment creation failed:', error);
      alert('Ошибка при создании платежа. Попробуйте еще раз.');
      
      // Track payment error
      tracking.paymentError(productId, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="px-6 pb-6">
        {/* Hero section */}
        <div className="text-center mb-5 pt-2">
          <div className="text-4xl mb-3">🎯</div>
          
          {/* Currency switch */}
          <div className="flex justify-center mb-4">
            <CurrencySwitch
              selectedCurrency={selectedCurrency}
              onCurrencyChange={setSelectedCurrency}
            />
          </div>
          
          {/* Special offer badge */}
          {specialOffer && (
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-600 text-xs font-bold px-3 py-1 rounded-full mb-2 border border-purple-500/20">
              {specialOffer.badge}
            </div>
          )}
          
          <h2 className="text-2xl font-bold text-telegram-text mb-2">
            {specialOffer?.title || 'Изучайте без ограничений'}
          </h2>
          <p className="text-telegram-hint text-sm mb-3">
            {specialOffer?.description || 'Более 500+ уроков, персональный план и поддержка'}
          </p>
          
          {/* Urgency message */}
          {specialOffer?.urgency && (
            <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-600 text-xs font-medium px-3 py-1 rounded-full mb-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              {specialOffer.urgency}
            </div>
          )}
          
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

        {/* Promo code section */}
        {appliedPromo ? (
          <div className="mb-4 p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
            <div className="text-center">
              <div className="text-green-600 font-bold text-sm">✅ ПРОМОКОД ПРИМЕНЕН</div>
              <div className="text-telegram-text text-xs mt-1">
                {appliedPromo.code} - скидка {appliedPromo.discountValue}%
              </div>
            </div>
          </div>
        ) : showPromoInput ? (
          <div className="mb-4 p-3 bg-telegram-card-bg rounded-xl border border-telegram-secondary-bg/30">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Введите промокод"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2 bg-telegram-bg border border-telegram-secondary-bg/30 rounded-lg text-telegram-text text-sm focus:outline-none focus:ring-2 focus:ring-telegram-accent/50"
                onKeyPress={(e) => e.key === 'Enter' && handlePromoSubmit()}
              />
              <Button
                variant="ghost"
                onClick={handlePromoSubmit}
                className="px-4 py-2 text-sm"
                disabled={!promoCode.trim()}
              >
                Применить
              </Button>
            </div>
            <button
              onClick={() => setShowPromoInput(false)}
              className="text-telegram-hint text-xs mt-2 hover:text-telegram-text transition-colors"
            >
              Отмена
            </button>
          </div>
        ) : (
          <div className="mb-4 text-center">
            <button
              onClick={() => setShowPromoInput(true)}
              className="text-telegram-accent text-sm font-medium hover:text-telegram-accent/80 transition-colors"
            >
              У меня есть промокод
            </button>
          </div>
        )}

        {/* Limited time offer */}
        {specialOffer?.urgency && (
          <div className="mb-4 p-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/20">
            <div className="text-center">
              <div className="text-orange-500 font-bold text-sm">⏰ ОГРАНИЧЕННОЕ ПРЕДЛОЖЕНИЕ</div>
              <div className="text-telegram-text text-xs mt-1">{specialOffer.urgency}</div>
            </div>
          </div>
        )}

        {/* Pricing plans */}
        <div className="space-y-4 sm:space-y-3 mb-6">
          {productsWithCalculatedPrices.map((product, index) => {
            const isYearly = product.duration === 'year';
            const isQuarterly = product.duration === 'quarter';
            const isMonthly = product.duration === 'month';
            const isFirst = index === 0;
            
            if (isMonthly && !isFirst) {
              // Monthly plan in collapsible section
              return (
                <details key={product.id} className="group">
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
                          <h4 className="text-base font-bold text-telegram-text">{product.name}</h4>
                          <p className="text-telegram-hint text-sm">Для тестирования</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-telegram-text">
                            {formatPriceWithCurrency(getDisplayPrice(product), selectedCurrency)}
                          </div>
                          {getDisplayOriginalPrice(product) && (
                            <div className="text-telegram-hint text-sm line-through">
                              {formatPriceWithCurrency(getDisplayOriginalPrice(product)!, selectedCurrency)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        fullWidth
                        variant="ghost"
                        onClick={() => handleSubscribe(product.id)}
                        disabled={isProcessing || createPaymentMutation.isPending}
                        className="border border-telegram-secondary-bg text-telegram-text hover:bg-telegram-secondary-bg/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing || createPaymentMutation.isPending ? '⏳ Создание платежа...' : 'Выбрать план'}
                      </Button>
                    </Card>
                  </div>
                </details>
              );
            }
            
            return (
              <Card 
                key={product.id}
                className={`relative ${
                  isYearly 
                    ? 'border-2 border-telegram-accent bg-gradient-to-r from-telegram-accent/15 to-blue-500/15 shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse-slow animate-glow-pulse hover:scale-[1.02]' 
                    : isQuarterly
                    ? 'border-2 border-green-500/60 bg-gradient-to-r from-green-50/30 to-emerald-50/30 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.01]'
                    : 'border border-telegram-secondary-bg/30'
                }`}
              >
                {isYearly && (
                  <>
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-telegram-accent via-purple-500 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md animate-triple-gradient">
                        💎 ЛУЧШИЙ ВЫБОР
                      </span>
                    </div>
                    
                    {/* Floating particles around the card */}
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-floating-particles animation-delay-100 opacity-60"></div>
                    <div className="absolute top-1/2 -left-1 w-2 h-2 bg-blue-400 rounded-full animate-floating-particles animation-delay-300 opacity-50"></div>
                    <div className="absolute -bottom-1 left-1/4 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-floating-particles animation-delay-500 opacity-70"></div>
                  </>
                )}
                
                {isQuarterly && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-2 sm:px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                      🎯 ОПТИМАЛЬНО ДЛЯ СТАРТА
                    </span>
                  </div>
                )}
                
                <div className={isYearly || isQuarterly ? 'pt-3' : ''}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className={`font-bold text-telegram-text ${isYearly ? 'text-lg' : 'text-base'}`}>
                        {product.name}
                      </h4>
                      <div className="flex items-center gap-2">
                        {product.discount && (
                          <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                            ЭКОНОМИЯ {product.discount}%
                          </span>
                        )}
                        {getDisplayMonthlyEquivalent(product) && (
                          <span className="text-telegram-hint text-sm">
                            ≈{formatPriceWithCurrency(getDisplayMonthlyEquivalent(product)!, selectedCurrency)}/мес
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold text-telegram-text ${isYearly ? 'text-2xl' : 'text-xl'}`}>
                        {formatPriceWithCurrency(getDisplayPrice(product), selectedCurrency)}
                      </div>
                      {getDisplayOriginalPrice(product) && (
                        <div className="text-telegram-hint text-sm line-through">
                          {formatPriceWithCurrency(getDisplayOriginalPrice(product)!, selectedCurrency)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="relative">
                    {/* Subtle glow - no blur */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-telegram-accent to-blue-500 rounded-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
                    
                    {/* Super attractive main button */}
                    <button
                      onClick={() => {
                        hapticFeedback.impact('heavy');
                        handleSubscribe(product.id);
                      }}
                      onMouseEnter={() => hapticFeedback.selection()}
                      disabled={isProcessing || createPaymentMutation.isPending}
                      className={`relative w-full flex items-center justify-center gap-3 px-5 py-3 ${
                        isYearly 
                          ? 'bg-gradient-to-r from-telegram-accent via-purple-500 to-blue-500 hover:from-telegram-accent/90 hover:via-purple-500/90 hover:to-blue-500/90 text-white font-bold text-base rounded-lg shadow-2xl hover:shadow-glow transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-out border border-white/20 animate-triple-gradient overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
                          : isQuarterly
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-base rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
                          : 'border border-telegram-secondary-bg text-telegram-text hover:bg-telegram-secondary-bg/20 disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      {/* Clean shimmer effect */}
                      {isYearly && (
                        <div className="absolute inset-0 rounded-xl overflow-hidden opacity-0 hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent transform -skew-x-12 animate-shimmer" />
                        </div>
                      )}
                      
                      {/* Content */}
                      <div className="relative flex flex-col items-center justify-center z-10">
                        {/* Main attractive text */}
                        <span className={`font-bold text-lg tracking-wide drop-shadow-lg leading-none mb-1 ${
                          isYearly ? 'text-white' : isQuarterly ? 'text-white' : 'text-telegram-text'
                        }`}>
                          {isProcessing || createPaymentMutation.isPending || createStarsPaymentMutation.isPending ? '⏳ Создание платежа...' : 
                           isYearly ? (selectedCurrency === 'STARS' ? '💎 Оплатить звездами' : '💎 Получить доступ') :
                           isQuarterly ? (selectedCurrency === 'STARS' ? '🚀 Оплатить звездами' : '🚀 Начать 90-дневный план') :
                           (selectedCurrency === 'STARS' ? 'Оплатить звездами' : 'Выбрать план')}
                        </span>
                        
                        {/* Savings and monthly cost */}
                        {!(isProcessing || createPaymentMutation.isPending || createStarsPaymentMutation.isPending) && isYearly && getDisplayMonthlyEquivalent(product) && (
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-300 font-bold text-sm drop-shadow-sm leading-none">
                              всего {formatPriceWithCurrency(getDisplayMonthlyEquivalent(product)!, selectedCurrency)}/мес
                            </span>
                            <span className="text-green-300 font-bold text-sm drop-shadow-sm leading-none">
                              экономия {product.savingsPercentage || 0}%
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
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
          
          {/* Currency-specific payment info */}
          {selectedCurrency === 'STARS' && (
            <div className="mt-3 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
              <div className="text-yellow-600 font-medium text-sm mb-1">
                ⭐ Оплата звездами Telegram
              </div>
              <div className="text-telegram-text text-xs">
                Оплата происходит через встроенную систему Telegram Stars
              </div>
            </div>
          )}
        </div>

        {/* Close button */}
        <Button
          fullWidth
          variant="ghost"
          onClick={onClose}
          className="mt-4 text-telegram-hint"
        >
          Может быть позже
        </Button>
      </div>
    </BottomSheet>
  );
};
