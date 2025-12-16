
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Public client-safe environment variables
// These are safe to expose in the client bundle
const PUBLIC_SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || 'https://uaqsjqakhgycfopftzzp.supabase.co';
const PUBLIC_SUPABASE_ANON_KEY = process.env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhcXNqcWFraGd5Y2ZvcGZ0enpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMDI3MDIsImV4cCI6MjA4MDc3ODcwMn0.fI_MegANXkIaNgDXrouI-kHzeV4ADZMUUam0TgBtCDw';

// Validate that we have the required public configuration
if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ Missing required Supabase configuration. Please set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.');
}

export const supabase = createClient<Database>(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);
