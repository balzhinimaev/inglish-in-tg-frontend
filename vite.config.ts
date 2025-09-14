import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Serve under /webapp in production (for nginx prefix), use / in dev
  base: "/webapp/",
  server: {
    port: 3000,
    host: "0.0.0.0",
    allowedHosts: ["burlive.ru", "localhost", "127.0.0.1"],
    hmr: {
      host: "burlive.ru",
      clientPort: 443,
      protocol: "wss",
      path: "/webapp/__hmr", // HMR WS за тем же префиксом
    },
    cors: true,
    fs: {
      strict: false,
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    // Отключаем минификацию для отладки (временно)
    minify: mode === "production" ? "esbuild" : false,
    rollupOptions: {
      // Убираем внешние зависимости из external
      external: [],
      output: {
        // Упрощенная стратегия разделения chunks
        manualChunks: {
          // Объединяем весь React в один chunk для избежания проблем с hooks
          "vendor-react": ["react", "react-dom", "react/jsx-runtime"],
          // Telegram SDK отдельно
          "vendor-telegram": ["@twa-dev/sdk"],
          // Query библиотеки
          "vendor-query": ["@tanstack/react-query"],
          // Чарты
          "vendor-charts": ["react-chartjs-2", "chart.js"],
        },
        // Более стабильные имена chunks
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId
                .split("/")
                .pop()
                ?.replace(".tsx", "")
                .replace(".ts", "")
                .replace(".jsx", "")
                .replace(".js", "")
            : "chunk";
          return `assets/${facadeModuleId}-[hash].js`;
        },
        // Предсказуемые имена для entry файлов
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
    // Убеждаемся что React резолвится корректно
    dedupe: ["react", "react-dom"],
  },
  // Оптимизация зависимостей
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "@tanstack/react-query",
      "@twa-dev/sdk",
    ],
    exclude: [],
  },
  // Дополнительные настройки для продакшена
  ...(mode === "production" && {
    esbuild: {
      // Сохраняем имена функций для лучшей отладки
      keepNames: true,
    },
  }),
}));
