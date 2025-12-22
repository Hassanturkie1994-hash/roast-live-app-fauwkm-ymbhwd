
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { RtcTokenBuilder, RtcRole } from 'npm:agora-access-token@2.0.8';

/**
 * agora-token Edge Function
 * 
 * Generates Agora RTC tokens securely for live streaming
 * 
 * Features:
 * - Generates tokens with 1 hour expiration
 * - Supports both publisher and subscriber roles
 * - Uses Agora App ID and Certificate from environment
 */

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
    console.log('🔑 [agora-token] Function invoked');

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('❌ [agora-token] Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid request body: must be valid JSON",
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

    const { channelName, uid, role } = body;

    console.log('📋 [agora-token] Request payload:', { channelName, uid, role });

    // Validate required fields
    if (!channelName || typeof channelName !== 'string' || !channelName.trim()) {
      console.error('❌ [agora-token] Invalid or missing channelName');
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid or missing channelName: must be a non-empty string",
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

    if (uid === undefined || uid === null || typeof uid !== 'number') {
      console.error('❌ [agora-token] Invalid or missing uid');
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid or missing uid: must be a number",
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

    if (!role || !['publisher', 'subscriber'].includes(role)) {
      console.error('❌ [agora-token] Invalid role');
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid role: must be 'publisher' or 'subscriber'",
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

    // Read Agora credentials from environment
    const AGORA_APP_ID = Deno.env.get("AGORA_APP_ID");
    const AGORA_APP_CERTIFICATE = Deno.env.get("AGORA_APP_CERTIFICATE");

    console.log('🔑 [agora-token] Agora credentials check:', {
      hasAppId: !!AGORA_APP_ID,
      hasAppCertificate: !!AGORA_APP_CERTIFICATE,
    });

    if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
      console.error('❌ [agora-token] Missing Agora credentials');
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error: Missing Agora credentials",
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

    // Set token expiration time to 1 hour (3600 seconds)
    const expirationTimeInSeconds = 3600;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Determine Agora role
    const agoraRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    console.log('🎯 [agora-token] Generating token with:', {
      channelName,
      uid,
      role: agoraRole,
      expiresIn: expirationTimeInSeconds,
    });

    // Generate token using Agora SDK
    const token = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channelName,
      uid,
      agoraRole,
      privilegeExpiredTs
    );

    console.log('✅ [agora-token] Token generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        token: token,
        channelName: channelName,
        uid: uid,
        role: role,
        expiresAt: new Date(privilegeExpiredTs * 1000).toISOString(),
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
    console.error('❌ [agora-token] CRITICAL ERROR');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error:', e);
    console.error('Error message:', e instanceof Error ? e.message : 'Unknown error');
    console.error('Error stack:', e instanceof Error ? e.stack : 'No stack trace');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: e instanceof Error ? e.message : "An unexpected error occurred" 
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
