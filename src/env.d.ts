/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    isAdmin: boolean;
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly SUPABASE_ANON_KEY: string;
  readonly ADMIN_PASSWORD: string;
  readonly PUBLIC_WHATSAPP_NUMBER: string;
  readonly PUBLIC_SITE_URL: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
