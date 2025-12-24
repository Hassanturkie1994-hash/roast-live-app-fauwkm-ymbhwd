
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- NOTIFICATION PREFERENCES TABLE WITH RLS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 
-- This migration creates the notification_preferences table with Row Level
-- Security (RLS) policies to ensure users can only access their own preferences.
-- 
-- Features:
-- - User-specific notification preferences
-- - RLS policies for authenticated users
-- - Indexes for performance
-- - Automatic timestamps
-- 
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification types
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  
  -- Notification categories
  gifts_enabled BOOLEAN DEFAULT true,
  follows_enabled BOOLEAN DEFAULT true,
  comments_enabled BOOLEAN DEFAULT true,
  mentions_enabled BOOLEAN DEFAULT true,
  battles_enabled BOOLEAN DEFAULT true,
  vip_club_enabled BOOLEAN DEFAULT true,
  moderator_alerts_enabled BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one row per user
  CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

-- 2. Enable Row Level Security
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for authenticated users

-- Policy: Users can view their own preferences
CREATE POLICY "Users can view their own notification preferences"
  ON public.notification_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Users can insert their own preferences
CREATE POLICY "Users can insert their own notification preferences"
  ON public.notification_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own preferences
CREATE POLICY "Users can update their own notification preferences"
  ON public.notification_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can delete their own preferences
CREATE POLICY "Users can delete their own notification preferences"
  ON public.notification_preferences
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id 
  ON public.notification_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_created_at 
  ON public.notification_preferences(created_at DESC);

-- 5. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to automatically update updated_at
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_notification_preferences_updated_at();

-- 7. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ADMIN ACCESS PATTERN
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 
-- RECOMMENDED: Use Supabase Edge Function with service role key
-- 
-- Edge functions with service role bypass RLS, allowing admin operations
-- without exposing the service role key to clients.
-- 
-- Example Edge Function:
-- 
-- import { createClient } from '@supabase/supabase-js'
-- 
-- const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
-- const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
-- 
-- const supabase = createClient(supabaseUrl, supabaseKey, {
--   auth: { autoRefreshToken: false, persistSession: false }
-- })
-- 
-- // Admin can now manage any user's preferences
-- const { data, error } = await supabase
--   .from('notification_preferences')
--   .update({ push_enabled: false })
--   .eq('user_id', targetUserId)
-- 
-- ALTERNATIVE: RLS Admin Policy (Less Secure)
-- 
-- If you must use RLS for admin access, create a policy like:
-- 
-- CREATE POLICY "Admins can manage all notification preferences"
--   ON public.notification_preferences
--   FOR ALL
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.user_roles
--       WHERE user_id = auth.uid() AND role = 'admin'
--     )
--   );
-- 
-- ⚠️ WARNING: This requires admin role in JWT claims and is less secure
-- than using Edge Functions with service role.
-- 
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
