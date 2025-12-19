
import { supabase } from '@/app/integrations/supabase/client';

export interface IdentityVerificationData {
  fullLegalName: string;
  personalIdNumber: string;
  country: string;
  address: string;
  city: string;
  stateProvince?: string;
  postalCode?: string;
  dateOfBirth: string; // YYYY-MM-DD
  documentType: 'passport' | 'national_id' | 'drivers_license';
  documentUrl: string;
  documentNumber: string;
  documentExpiryDate?: string; // YYYY-MM-DD
  ipAddress?: string;
  deviceInfo?: Record<string, any>;
}

export interface IdentityVerification {
  id: string;
  user_id: string;
  full_legal_name: string;
  personal_id_number: string;
  country: string;
  address: string;
  city: string;
  state_province: string | null;
  postal_code: string | null;
  date_of_birth: string;
  document_type: string;
  document_url: string;
  document_number: string;
  document_expiry_date: string | null;
  verification_status: 'pending' | 'approved' | 'rejected' | 'revoked';
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
  revoked_at: string | null;
  revoked_by: string | null;
  revocation_reason: string | null;
  submitted_at: string;
  ip_address: string | null;
  device_info: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

class IdentityVerificationService {
  /**
   * Check if user is verified
   */
  async isUserVerified(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('is_user_verified', {
        user_uuid: userId,
      });

      if (error) {
        console.error('Error checking verification status:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error in isUserVerified:', error);
      return false;
    }
  }

  /**
   * Get user's verification data
   */
  async getUserVerification(userId: string): Promise<IdentityVerification | null> {
    try {
      const { data, error } = await supabase
        .from('identity_verifications')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching verification:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserVerification:', error);
      return null;
    }
  }

