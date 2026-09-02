
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Exported as `supabaseClient` so consumers can null-check when needed.
 * At runtime (Vercel), env vars are always set.
 * At build-time (sitemap generation), they may be absent.
 */
let _client: ReturnType<typeof createClient> | null = null;
try {
  if (supabaseUrl && supabaseAnonKey) {
    _client = createClient(supabaseUrl, supabaseAnonKey);
  } else {
    console.warn('[Blu Decor] Supabase env vars missing — client disabled (likely build-time).');
  }
} catch {
  // Prevent build-time crashes
}

export const supabase = _client!;

/** Null-safe version for code that may run at build time (e.g. sitemap). */
export const supabaseSafe = _client;
