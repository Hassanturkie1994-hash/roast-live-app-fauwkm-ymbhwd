
import { supabase } from '@/app/integrations/supabase/client';

export interface TermsAcceptance {
  id: string;
  user_id: string;
  accepted_at: string;
  version: string;
  device?: string;
  ip_address?: string;
}

export interface PrivacyAcceptance {
  id: string;
  user_id: string;
  accepted_at: string;
  version: string;
  device?: string;
  ip_address?: string;
}

export const termsPrivacyService = {
  // Terms of Service
  async acceptTermsOfService(userId: string, device?: string, ipAddress?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('terms_of_service_acceptance')
        .insert({
          user_id: userId,
          version: '1.0',
          device,
          ip_address: ipAddress,
        });

      if (error) {
        console.error('Error accepting terms:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error accepting terms:', error);
      return { success: false, error: error.message };
    }
  },

  async getTermsAcceptance(userId: string): Promise<TermsAcceptance | null> {
    try {
      const { data, error } = await supabase
        .from('terms_of_service_acceptance')
        .select('*')
        .eq('user_id', userId)
        .order('accepted_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching terms acceptance:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching terms acceptance:', error);
      return null;
    }
  },

  async hasAcceptedTerms(userId: string): Promise<boolean> {
    const acceptance = await this.getTermsAcceptance(userId);
    return acceptance !== null;
  },

  // Privacy Policy
  async acceptPrivacyPolicy(userId: string, device?: string, ipAddress?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('privacy_policy_acceptance')
        .insert({
          user_id: userId,
          version: '1.0',
          device,
          ip_address: ipAddress,
        });

      if (error) {
        console.error('Error accepting privacy policy:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error accepting privacy policy:', error);
      return { success: false, error: error.message };
    }
  },

  async getPrivacyAcceptance(userId: string): Promise<PrivacyAcceptance | null> {
    try {
      const { data, error } = await supabase
        .from('privacy_policy_acceptance')
        .select('*')
        .eq('user_id', userId)
        .order('accepted_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching privacy acceptance:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching privacy acceptance:', error);
      return null;
    }
  },

  async hasAcceptedPrivacy(userId: string): Promise<boolean> {
    const acceptance = await this.getPrivacyAcceptance(userId);
    return acceptance !== null;
  },
};