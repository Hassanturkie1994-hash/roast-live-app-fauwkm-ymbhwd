
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

    // Get the authenticated user
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

    const { user_id, reason, duration_hours, is_permanent } = await req.json();

    if (!user_id || !reason) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, reason' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate expiration date if not permanent
    let expires_at = null;
    if (!is_permanent && duration_hours) {
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + duration_hours);
      expires_at = expirationDate.toISOString();
    }

    // Insert ban record
    const { data: ban, error: banError } = await supabaseClient
      .from('bans')
      .insert({
        user_id,
        banned_by: user.id,
        reason,
        expires_at,
        is_permanent: is_permanent || false,
      })
      .select()
      .single();

    if (banError) {
      console.error('Error creating ban:', banError);
      return new Response(
        JSON.stringify({ error: 'Failed to create ban' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send notification to banned user
    await supabaseClient.from('notifications').insert({
      user_id,
      type: 'moderation',
      title: 'Account Banned',
      body: `Your account has been ${is_permanent ? 'permanently' : 'temporarily'} banned. Reason: ${reason}`,
      data: { ban_id: ban.id },
      is_read: false,
    });

    return new Response(
      JSON.stringify({ success: true, data: ban }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ban-add function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
