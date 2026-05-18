import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // Show a clear error in the console rather than failing silently.
  // eslint-disable-next-line no-console
  console.error(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill in your Supabase project credentials.'
  );
}

export const supabase = createClient(url ?? '', anon ?? '', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});
