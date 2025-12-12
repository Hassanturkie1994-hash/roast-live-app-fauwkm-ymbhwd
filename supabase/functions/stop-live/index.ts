
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const live_input_id = body.live_input_id || body.liveInputId || body.stream_id || body.streamId;

    // Validate required field
    if (!live_input_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing live_input_id parameter. Please provide live_input_id in the request body.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Read Cloudflare credentials from secrets
    const CF_ACCOUNT_ID = Deno.env.get("CF_ACCOUNT_ID") || Deno.env.get("CLOUDFLARE_ACCOUNT_ID");
    const CF_API_TOKEN = Deno.env.get("CF_API_TOKEN") || Deno.env.get("CLOUDFLARE_API_TOKEN");

    if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing Cloudflare credentials. Please configure CF_ACCOUNT_ID (or CLOUDFLARE_ACCOUNT_ID) and CF_API_TOKEN in Supabase Edge Function secrets.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Delete/disable Cloudflare live input
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

    const cloudflareResponse = await deleteInput.json();

    if (!cloudflareResponse.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: cloudflareResponse.errors 
            ? JSON.stringify(cloudflareResponse.errors) 
            : "Failed to delete Cloudflare live input",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: e instanceof Error ? e.message : "Unknown error occurred" 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});