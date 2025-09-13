import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import { initTelegramWebApp } from './utils/telegram';

// Force dark theme before any rendering
document.documentElement.style.setProperty('--tg-theme-bg-color', '#121212');
document.documentElement.style.setProperty('--tg-theme-text-color', '#ffffff');
document.body.style.backgroundColor = '#121212';
document.body.style.color = '#ffffff';

// Initialize Telegram WebApp
initTelegramWebApp();

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
