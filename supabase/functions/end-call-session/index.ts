
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * end-call-session Edge Function
 * 
 * Ends a Cloudflare Calls session when the stream ends.
 * This disconnects all WebRTC peer connections.
 * 
 * NOTE: This is a placeholder implementation. In production, you would:
 * 1. Use Cloudflare Calls API to terminate the session
 * 2. Notify all participants
 * 3. Clean up resources
 */

Deno.serve(async (req) => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🛑 [end-call-session] Edge Function invoked');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('❌ [end-call-session] Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid request body: must be valid JSON",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { sessionId } = body;

    console.log('📋 [end-call-session] Request payload:', { sessionId });

    // Validate required fields
    if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
      console.error('❌ [end-call-session] Invalid or missing sessionId');
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid or missing sessionId: must be a non-empty string",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // TODO: In production, call Cloudflare Calls API here to end the session
    // const CF_CALLS_APP_ID = Deno.env.get("CF_CALLS_APP_ID");
    // const CF_CALLS_APP_SECRET = Deno.env.get("CF_CALLS_APP_SECRET");

    console.log('✅ [end-call-session] Call session ended successfully');

    // Build response
    const response = {
      success: true,
      message: 'Call session ended successfully',
    };

    console.log('✅ [end-call-session] Returning success response');

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ [end-call-session] CRITICAL ERROR');
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
