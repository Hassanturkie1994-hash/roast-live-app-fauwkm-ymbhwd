
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

    const { creator_id, user_id, minutes, stream_id } = await req.json();

    // Validate required fields
    if (!creator_id || !user_id || !minutes || !stream_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: creator_id, user_id, minutes, and stream_id are required',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate minutes range
    if (minutes < 1 || minutes > 60) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Timeout duration must be between 1 and 60 minutes',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate timeout end time
    const endTime = new Date();
    endTime.setMinutes(endTime.getMinutes() + minutes);

    // Delete existing timeout if any
    await supabase
      .from('timed_out_users')
      .delete()
      .eq('stream_id', stream_id)
      .eq('user_id', user_id);

    // Insert new timeout
    const { error: insertError } = await supabase
      .from('timed_out_users')
      .insert({
        stream_id: stream_id,
        user_id: user_id,
        end_time: endTime.toISOString(),
      });

    if (insertError) {
      console.error('Error timing out user:', insertError);
      return new Response(
        JSON.stringify({
          success: false,
          error: insertError.message,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `User timed out for ${minutes} minutes`,
        timeout_until: endTime.toISOString(),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('Error in timeout-add function:', e);
    return new Response(
      JSON.stringify({
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error occurred',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});