
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

    // Check if user is admin, moderator, or stream owner
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('is_admin, is_moderator')
      .eq('id', user.id)
      .single();

    if (userError) {
      return new Response(
        JSON.stringify({ error: 'Failed to verify user permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user_id, stream_id, reason, duration_minutes } = await req.json();

    if (!user_id || !stream_id || !reason || !duration_minutes) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, stream_id, reason, duration_minutes' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify stream exists and check if user is the owner
    const { data: stream, error: streamError } = await supabaseClient
      .from('live_streams')
      .select('user_id')
      .eq('id', stream_id)
      .single();

    if (streamError || !stream) {
      return new Response(
        JSON.stringify({ error: 'Stream not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isStreamOwner = stream.user_id === user.id;
    const hasPermission = userData.is_admin || userData.is_moderator || isStreamOwner;

    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate expiration time
    const expirationDate = new Date();
    expirationDate.setMinutes(expirationDate.getMinutes() + duration_minutes);

    // Insert timeout record
    const { data: timeout, error: timeoutError } = await supabaseClient
      .from('timeouts')
      .insert({
        user_id,
        stream_id,
        timeout_by: user.id,
        reason,
        expires_at: expirationDate.toISOString(),
      })
      .select()
      .single();

    if (timeoutError) {
      console.error('Error creating timeout:', timeoutError);
      return new Response(
        JSON.stringify({ error: 'Failed to create timeout' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send notification to timed out user
    await supabaseClient.from('notifications').insert({
      user_id,
      type: 'moderation',
      title: 'Chat Timeout',
      body: `You have been timed out for ${duration_minutes} minutes. Reason: ${reason}`,
      data: { timeout_id: timeout.id, stream_id },
      is_read: false,
    });

    return new Response(
      JSON.stringify({ success: true, data: timeout }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in timeout-add function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
