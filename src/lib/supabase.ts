import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _admin: SupabaseClient | null = null;

export function getAdminClient(): SupabaseClient {
  if (_admin) return _admin;
  const url = import.meta.env.SUPABASE_URL;
  const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Supabase ortam değişkenleri eksik (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).'
    );
  }
  _admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}

export type Application = {
  id: string;
  created_at: string;
  full_name: string;
  phone: string;
  email: string;
  level: string;
  subject: string;
  message: string | null;
  status: 'new' | 'contacted' | 'converted' | 'archived';
  notes: string | null;
};
