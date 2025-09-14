import React, { useEffect, useRef } from 'react';
import * as QRCode from 'qrcode.js';
import { Screen } from '../components';

interface DesktopBridgeScreenProps {
  botUsername?: string;
  webAppUrl?: string;
}

export const DesktopBridgeScreen: React.FC<DesktopBridgeScreenProps> = ({
  botUsername = import.meta.env.VITE_BOT_USERNAME || 'englishintg_bot',
  webAppUrl = import.meta.env.VITE_TELEGRAM_WEB_APP_URL || 'https://t.me/englishintg_bot/webapp'
}) => {
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (qrRef.current) {
      // Clear previous QR code
      qrRef.current.innerHTML = '';
      
      // Generate QR code
      const qr = new QRCode(qrRef.current, {
        text: webAppUrl,
        width: 256,
        height: 256,
        colorDark: '#ffffff',
        colorLight: '#121212',
        correctLevel: QRCode.CorrectLevel.H,
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
            <div ref={qrRef} className="flex justify-center" />
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
