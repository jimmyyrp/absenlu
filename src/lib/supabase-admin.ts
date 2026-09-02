import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase admin client (service role).
 * Hanya dipakai di API route yang dilindungi token.
 * Mengembalikan null jika SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi,
 * sehingga pemanggil bisa fallback ke operasi baca-saja dengan anon key.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
