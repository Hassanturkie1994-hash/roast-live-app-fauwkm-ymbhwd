
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  try {
    const { 
      userId, 
      clubId, 
      creatorId, 
      monthlyPriceCents, 
      currency,
      subscription_type, // 'vip_club' or 'premium'
      price_id,
      success_url,
      cancel_url,
      provider = 'stripe'
    } = await req.json();

    console.log('Creating subscription:', {
      userId,
      clubId,
      creatorId,
      monthlyPriceCents,
      currency,
      subscription_type,
      provider,
    });

    // Validate based on subscription type
    if (subscription_type === 'premium') {
      if (!userId) {
        return new Response(JSON.stringify({ error: 'Missing userId for premium subscription' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else {
      if (!userId || !clubId || !creatorId || !monthlyPriceCents) {
        return new Response(JSON.stringify({ error: 'Missing required fields for VIP club subscription' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Get user email
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user email from auth
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const email = authUser?.user?.email;

    if (!email) {
      return new Response(JSON.stringify({ error: 'User email not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if customer already exists
    let customerId: string;
    const { data: existingMembership } = await supabase
      .from('creator_club_memberships')
      .select('stripe_customer_id')
      .eq('member_id', userId)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .single();

    if (existingMembership?.stripe_customer_id) {
      customerId = existingMembership.stripe_customer_id;
      console.log('Using existing customer:', customerId);
    } else {
      // Create Stripe customer
      const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email,
          'metadata[user_id]': userId,
        }),
      });

      if (!customerResponse.ok) {
        const error = await customerResponse.text();
        console.error('Stripe customer creation error:', error);
        return new Response(JSON.stringify({ error: 'Failed to create customer' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const customer = await customerResponse.json();
      customerId = customer.id;
      console.log('✅ Customer created:', customerId);
    }

    // Determine price ID and metadata based on subscription type
    let priceId: string;
    let metadata: Record<string, string> = { user_id: userId };

    if (subscription_type === 'premium') {
      // For premium, use a fixed price or create one
      if (price_id) {
        priceId = price_id;
      } else {
        // Create price for premium subscription (89 SEK)
        const priceResponse = await fetch('https://api.stripe.com/v1/prices', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            'currency': 'sek',
            'unit_amount': '8900', // 89 SEK
            'recurring[interval]': 'month',
            'product_data[name]': 'PREMIUM Membership',
            'metadata[subscription_type]': 'premium',
          }),
        });

        if (!priceResponse.ok) {
          const error = await priceResponse.text();
          console.error('Stripe price creation error:', error);
          return new Response(JSON.stringify({ error: 'Failed to create price' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const price = await priceResponse.json();
        priceId = price.id;
        console.log('✅ Premium price created:', priceId);
      }
      metadata.subscription_type = 'premium';
    } else {
      // Create price for VIP club subscription
      const priceResponse = await fetch('https://api.stripe.com/v1/prices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'currency': currency.toLowerCase(),
          'unit_amount': monthlyPriceCents.toString(),
          'recurring[interval]': 'month',
          'product_data[name]': 'Creator Club Membership',
          'metadata[club_id]': clubId,
          'metadata[creator_id]': creatorId,
        }),
      });

      if (!priceResponse.ok) {
        const error = await priceResponse.text();
        console.error('Stripe price creation error:', error);
        return new Response(JSON.stringify({ error: 'Failed to create price' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const price = await priceResponse.json();
      priceId = price.id;
      console.log('✅ VIP club price created:', priceId);
      
      metadata.club_id = clubId;
      metadata.creator_id = creatorId;
      metadata.subscription_type = 'vip_club';
    }

    // Create subscription with metadata
    const subscriptionParams = new URLSearchParams({
      customer: customerId,
      'items[0][price]': priceId,
      'payment_behavior': 'default_incomplete',
      'payment_settings[save_default_payment_method]': 'on_subscription',
      'expand[0]': 'latest_invoice.payment_intent',
    });

    // Add metadata
    Object.entries(metadata).forEach(([key, value]) => {
      subscriptionParams.append(`metadata[${key}]`, value);
    });

    const subscriptionResponse = await fetch('https://api.stripe.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: subscriptionParams,
    });

    if (!subscriptionResponse.ok) {
      const error = await subscriptionResponse.text();
      console.error('Stripe subscription creation error:', error);
      return new Response(JSON.stringify({ error: 'Failed to create subscription' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const subscription = await subscriptionResponse.json();
    console.log('✅ Subscription created:', subscription.id);

    // Update database based on subscription type
    const renewsAt = new Date();
    renewsAt.setMonth(renewsAt.getMonth() + 1);

    if (subscription_type === 'premium') {
      // Create premium subscription record
      await supabase.from('premium_subscriptions').insert({
        user_id: userId,
        subscription_provider: provider,
        subscription_id: subscription.id,
        customer_id: customerId,
        price_sek: 89.00,
        status: 'active',
        started_at: new Date().toISOString(),
        renewed_at: renewsAt.toISOString(),
      });

      // Update profile
      await supabase.from('profiles').update({
        premium_active: true,
        premium_since: new Date().toISOString(),
        premium_expiring: renewsAt.toISOString(),
        premium_subscription_provider: provider,
        premium_subscription_id: subscription.id,
      }).eq('id', userId);

      console.log('✅ Premium subscription created in database');
    } else {
      // Update VIP club membership with Stripe IDs
      await supabase
        .from('creator_club_memberships')
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          renews_at: renewsAt.toISOString(),
          is_active: true,
        })
        .eq('club_id', clubId)
        .eq('member_id', userId);

      console.log('✅ VIP club membership updated in database');
    }

    return new Response(
      JSON.stringify({
        subscriptionId: subscription.id,
        customerId: customerId,
        status: subscription.status,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating subscription:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});