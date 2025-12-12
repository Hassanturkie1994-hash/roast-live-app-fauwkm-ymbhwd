
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

    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update user to remove moderator status
    const { error: updateError } = await supabaseClient
      .from('users')
      .update({ is_moderator: false })
      .eq('id', user_id);

    if (updateError) {
      console.error('Error updating user:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete moderator record
    const { error: deleteError } = await supabaseClient
      .from('moderators')
      .delete()
      .eq('user_id', user_id);

    if (deleteError) {
      console.error('Error deleting moderator:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete moderator' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send notification
    await supabaseClient.from('notifications').insert({
      user_id,
      type: 'system',
      title: 'Moderator Role Removed',
      body: 'Your moderator role has been removed.',
      is_read: false,
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Moderator removed successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in moderators-remove function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
