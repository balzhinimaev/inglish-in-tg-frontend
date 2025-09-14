/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENABLE_DEBUG_LOGGING: string;
  readonly VITE_DEV_HOST: string;
  readonly VITE_DEV_PORT: string;
  readonly VITE_BOT_USERNAME: string;
  readonly VITE_TELEGRAM_WEB_APP_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
