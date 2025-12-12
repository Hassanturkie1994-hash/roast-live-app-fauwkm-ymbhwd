
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '';

serve(async (req) => {
  try {
    const { subscriptionId, immediate } = await req.json();

    console.log('Canceling subscription:', { subscriptionId, immediate });

    if (!subscriptionId) {
      return new Response(JSON.stringify({ error: 'Missing subscription ID' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Cancel subscription
    const endpoint = immediate
      ? `https://api.stripe.com/v1/subscriptions/${subscriptionId}`
      : `https://api.stripe.com/v1/subscriptions/${subscriptionId}`;

    const body = immediate
      ? new URLSearchParams({})
      : new URLSearchParams({
          'cancel_at_period_end': 'true',
        });

    const response = await fetch(endpoint, {
      method: immediate ? 'DELETE' : 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: immediate ? undefined : body,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Stripe API error:', error);
      return new Response(JSON.stringify({ error: 'Failed to cancel subscription' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const subscription = await response.json();

    console.log('✅ Subscription canceled:', subscription.id);

    return new Response(
      JSON.stringify({
        success: true,
        status: subscription.status,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});