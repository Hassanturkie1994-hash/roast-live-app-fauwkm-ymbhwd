
import { supabase } from '@/app/integrations/supabase/client';
import { Platform } from 'react-native';

export interface TwoFactorAuth {
  id: string;
  user_id: string;
  method: 'sms' | 'email';
  phone_number?: string;
  email?: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginHistory {
  id: string;
  user_id: string;
  device?: string;
  ip_address?: string;
  location?: string;
  user_agent?: string;
  status: 'success' | 'failed' | 'logged_out';
  logged_in_at: string;
  logged_out_at?: string;
  created_at: string;
}

export const twoFactorAuthService = {
  // Get 2FA settings
  async get2FASettings(userId: string): Promise<TwoFactorAuth | null> {
    try {
      const { data, error } = await supabase
        .from('two_factor_auth')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching 2FA settings:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching 2FA settings:', error);
      return null;
    }
  },

  // Enable 2FA
  async enable2FA(
    userId: string,
    method: 'sms' | 'email',
    phoneNumber?: string,
    email?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const existing = await this.get2FASettings(userId);

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('two_factor_auth')
          .update({
            method,
            phone_number: phoneNumber,
            email,
            is_enabled: true,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (error) {
          console.error('Error updating 2FA:', error);
          return { success: false, error: error.message };
        }
      } else {
        // Create new
        const { error } = await supabase
          .from('two_factor_auth')
          .insert({
            user_id: userId,
            method,
            phone_number: phoneNumber,
            email,
            is_enabled: true,
          });

        if (error) {
          console.error('Error enabling 2FA:', error);
          return { success: false, error: error.message };
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error enabling 2FA:', error);
      return { success: false, error: error.message };
    }
  },

  // Disable 2FA
  async disable2FA(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('two_factor_auth')
        .update({
          is_enabled: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error disabling 2FA:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error disabling 2FA:', error);
      return { success: false, error: error.message };
    }
  },

  // Generate verification code
  async generateVerificationCode(userId: string, method: 'sms' | 'email'): Promise<{ success: boolean; code?: string; error?: string }> {
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

      const { error } = await supabase
        .from('verification_codes')
        .insert({
          user_id: userId,
          code,
          method,
          expires_at: expiresAt,
        });

      if (error) {
        console.error('Error generating verification code:', error);
        return { success: false, error: error.message };
      }

      return { success: true, code };
    } catch (error: any) {
      console.error('Error generating verification code:', error);
      return { success: false, error: error.message };
    }
  },

  // Verify code
  async verifyCode(userId: string, code: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('verification_codes')
        .select('*')
        .eq('user_id', userId)
        .eq('code', code)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return { success: false, error: 'Invalid or expired code' };
      }

      // Mark code as used
      await supabase
        .from('verification_codes')
        .update({ used: true })
        .eq('id', data.id);

      return { success: true };
    } catch (error: any) {
      console.error('Error verifying code:', error);
      return { success: false, error: error.message };
    }
  },

  // Get login history
  async getLoginHistory(userId: string): Promise<LoginHistory[]> {
    try {
      const { data, error } = await supabase
        .from('login_history')
        .select('*')
        .eq('user_id', userId)
        .order('logged_in_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching login history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching login history:', error);
      return [];
    }
  },

  // Log login
  async logLogin(
    userId: string,
    device?: string,
    ipAddress?: string,
    location?: string,
    userAgent?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('login_history')
        .insert({
          user_id: userId,
          device: device || Platform.OS,
          ip_address: ipAddress,
          location,
          user_agent: userAgent,
          status: 'success',
        });

      if (error) {
        console.error('Error logging login:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error logging login:', error);
      return { success: false, error: error.message };
    }
  },

  // Logout from device
  async logoutFromDevice(loginHistoryId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('login_history')
        .update({
          status: 'logged_out',
          logged_out_at: new Date().toISOString(),
        })
        .eq('id', loginHistoryId);

      if (error) {
        console.error('Error logging out from device:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error logging out from device:', error);
      return { success: false, error: error.message };
    }
  },

  // Logout from all devices
  async logoutFromAllDevices(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('login_history')
        .update({
          status: 'logged_out',
          logged_out_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('status', 'success');

      if (error) {
        console.error('Error logging out from all devices:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error logging out from all devices:', error);
      return { success: false, error: error.message };
    }
  },
};