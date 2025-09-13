import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Serve under /webapp in production (for nginx prefix), use / in dev
  base: '/webapp/',
  server: {
    port: 3000,
    host: "0.0.0.0",
    allowedHosts: ["burlive.ru", "localhost", "127.0.0.1"],
    hmr: {
      host: 'burlive.ru',
      clientPort: 443,
      protocol: 'wss',
      path: '/webapp/__hmr' // HMR WS за тем же префиксом
    },
    cors: true,
    fs: {
      strict: false,
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-chartjs-2') || id.includes('chart.js')) {
              return 'charts';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query';
            }
            if (id.includes('@twa-dev/sdk')) {
              return 'telegram';
            }
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            return 'vendor';
          }
          // Split large feature screens
          if (id.includes('/src/features/')) {
            if (id.includes('LessonsListScreen')) return 'feature-lessons-list';
            if (id.includes('LessonScreen')) return 'feature-lesson';
            if (id.includes('ProfileScreen')) return 'feature-profile';
            if (id.includes('PaywallScreen')) return 'feature-paywall';
          }
          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
}));
