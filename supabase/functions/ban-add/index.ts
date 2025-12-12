
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { creator_id, banned_user_id, reason } = await req.json();

    // Validate required fields
    if (!creator_id || !banned_user_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: creator_id and banned_user_id are required',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if already banned
    const { data: existing } = await supabase
      .from('banned_users')
      .select('id')
      .eq('streamer_id', creator_id)
      .eq('user_id', banned_user_id)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'User is already banned',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Ban user
    const { error: insertError } = await supabase
      .from('banned_users')
      .insert({
        streamer_id: creator_id,
        user_id: banned_user_id,
        reason: reason || null,
      });

    if (insertError) {
      console.error('Error banning user:', insertError);
      return new Response(
        JSON.stringify({
          success: false,
          error: insertError.message,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Broadcast ban event to kick user from stream
    const { data: streams } = await supabase
      .from('streams')
      .select('id')
      .eq('broadcaster_id', creator_id)
      .eq('status', 'live');

    if (streams && streams.length > 0) {
      // User will be kicked via realtime subscription in the app
      console.log(`User ${banned_user_id} banned from streamer ${creator_id}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User banned successfully',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('Error in ban-add function:', e);
    return new Response(
      JSON.stringify({
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error occurred',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});