
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

    const now = new Date().toISOString();

    // Find all expired bans
    const { data: expiredBans, error: fetchError } = await supabaseClient
      .from('bans')
      .select('id, user_id')
      .not('expires_at', 'is', null)
      .lt('expires_at', now)
      .eq('is_permanent', false);

    if (fetchError) {
      console.error('Error fetching expired bans:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch expired bans' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!expiredBans || expiredBans.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No expired bans found', count: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete expired bans
    const { error: deleteError } = await supabaseClient
      .from('bans')
      .delete()
      .in('id', expiredBans.map(ban => ban.id));

    if (deleteError) {
      console.error('Error deleting expired bans:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete expired bans' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send notifications to unbanned users
    const notifications = expiredBans.map(ban => ({
      user_id: ban.user_id,
      type: 'moderation',
      title: 'Ban Expired',
      body: 'Your temporary ban has expired. Welcome back!',
      is_read: false,
    }));

    await supabaseClient.from('notifications').insert(notifications);

    console.log(`Removed ${expiredBans.length} expired bans`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Removed ${expiredBans.length} expired bans`,
        count: expiredBans.length 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-ban-expirations function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
