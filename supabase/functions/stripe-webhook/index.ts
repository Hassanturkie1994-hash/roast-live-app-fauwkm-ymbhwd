
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
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

    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!signature || !webhookSecret) {
      return new Response(
        JSON.stringify({ error: 'Missing signature or webhook secret' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.text();
    
    // In production, verify the webhook signature here
    // For now, we'll parse the event directly
    const event = JSON.parse(body);

    console.log('Received Stripe webhook event:', event.type);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        
        await supabaseClient
          .from('subscriptions')
          .upsert({
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer,
            status: subscription.status,
            price_id: subscription.items.data[0].price.id,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }, {
            onConflict: 'stripe_subscription_id',
          });

        // Update user premium status
        const { data: subData } = await supabaseClient
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (subData?.user_id) {
          await supabaseClient
            .from('users')
            .update({ is_premium: subscription.status === 'active' })
            .eq('id', subData.user_id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        await supabaseClient
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        // Update user premium status
        const { data: subData } = await supabaseClient
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (subData?.user_id) {
          await supabaseClient
            .from('users')
            .update({ is_premium: false })
            .eq('id', subData.user_id);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log('Payment succeeded for invoice:', invoice.id);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('Payment failed for invoice:', invoice.id);
        
        // Notify user about failed payment
        const { data: subData } = await supabaseClient
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', invoice.customer)
          .single();

        if (subData?.user_id) {
          await supabaseClient.from('notifications').insert({
            user_id: subData.user_id,
            type: 'system',
            title: 'Payment Failed',
            body: 'Your subscription payment failed. Please update your payment method.',
            is_read: false,
          });
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in stripe-webhook function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
