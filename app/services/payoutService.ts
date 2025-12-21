
import { supabase } from '@/app/integrations/supabase/client';
import { walletService } from './walletService';
import { creatorRevenueService } from './creatorRevenueService';
import { notificationService } from './notificationService';
import { identityVerificationService } from './identityVerificationService';

export interface PayoutRequest {
  id: string;
  user_id: string;
  amount_cents: number;
  status: 'pending' | 'processing' | 'paid' | 'rejected';
  iban?: string;
  bank_account?: string;
  full_name: string;
  country: string;
  notes?: string;
  created_at: string;
  processed_at?: string;
  processed_by?: string;
}

class PayoutService {
  /**
   * Create a payout request
   * UPDATED: Enforces identity verification before creating payout
   */
  async createPayoutRequest(
    userId: string,
    amountCents: number,
    fullName: string,
    country: string,
    iban?: string,
    bankAccount?: string
  ): Promise<{ success: boolean; error?: string; data?: PayoutRequest }> {
    try {
      // CRITICAL: Check identity verification before allowing payout
      const verificationCheck = await identityVerificationService.canReceivePayouts(userId);
      if (!verificationCheck.canReceive) {
        console.error('❌ Payout blocked: User not verified');
        return { 
          success: false, 
          error: verificationCheck.reason || 'Identity verification required for payouts'
        };
      }

      // Check if user has sufficient balance
      const wallet = await walletService.getOrCreateWallet(userId);
      if (!wallet) {
        return { success: false, error: 'Failed to get wallet' };
      }

      if (wallet.balance_cents < amountCents) {
        return { success: false, error: 'Insufficient balance' };
      }

      // Minimum payout amount (e.g., 100 SEK = 10000 cents)
      if (amountCents < 10000) {
        return { success: false, error: 'Minimum payout amount is 100 SEK' };
      }

      // Create payout request
      const { data, error } = await supabase
        .from('payout_requests')
        .insert({
          user_id: userId,
          amount_cents: amountCents,
          full_name: fullName,
          country: country,
          iban: iban || null,
          bank_account: bankAccount || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating payout request:', error);
        return { success: false, error: error.message };
      }

      // Send notification to user
      await notificationService.createNotification(
        userId,
        userId,
        'message',
        'Your payout request was received and is being processed.'
      );

      console.log('✅ Payout request created successfully');
      return { success: true, data: data as PayoutRequest };
    } catch (error) {
      console.error('Error in createPayoutRequest:', error);
      return { success: false, error: 'Failed to create payout request. Please try again later.' };
    }
  }

  /**
   * Get payout requests for a user
   */
  async getUserPayoutRequests(userId: string): Promise<PayoutRequest[]> {
    try {
      const { data, error } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payout requests:', error);
        return [];
      }

      return data as PayoutRequest[];
    } catch (error) {
      console.error('Error in getUserPayoutRequests:', error);
      return [];
    }
  }

  /**
   * Get all payout requests (admin only)
   */
  async getAllPayoutRequests(
    status?: 'pending' | 'processing' | 'paid' | 'rejected'
  ): Promise<PayoutRequest[]> {
    try {
      let query = supabase
        .from('payout_requests')
        .select(`
          *,
          user:profiles!payout_requests_user_id_fkey(
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching all payout requests:', error);
        return [];
      }

      return data as any[];
    } catch (error) {
      console.error('Error in getAllPayoutRequests:', error);
      return [];
    }
  }

  /**
   * Update payout request status (admin only)
   * UPDATED: Enforces identity verification before processing payout
   */
  async updatePayoutStatus(
    payoutId: string,
    status: 'processing' | 'paid' | 'rejected',
    adminUserId: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the payout request
      const { data: payout, error: fetchError } = await supabase
        .from('payout_requests')
        .select('*')
        .eq('id', payoutId)
        .single();

      if (fetchError || !payout) {
        return { success: false, error: 'Payout request not found' };
      }

      // CRITICAL: Verify identity before processing payout
      if (status === 'paid') {
        const verificationCheck = await identityVerificationService.canReceivePayouts(payout.user_id);
        if (!verificationCheck.canReceive) {
          console.error('❌ Payout processing blocked: User not verified');
          return { 
            success: false, 
            error: verificationCheck.reason || 'User must complete identity verification before receiving payouts'
          };
        }
      }

      // Update payout request
      const { error: updateError } = await supabase
        .from('payout_requests')
        .update({
          status,
          notes,
          processed_at: new Date().toISOString(),
          processed_by: adminUserId,
        })
        .eq('id', payoutId);

      if (updateError) {
        console.error('Error updating payout status:', updateError);
        return { success: false, error: updateError.message };
      }

      // If status is 'paid', deduct from wallet and create transaction
      if (status === 'paid') {
        const withdrawResult = await walletService.withdrawFunds(
          payout.user_id,
          payout.amount_cents,
          {
            payout_request_id: payoutId,
            notes,
          }
        );

        if (!withdrawResult.success) {
          // Rollback status update
          await supabase
            .from('payout_requests')
            .update({
              status: 'pending',
              processed_at: null,
              processed_by: null,
            })
            .eq('id', payoutId);

          return { success: false, error: 'Failed to process withdrawal' };
        }

        // Update creator revenue summary
        await creatorRevenueService.updateWithdrawnAmount(
          payout.user_id,
          payout.amount_cents
        );
      }

      // Send notification to user
      let notificationMessage = '';
      switch (status) {
        case 'processing':
          notificationMessage = 'Your payout request is being processed.';
          break;
        case 'paid':
          notificationMessage = `Your payout request of ${(payout.amount_cents / 100).toFixed(2)} SEK has been paid.`;
          break;
        case 'rejected':
          notificationMessage = `Your payout request has been rejected. ${notes || ''}`;
          break;
      }

      await notificationService.createNotification(
        adminUserId,
        payout.user_id,
        'message',
        notificationMessage
      );

      console.log('✅ Payout status updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in updatePayoutStatus:', error);
      return { success: false, error: 'Failed to update payout status. Please try again later.' };
    }
  }

  /**
   * Get payout statistics for a user
   */
  async getPayoutStats(userId: string): Promise<{
    totalRequested: number;
    totalPaid: number;
    totalPending: number;
    totalRejected: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('payout_requests')
        .select('amount_cents, status')
        .eq('user_id', userId);

      if (error || !data) {
        return {
          totalRequested: 0,
          totalPaid: 0,
          totalPending: 0,
          totalRejected: 0,
        };
      }

      const stats = data.reduce(
        (acc, request) => {
          const amount = request.amount_cents / 100;
          acc.totalRequested += amount;

          switch (request.status) {
            case 'paid':
              acc.totalPaid += amount;
              break;
            case 'pending':
            case 'processing':
              acc.totalPending += amount;
              break;
            case 'rejected':
              acc.totalRejected += amount;
              break;
          }

          return acc;
        },
        {
          totalRequested: 0,
          totalPaid: 0,
          totalPending: 0,
          totalRejected: 0,
        }
      );

      return stats;
    } catch (error) {
      console.error('Error in getPayoutStats:', error);
      return {
        totalRequested: 0,
        totalPaid: 0,
        totalPending: 0,
        totalRejected: 0,
      };
    }
  }
}

export const payoutService = new PayoutService();
