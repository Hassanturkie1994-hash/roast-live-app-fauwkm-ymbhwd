
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

    const { stream_id } = await req.json();

    if (!stream_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: stream_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify stream belongs to user
    const { data: stream, error: fetchError } = await supabaseClient
      .from('live_streams')
      .select('*')
      .eq('id', stream_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !stream) {
      return new Response(
        JSON.stringify({ error: 'Stream not found or unauthorized' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update stream to stopped
    const { data: updatedStream, error: updateError } = await supabaseClient
      .from('live_streams')
      .update({
        is_live: false,
        ended_at: new Date().toISOString(),
      })
      .eq('id', stream_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error stopping live stream:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to stop live stream' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate stream duration
    const startedAt = new Date(stream.started_at);
    const endedAt = new Date(updatedStream.ended_at);
    const durationMinutes = Math.floor((endedAt.getTime() - startedAt.getTime()) / 60000);

    console.log(`Stream ${stream_id} ended. Duration: ${durationMinutes} minutes, Peak viewers: ${stream.viewer_count}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: updatedStream,
        stats: {
          duration_minutes: durationMinutes,
          peak_viewers: stream.viewer_count,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in stop-live function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
