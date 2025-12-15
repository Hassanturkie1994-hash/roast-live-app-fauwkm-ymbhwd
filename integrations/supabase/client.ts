import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = 'https://uaqsjqakhgycfopftzzp.supabase.co';

const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhcXNqcWFraGd5Y2ZvcGZ0enpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMDI3MDIsImV4cCI6MjA4MDc3ODcwMn0.fI_MegANXkIaNgDXrouI-kHzeV4ADZMUUam0TgBtCDw';

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);