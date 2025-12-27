import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  // Для development через туннель используем /development
  // В dev режиме НЕ используем base, чтобы не было редиректов
  base: mode === "development" ? "/development/" : "/",

  server: {
    port: 8004,
    host: "0.0.0.0",
    allowedHosts: ["englishintg.ru", "localhost", "127.0.0.1"],
    cors: true,
    fs: {
      strict: false,
    },
    hmr: {
      host: "englishintg.ru",
      clientPort: 443,
      protocol: "wss",
      path: "/development/__vite_hmr", // Исправлено на правильный путь
    },
    // Убери все hmr настройки пока
  },
  // server: {
  //   port: 8004,
  //   host: "0.0.0.0",
  //   allowedHosts: ["englishintg.ru", "localhost", "127.0.0.1"],
  //   hmr: {
  //     host: "englishintg.ru",
  //     clientPort: 443,
  //     protocol: "wss",
  //     path: "/development/__vite_hmr", // Исправлено на правильный путь
  //   },
  //   cors: true,
  //   fs: {
  //     strict: false,
  //   },
  // },

  build: {
    outDir: "dist",
    sourcemap: true,
    minify: mode === "production" ? "esbuild" : false,
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react/jsx-runtime"],
          "vendor-telegram": ["@twa-dev/sdk"],
          "vendor-query": ["@tanstack/react-query"],
          "vendor-charts": ["react-chartjs-2", "chart.js"],
        },
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
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },

  resolve: {
    alias: {
      "@": "/src",
    },
    dedupe: ["react", "react-dom"],
  },

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

  ...(mode === "production" && {
    esbuild: {
      keepNames: true,
    },
  }),
}));
