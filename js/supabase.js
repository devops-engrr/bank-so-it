/*
 * Bank SO IT - Supabase client
 *
 * IMPORTANT:
 * - Replace SUPABASE_PUBLISHABLE_KEY with the PUBLIC/PUBLISHABLE key
 *   from Supabase Settings -> API Keys.
 * - NEVER put sb_secret_... or service_role keys in this file.
 */
(() => {
  const SUPABASE_URL = "https://pgxdebcujxlnhnbrxfxc.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_2pIjNBLeO67uDj0EYCzMig_Y-IKBRTX";

  if (!window.supabase) {
    console.error("Supabase library failed to load.");
    return;
  }

  window.bankSoItSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    }
  );
})();
