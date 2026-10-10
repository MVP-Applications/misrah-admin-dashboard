/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_KEY: string;
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_SEND_DEVICE_HEADERS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
