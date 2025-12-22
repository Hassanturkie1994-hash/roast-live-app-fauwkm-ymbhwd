
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * generate-call-token Edge Function
 * 
 * Generates a session token for a user to join a Cloudflare Calls session.
 * This token is used to authenticate the user in the WebRTC session.
 * 
 * NOTE: This is a placeholder implementation. In production, you would:
 * 1. Use Cloudflare Calls API to generate a proper JWT token
 * 2. Include user permissions and session metadata
 * 3. Set appropriate expiration time
 * 
 * For now, we'll generate a simple token.
 */

Deno.serve(async (req) => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎫 [generate-call-token] Edge Function invoked');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('❌ [generate-call-token] Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid request body: must be valid JSON",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { sessionId, userId, role } = body;

    console.log('📋 [generate-call-token] Request payload:', { sessionId, userId, role });

    // Validate required fields
    if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
      console.error('❌ [generate-call-token] Invalid or missing sessionId');
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid or missing sessionId: must be a non-empty string",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!userId || typeof userId !== 'string' || !userId.trim()) {
      console.error('❌ [generate-call-token] Invalid or missing userId');
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid or missing userId: must be a non-empty string",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!role || (role !== 'host' && role !== 'guest')) {
      console.error('❌ [generate-call-token] Invalid role');
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid role: must be 'host' or 'guest'",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ [generate-call-token] Missing Supabase credentials');
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error: Missing Supabase credentials",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('❌ [generate-call-token] User not found:', profileError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "User not found",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // TODO: In production, call Cloudflare Calls API here to generate JWT token
    // const CF_CALLS_APP_ID = Deno.env.get("CF_CALLS_APP_ID");
    // const CF_CALLS_APP_SECRET = Deno.env.get("CF_CALLS_APP_SECRET");
    
    // For now, generate a simple token
    const token = `token-${sessionId}-${userId}-${role}-${Date.now()}`;

    console.log('✅ [generate-call-token] Token generated successfully');

    // Build response
    const response = {
      success: true,
      token: token,
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
    };

    console.log('✅ [generate-call-token] Returning success response');

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ [generate-call-token] CRITICAL ERROR');
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
