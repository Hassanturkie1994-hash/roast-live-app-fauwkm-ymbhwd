
import { supabase } from '@/app/integrations/supabase/client';
import { mediaUploadService } from './mediaUploadService';

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
  selfieUrl?: string; // For automatic verification
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
  selfie_url: string | null;
  verification_status: 'pending' | 'approved' | 'rejected' | 'revoked';
  verification_method: 'manual' | 'automatic';
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

/**
 * Identity Verification Service
 * 
 * UPDATED BEHAVIOR:
 * - Verification is NOT required for streaming
 * - Verification is ONLY required for payouts (Stripe/PayPal)
 * - Supports automatic camera-based verification
 * - Supports manual document upload verification
 */
class IdentityVerificationService {
  /**
   * Check if user can go live
   * 
   * UPDATED: Streaming no longer requires verification
   * This method now always returns true for backward compatibility
   */
  canGoLive = async (userId: string): Promise<{ canGoLive: boolean; reason?: string }> => {
    try {
      console.log('✅ [IdentityVerification] canGoLive check - verification not required for streaming');
      
      // Streaming no longer requires verification
      // Users can stream without identity verification
      return { canGoLive: true };
    } catch (error) {
      console.error('Error in canGoLive:', error);
      // Even on error, allow streaming (fail open)
      return { canGoLive: true };
    }
  }

  /**
   * Check if user is verified for payouts
   */
  isUserVerifiedForPayouts = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('identity_verifications')
        .select('verification_status')
        .eq('user_id', userId)
        .eq('verification_status', 'approved')
        .maybeSingle();

      if (error) {
        console.error('Error checking verification status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isUserVerifiedForPayouts:', error);
      return false;
    }
  }

  /**
   * Get user's verification data
   */
  getUserVerification = async (userId: string): Promise<IdentityVerification | null> => {
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
  submitVerification = async (
    userId: string,
    data: IdentityVerificationData,
    verificationMethod: 'manual' | 'automatic' = 'manual'
  ): Promise<{ success: boolean; error?: string }> => {
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
          selfie_url: data.selfieUrl || null,
          verification_status: 'pending',
          verification_method: verificationMethod,
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
  uploadVerificationDocument = async (
    userId: string,
    fileUri: string,
    documentType: string,
    onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
  ): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
      console.log('📤 [VerificationService] Uploading document...');

      const result = await mediaUploadService.uploadMedia(
        userId,
        fileUri,
        'verification-document',
        { documentType },
        onProgress,
        false
      );

      if (!result.success) {
        console.error('❌ [VerificationService] Upload failed:', result.error);
        return { success: false, error: result.error };
      }

      console.log('✅ [VerificationService] Document uploaded:', result.url);
      return { success: true, url: result.url };
    } catch (error) {
      console.error('Error uploading verification document:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload document';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Upload selfie for automatic verification
   */
  uploadVerificationSelfie = async (
    userId: string,
    fileUri: string,
    onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
  ): Promise<{ success: boolean; url?: string; error?: string }> => {
    try {
      console.log('📤 [VerificationService] Uploading selfie...');

      const result = await mediaUploadService.uploadMedia(
        userId,
        fileUri,
        'verification-document',
        { documentType: 'selfie' },
        onProgress,
        false
      );

      if (!result.success) {
        console.error('❌ [VerificationService] Selfie upload failed:', result.error);
        return { success: false, error: result.error };
      }

      console.log('✅ [VerificationService] Selfie uploaded:', result.url);
      return { success: true, url: result.url };
    } catch (error) {
      console.error('Error uploading verification selfie:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload selfie';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Approve verification (admin only)
   */
  approveVerification = async (
    verificationId: string,
    adminId: string
  ): Promise<{ success: boolean; error?: string }> => {
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
  rejectVerification = async (
    verificationId: string,
    adminId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> => {
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
  revokeVerification = async (
    userId: string,
    adminId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> => {
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
  private logVerificationAction = async (
    verificationId: string,
    adminId: string,
    actionType: 'approved' | 'rejected' | 'revoked' | 'viewed',
    reason: string | null
  ): Promise<void> => {
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
  getPendingVerifications = async (): Promise<IdentityVerification[]> => {
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
  getAllVerifications = async (
    status?: 'pending' | 'approved' | 'rejected' | 'revoked'
  ): Promise<IdentityVerification[]> => {
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
   * Check if user can receive payouts (must be verified)
   * UPDATED: Streaming no longer requires verification
   */
  canReceivePayouts = async (userId: string): Promise<{ canReceive: boolean; reason?: string }> => {
    try {
      const isVerified = await this.isUserVerifiedForPayouts(userId);

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

// Export a singleton instance
const identityVerificationService = new IdentityVerificationService();

export { identityVerificationService };
export default identityVerificationService;
