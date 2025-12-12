
import { supabase } from '@/app/integrations/supabase/client';

export interface CreatorRevenueSummary {
  id: string;
  creator_id: string;
  total_from_gifts_cents: number;
  total_from_subscriptions_cents: number;
  total_withdrawn_cents: number;
  updated_at: string;
  created_at: string;
}

class CreatorRevenueService {
  /**
   * Get or create revenue summary for creator
   */
  async getOrCreateRevenueSummary(creatorId: string): Promise<CreatorRevenueSummary | null> {
    try {
      // Try to get existing summary
      const { data: existing, error: fetchError } = await supabase
        .from('creator_revenue_summary')
        .select('*')
        .eq('creator_id', creatorId)
        .single();

      if (existing) {
        return existing as CreatorRevenueSummary;
      }

      // Create new summary if doesn't exist
      if (fetchError && fetchError.code === 'PGRST116') {
        const { data: newSummary, error: createError } = await supabase
          .from('creator_revenue_summary')
          .insert({
            creator_id: creatorId,
            total_from_gifts_cents: 0,
            total_from_subscriptions_cents: 0,
            total_withdrawn_cents: 0,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating revenue summary:', createError);
          return null;
        }

        return newSummary as CreatorRevenueSummary;
      }

      console.error('Error fetching revenue summary:', fetchError);
      return null;
    } catch (error) {
      console.error('Error in getOrCreateRevenueSummary:', error);
      return null;
    }
  }

  /**
   * Update gift revenue
   */
  async updateGiftRevenue(
    creatorId: string,
    amountCents: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const summary = await this.getOrCreateRevenueSummary(creatorId);
      if (!summary) {
        return { success: false, error: 'Failed to get revenue summary' };
      }

      const { error } = await supabase
        .from('creator_revenue_summary')
        .update({
          total_from_gifts_cents: summary.total_from_gifts_cents + amountCents,
          updated_at: new Date().toISOString(),
        })
        .eq('creator_id', creatorId);

      if (error) {
        console.error('Error updating gift revenue:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Gift revenue updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in updateGiftRevenue:', error);
      return { success: false, error: 'Failed to update gift revenue' };
    }
  }

  /**
   * Update subscription revenue
   */
  async updateSubscriptionRevenue(
    creatorId: string,
    amountCents: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const summary = await this.getOrCreateRevenueSummary(creatorId);
      if (!summary) {
        return { success: false, error: 'Failed to get revenue summary' };
      }

      const { error } = await supabase
        .from('creator_revenue_summary')
        .update({
          total_from_subscriptions_cents: summary.total_from_subscriptions_cents + amountCents,
          updated_at: new Date().toISOString(),
        })
        .eq('creator_id', creatorId);

      if (error) {
        console.error('Error updating subscription revenue:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Subscription revenue updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in updateSubscriptionRevenue:', error);
      return { success: false, error: 'Failed to update subscription revenue' };
    }
  }

  /**
   * Update withdrawn amount
   */
  async updateWithdrawnAmount(
    creatorId: string,
    amountCents: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const summary = await this.getOrCreateRevenueSummary(creatorId);
      if (!summary) {
        return { success: false, error: 'Failed to get revenue summary' };
      }

      const { error } = await supabase
        .from('creator_revenue_summary')
        .update({
          total_withdrawn_cents: summary.total_withdrawn_cents + amountCents,
          updated_at: new Date().toISOString(),
        })
        .eq('creator_id', creatorId);

      if (error) {
        console.error('Error updating withdrawn amount:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Withdrawn amount updated successfully');
      return { success: true };
    } catch (error) {
      console.error('Error in updateWithdrawnAmount:', error);
      return { success: false, error: 'Failed to update withdrawn amount' };
    }
  }

  /**
   * Get revenue summary
   */
  async getRevenueSummary(creatorId: string): Promise<CreatorRevenueSummary | null> {
    return await this.getOrCreateRevenueSummary(creatorId);
  }

  /**
   * Get formatted revenue stats
   */
  async getRevenueStats(creatorId: string): Promise<{
    totalFromGifts: number;
    totalFromSubscriptions: number;
    totalEarned: number;
    totalWithdrawn: number;
    availableBalance: number;
  }> {
    try {
      const summary = await this.getOrCreateRevenueSummary(creatorId);
      if (!summary) {
        return {
          totalFromGifts: 0,
          totalFromSubscriptions: 0,
          totalEarned: 0,
          totalWithdrawn: 0,
          availableBalance: 0,
        };
      }

      const totalEarned = summary.total_from_gifts_cents + summary.total_from_subscriptions_cents;
      const availableBalance = totalEarned - summary.total_withdrawn_cents;

      return {
        totalFromGifts: summary.total_from_gifts_cents / 100,
        totalFromSubscriptions: summary.total_from_subscriptions_cents / 100,
        totalEarned: totalEarned / 100,
        totalWithdrawn: summary.total_withdrawn_cents / 100,
        availableBalance: availableBalance / 100,
      };
    } catch (error) {
      console.error('Error in getRevenueStats:', error);
      return {
        totalFromGifts: 0,
        totalFromSubscriptions: 0,
        totalEarned: 0,
        totalWithdrawn: 0,
        availableBalance: 0,
      };
    }
  }
}

export const creatorRevenueService = new CreatorRevenueService();