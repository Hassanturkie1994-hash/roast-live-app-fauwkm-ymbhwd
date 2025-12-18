
/**
 * Recalculate Season Rankings - Supabase Edge Function
 * 
 * This function should be scheduled to run daily via Supabase cron.
 * It recalculates all ranks for the active season and updates tier assignments.
 * 
 * Schedule: Daily at 00:00 UTC
 * 
 * Cron expression: 0 0 * * *
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RankingEntry {
  id: string;
  creator_id: string;
  composite_score: number;
  current_tier: string | null;
}

interface RankTier {
  tier_name: string;
  min_score: number;
  max_score: number | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 Starting season rankings recalculation...');

    // Get current active season
    const { data: season, error: seasonError } = await supabase
      .from('roast_ranking_seasons')
      .select('*')
      .eq('status', 'active')
      .single();

    if (seasonError || !season) {
      console.log('⚠️ No active season found');
      return new Response(
        JSON.stringify({ success: false, message: 'No active season' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`✅ Found active season: ${season.id} (Season ${season.season_number})`);

    // Get all ranking entries for the season
    const { data: entries, error: entriesError } = await supabase
      .from('roast_ranking_entries')
      .select('id, creator_id, composite_score, current_tier')
      .eq('season_id', season.id)
      .order('composite_score', { ascending: false });

    if (entriesError) {
      throw new Error(`Failed to fetch entries: ${entriesError.message}`);
    }

    if (!entries || entries.length === 0) {
      console.log('ℹ️ No ranking entries found for this season');
      return new Response(
        JSON.stringify({ success: true, message: 'No entries to recalculate' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`📊 Found ${entries.length} ranking entries`);

    // Get rank tiers
    const { data: tiers, error: tiersError } = await supabase
      .from('roast_rank_tiers')
      .select('tier_name, min_score, max_score')
      .eq('season_id', season.id)
      .order('tier_order', { ascending: true });

    if (tiersError) {
      throw new Error(`Failed to fetch tiers: ${tiersError.message}`);
    }

    console.log(`🏆 Found ${tiers?.length || 0} rank tiers`);

    // Determine tier for a score
    const determineTier = (score: number, tiers: RankTier[]): string | null => {
      for (const tier of tiers) {
        if (score >= tier.min_score && (tier.max_score === null || score <= tier.max_score)) {
          return tier.tier_name;
        }
      }
      return null;
    };

    // Update ranks and tiers
    const updates: Array<{ id: string; rank: number; tier: string | null }> = [];
    
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const rank = i + 1;
      const tier = determineTier(entry.composite_score, tiers || []);

      updates.push({
        id: entry.id,
        rank,
        tier,
      });
    }

    console.log(`🔄 Updating ${updates.length} ranking entries...`);

    // Batch update in chunks of 100
    const chunkSize = 100;
    for (let i = 0; i < updates.length; i += chunkSize) {
      const chunk = updates.slice(i, i + chunkSize);
      
      for (const update of chunk) {
        const { error: updateError } = await supabase
          .from('roast_ranking_entries')
          .update({
            rank: update.rank,
            current_tier: update.tier,
            last_recalculated_at: new Date().toISOString(),
          })
          .eq('id', update.id);

        if (updateError) {
          console.error(`❌ Failed to update entry ${update.id}:`, updateError);
        }
      }

      console.log(`✅ Updated chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(updates.length / chunkSize)}`);
    }

    console.log('✅ Season rankings recalculation complete!');

    // Return summary
    const summary = {
      success: true,
      season_id: season.id,
      season_number: season.season_number,
      total_entries: entries.length,
      tiers_used: tiers?.length || 0,
      recalculated_at: new Date().toISOString(),
    };

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('❌ Error recalculating rankings:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
