
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * start-live Edge Function - AGORA INTEGRATION
 * 
 * Migrated from Cloudflare Stream to Agora RTC for 1v1 roast battles
 * 
 * Features:
 * - Generates Agora RTC tokens for publishers
 * - Stores channel_name in database for audience to join
 * - Supports real-time 1v1 guest battles
 * - Maintains existing notification and moderator logic
 */

// Agora Token Generation (simplified implementation)
// For production, use the official agora-access-token package
function generateAgoraToken(
  appId: string,
  appCertificate: string,
  channelName: string,
  uid: number,
  role: number, // 1 = PUBLISHER, 2 = SUBSCRIBER
  expirationTimeInSeconds: number
): string {
  // This is a simplified token generation
  // In production, you should use the official Agora token library
  // For now, we'll create a basic token structure
  
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
  
  // Create a simple token (this is a placeholder - use official library in production)
  const tokenData = {
    appId,
    channelName,
    uid,
    role,
    privilegeExpiredTs,
    timestamp: currentTimestamp,
  };
  
  // In production, use proper HMAC signing with appCertificate
  const tokenString = btoa(JSON.stringify(tokenData));
  
  console.log('🔑 [start-live] Generated Agora token (simplified)');
  
  return tokenString;
}

Deno.serve(async (req) => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎬 [start-live] AGORA Edge Function invoked');
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

    const { title, user_id, channelName, uid } = body;

    console.log('📋 [start-live] Request payload:', { title, user_id, channelName, uid });

    // Validate required fields
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

    // Generate channel name if not provided
    const finalChannelName = channelName || `roast_${user_id}_${Date.now()}`;
    
    // Generate UID if not provided (0 means Agora will auto-assign)
    const finalUid = uid || 0;

    // Read Agora credentials from environment
    const AGORA_APP_ID = Deno.env.get("AGORA_APP_ID");
    const AGORA_APP_CERTIFICATE = Deno.env.get("AGORA_APP_CERTIFICATE");

    console.log('🔑 [start-live] Agora credentials check:', {
      hasAppId: !!AGORA_APP_ID,
      hasAppCertificate: !!AGORA_APP_CERTIFICATE,
    });

    if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
      console.error('❌ [start-live] Missing Agora credentials');
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error: Missing Agora credentials. Please contact support.",
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

    console.log('🎯 [start-live] Generating Agora RTC token...');

    // Generate Agora RTC Token
    // Role: 1 = PUBLISHER (host can publish audio/video)
    const role = 1; // PUBLISHER
    const expirationTimeInSeconds = 3600; // 1 hour
    
    const token = generateAgoraToken(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      finalChannelName,
      finalUid,
      role,
      expirationTimeInSeconds
    );

    console.log('✅ [start-live] Agora token generated successfully');

    // Generate a unique stream ID
    const streamId = `agora_${finalChannelName}_${Date.now()}`;

    console.log('📝 [start-live] Creating stream record in database...');

    // Create stream record in database with channel_name
    const { data: streamData, error: streamError } = await supabase
      .from('streams')
      .insert({
        id: streamId,
        broadcaster_id: user_id,
        channel_name: finalChannelName, // Store channel name for audience
        agora_channel: finalChannelName,
        agora_uid: finalUid,
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
        id: streamId,
        title: title,
        status: "live",
        channel_name: finalChannelName,
        moderators: moderatorsArray,
      },
      agora: {
        token: token,
        channelName: finalChannelName,
        uid: finalUid,
        appId: AGORA_APP_ID,
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
                    streamId: streamId,
                    stream_id: streamId,
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
            ref_stream_id: streamId,
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
