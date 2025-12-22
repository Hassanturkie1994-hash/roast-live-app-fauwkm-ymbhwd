
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * create-call-session Edge Function
 * 
 * Creates a Cloudflare Calls session for WebRTC co-hosting.
 * This session is used for real-time audio/video communication between host and guests.
 * 
 * NOTE: This is a placeholder implementation. In production, you would:
 * 1. Use Cloudflare Calls API to create a session
 * 2. Store session credentials in environment variables
 * 3. Return session ID and connection details
 * 
 * For now, we'll create a simple session record in the database.
 */

Deno.serve(async (req) => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📞 [create-call-session] Edge Function invoked');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('❌ [create-call-session] Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid request body: must be valid JSON",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { streamId } = body;

    console.log('📋 [create-call-session] Request payload:', { streamId });

    // Validate required fields
    if (!streamId || typeof streamId !== 'string' || !streamId.trim()) {
      console.error('❌ [create-call-session] Invalid or missing streamId');
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid or missing streamId: must be a non-empty string",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ [create-call-session] Missing Supabase credentials');
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error: Missing Supabase credentials",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify stream exists
    const { data: stream, error: streamError } = await supabase
      .from('streams')
      .select('id, broadcaster_id, status')
      .eq('id', streamId)
      .single();

    if (streamError || !stream) {
      console.error('❌ [create-call-session] Stream not found:', streamError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Stream not found",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (stream.status !== 'live') {
      console.error('❌ [create-call-session] Stream is not live');
      return new Response(
        JSON.stringify({
          success: false,
          error: "Stream is not live",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // TODO: In production, call Cloudflare Calls API here
    // const CF_CALLS_APP_ID = Deno.env.get("CF_CALLS_APP_ID");
    // const CF_CALLS_APP_SECRET = Deno.env.get("CF_CALLS_APP_SECRET");
    
    // For now, create a simple session ID
    const sessionId = `call-${streamId}-${Date.now()}`;

    console.log('✅ [create-call-session] Call session created:', sessionId);

    // Build response
    const response = {
      success: true,
      session: {
        sessionId: sessionId,
        sessionDescription: 'WebRTC session for co-hosting',
        tracks: [],
      },
    };

    console.log('✅ [create-call-session] Returning success response');

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ [create-call-session] CRITICAL ERROR');
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
