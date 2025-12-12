
import { supabase } from '@/app/integrations/supabase/client';

export interface StreamSettings {
  id: string;
  streamer_id: string;
  stream_delay_seconds: 0 | 3 | 5 | 10;
  enable_safety_hints: boolean;
  auto_moderate_spam: boolean;
  created_at: string;
  updated_at: string;
}

class StreamSettingsService {
  /**
   * Get stream settings for a streamer
   */
  async getSettings(streamerId: string): Promise<StreamSettings | null> {
    try {
      const { data, error } = await supabase
        .from('stream_settings')
        .select('*')
        .eq('streamer_id', streamerId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching stream settings:', error);
        return null;
      }

      return data as StreamSettings;
    } catch (error) {
      console.error('Error in getSettings:', error);
      return null;
    }
  }

  /**
   * Create or update stream settings
   */
  async upsertSettings(
    streamerId: string,
    settings: Partial<Omit<StreamSettings, 'id' | 'streamer_id' | 'created_at' | 'updated_at'>>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('stream_settings')
        .upsert({
          streamer_id: streamerId,
          ...settings,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'streamer_id',
        });

      if (error) {
        console.error('Error upserting stream settings:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Stream settings updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in upsertSettings:', error);
      return { success: false, error: 'Failed to update settings' };
    }
  }

  /**
   * Get stream delay for a streamer
   */
  async getStreamDelay(streamerId: string): Promise<number> {
    try {
      const settings = await this.getSettings(streamerId);
      return settings?.stream_delay_seconds || 0;
    } catch (error) {
      console.error('Error in getStreamDelay:', error);
      return 0;
    }
  }

  /**
   * Update stream delay
   */
  async updateStreamDelay(
    streamerId: string,
    delaySeconds: 0 | 3 | 5 | 10
  ): Promise<{ success: boolean; error?: string }> {
    return this.upsertSettings(streamerId, { stream_delay_seconds: delaySeconds });
  }

  /**
   * Toggle safety hints
   */
  async toggleSafetyHints(
    streamerId: string,
    enabled: boolean
  ): Promise<{ success: boolean; error?: string }> {
    return this.upsertSettings(streamerId, { enable_safety_hints: enabled });
  }
}

export const streamSettingsService = new StreamSettingsService();