
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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { subscription_id } = await req.json();

    if (!subscription_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: subscription_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cancel subscription with Stripe
    const cancelResponse = await fetch(
      `https://api.stripe.com/v1/subscriptions/${subscription_id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (!cancelResponse.ok) {
      const error = await cancelResponse.json();
      console.error('Stripe error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to cancel subscription with Stripe' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const canceledSubscription = await cancelResponse.json();

    // Update subscription status in database
    await supabaseClient
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription_id)
      .eq('user_id', user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: canceledSubscription,
        message: 'Subscription canceled successfully' 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in stripe-cancel-subscription function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
