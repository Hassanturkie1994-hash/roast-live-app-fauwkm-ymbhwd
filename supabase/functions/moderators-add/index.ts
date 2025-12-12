
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

    // Check if user is admin
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user_id, permissions } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update user to be moderator
    const { error: updateError } = await supabaseClient
      .from('users')
      .update({ is_moderator: true })
      .eq('id', user_id);

    if (updateError) {
      console.error('Error updating user:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert moderator record
    const { data: moderator, error: moderatorError } = await supabaseClient
      .from('moderators')
      .insert({
        user_id,
        assigned_by: user.id,
        permissions: permissions || ['ban_users', 'timeout_users', 'delete_content', 'review_reports'],
      })
      .select()
      .single();

    if (moderatorError) {
      console.error('Error creating moderator:', moderatorError);
      return new Response(
        JSON.stringify({ error: 'Failed to create moderator' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send notification to new moderator
    await supabaseClient.from('notifications').insert({
      user_id,
      type: 'system',
      title: 'Moderator Role Assigned',
      body: 'You have been assigned as a moderator. Welcome to the team!',
      is_read: false,
    });

    return new Response(
      JSON.stringify({ success: true, data: moderator }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in moderators-add function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
