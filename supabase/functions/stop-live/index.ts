
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials');
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

    console.log('📊 Updating stream record in database...');

    // Update stream record in database - try both live_input_id and id
    const { error: updateError } = await supabase
      .from('streams')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
      })
      .or(`live_input_id.eq.${live_input_id},id.eq.${live_input_id}`);

    if (updateError) {
      console.error('⚠️ Error updating stream record:', updateError);
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

    console.log('✅ Stream record updated successfully in database');

    // Read Cloudflare credentials from secrets
    const CF_ACCOUNT_ID = Deno.env.get("CF_ACCOUNT_ID") || Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    const CF_API_TOKEN = Deno.env.get("CF_API_TOKEN") || Deno.env.get("CLOUDFLARE_API_TOKEN");

    console.log('🔑 Cloudflare credentials check:', {
      hasAccountId: !!CF_ACCOUNT_ID,
      hasApiToken: !!CF_API_TOKEN,
    });

    // If Cloudflare credentials are missing, return success anyway
    // The database update is what matters most
    if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
      console.warn('⚠️ Missing Cloudflare credentials - skipping Cloudflare cleanup');
      return new Response(
        JSON.stringify({
          success: true,
          warning: 'Stream ended in database but Cloudflare cleanup was skipped (missing credentials)',
        }),
        { 
          status: 200, 
          headers: { 
            "Content-Type": "application/json",
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    console.log('☁️ Attempting to stop Cloudflare live input...');

    // Try to stop the Cloudflare live input
    try {
      // First try PATCH to disable recording
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

      console.log('☁️ Cloudflare PATCH response:', {
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
          console.warn('⚠️ Both PATCH and DELETE failed - but database was updated successfully');
          
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

      console.log('✅ Stream stopped successfully (database + Cloudflare)');

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
    } catch (cloudflareError) {
      console.error('❌ Cloudflare API error:', cloudflareError);
      console.log('✅ Database was updated successfully despite Cloudflare error');
      
      return new Response(
        JSON.stringify({
          success: true,
          warning: 'Stream ended in database but Cloudflare cleanup failed',
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
  } catch (e) {
    console.error('❌ Critical error in stop-live:', e);
    
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
