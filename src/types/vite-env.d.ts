/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_SKIP_AUTH?: string;
  readonly VITE_HERMES_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
