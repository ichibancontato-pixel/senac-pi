/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Endereço do back-end (ex.: http://127.0.0.1:5000). Vazio = modo demonstração. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
