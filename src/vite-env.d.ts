
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_AUTH_DISABLED: string
  readonly VITE_MOCK_USER_EMAIL: string
  readonly VITE_MOCK_USER_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
