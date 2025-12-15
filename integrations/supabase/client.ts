
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://uaqsjqakhgycfopftzzp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhcXNqcWFraGd5Y2ZvcGZ0enpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMDI3MDIsImV4cCI6MjA4MDc3ODcwMn0.fI_MegANXkIaNgDXrouI-kHzeV4ADZMUUam0TgBtCDw";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
