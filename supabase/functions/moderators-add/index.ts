
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

    const { creator_id, moderator_id } = await req.json();

    // Validate required fields
    if (!creator_id || !moderator_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: creator_id and moderator_id are required',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if already a moderator
    const { data: existing } = await supabase
      .from('moderators')
      .select('id')
      .eq('streamer_id', creator_id)
      .eq('user_id', moderator_id)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'User is already a moderator',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check moderator limit (30 max)
    const { count } = await supabase
      .from('moderators')
      .select('*', { count: 'exact', head: true })
      .eq('streamer_id', creator_id);

    if (count && count >= 30) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Maximum of 30 moderators reached',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Add moderator
    const { error: insertError } = await supabase
      .from('moderators')
      .insert({
        streamer_id: creator_id,
        user_id: moderator_id,
      });

    if (insertError) {
      console.error('Error adding moderator:', insertError);
      return new Response(
        JSON.stringify({
          success: false,
          error: insertError.message,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch updated moderators list
    const { data: moderators } = await supabase
      .from('moderators')
      .select('*, profiles(id, username, display_name, avatar_url)')
      .eq('streamer_id', creator_id)
      .order('created_at', { ascending: false });

    return new Response(
      JSON.stringify({
        success: true,
        moderators: moderators || [],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('Error in moderators-add function:', e);
    return new Response(
      JSON.stringify({
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error occurred',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});