import React from 'react';
import { PaymentCurrency } from '../types';
import { hapticFeedback } from '../utils/telegram';
import { isTelegramStarsAvailable } from '../services/telegramStars';

interface CurrencySwitchProps {
  selectedCurrency: PaymentCurrency;
  onCurrencyChange: (currency: PaymentCurrency) => void;
  className?: string;
}

export const CurrencySwitch: React.FC<CurrencySwitchProps> = ({
  selectedCurrency,
  onCurrencyChange,
  className = ''
}) => {
  const handleCurrencyChange = (currency: PaymentCurrency) => {
    hapticFeedback.selection();
    onCurrencyChange(currency);
  };

  const starsAvailable = isTelegramStarsAvailable();

  // If stars are not available and user selected stars, switch to RUB
  React.useEffect(() => {
    if (!starsAvailable && selectedCurrency === 'STARS') {
      onCurrencyChange('RUB');
    }
  }, [starsAvailable, selectedCurrency, onCurrencyChange]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-telegram-hint">Оплата:</span>
      
      <div className="flex bg-telegram-secondary-bg rounded-lg p-1">
        <button
          onClick={() => handleCurrencyChange('RUB')}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
            selectedCurrency === 'RUB'
              ? 'bg-telegram-accent text-white shadow-sm'
              : 'text-telegram-text hover:text-telegram-accent'
          }`}
        >
          ₽ Рубли
        </button>
        
        {starsAvailable && (
          <button
            onClick={() => handleCurrencyChange('STARS')}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
              selectedCurrency === 'STARS'
                ? 'bg-telegram-accent text-white shadow-sm'
                : 'text-telegram-text hover:text-telegram-accent'
            }`}
          >
            ⭐ Звезды
          </button>
        )}
      </div>
    </div>
  );
};
