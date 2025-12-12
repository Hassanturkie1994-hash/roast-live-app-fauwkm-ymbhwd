
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { user_ids, title, body, data } = await req.json();

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0 || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_ids (array), title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get push tokens for users
    const { data: pushTokens, error: tokenError } = await supabaseClient
      .from('push_tokens')
      .select('user_id, token')
      .in('user_id', user_ids);

    if (tokenError) {
      console.error('Error fetching push tokens:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pushTokens || pushTokens.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No push tokens found for users', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send push notifications using Expo Push Notification service
    const messages = pushTokens.map(({ token }) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data: data || {},
    }));

    const expoPushUrl = 'https://exp.host/--/api/v2/push/send';
    const responses = [];

    // Send in batches of 100 (Expo's limit)
    for (let i = 0; i < messages.length; i += 100) {
      const batch = messages.slice(i, i + 100);
      
      const response = await fetch(expoPushUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      });

      const result = await response.json();
      responses.push(result);
    }

    console.log(`Sent ${messages.length} push notifications`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent ${messages.length} push notifications`,
        sent: messages.length,
        responses 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-push-notification function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
