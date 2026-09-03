/**
 * Supabase Client Initialization & Typed Interface
 * =================================================
 * Configures the connection to the Supabase PostgreSQL database.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
    return Boolean(
        supabaseUrl && 
        supabaseAnonKey && 
        !supabaseUrl.includes('your-project') &&
        supabaseUrl.startsWith('https://')
    );
};

// Fallback dummy client if credentials are not yet supplied in .env
export const supabase = isSupabaseConfigured()
    ? createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
              persistSession: false, // Using Firebase Auth for session management
              autoRefreshToken: false,
          },
      })
    : createClient('https://placeholder.supabase.co', 'placeholder-key', {
          auth: { persistSession: false },
      });
