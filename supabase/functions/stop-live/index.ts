
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

/**
 * stop-live Edge Function - AGORA INTEGRATION
 * 
 * Migrated from Cloudflare Stream to Agora RTC
 * 
 * Features:
 * - Updates stream status in database
 * - No Cloudflare cleanup needed (Agora handles channel lifecycle)
 * - Maintains backward compatibility with existing code
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
    const body = await req.json();
    const stream_id = body.stream_id || body.streamId || body.live_input_id || body.liveInputId;

    console.log('🛑 [stop-live] AGORA called with:', { stream_id, body });

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

    console.log('📊 [stop-live] Updating stream record in database...');

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

    // Note: Agora channels are automatically cleaned up when all users leave
    // No need for manual cleanup like Cloudflare Stream

    console.log('✅ [stop-live] Stream stopped successfully (Agora)');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Stream ended successfully',
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
    console.error('❌ [stop-live] Critical error:', e);
    
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