  /**
   * Submit identity verification
   */
  async submitVerification(
    userId: string,
    data: IdentityVerificationData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if user already has a verification
      const existing = await this.getUserVerification(userId);
      if (existing && existing.verification_status === 'approved') {
        return { success: false, error: 'You are already verified' };
      }

      if (existing && existing.verification_status === 'pending') {
        return { success: false, error: 'Your verification is already pending review' };
      }

      // Insert or update verification
      const { error } = await supabase
        .from('identity_verifications')
        .upsert({
          user_id: userId,
          full_legal_name: data.fullLegalName,
          personal_id_number: data.personalIdNumber,
          country: data.country,
          address: data.address,
          city: data.city,
          state_province: data.stateProvince || null,
          postal_code: data.postalCode || null,
          date_of_birth: data.dateOfBirth,
          document_type: data.documentType,
          document_url: data.documentUrl,
          document_number: data.documentNumber,
          document_expiry_date: data.documentExpiryDate || null,
          verification_status: 'pending',
          ip_address: data.ipAddress || null,
          device_info: data.deviceInfo || null,
          submitted_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error submitting verification:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in submitVerification:', error);
      return { success: false, error: 'Failed to submit verification' };
    }
  }

  /**
   * Upload verification document
   */
  async uploadVerificationDocument(
    userId: string,
    fileUri: string,
    documentType: string
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Fetch the file
      const response = await fetch(fileUri);
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }

      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        throw new Error('Invalid file');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileExt = fileUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `verification/${userId}/${documentType}_${timestamp}.${fileExt}`;

      console.log('Uploading verification document:', fileName);

      // Upload to Supabase Storage (secure bucket)
      const { data, error } = await supabase.storage
        .from('verification-documents')
        .upload(fileName, blob, {
          contentType: blob.type || 'application/octet-stream',
          upsert: false, // Don't overwrite
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      // Get public URL (note: this bucket should have restricted access)
      const { data: urlData } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(fileName);

      if (!urlData || !urlData.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      console.log('Document uploaded successfully:', urlData.publicUrl);
      return { success: true, url: urlData.publicUrl };
    } catch (error) {
      console.error('Error uploading verification document:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload document';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Approve verification (admin only)
   */
  async approveVerification(
    verificationId: string,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('identity_verifications')
        .update({
          verification_status: 'approved',
          verified_at: new Date().toISOString(),
          verified_by: adminId,
        })
        .eq('id', verificationId);

      if (error) {
        console.error('Error approving verification:', error);
        return { success: false, error: error.message };
      }

      // Log audit
      await this.logVerificationAction(verificationId, adminId, 'approved', null);

      return { success: true };
    } catch (error) {
      console.error('Error in approveVerification:', error);
      return { success: false, error: 'Failed to approve verification' };
    }
  }

  /**
   * Reject verification (admin only)
   */
  async rejectVerification(
    verificationId: string,
    adminId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('identity_verifications')
        .update({
          verification_status: 'rejected',
          rejection_reason: reason,
        })
        .eq('id', verificationId);

      if (error) {
        console.error('Error rejecting verification:', error);
        return { success: false, error: error.message };
      }

      // Log audit
      await this.logVerificationAction(verificationId, adminId, 'rejected', reason);

      return { success: true };
    } catch (error) {
      console.error('Error in rejectVerification:', error);
      return { success: false, error: 'Failed to reject verification' };
    }
  }

  /**
   * Revoke verification (admin only)
   */
  async revokeVerification(
    userId: string,
    adminId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: verification, error: fetchError } = await supabase
        .from('identity_verifications')
        .select('id')
        .eq('user_id', userId)
        .eq('verification_status', 'approved')
        .maybeSingle();

      if (fetchError || !verification) {
        return { success: false, error: 'No approved verification found' };
      }

      const { error } = await supabase
        .from('identity_verifications')
        .update({
          verification_status: 'revoked',
          revoked_at: new Date().toISOString(),
          revoked_by: adminId,
          revocation_reason: reason,
        })
        .eq('id', verification.id);

      if (error) {
        console.error('Error revoking verification:', error);
        return { success: false, error: error.message };
      }

      // Log audit
      await this.logVerificationAction(verification.id, adminId, 'revoked', reason);

      return { success: true };
    } catch (error) {
      console.error('Error in revokeVerification:', error);
      return { success: false, error: 'Failed to revoke verification' };
    }
  }

  /**
   * Log verification action to audit log
   */
  private async logVerificationAction(
    verificationId: string,
    adminId: string,
    actionType: 'approved' | 'rejected' | 'revoked' | 'viewed',
    reason: string | null
  ): Promise<void> {
    try {
      await supabase.from('identity_verification_audit_log').insert({
        verification_id: verificationId,
        admin_id: adminId,
        action_type: actionType,
        reason,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error logging verification action:', error);
    }
  }

  /**
   * Get pending verifications (admin only)
   */
  async getPendingVerifications(): Promise<IdentityVerification[]> {
    try {
      const { data, error } = await supabase
        .from('identity_verifications')
        .select('*')
        .eq('verification_status', 'pending')
        .order('submitted_at', { ascending: true });

      if (error) {
        console.error('Error fetching pending verifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPendingVerifications:', error);
      return [];
    }
  }

  /**
   * Get all verifications (admin only)
   */
  async getAllVerifications(
    status?: 'pending' | 'approved' | 'rejected' | 'revoked'
  ): Promise<IdentityVerification[]> {
    try {
      let query = supabase
        .from('identity_verifications')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (status) {
        query = query.eq('verification_status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching verifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllVerifications:', error);
      return [];
    }
  }

  /**
   * Check if user can go live (must be verified)
   */
  async canGoLive(userId: string): Promise<{ canGoLive: boolean; reason?: string }> {
    try {
      const isVerified = await this.isUserVerified(userId);

      if (!isVerified) {
        return {
          canGoLive: false,
          reason: 'You must complete identity verification before going live',
        };
      }

      return { canGoLive: true };
    } catch (error) {
      console.error('Error in canGoLive:', error);
      return { canGoLive: false, reason: 'Failed to check verification status' };
    }
  }

  /**
   * Check if user can receive payouts (must be verified)
   */
  async canReceivePayouts(userId: string): Promise<{ canReceive: boolean; reason?: string }> {
    try {
      const isVerified = await this.isUserVerified(userId);

      if (!isVerified) {
        return {
          canReceive: false,
          reason: 'You must complete identity verification before receiving payouts',
        };
      }

      return { canReceive: true };
    } catch (error) {
      console.error('Error in canReceivePayouts:', error);
      return { canReceive: false, reason: 'Failed to check verification status' };
    }
  }
}

export const identityVerificationService = new IdentityVerificationService();
