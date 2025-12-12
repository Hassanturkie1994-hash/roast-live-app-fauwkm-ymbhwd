
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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin or moderator
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('is_admin, is_moderator')
      .eq('id', user.id)
      .single();

    if (userError || (!userData?.is_admin && !userData?.is_moderator)) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin or Moderator access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { ban_id, user_id } = await req.json();

    if (!ban_id && !user_id) {
      return new Response(
        JSON.stringify({ error: 'Either ban_id or user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete ban record
    let query = supabaseClient.from('bans').delete();
    
    if (ban_id) {
      query = query.eq('id', ban_id);
    } else {
      query = query.eq('user_id', user_id);
    }

    const { error: deleteError } = await query;

    if (deleteError) {
      console.error('Error removing ban:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to remove ban' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send notification to unbanned user
    const targetUserId = user_id || (await supabaseClient
      .from('bans')
      .select('user_id')
      .eq('id', ban_id)
      .single()).data?.user_id;

    if (targetUserId) {
      await supabaseClient.from('notifications').insert({
        user_id: targetUserId,
        type: 'moderation',
        title: 'Ban Removed',
        body: 'Your account ban has been lifted. Welcome back!',
        is_read: false,
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Ban removed successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ban-remove function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
