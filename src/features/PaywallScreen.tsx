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

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price);
  };

  const getDiscountText = (duration: string, discount?: number) => {
    if (!discount) return null;
    
    return duration === 'quarter' 
      ? `Скидка ${discount}%` 
      : duration === 'year' 
      ? `Скидка ${discount}%` 
      : null;
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
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-telegram-text mb-3">
            Откройте полный доступ 🚀
          </h1>
          <p className="text-telegram-hint text-lg">
            Получите доступ к полному 7-дневному курсу и изучайте язык эффективнее
          </p>
        </div>

        {/* Benefits */}
        <Card className="mb-6">
          <h3 className="font-semibold text-telegram-text mb-4">
            Что вы получите:
          </h3>
          <div className="space-y-3">
            {[
              '📚 Полный доступ к 7-дневному курсу',
              '🎧 Аудио уроки с носителями языка',
              '📝 Интерактивные упражнения',
              '🎯 Персональный план обучения',
              '💬 Поддержка в обучении',
            ].map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-lg">{benefit.split(' ')[0]}</span>
                <span className="text-telegram-text">{benefit.substring(benefit.indexOf(' ') + 1)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Pricing Cards */}
        <div className="space-y-4 mb-6">
          {products.map((product) => {
            const discountText = getDiscountText(product.duration, product.discount);
            
            return (
              <Card 
                key={product.id}
                className={`relative ${product.isPopular ? 'ring-2 ring-telegram-button' : ''}`}
              >
                {product.isPopular && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <span className="bg-telegram-button text-telegram-button-text px-3 py-1 text-xs font-medium rounded-full">
                      Популярный
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-telegram-text text-lg">
                      {product.name}
                    </h3>
                    <p className="text-telegram-hint text-sm">
                      {product.description}
                    </p>
                    {discountText && (
                      <span className="inline-block mt-1 text-green-600 text-sm font-medium">
                        {discountText}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-telegram-text">
                      {formatPrice(product.price, product.currency)}
                    </div>
                  </div>
                </div>
                
                <Button
                  fullWidth
                  variant={product.isPopular ? 'primary' : 'secondary'}
                  onClick={() => handlePurchase(product.id, product.price, product.currency)}
                  disabled={isProcessing || createPaymentMutation.isPending}
                >
                  {isProcessing || createPaymentMutation.isPending ? 'Создание платежа...' : 'Купить'}
                </Button>
              </Card>
            );
          })}
        </div>

        {/* Back to lesson */}
        <Button
          variant="ghost"
          fullWidth
          onClick={() => navigateTo(APP_STATES.MODULES)}
          className="mb-4"
        >
          Вернуться к модулям
        </Button>

        {/* Footer */}
        <div className="text-center text-telegram-hint text-sm">
          <p>
            Безопасная оплата через YooKassa.{' '}
            <br />
            Отмена в любое время.
          </p>
        </div>
      </div>
    </Screen>
  );
};
