
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

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
    const live_input_id = body.live_input_id || body.liveInputId || body.stream_id || body.streamId;

    console.log('🛑 stop-live called with:', { live_input_id, body });

    // Validate required field
    if (!live_input_id) {
      console.error('❌ Missing live_input_id parameter');
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing live_input_id parameter. Please provide live_input_id in the request body.",
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

    // Read Cloudflare credentials from secrets
    const CF_ACCOUNT_ID = Deno.env.get("CF_ACCOUNT_ID") || Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    const CF_API_TOKEN = Deno.env.get("CF_API_TOKEN") || Deno.env.get("CLOUDFLARE_API_TOKEN");

    console.log('🔑 Cloudflare credentials check:', {
      hasAccountId: !!CF_ACCOUNT_ID,
      hasApiToken: !!CF_API_TOKEN,
    });

    if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
      console.error('❌ Missing Cloudflare credentials');
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing Cloudflare credentials. Please configure CF_ACCOUNT_ID (or CLOUDFLARE_ACCOUNT_ID) and CF_API_TOKEN in Supabase Edge Function secrets.",
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('📊 Updating stream record in database...');

    // Update stream record in database
    const { error: updateError } = await supabase
      .from('streams')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
      })
      .eq('live_input_id', live_input_id);

    if (updateError) {
      console.error('⚠️ Error updating stream record:', updateError);
      // Continue anyway - we still want to stop the Cloudflare stream
    } else {
      console.log('✅ Stream record updated successfully');
    }

    console.log('☁️ Stopping Cloudflare live input...');

    // Stop the Cloudflare live input by disabling it
    // Note: We're using PATCH to update the live input to disabled state
    // instead of DELETE which may cause issues
    const stopInput = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/live_inputs/${live_input_id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recording: {
            mode: "off"
          }
        }),
      }
    );

    const cloudflareResponse = await stopInput.json();

    console.log('☁️ Cloudflare response:', {
      status: stopInput.status,
      success: cloudflareResponse.success,
      errors: cloudflareResponse.errors,
    });

    // If PATCH fails, try DELETE as fallback
    if (!cloudflareResponse.success) {
      console.log('⚠️ PATCH failed, trying DELETE as fallback...');
      
      const deleteInput = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/stream/live_inputs/${live_input_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${CF_API_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      const deleteResponse = await deleteInput.json();

      console.log('☁️ Cloudflare DELETE response:', {
        status: deleteInput.status,
        success: deleteResponse.success,
        errors: deleteResponse.errors,
      });

      if (!deleteResponse.success) {
        console.error('❌ Both PATCH and DELETE failed');
        
        // Even if Cloudflare fails, we've updated the database
        // So we return success to prevent client-side errors
        return new Response(
          JSON.stringify({
            success: true,
            warning: 'Stream ended in database but Cloudflare cleanup may have failed',
          }),
          {
            status: 200,
            headers: { 
              "Content-Type": "application/json",
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    }

    console.log('✅ Stream stopped successfully');

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
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
    console.error('❌ Error in stop-live:', e);
    
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
