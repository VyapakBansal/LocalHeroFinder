import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://nlhidtzfltbpkhkttzwb.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (typeof window !== 'undefined') {
  console.log('🔍 Supabase URL:', SUPABASE_URL);
  console.log('🔍 Supabase Project ID:', SUPABASE_URL?.replace('https://', '').replace('.supabase.co', ''));
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, 
  }
});