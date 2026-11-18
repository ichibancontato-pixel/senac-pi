/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true" = usa dados de demonstração no navegador, sem backend. */
  readonly VITE_MODO_DEMO?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
