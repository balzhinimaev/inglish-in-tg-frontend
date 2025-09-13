import React from 'react';
import { Screen, Button } from '../components';
import { useUserStore } from '../store/user';
import { closeTelegramWebApp } from '../utils/telegram';

export const ErrorScreen: React.FC = () => {
  const { error, reset } = useUserStore();

  const handleRestart = () => {
    reset();
    window.location.reload();
  };

  const handleClose = () => {
    closeTelegramWebApp();
  };

  return (
    <Screen className="flex items-center justify-center">
      <div className="text-center max-w-md mx-auto">
        {/* Error Icon */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        {/* Error Message */}
        <h1 className="text-xl font-bold text-telegram-text mb-4">
          Произошла ошибка
        </h1>
        
        <p className="text-telegram-hint text-center mb-6">
          {error || 'Что-то пошло не так. Попробуйте перезапустить приложение.'}
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            fullWidth
            size="lg"
            onClick={handleRestart}
          >
            Перезапустить приложение
          </Button>
          
          <Button
            variant="ghost"
            fullWidth
            onClick={handleClose}
          >
            Закрыть
          </Button>
        </div>

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && error && (
          <div className="mt-6 p-3 bg-gray-100 rounded-lg text-left">
            <p className="text-xs text-gray-600 font-mono break-all">
              {error}
            </p>
          </div>
        )}
      </div>
    </Screen>
  );
};
