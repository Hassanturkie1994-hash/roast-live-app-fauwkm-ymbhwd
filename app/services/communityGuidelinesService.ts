
import { supabase } from '@/app/integrations/supabase/client';
import { Platform } from 'react-native';
import * as Network from 'expo-network';

export interface CommunityGuidelinesAcceptance {
  id: string;
  user_id: string;
  accepted_at: string;
  version: string;
  device: string | null;
  ip_address: string | null;
  created_at: string;
}

class CommunityGuidelinesService {
  /**
   * Check if user has accepted community guidelines
   * Uses maybeSingle() to avoid PGRST116 error when no row exists
   */
  async hasAcceptedGuidelines(userId: string, version: string = '1.0'): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('community_guidelines_acceptance')
        .select('id')
        .eq('user_id', userId)
        .eq('version', version)
        .maybeSingle();

      if (error) {
        console.error('Error checking community guidelines acceptance:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in hasAcceptedGuidelines:', error);
      return false;
    }
  }

  /**
   * Record community guidelines acceptance
   */
  async recordAcceptance(
    userId: string,
    version: string = '1.0'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get device info
      const device = Platform.OS;
      
      // Get IP address (best effort)
      let ipAddress: string | null = null;
      try {
        const networkState = await Network.getIpAddressAsync();
        ipAddress = networkState || null;
      } catch (error) {
        console.log('Could not get IP address:', error);
      }

      // Use upsert to handle duplicate entries gracefully
      const { error } = await supabase
        .from('community_guidelines_acceptance')
        .upsert({
          user_id: userId,
          version: version,
          device: device,
          ip_address: ipAddress,
          accepted_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,version',
        });

      if (error) {
        console.error('Error recording community guidelines acceptance:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Community guidelines acceptance recorded');
      return { success: true };
    } catch (error) {
      console.error('Error in recordAcceptance:', error);
      return { success: false, error: 'Failed to record acceptance' };
    }
  }

  /**
   * Get user's acceptance record
   */
  async getAcceptanceRecord(
    userId: string,
    version: string = '1.0'
  ): Promise<CommunityGuidelinesAcceptance | null> {
    try {
      const { data, error } = await supabase
        .from('community_guidelines_acceptance')
        .select('*')
        .eq('user_id', userId)
        .eq('version', version)
        .maybeSingle();

      if (error) {
        console.error('Error fetching acceptance record:', error);
        return null;
      }

      return data as CommunityGuidelinesAcceptance | null;
    } catch (error) {
      console.error('Error in getAcceptanceRecord:', error);
      return null;
    }
  }

  /**
   * Check if user can livestream (requires community guidelines acceptance)
   */
  async canUserLivestream(userId: string): Promise<{ canStream: boolean; reason?: string }> {
    const hasAccepted = await this.hasAcceptedGuidelines(userId);
    
    if (!hasAccepted) {
      return {
        canStream: false,
        reason: 'You must accept the Community Guidelines before you can livestream.',
      };
    }

    return { canStream: true };
  }
}

export const communityGuidelinesService = new CommunityGuidelinesService();
