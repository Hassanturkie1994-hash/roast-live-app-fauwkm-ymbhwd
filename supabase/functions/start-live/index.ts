
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const { title, user_id } = await req.json();

    // Validate required fields
    if (!title || !user_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: title and user_id are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Read Cloudflare credentials from secrets
    const CF_ACCOUNT_ID = Deno.env.get("CF_ACCOUNT_ID") || Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    const CF_API_TOKEN = Deno.env.get("CF_API_TOKEN") || Deno.env.get("CLOUDFLARE_API_TOKEN");

    if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing Cloudflare credentials. Please configure CF_ACCOUNT_ID (or CLOUDFLARE_ACCOUNT_ID) and CF_API_TOKEN in Supabase Edge Function secrets.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch moderators for this creator
    const { data: moderators, error: modError } = await supabase
      .from('moderators')
      .select('user_id, profiles(id, username, display_name, avatar_url)')
      .eq('streamer_id', user_id);

    if (modError) {
      console.error('Error fetching moderators:', modError);
    }

    // Create Cloudflare live input
    const createInput = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/live_inputs`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          meta: { title, user_id },
        }),
      }
    );

    const cloudflareResponse = await createInput.json();

    if (!cloudflareResponse.success || !cloudflareResponse.result) {
      return new Response(
        JSON.stringify({
          success: false,
          error: cloudflareResponse.errors 
            ? JSON.stringify(cloudflareResponse.errors) 
            : "Cloudflare API error",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { uid, rtmps, webRTC } = cloudflareResponse.result;

    // Validate required fields from Cloudflare
    if (!uid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing uid in Cloudflare response",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build playback URL
    const playback_url = `https://customer-${CF_ACCOUNT_ID}.cloudflarestream.com/${uid}/manifest/video.m3u8`;

    // Create stream record in database
    const { data: streamData, error: streamError } = await supabase
      .from('streams')
      .insert({
        id: uid,
        broadcaster_id: user_id,
        cloudflare_stream_id: uid,
        playback_url: playback_url,
        ingest_url: rtmps?.url || null,
        stream_key: rtmps?.streamKey || null,
        title: title,
        status: 'live',
        viewer_count: 0,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (streamError) {
      console.error('Error creating stream record:', streamError);
      // Continue anyway, the stream is created in Cloudflare
    }

    // Format moderators array
    const moderatorsArray = moderators?.map(mod => ({
      user_id: mod.user_id,
      username: mod.profiles?.username,
      display_name: mod.profiles?.display_name,
      avatar_url: mod.profiles?.avatar_url,
    })) || [];

    // Return response with moderators included
    const response = {
      success: true,
      stream: {
        id: uid,
        live_input_id: uid,
        title: title,
        status: "live",
        playback_url: playback_url,
        moderators: moderatorsArray,
      },
      ingest: {
        webRTC_url: webRTC?.url || null,
        rtmps_url: rtmps?.url || null,
        stream_key: rtmps?.streamKey || null,
      },
    };

    console.log(`✅ Stream started with ${moderatorsArray.length} moderators`);

    // Send push notifications to followers when creator goes live
    try {
      // Get creator info
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', user_id)
        .single();

      const creatorName = creatorProfile?.display_name || creatorProfile?.username || 'A creator';

      // Get all followers of the creator
      const { data: followers, error: followersError } = await supabase
        .from('followers')
        .select('follower_id')
        .eq('following_id', user_id);

      if (!followersError && followers && followers.length > 0) {
        console.log(`Sending live notifications to ${followers.length} followers`);

        // Send notification to each follower
        for (const follower of followers) {
          // Check if user has enabled live notifications
          const { data: prefs } = await supabase
            .from('notification_preferences')
            .select('notify_when_followed_goes_live')
            .eq('user_id', follower.follower_id)
            .maybeSingle();

          if (prefs && prefs.notify_when_followed_goes_live === false) {
            continue; // Skip if user disabled live notifications
          }

          // Get active device tokens
          const { data: tokens } = await supabase
            .from('push_device_tokens')
            .select('device_token, platform')
            .eq('user_id', follower.follower_id)
            .eq('is_active', true);

          if (tokens && tokens.length > 0) {
            // Send push notification via edge function
            await supabase.functions.invoke('send-push-notification', {
              body: {
                userId: follower.follower_id,
                tokens: tokens.map(t => ({ token: t.device_token, platform: t.platform })),
                notification: {
                  title: `${creatorName} is LIVE now!`,
                  body: 'Join the stream before it fills up!',
                  data: {
                    route: 'LiveStream',
                    streamId: uid,
                    stream_id: uid,
                    sender_id: user_id,
                  },
                },
              },
            });
          }

          // Create in-app notification
          await supabase.from('notifications').insert({
            type: 'stream_started',
            sender_id: user_id,
            receiver_id: follower.follower_id,
            message: `${creatorName} is LIVE now!\n\nJoin the stream before it fills up!`,
            ref_stream_id: uid,
            category: 'social',
            read: false,
          });
        }

        console.log(`✅ Sent live notifications to ${followers.length} followers`);
      }
    } catch (notifError) {
      console.error('Error sending live notifications:', notifError);
      // Don't fail the stream start if notifications fail
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error('Error in start-live function:', e);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: e instanceof Error ? e.message : "Unknown error occurred" 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
