
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { RtcTokenBuilder, RtcRole } from 'npm:agora-access-token@2.0.8';

/**
 * start-live Edge Function - AGORA INTEGRATION WITH CLOUD RECORDING
 * 
 * Features:
 * - Generates Agora RTC tokens for publishers
 * - Starts Agora Cloud Recording to AWS S3
 * - Stores channel_name and recording metadata in database
 * - Supports real-time multi-guest streaming (up to 10 users)
 * - Maintains existing notification and moderator logic
 */

// Helper function to make Agora REST API calls with Basic Auth
async function callAgoraAPI(
  endpoint: string,
  method: string,
  body: any,
  customerKey: string,
  customerSecret: string
) {
  const credentials = btoa(`${customerKey}:${customerSecret}`);
  
  const response = await fetch(endpoint, {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${credentials}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Agora API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

// Helper function to map AWS region to Agora region code
function getAgoraRegionCode(awsRegion: string): number {
  const regionMap: Record<string, number> = {
    'us-east-1': 0,
    'us-east-2': 0,
    'us-west-1': 0,
    'us-west-2': 0,
    'eu-west-1': 1,
    'eu-central-1': 1,
    'ap-southeast-1': 2,
    'ap-northeast-1': 2,
    'cn-north-1': 3,
  };
  
  return regionMap[awsRegion] || 0; // Default to US
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
    const AGORA_CUSTOMER_KEY = Deno.env.get("AGORA_CUSTOMER_KEY");
    const AGORA_CUSTOMER_SECRET = Deno.env.get("AGORA_CUSTOMER_SECRET");
    
    // Read AWS S3 credentials from environment
    const AWS_ACCESS_KEY_ID = Deno.env.get("AWS_ACCESS_KEY_ID");
    const AWS_SECRET_ACCESS_KEY = Deno.env.get("AWS_SECRET_ACCESS_KEY");
    const AWS_BUCKET_NAME = Deno.env.get("AWS_BUCKET_NAME") || Deno.env.get("AWS_S3_BUCKET") || "roast-live-recordings";
    const AWS_S3_REGION = Deno.env.get("AWS_S3_REGION") || "us-east-1";

    console.log('🔑 [start-live] Credentials check:', {
      hasAppId: !!AGORA_APP_ID,
      hasAppCertificate: !!AGORA_APP_CERTIFICATE,
      hasCustomerKey: !!AGORA_CUSTOMER_KEY,
      hasCustomerSecret: !!AGORA_CUSTOMER_SECRET,
      hasAwsAccessKey: !!AWS_ACCESS_KEY_ID,
      hasAwsSecretKey: !!AWS_SECRET_ACCESS_KEY,
      awsBucket: AWS_BUCKET_NAME,
      awsRegion: AWS_S3_REGION,
    });

    if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
      console.error('❌ [start-live] Missing Agora credentials');
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error: Missing Agora credentials",
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
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    
    const token = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      finalChannelName,
      finalUid,
      role,
      privilegeExpiredTs
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
        channel_name: finalChannelName,
        agora_channel: finalChannelName,
        agora_uid: finalUid,
        title: title,
        status: 'live',
        viewer_count: 0,
        started_at: new Date().toISOString(),
        recording_status: 'not_started',
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

    // Start Cloud Recording if credentials are available
    let recordingResourceId = null;
    let recordingSid = null;
    let recordingError = null;

    if (AGORA_CUSTOMER_KEY && AGORA_CUSTOMER_SECRET && AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY) {
      try {
        console.log('📹 [start-live] Starting Agora Cloud Recording...');

        // Step 1: Acquire resource ID
        const acquireEndpoint = `https://api.agora.io/v1/apps/${AGORA_APP_ID}/cloud_recording/acquire`;
        const acquireBody = {
          cname: finalChannelName,
          uid: `${finalUid}`,
          clientRequest: {
            resourceExpiredHour: 24,
            scene: 0, // Real-time recording
          },
        };

        console.log('🔄 [start-live] Acquiring resource ID...');
        const acquireResponse = await callAgoraAPI(
          acquireEndpoint,
          'POST',
          acquireBody,
          AGORA_CUSTOMER_KEY,
          AGORA_CUSTOMER_SECRET
        );

        recordingResourceId = acquireResponse.resourceId;
        console.log('✅ [start-live] Resource ID acquired:', recordingResourceId);

        // Step 2: Start recording
        const startEndpoint = `https://api.agora.io/v1/apps/${AGORA_APP_ID}/cloud_recording/resourceid/${recordingResourceId}/mode/mix/start`;
        
        // Map AWS region to Agora region code
        const agoraRegionCode = getAgoraRegionCode(AWS_S3_REGION);
        
        const startBody = {
          cname: finalChannelName,
          uid: `${finalUid}`,
          clientRequest: {
            token: token,
            recordingConfig: {
              maxIdleTime: 30,
              streamTypes: 2, // Audio and video
              channelType: 0, // Communication mode
              videoStreamType: 0, // High stream
              subscribeVideoUids: ["#allstream#"], // Subscribe to all streams
              subscribeAudioUids: ["#allstream#"],
              subscribeUidGroup: 0,
            },
            recordingFileConfig: {
              avFileType: ["hls", "mp4"], // HLS for live playback, MP4 for download
            },
            storageConfig: {
              vendor: 1, // AWS S3
              region: agoraRegionCode,
              bucket: AWS_BUCKET_NAME,
              accessKey: AWS_ACCESS_KEY_ID,
              secretKey: AWS_SECRET_ACCESS_KEY,
              fileNamePrefix: [`recordings/${finalChannelName}`],
            },
          },
        };

        console.log('🔄 [start-live] Starting recording with config:', {
          vendor: 1,
          region: agoraRegionCode,
          bucket: AWS_BUCKET_NAME,
          fileNamePrefix: `recordings/${finalChannelName}`,
        });

        const startResponse = await callAgoraAPI(
          startEndpoint,
          'POST',
          startBody,
          AGORA_CUSTOMER_KEY,
          AGORA_CUSTOMER_SECRET
        );

        recordingSid = startResponse.sid;
        console.log('✅ [start-live] Recording started with SID:', recordingSid);

        // Update stream record with recording info
        const { error: updateError } = await supabase
          .from('streams')
          .update({
            recording_resource_id: recordingResourceId,
            recording_sid: recordingSid,
            recording_status: 'recording',
            recording_started_at: new Date().toISOString(),
          })
          .eq('id', streamId);

        if (updateError) {
          console.error('⚠️ [start-live] Error updating recording info:', updateError);
        } else {
          console.log('✅ [start-live] Recording info saved to database');
        }
      } catch (error) {
        recordingError = error instanceof Error ? error.message : 'Unknown recording error';
        console.error('⚠️ [start-live] Cloud recording failed:', recordingError);
        console.error('⚠️ [start-live] Full error:', error);
        
        // Don't fail the stream start if recording fails - just log it
        await supabase
          .from('streams')
          .update({
            recording_status: 'failed',
          })
          .eq('id', streamId);
      }
    } else {
      console.log('⚠️ [start-live] Cloud recording skipped - missing AWS credentials');
      console.log('⚠️ [start-live] Required: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_NAME');
    }

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
        recording: {
          enabled: !!recordingResourceId,
          resource_id: recordingResourceId,
          sid: recordingSid,
          error: recordingError,
        },
      },
      agora: {
        token: token,
        channelName: finalChannelName,
        uid: finalUid,
        appId: AGORA_APP_ID,
      },
    };

    console.log(`✅ [start-live] Stream started successfully with ${moderatorsArray.length} moderators`);
    if (recordingError) {
      console.log('⚠️ [start-live] Note: Recording failed but stream is live');
    }

    // Send push notifications to followers (non-blocking)
    try {
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', user_id)
        .single();

      const creatorName = creatorProfile?.display_name || creatorProfile?.username || 'A creator';

      const { data: followers, error: followersError } = await supabase
        .from('followers')
        .select('follower_id')
        .eq('following_id', user_id);

      if (!followersError && followers && followers.length > 0) {
        console.log(`📢 [start-live] Sending live notifications to ${followers.length} followers`);

        for (const follower of followers) {
          const { data: prefs } = await supabase
            .from('notification_preferences')
            .select('notify_when_followed_goes_live')
            .eq('user_id', follower.follower_id)
            .maybeSingle();

          if (prefs && prefs.notify_when_followed_goes_live === false) {
            continue;
          }

          const { data: tokens } = await supabase
            .from('push_device_tokens')
            .select('device_token, platform')
            .eq('user_id', follower.follower_id)
            .eq('is_active', true);

          if (tokens && tokens.length > 0) {
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
