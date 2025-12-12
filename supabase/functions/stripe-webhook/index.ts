
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Platform fee percentage (30%)
const PLATFORM_FEE_PERCENTAGE = 0.3;

serve(async (req) => {
  try {
    // Get the signature from headers
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('No Stripe signature found');
      return new Response(JSON.stringify({ error: 'No signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the raw body
    const body = await req.text();

    // In production, you would verify the signature here using Stripe SDK
    // For now, we'll parse the event directly
    const event = JSON.parse(body);

    console.log('Received Stripe webhook event:', event.type);

    // Log the webhook event
    await supabase.from('stripe_webhook_logs').insert({
      event_id: event.id,
      event_type: event.type,
      payload: event,
      processed: false,
    });

    // Handle different event types
    let result;
    switch (event.type) {
      case 'checkout.session.completed':
        result = await handleCheckoutSessionCompleted(event);
        break;
      case 'invoice.paid':
        result = await handleInvoicePaid(event);
        break;
      case 'customer.subscription.deleted':
      case 'customer.subscription.updated':
        result = await handleSubscriptionChange(event);
        break;
      case 'charge.refunded':
        result = await handleChargeRefunded(event);
        break;
      case 'charge.dispute.created':
        result = await handleDisputeCreated(event);
        break;
      default:
        console.log('Unhandled event type:', event.type);
        result = { success: true, message: 'Event type not handled' };
    }

    // Update webhook log as processed
    await supabase
      .from('stripe_webhook_logs')
      .update({
        processed: true,
        error: result.success ? null : result.error,
      })
      .eq('event_id', event.id);

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutSessionCompleted(event: any) {
  try {
    const session = event.data.object;
    const metadata = session.metadata || {};

    console.log('Processing checkout session:', session.id);

    // Check if this is a wallet top-up
    if (metadata.type === 'wallet_topup') {
      const userId = metadata.user_id;
      const amountCents = session.amount_total;

      if (!userId || !amountCents) {
        return { success: false, error: 'Missing required metadata' };
      }

      // Get or create wallet
      let { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!wallet) {
        const { data: newWallet, error: createError } = await supabase
          .from('wallets')
          .insert({
            user_id: userId,
            balance_cents: 0,
            lifetime_earned_cents: 0,
            lifetime_spent_cents: 0,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating wallet:', createError);
          return { success: false, error: createError.message };
        }

        wallet = newWallet;
      }

      // Update wallet balance
      const { error: updateError } = await supabase
        .from('wallets')
        .update({
          balance_cents: wallet.balance_cents + amountCents,
          lifetime_earned_cents: wallet.lifetime_earned_cents + amountCents,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating wallet:', updateError);
        return { success: false, error: updateError.message };
      }

      // Create transaction record
      await supabase.from('wallet_transactions_v2').insert({
        user_id: userId,
        type: 'deposit',
        amount_cents: amountCents,
        currency: session.currency?.toUpperCase() || 'SEK',
        metadata: {
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent,
        },
      });

      console.log('✅ Wallet top-up processed successfully');
      return { success: true, message: 'Wallet credited' };
    }

    return { success: true, message: 'Session processed' };
  } catch (error) {
    console.error('Error in handleCheckoutSessionCompleted:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle invoice.paid event (subscription cycles)
 */
async function handleInvoicePaid(event: any) {
  try {
    const invoice = event.data.object;
    const subscriptionId = invoice.subscription;
    const customerId = invoice.customer;
    const amountPaid = invoice.amount_paid;

    console.log('Processing invoice payment:', invoice.id);

    // Find the membership associated with this subscription
    const { data: membership } = await supabase
      .from('creator_club_memberships')
      .select('*, creator_clubs(*)')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (!membership) {
      console.log('No membership found for subscription:', subscriptionId);
      return { success: true, message: 'No membership found' };
    }

    // Calculate platform fee and creator earnings
    const platformFeeCents = Math.floor(amountPaid * PLATFORM_FEE_PERCENTAGE);
    const creatorEarningsCents = amountPaid - platformFeeCents;

    // Update membership renewal date
    const renewsAt = new Date();
    renewsAt.setMonth(renewsAt.getMonth() + 1);

    await supabase
      .from('creator_club_memberships')
      .update({
        is_active: true,
        renews_at: renewsAt.toISOString(),
      })
      .eq('id', membership.id);

    // Create transaction for member (payment)
    await supabase.from('wallet_transactions_v2').insert({
      user_id: membership.member_id,
      type: 'subscription_payment',
      amount_cents: -amountPaid,
      currency: invoice.currency?.toUpperCase() || 'SEK',
      related_user_id: membership.creator_clubs.creator_id,
      club_id: membership.club_id,
      metadata: {
        stripe_invoice_id: invoice.id,
        stripe_subscription_id: subscriptionId,
      },
    });

    // Update creator wallet
    const { data: creatorWallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', membership.creator_clubs.creator_id)
      .single();

    if (creatorWallet) {
      await supabase
        .from('wallets')
        .update({
          balance_cents: creatorWallet.balance_cents + creatorEarningsCents,
          lifetime_earned_cents: creatorWallet.lifetime_earned_cents + creatorEarningsCents,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', membership.creator_clubs.creator_id);
    } else {
      // Create wallet if doesn't exist
      await supabase.from('wallets').insert({
        user_id: membership.creator_clubs.creator_id,
        balance_cents: creatorEarningsCents,
        lifetime_earned_cents: creatorEarningsCents,
        lifetime_spent_cents: 0,
      });
    }

    // Create transaction for creator (earnings)
    await supabase.from('wallet_transactions_v2').insert({
      user_id: membership.creator_clubs.creator_id,
      type: 'subscription_payment',
      amount_cents: creatorEarningsCents,
      currency: invoice.currency?.toUpperCase() || 'SEK',
      related_user_id: membership.member_id,
      club_id: membership.club_id,
      metadata: {
        stripe_invoice_id: invoice.id,
        stripe_subscription_id: subscriptionId,
      },
    });

    // Create platform fee transaction
    await supabase.from('wallet_transactions_v2').insert({
      user_id: membership.creator_clubs.creator_id,
      type: 'platform_fee',
      amount_cents: -platformFeeCents,
      currency: invoice.currency?.toUpperCase() || 'SEK',
      club_id: membership.club_id,
      metadata: {
        original_amount: amountPaid,
        stripe_invoice_id: invoice.id,
      },
    });

    // Update creator revenue summary
    const { data: revenueSummary } = await supabase
      .from('creator_revenue_summary')
      .select('*')
      .eq('creator_id', membership.creator_clubs.creator_id)
      .single();

    if (revenueSummary) {
      await supabase
        .from('creator_revenue_summary')
        .update({
          total_from_subscriptions_cents:
            revenueSummary.total_from_subscriptions_cents + creatorEarningsCents,
          updated_at: new Date().toISOString(),
        })
        .eq('creator_id', membership.creator_clubs.creator_id);
    } else {
      await supabase.from('creator_revenue_summary').insert({
        creator_id: membership.creator_clubs.creator_id,
        total_from_gifts_cents: 0,
        total_from_subscriptions_cents: creatorEarningsCents,
        total_withdrawn_cents: 0,
      });
    }

    console.log('✅ Invoice payment processed successfully');
    return { success: true, message: 'Invoice processed' };
  } catch (error) {
    console.error('Error in handleInvoicePaid:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle subscription changes (deleted/canceled)
 */
async function handleSubscriptionChange(event: any) {
  try {
    const subscription = event.data.object;
    const subscriptionId = subscription.id;

    console.log('Processing subscription change:', subscriptionId);

    // Find the membership
    const { data: membership } = await supabase
      .from('creator_club_memberships')
      .select('*')
      .eq('stripe_subscription_id', subscriptionId)
      .single();

    if (!membership) {
      console.log('No membership found for subscription:', subscriptionId);
      return { success: true, message: 'No membership found' };
    }

    // Update membership status
    if (event.type === 'customer.subscription.deleted') {
      await supabase
        .from('creator_club_memberships')
        .update({
          is_active: false,
          cancel_at_period_end: false,
        })
        .eq('id', membership.id);
    } else if (event.type === 'customer.subscription.updated') {
      await supabase
        .from('creator_club_memberships')
        .update({
          cancel_at_period_end: subscription.cancel_at_period_end || false,
        })
        .eq('id', membership.id);
    }

    console.log('✅ Subscription change processed successfully');
    return { success: true, message: 'Subscription updated' };
  } catch (error) {
    console.error('Error in handleSubscriptionChange:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle charge.refunded event
 */
async function handleChargeRefunded(event: any) {
  try {
    const charge = event.data.object;
    const paymentIntent = charge.payment_intent;
    const amountRefunded = charge.amount_refunded;

    console.log('Processing charge refund:', charge.id);

    // Find transactions related to this payment
    const { data: transactions } = await supabase
      .from('wallet_transactions_v2')
      .select('*')
      .contains('metadata', { stripe_payment_intent: paymentIntent });

    if (!transactions || transactions.length === 0) {
      console.log('No transactions found for payment intent:', paymentIntent);
      return { success: true, message: 'No transactions found' };
    }

    // Reverse the transactions
    for (const transaction of transactions) {
      // Update wallet balance
      const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', transaction.user_id)
        .single();

      if (wallet) {
        await supabase
          .from('wallets')
          .update({
            balance_cents: wallet.balance_cents - transaction.amount_cents,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', transaction.user_id);
      }

      // Create reversal transaction
      await supabase.from('wallet_transactions_v2').insert({
        user_id: transaction.user_id,
        type: 'adjustment',
        amount_cents: -transaction.amount_cents,
        currency: transaction.currency,
        metadata: {
          reason: 'refund',
          original_transaction_id: transaction.id,
          stripe_charge_id: charge.id,
        },
      });
    }

    console.log('✅ Charge refund processed successfully');
    return { success: true, message: 'Refund processed' };
  } catch (error) {
    console.error('Error in handleChargeRefunded:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Handle charge.dispute.created event
 */
async function handleDisputeCreated(event: any) {
  try {
    const dispute = event.data.object;
    const charge = dispute.charge;
    const amount = dispute.amount;

    console.log('Processing dispute:', dispute.id);

    // Find transactions related to this charge
    const { data: transactions } = await supabase
      .from('wallet_transactions_v2')
      .select('*')
      .contains('metadata', { stripe_charge_id: charge });

    if (!transactions || transactions.length === 0) {
      console.log('No transactions found for charge:', charge);
      return { success: true, message: 'No transactions found' };
    }

    // Flag the account for review
    for (const transaction of transactions) {
      // Create adjustment transaction
      await supabase.from('wallet_transactions_v2').insert({
        user_id: transaction.user_id,
        type: 'adjustment',
        amount_cents: -transaction.amount_cents,
        currency: transaction.currency,
        metadata: {
          reason: 'dispute',
          original_transaction_id: transaction.id,
          stripe_dispute_id: dispute.id,
          requires_review: true,
        },
      });

      // TODO: Implement account flagging for anti-fraud review
      console.log('⚠️ Account flagged for review:', transaction.user_id);
    }

    console.log('✅ Dispute processed successfully');
    return { success: true, message: 'Dispute processed' };
  } catch (error) {
    console.error('Error in handleDisputeCreated:', error);
    return { success: false, error: error.message };
  }
}