
import { supabase } from '@/app/integrations/supabase/client';

interface CreatorPayout {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  method: 'stripe' | 'paypal';
  status: 'pending' | 'paid';
  created_at: string;
}

interface EarningsLedger {
  id: string;
  user_id: string;
  source_type: 'gift' | 'subscription' | 'premium';
  gross_amount: number;
  platform_fee: number;
  net_amount: number;
  created_at: string;
}

interface TaxForm {
  id: string;
  user_id: string;
  form_type: 'W8' | 'W9';
  submitted_file_url: string;
  verified: boolean;
  created_at: string;
}

interface EarningsSummary {
  monthlyEarnings: number;
  lifetimeEarnings: number;
  pendingPayouts: number;
  totalPaid: number;
}

class CreatorEarningsService {
  /**
   * Record an earning in the ledger
   */
  async recordEarning(
    userId: string,
    sourceType: 'gift' | 'subscription' | 'premium',
    grossAmount: number,
    platformFeePercentage: number = 30
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const platformFee = (grossAmount * platformFeePercentage) / 100;
      const netAmount = grossAmount - platformFee;

      const { error } = await supabase.from('creator_earnings_ledger').insert({
        user_id: userId,
        source_type: sourceType,
        gross_amount: grossAmount,
        platform_fee: platformFee,
        net_amount: netAmount,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error recording earning:', error);
      return { success: false, error: 'Failed to record earning' };
    }
  }

  /**
   * Get earnings summary for a user
   */
  async getEarningsSummary(userId: string): Promise<{
    success: boolean;
    summary?: EarningsSummary;
    error?: string;
  }> {
    try {
      // Get monthly earnings (current month)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthlyData, error: monthlyError } = await supabase
        .from('creator_earnings_ledger')
        .select('net_amount')
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString());

      if (monthlyError) throw monthlyError;

      const monthlyEarnings = monthlyData?.reduce((sum, e) => sum + Number(e.net_amount), 0) || 0;

      // Get lifetime earnings
      const { data: lifetimeData, error: lifetimeError } = await supabase
        .from('creator_earnings_ledger')
        .select('net_amount')
        .eq('user_id', userId);

      if (lifetimeError) throw lifetimeError;

      const lifetimeEarnings = lifetimeData?.reduce((sum, e) => sum + Number(e.net_amount), 0) || 0;

      // Get pending payouts
      const { data: pendingData, error: pendingError } = await supabase
        .from('creator_payouts')
        .select('amount')
        .eq('user_id', userId)
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      const pendingPayouts = pendingData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Get total paid
      const { data: paidData, error: paidError } = await supabase
        .from('creator_payouts')
        .select('amount')
        .eq('user_id', userId)
        .eq('status', 'paid');

      if (paidError) throw paidError;

      const totalPaid = paidData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      return {
        success: true,
        summary: {
          monthlyEarnings,
          lifetimeEarnings,
          pendingPayouts,
          totalPaid,
        },
      };
    } catch (error) {
      console.error('Error fetching earnings summary:', error);
      return { success: false, error: 'Failed to fetch earnings summary' };
    }
  }

  /**
   * Get earnings ledger for a user
   */
  async getEarningsLedger(
    userId: string,
    limit: number = 50
  ): Promise<{ success: boolean; ledger?: EarningsLedger[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('creator_earnings_ledger')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { success: true, ledger: data as EarningsLedger[] };
    } catch (error) {
      console.error('Error fetching earnings ledger:', error);
      return { success: false, error: 'Failed to fetch earnings ledger' };
    }
  }

  /**
   * Request a payout
   */
  async requestPayout(
    userId: string,
    amount: number,
    method: 'stripe' | 'paypal',
    currency: string = 'SEK'
  ): Promise<{ success: boolean; payoutId?: string; error?: string }> {
    try {
      // Check if user has submitted tax form
      const { data: taxForm } = await supabase
        .from('tax_forms')
        .select('verified')
        .eq('user_id', userId)
        .maybeSingle();

      if (!taxForm || !taxForm.verified) {
        return { success: false, error: 'Tax form must be submitted and verified before requesting payout' };
      }

      // Check if user has enough earnings
      const { summary } = await this.getEarningsSummary(userId);
      if (!summary) {
        return { success: false, error: 'Failed to fetch earnings summary' };
      }

      const availableBalance = summary.lifetimeEarnings - summary.totalPaid - summary.pendingPayouts;
      if (availableBalance < amount) {
        return { success: false, error: 'Insufficient balance for payout' };
      }

      // Create payout request
      const { data, error } = await supabase
        .from('creator_payouts')
        .insert({
          user_id: userId,
          amount,
          currency,
          method,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, payoutId: data.id };
    } catch (error) {
      console.error('Error requesting payout:', error);
      return { success: false, error: 'Failed to request payout' };
    }
  }

  /**
   * Get payouts for a user
   */
  async getPayouts(userId: string): Promise<{
    success: boolean;
    payouts?: CreatorPayout[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('creator_payouts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, payouts: data as CreatorPayout[] };
    } catch (error) {
      console.error('Error fetching payouts:', error);
      return { success: false, error: 'Failed to fetch payouts' };
    }
  }

  /**
   * Submit tax form
   */
  async submitTaxForm(
    userId: string,
    formType: 'W8' | 'W9',
    fileUrl: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if tax form already exists
      const { data: existing } = await supabase
        .from('tax_forms')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('tax_forms')
          .update({
            form_type: formType,
            submitted_file_url: fileUrl,
            verified: false,
          })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase.from('tax_forms').insert({
          user_id: userId,
          form_type: formType,
          submitted_file_url: fileUrl,
          verified: false,
        });

        if (error) throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error submitting tax form:', error);
      return { success: false, error: 'Failed to submit tax form' };
    }
  }

  /**
   * Get tax form for a user
   */
  async getTaxForm(userId: string): Promise<{
    success: boolean;
    taxForm?: TaxForm;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('tax_forms')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      return { success: true, taxForm: data as TaxForm | undefined };
    } catch (error) {
      console.error('Error fetching tax form:', error);
      return { success: false, error: 'Failed to fetch tax form' };
    }
  }

  /**
   * Generate monthly statement (admin function)
   */
  async generateMonthlyStatement(
    userId: string,
    year: number,
    month: number
  ): Promise<{ success: boolean; statement?: any; error?: string }> {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const { data, error } = await supabase
        .from('creator_earnings_ledger')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      const statement = {
        userId,
        year,
        month,
        earnings: data,
        totalGross: data?.reduce((sum, e) => sum + Number(e.gross_amount), 0) || 0,
        totalFees: data?.reduce((sum, e) => sum + Number(e.platform_fee), 0) || 0,
        totalNet: data?.reduce((sum, e) => sum + Number(e.net_amount), 0) || 0,
      };

      return { success: true, statement };
    } catch (error) {
      console.error('Error generating monthly statement:', error);
      return { success: false, error: 'Failed to generate monthly statement' };
    }
  }

  /**
   * Approve payout (admin function)
   */
  async approvePayout(payoutId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('creator_payouts')
        .update({ status: 'paid' })
        .eq('id', payoutId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error approving payout:', error);
      return { success: false, error: 'Failed to approve payout' };
    }
  }

  /**
   * Verify tax form (admin function)
   */
  async verifyTaxForm(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('tax_forms')
        .update({ verified: true })
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error verifying tax form:', error);
      return { success: false, error: 'Failed to verify tax form' };
    }
  }
}

export const creatorEarningsService = new CreatorEarningsService();