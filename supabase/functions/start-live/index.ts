
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

    const { title, description, thumbnail_url } = await req.json();

    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: title' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already has an active stream
    const { data: existingStream } = await supabaseClient
      .from('live_streams')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_live', true)
      .single();

    if (existingStream) {
      return new Response(
        JSON.stringify({ error: 'You already have an active live stream' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique stream key
    const streamKey = crypto.randomUUID();

    // Create live stream record
    const { data: liveStream, error: streamError } = await supabaseClient
      .from('live_streams')
      .insert({
        user_id: user.id,
        title,
        description: description || '',
        thumbnail_url: thumbnail_url || '',
        stream_key: streamKey,
        is_live: true,
        viewer_count: 0,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (streamError) {
      console.error('Error creating live stream:', streamError);
      return new Response(
        JSON.stringify({ error: 'Failed to create live stream' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's followers
    const { data: followers } = await supabaseClient
      .from('follows')
      .select('follower_id')
      .eq('following_id', user.id);

    // Send notifications to followers
    if (followers && followers.length > 0) {
      const notifications = followers.map(follow => ({
        user_id: follow.follower_id,
        type: 'live_start',
        title: 'Live Stream Started',
        body: `${user.email} is now live: ${title}`,
        data: { stream_id: liveStream.id },
        is_read: false,
      }));

      await supabaseClient.from('notifications').insert(notifications);
    }

    return new Response(
      JSON.stringify({ success: true, data: liveStream }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in start-live function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
