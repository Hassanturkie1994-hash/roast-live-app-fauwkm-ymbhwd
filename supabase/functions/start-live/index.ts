
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * start-live Edge Function
 * 
 * FIX ISSUE 3: Enhanced error handling and response structure
 * - Always returns JSON with explicit status codes
 * - Validates all inputs before processing
 * - Surfaces detailed error messages for debugging
 */

Deno.serve(async (req) => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎬 [start-live] Edge Function invoked');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('❌ [start-live] Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid request body: must be valid JSON",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { title, user_id } = body;

    console.log('📋 [start-live] Request payload:', { title, user_id });

    // FIX ISSUE 3: Validate required fields
    if (!title || typeof title !== 'string' || !title.trim()) {
      console.error('❌ [start-live] Invalid or missing title');
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid or missing title: must be a non-empty string",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!user_id || typeof user_id !== 'string' || !user_id.trim()) {
      console.error('❌ [start-live] Invalid or missing user_id');
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid or missing user_id: must be a non-empty string",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Read Cloudflare credentials from secrets
    const CF_ACCOUNT_ID = Deno.env.get("CF_ACCOUNT_ID") || Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    const CF_API_TOKEN = Deno.env.get("CF_API_TOKEN") || Deno.env.get("CLOUDFLARE_API_TOKEN");

    console.log('🔑 [start-live] Cloudflare credentials check:', {
      hasAccountId: !!CF_ACCOUNT_ID,
      hasApiToken: !!CF_API_TOKEN,
    });

    if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
      console.error('❌ [start-live] Missing Cloudflare credentials');
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error: Missing Cloudflare credentials. Please contact support.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ [start-live] Missing Supabase credentials');
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error: Missing Supabase credentials",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('📡 [start-live] Creating Cloudflare live input...');

    // Create Cloudflare live input
    let createInput;
    try {
      createInput = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/live_inputs`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${CF_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            meta: { title, user_id },
            recording: {
              mode: "automatic",
              timeoutSeconds: 10,
            },
          }),
        }
      );
    } catch (fetchError) {
      console.error('❌ [start-live] Cloudflare API request failed:', fetchError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to connect to Cloudflare: ${fetchError.message}`,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    let cloudflareResponse;
    try {
      cloudflareResponse = await createInput.json();
    } catch (jsonError) {
      console.error('❌ [start-live] Failed to parse Cloudflare response:', jsonError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid response from Cloudflare API",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('☁️ [start-live] Cloudflare response:', {
      success: cloudflareResponse.success,
      hasResult: !!cloudflareResponse.result,
      errors: cloudflareResponse.errors,
    });

    if (!cloudflareResponse.success || !cloudflareResponse.result) {
      console.error('❌ [start-live] Cloudflare API error:', cloudflareResponse.errors);
      const errorMessage = cloudflareResponse.errors 
        ? JSON.stringify(cloudflareResponse.errors) 
        : "Cloudflare API returned an error";
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `Cloudflare error: ${errorMessage}`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { uid, rtmps, webRTC } = cloudflareResponse.result;

    console.log('✅ [start-live] Cloudflare live input created:', { uid });

    // Validate required fields from Cloudflare
    if (!uid) {
      console.error('❌ [start-live] Missing uid in Cloudflare response');
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid Cloudflare response: missing stream ID",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build playback URL
    const playback_url = `https://customer-${CF_ACCOUNT_ID}.cloudflarestream.com/${uid}/manifest/video.m3u8`;

    console.log('📝 [start-live] Creating stream record in database...');

    // Create stream record in database with live_input_id
    const { data: streamData, error: streamError } = await supabase
      .from('streams')
      .insert({
        id: uid,
        broadcaster_id: user_id,
        cloudflare_stream_id: uid,
        live_input_id: uid,
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
      console.error('❌ [start-live] Error creating stream record:', streamError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Database error: ${streamError.message}`,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log('✅ [start-live] Stream record created successfully');

    // Fetch moderators for this creator
    const { data: moderators, error: modError } = await supabase
      .from('moderators')
      .select('user_id, profiles(id, username, display_name, avatar_url)')
      .eq('streamer_id', user_id);

    if (modError) {
      console.error('⚠️ [start-live] Error fetching moderators:', modError);
    }

    // Format moderators array
    const moderatorsArray = moderators?.map(mod => ({
      user_id: mod.user_id,
      username: mod.profiles?.username,
      display_name: mod.profiles?.display_name,
      avatar_url: mod.profiles?.avatar_url,
    })) || [];

    // Build response
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

    console.log(`✅ [start-live] Stream started successfully with ${moderatorsArray.length} moderators`);

    // Send push notifications to followers (non-blocking)
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
        console.log(`📢 [start-live] Sending live notifications to ${followers.length} followers`);

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

        console.log(`✅ [start-live] Sent live notifications to ${followers.length} followers`);
      }
    } catch (notifError) {
      console.error('⚠️ [start-live] Error sending live notifications:', notifError);
      // Don't fail the stream start if notifications fail
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ [start-live] Returning success response');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ [start-live] CRITICAL ERROR');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error:', e);
    console.error('Error message:', e instanceof Error ? e.message : 'Unknown error');
    console.error('Error stack:', e instanceof Error ? e.stack : 'No stack trace');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: e instanceof Error ? e.message : "An unexpected error occurred. Please try again." 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
