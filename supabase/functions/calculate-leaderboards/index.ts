
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { period = 'daily' } = await req.json().catch(() => ({}));

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'weekly':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'monthly':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'all_time':
        startDate = new Date(0);
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
    }

    // Calculate scores based on various metrics
    // This is a simplified example - adjust based on your scoring logic
    const { data: leaderboardData, error: leaderboardError } = await supabaseClient
      .rpc('calculate_user_scores', {
        start_date: startDate.toISOString(),
        period_type: period,
      });

    if (leaderboardError) {
      console.error('Error calculating leaderboard:', leaderboardError);
      return new Response(
        JSON.stringify({ error: 'Failed to calculate leaderboard' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store leaderboard snapshot
    const { error: snapshotError } = await supabaseClient
      .from('leaderboard_snapshots')
      .insert({
        period,
        data: leaderboardData,
        calculated_at: new Date().toISOString(),
      });

    if (snapshotError) {
      console.error('Error storing leaderboard snapshot:', snapshotError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: leaderboardData,
        message: `${period} leaderboard calculated successfully` 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in calculate-leaderboards function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
