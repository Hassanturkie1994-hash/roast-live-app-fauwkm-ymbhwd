
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

    const { creator_id, banned_user_id } = await req.json();

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

    // Unban user
    const { error: deleteError } = await supabase
      .from('banned_users')
      .delete()
      .eq('streamer_id', creator_id)
      .eq('user_id', banned_user_id);

    if (deleteError) {
      console.error('Error unbanning user:', deleteError);
      return new Response(
        JSON.stringify({
          success: false,
          error: deleteError.message,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User unbanned successfully',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('Error in ban-remove function:', e);
    return new Response(
      JSON.stringify({
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error occurred',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});