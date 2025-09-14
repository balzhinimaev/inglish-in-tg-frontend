import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Screen } from '../components';

interface DesktopBridgeScreenProps {
  botUsername?: string;
  webAppUrl?: string;
}

export const DesktopBridgeScreen: React.FC<DesktopBridgeScreenProps> = ({
  botUsername = import.meta.env.VITE_BOT_USERNAME || 'EnglishINtg_bot',
  webAppUrl = import.meta.env.VITE_TELEGRAM_WEB_APP_URL || 'https://t.me/EnglishINtg_bot/webapp'
}) => {
  const qrRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (qrRef.current) {
      // Generate QR code directly on canvas element
      QRCode.toCanvas(qrRef.current, webAppUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#ffffff',
          light: '#121212',
        },
        errorCorrectionLevel: 'H'
      }).then(() => {
        console.log('QR code generated successfully');
      }).catch((error) => {
        console.error('QR code generation failed:', error);
        // Fallback: show error message
        const canvas = qrRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = 256;
            canvas.height = 256;
            ctx.fillStyle = '#121212';
            ctx.fillRect(0, 0, 256, 256);
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('QR код недоступен', 128, 120);
            ctx.fillText('Используйте кнопку ниже', 128, 140);
          }
        }
      });
    }
  }, [webAppUrl]);

  const handleTelegramLinkClick = () => {
    // Try to open in Telegram app, fallback to web
    const telegramAppUrl = `tg://resolve?domain=${botUsername}&start=webapp`;
    const telegramWebUrl = `https://t.me/${botUsername}`;
    
    // Try Telegram app first
    window.location.href = telegramAppUrl;
    
    // Fallback to web version after a short delay
    setTimeout(() => {
      window.open(telegramWebUrl, '_blank');
    }, 1000);
  };

  return (
    <Screen>
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="max-w-md mx-auto space-y-6">
          {/* Logo or App Icon */}
          <div className="mx-auto w-20 h-20 bg-telegram-button rounded-full flex items-center justify-center mb-6">
            <span className="text-3xl font-bold text-telegram-button-text">📚</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-telegram-text mb-4">
            English in Telegram
          </h1>

          {/* Description */}
          <p className="text-telegram-hint text-lg leading-relaxed mb-6">
            Это приложение работает в Telegram. 
            <br />
            Сканируйте QR код или перейдите по ссылке ниже.
          </p>

          {/* QR Code */}
          <div className="bg-white p-6 rounded-2xl shadow-lg mb-6 inline-block">
            <canvas 
              ref={qrRef} 
              className="block"
              style={{ maxWidth: '256px', maxHeight: '256px' }}
            />
          </div>

          {/* Instructions */}
          <div className="space-y-4 text-telegram-hint">
            <p className="font-medium text-telegram-text">Как запустить:</p>
            <div className="space-y-2 text-left">
              <div className="flex items-start space-x-3">
                <span className="text-telegram-button font-bold">1.</span>
                <span>Откройте Telegram на вашем телефоне</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-telegram-button font-bold">2.</span>
                <span>Сканируйте QR код камерой</span>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-telegram-button font-bold">3.</span>
                <span>Или нажмите кнопку ниже</span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleTelegramLinkClick}
              className="w-full bg-telegram-button hover:opacity-90 transition-opacity text-telegram-button-text font-semibold py-4 px-6 rounded-xl text-lg"
            >
              Открыть в Telegram
            </button>

            <a
              href={webAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full border border-telegram-button text-telegram-button hover:bg-telegram-button hover:text-telegram-button-text transition-all font-semibold py-4 px-6 rounded-xl text-lg"
            >
              Открыть в веб-версии
            </a>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-telegram-secondary-bg">
            <p className="text-sm text-telegram-hint">
              Лучший опыт обучения — в мобильном приложении Telegram
            </p>
          </div>
        </div>
      </div>
    </Screen>
  );
};

export default DesktopBridgeScreen;
