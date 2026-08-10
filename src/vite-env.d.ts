/// <reference types="vite/client" />
/** @file Declares build-time values supplied by Vite. */

declare const __APP_VERSION__: string;

interface ImportMetaEnv {
  readonly VITE_PROJECT_ID: string;
  readonly VITE_WEB_API_KEY: string;
  readonly VITE_AUTH_HOST: string;
  readonly VITE_AUTH_PORT: string;
  readonly VITE_DB_HOST: string;
  readonly VITE_DB_PORT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
