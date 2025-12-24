
import { supabase } from '@/app/integrations/supabase/client';

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SAFE SUPABASE CLIENT INSERT EXAMPLE
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * This file demonstrates how to safely insert notification preferences
 * with proper user_id handling to avoid RLS policy violations.
 * 
 * Key Points:
 * - Always include user_id in insert
 * - Use auth.uid() from session
 * - Handle errors gracefully
 * - Check authentication before insert
 * 
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

export interface NotificationPreferences {
  id?: string;
  user_id: string;
  push_enabled?: boolean;
  email_enabled?: boolean;
  sms_enabled?: boolean;
  gifts_enabled?: boolean;
  follows_enabled?: boolean;
  comments_enabled?: boolean;
  mentions_enabled?: boolean;
  battles_enabled?: boolean;
  vip_club_enabled?: boolean;
  moderator_alerts_enabled?: boolean;
}

/**
 * Get notification preferences for the current user
 */
export async function getNotificationPreferences(): Promise<{
  data: NotificationPreferences | null;
  error: string | null;
}> {
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return {
        data: null,
        error: 'Not authenticated',
      };
    }

    // Query preferences
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      console.error('❌ [Notification Preferences] Error fetching:', error);
      return {
        data: null,
        error: error.message,
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error: any) {
    console.error('❌ [Notification Preferences] Exception:', error);
    return {
      data: null,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Create or update notification preferences for the current user
 * 
 * CRITICAL: Always include user_id from session to avoid RLS violations
 */
export async function upsertNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<{
  data: NotificationPreferences | null;
  error: string | null;
}> {
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return {
        data: null,
        error: 'Not authenticated',
      };
    }

    console.log('✅ [Notification Preferences] User authenticated:', session.user.id);

    // CRITICAL: Include user_id from session
    const dataToInsert = {
      ...preferences,
      user_id: session.user.id, // Always set user_id to current user
    };

    console.log('📝 [Notification Preferences] Upserting:', dataToInsert);

    // Upsert preferences (insert or update if exists)
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert(dataToInsert, {
        onConflict: 'user_id', // Update if user_id already exists
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [Notification Preferences] Error upserting:', error);
      
      // Provide helpful error messages
      if (error.code === '42501') {
        return {
          data: null,
          error: 'Permission denied. Make sure you are authenticated and trying to update your own preferences.',
        };
      }
      
      return {
        data: null,
        error: error.message,
      };
    }

    console.log('✅ [Notification Preferences] Upserted successfully');
    return {
      data,
      error: null,
    };
  } catch (error: any) {
    console.error('❌ [Notification Preferences] Exception:', error);
    return {
      data: null,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Example usage in a React component:
 * 
 * ```tsx
 * import { upsertNotificationPreferences } from '@/src/integrations/supabase/notificationPreferencesExample';
 * 
 * function NotificationSettings() {
 *   const handleSave = async () => {
 *     const { data, error } = await upsertNotificationPreferences({
 *       push_enabled: true,
 *       email_enabled: false,
 *       gifts_enabled: true,
 *     });
 * 
 *     if (error) {
 *       Alert.alert('Error', error);
 *       return;
 *     }
 * 
 *     Alert.alert('Success', 'Preferences saved');
 *   };
 * 
 *   return (
 *     <Button title="Save Preferences" onPress={handleSave} />
 *   );
 * }
 * ```
 */
