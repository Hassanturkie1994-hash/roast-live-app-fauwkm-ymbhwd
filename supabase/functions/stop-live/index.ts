
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * stop-live Edge Function - AGORA INTEGRATION WITH CLOUD RECORDING
 * 
 * Features:
 * - Updates stream status in database
 * - Stops Agora Cloud Recording
 * - Retrieves recording file details and constructs S3 URL
 * - Saves playback_url to database for replay functionality
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🛑 [stop-live] AGORA Edge Function invoked');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const body = await req.json();
    const stream_id = body.stream_id || body.streamId || body.live_input_id || body.liveInputId;

    console.log('🛑 [stop-live] Request payload:', { stream_id, body });

    // Validate required field
    if (!stream_id) {
      console.error('❌ [stop-live] Missing stream_id parameter');
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing stream_id parameter. Please provide stream_id in the request body.",
        }),
        { 
          status: 400, 
          headers: { 
            "Content-Type": "application/json",
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ [stop-live] Missing Supabase credentials');
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing Supabase credentials",
        }),
        { 
          status: 500, 
          headers: { 
            "Content-Type": "application/json",
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('📊 [stop-live] Fetching stream record from database...');

    // Fetch stream record to get recording info
    const { data: streamData, error: fetchError } = await supabase
      .from('streams')
      .select('recording_resource_id, recording_sid, channel_name, agora_channel, agora_uid, recording_status')
      .eq('id', stream_id)
      .single();

    if (fetchError) {
      console.error('⚠️ [stop-live] Error fetching stream record:', fetchError);
    }

    console.log('📊 [stop-live] Stream data:', {
      hasResourceId: !!streamData?.recording_resource_id,
      hasSid: !!streamData?.recording_sid,
      recordingStatus: streamData?.recording_status,
      channelName: streamData?.channel_name || streamData?.agora_channel,
    });

    // Stop Cloud Recording if it was started
    let playbackUrl = null;
    let recordingFiles: any[] = [];

    if (streamData?.recording_resource_id && streamData?.recording_sid && streamData?.recording_status === 'recording') {
      try {
        console.log('📹 [stop-live] Stopping Agora Cloud Recording...');

        const AGORA_APP_ID = Deno.env.get("AGORA_APP_ID");
        const AGORA_CUSTOMER_KEY = Deno.env.get("AGORA_CUSTOMER_KEY");
        const AGORA_CUSTOMER_SECRET = Deno.env.get("AGORA_CUSTOMER_SECRET");
        const AWS_BUCKET_NAME = Deno.env.get("AWS_BUCKET_NAME") || Deno.env.get("AWS_S3_BUCKET") || "roast-live-recordings";
        const AWS_S3_REGION = Deno.env.get("AWS_S3_REGION") || "us-east-1";

        if (!AGORA_APP_ID || !AGORA_CUSTOMER_KEY || !AGORA_CUSTOMER_SECRET) {
          console.error('❌ [stop-live] Missing Agora credentials for stopping recording');
        } else {
          const channelName = streamData.channel_name || streamData.agora_channel;
          const stopEndpoint = `https://api.agora.io/v1/apps/${AGORA_APP_ID}/cloud_recording/resourceid/${streamData.recording_resource_id}/sid/${streamData.recording_sid}/mode/mix/stop`;
          const stopBody = {
            cname: channelName,
            uid: `${streamData.agora_uid || 0}`,
            clientRequest: {},
          };

          console.log('🔄 [stop-live] Calling stop recording endpoint...');
          console.log('🔄 [stop-live] Stop config:', {
            resourceId: streamData.recording_resource_id,
            sid: streamData.recording_sid,
            channelName: channelName,
          });

          const stopResponse = await callAgoraAPI(
            stopEndpoint,
            'POST',
            stopBody,
            AGORA_CUSTOMER_KEY,
            AGORA_CUSTOMER_SECRET
          );

          console.log('✅ [stop-live] Recording stopped successfully');
          console.log('📦 [stop-live] Recording response:', JSON.stringify(stopResponse, null, 2));

          // Construct S3 URL from response
          if (stopResponse.serverResponse?.fileList && stopResponse.serverResponse.fileList.length > 0) {
            recordingFiles = stopResponse.serverResponse.fileList;
            console.log('📦 [stop-live] Found recording files:', recordingFiles.length);

            // Find the M3U8 file (HLS playlist) for playback
            const m3u8File = recordingFiles.find((f: any) => f.fileName.endsWith('.m3u8'));
            
            // If no M3U8, try MP4
            const mp4File = recordingFiles.find((f: any) => f.fileName.endsWith('.mp4'));
            
            const playbackFile = m3u8File || mp4File || recordingFiles[0];
            
            if (playbackFile) {
              // Construct S3 URL
              playbackUrl = `https://${AWS_BUCKET_NAME}.s3.${AWS_S3_REGION}.amazonaws.com/${playbackFile.fileName}`;
              console.log('✅ [stop-live] Playback URL constructed:', playbackUrl);
              console.log('✅ [stop-live] File type:', playbackFile.fileName.split('.').pop());
            } else {
              console.log('⚠️ [stop-live] No suitable playback file found');
            }
          } else {
            console.log('⚠️ [stop-live] No files in recording response');
            console.log('⚠️ [stop-live] Full response:', JSON.stringify(stopResponse, null, 2));
          }

          // Update stream record with recording stopped info
          const { error: updateRecordingError } = await supabase
            .from('streams')
            .update({
              recording_status: 'stopped',
              recording_stopped_at: new Date().toISOString(),
              playback_url: playbackUrl,
            })
            .eq('id', stream_id);

          if (updateRecordingError) {
            console.error('⚠️ [stop-live] Error updating recording info:', updateRecordingError);
          } else {
            console.log('✅ [stop-live] Recording info updated in database');
          }
        }
      } catch (recordingError) {
        console.error('⚠️ [stop-live] Error stopping cloud recording:', recordingError);
        console.error('⚠️ [stop-live] Full error:', recordingError);
        
        // Update status to failed
        await supabase
          .from('streams')
          .update({
            recording_status: 'failed',
          })
          .eq('id', stream_id);
      }
    } else {
      console.log('⚠️ [stop-live] No active recording to stop');
      console.log('⚠️ [stop-live] Reason:', {
        hasResourceId: !!streamData?.recording_resource_id,
        hasSid: !!streamData?.recording_sid,
        status: streamData?.recording_status,
      });
    }

    console.log('📊 [stop-live] Updating stream status to ended...');

    // Update stream record in database
    const { error: updateError } = await supabase
      .from('streams')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
      })
      .eq('id', stream_id);

    if (updateError) {
      console.error('⚠️ [stop-live] Error updating stream record:', updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to update stream in database: ${updateError.message}`,
        }),
        { 
          status: 500, 
          headers: { 
            "Content-Type": "application/json",
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    console.log('✅ [stop-live] Stream record updated successfully in database');
    console.log('✅ [stop-live] Stream stopped successfully (Agora)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Stream ended successfully',
        playback_url: playbackUrl,
        recording_files: recordingFiles.map((f: any) => ({
          fileName: f.fileName,
          trackType: f.trackType,
          uid: f.uid,
          mixedAllUser: f.mixedAllUser,
          isPlayable: f.isPlayable,
          sliceStartTime: f.sliceStartTime,
        })),
      }),
      {
        status: 200,
        headers: { 
          "Content-Type": "application/json",
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (e) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ [stop-live] Critical error:', e);
    console.error('❌ [stop-live] Error message:', e instanceof Error ? e.message : 'Unknown error');
    console.error('❌ [stop-live] Error stack:', e instanceof Error ? e.stack : 'No stack trace');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: e instanceof Error ? e.message : "Unknown error occurred" 
      }),
      { 
        status: 500, 
        headers: { 
          "Content-Type": "application/json",
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  }
});
