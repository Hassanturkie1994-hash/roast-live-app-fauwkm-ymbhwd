
// CRITICAL: This polyfill MUST be the first import
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = 'https://uaqsjqakhgycfopftzzp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhcXNqcWFraGd5Y2ZvcGZ0enpwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMDI3MDIsImV4cCI6MjA4MDc3ODcwMn0.fI_MegANXkIaNgDXrouI-kHzeV4ADZMUUam0TgBtCDw';

// Validate environment before creating client
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

console.log('🔧 Initializing Supabase client...');
console.log('📍 URL:', SUPABASE_URL);
console.log('🔑 Key exists:', !!SUPABASE_ANON_KEY);

// Create Supabase client with React Native configuration
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

console.log('✅ Supabase client initialized successfully');

// Validate client was created properly
if (!supabase) {
  throw new Error('Failed to create Supabase client');
}

// Export a function to test the client
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.error('❌ Supabase connection test failed:', error);
      return false;
    }
    console.log('✅ Supabase connection test passed');
    return true;
  } catch (err) {
    console.error('❌ Supabase connection test error:', err);
    return false;
  }
};
