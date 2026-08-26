/// <reference types="vite/client" />

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_PROJECT_ID: string;
  readonly VITE_WEB_API_KEY: string;
  readonly VITE_USE_FIREBASE_EMULATORS?: string;
  readonly VITE_AUTH_HOST: string;
  readonly VITE_AUTH_PORT: string;
  readonly VITE_DB_HOST: string;
  readonly VITE_DB_PORT: string;
}
