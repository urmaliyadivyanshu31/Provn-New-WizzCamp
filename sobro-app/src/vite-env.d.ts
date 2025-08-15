/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ORIGIN_CLIENT_ID: string
  readonly VITE_ORIGIN_API_KEY: string
  readonly VITE_SUBGRAPH_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}