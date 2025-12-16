
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js';

// Public client-safe environment variables
// These are safe to expose in the client bundle
const PUBLIC_SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || "https://uaqsjqakhgycfopftzzp.supabase.co";
const PUBLIC_SUPABASE_ANON_KEY = process.env.PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhcXNqcWFraGd5Y2ZvcGZ0enpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMDI3MDIsImV4cCI6MjA4MDc3ODcwMn0.fI_MegANXkIaNgDXrouI-kHzeV4ADZMUUam0TgBtCDw";

// Validate that we have the required public configuration
if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ Missing required Supabase configuration. Please set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
