
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();
    let notificationsSent = 0;

    // Check for expired admin penalties
    const { data: expiredPenalties } = await supabase
      .from('admin_penalties')
      .select('id, user_id')
      .eq('is_active', true)
      .not('expires_at', 'is', null)
      .lte('expires_at', now);

    if (expiredPenalties && expiredPenalties.length > 0) {
      console.log(`Found ${expiredPenalties.length} expired penalties`);

      for (const penalty of expiredPenalties) {
        // Deactivate the penalty
        await supabase
          .from('admin_penalties')
          .update({ is_active: false })
          .eq('id', penalty.id);

        // Get user's active device tokens
        const { data: tokens } = await supabase
          .from('push_device_tokens')
          .select('device_token, platform')
          .eq('user_id', penalty.user_id)
          .eq('is_active', true);

        if (tokens && tokens.length > 0) {
          // Send push notification via send-push-notification function
          await supabase.functions.invoke('send-push-notification', {
            body: {
              userId: penalty.user_id,
              tokens: tokens.map(t => ({ token: t.device_token, platform: t.platform })),
              notification: {
                title: 'Your restriction has ended',
                body: 'You can now interact again. Please follow the community rules.',
                data: { penalty_id: penalty.id },
              },
            },
          });

          // Log the push notification
          await supabase.from('push_notifications_log').insert({
            user_id: penalty.user_id,
            type: 'BAN_EXPIRED',
            title: 'Your restriction has ended',
            body: 'You can now interact again. Please follow the community rules.',
            payload_json: { penalty_id: penalty.id },
            delivery_status: 'sent',
          });

          notificationsSent++;
        }

        // Create in-app notification
        await supabase.from('notifications').insert({
          type: 'ban_lifted',
          receiver_id: penalty.user_id,
          message: 'Your restriction has ended\n\nYou can now interact again. Please follow the community rules.',
          category: 'safety',
          read: false,
        });

        console.log(`✅ Notified user ${penalty.user_id} about expired ban`);
      }
    }

    // Check for expired AI strikes (level 3 - 24 hour bans)
    const { data: expiredStrikes } = await supabase
      .from('ai_strikes')
      .select('id, user_id, creator_id')
      .eq('strike_level', 3)
      .not('expires_at', 'is', null)
      .lte('expires_at', now);

    if (expiredStrikes && expiredStrikes.length > 0) {
      console.log(`Found ${expiredStrikes.length} expired AI strikes`);

      for (const strike of expiredStrikes) {
        // Get user's active device tokens
        const { data: tokens } = await supabase
          .from('push_device_tokens')
          .select('device_token, platform')
          .eq('user_id', strike.user_id)
          .eq('is_active', true);

        if (tokens && tokens.length > 0) {
          // Send push notification
          await supabase.functions.invoke('send-push-notification', {
            body: {
              userId: strike.user_id,
              tokens: tokens.map(t => ({ token: t.device_token, platform: t.platform })),
              notification: {
                title: 'Your stream ban has ended',
                body: 'You can now join this creator\'s streams again. Please follow the community rules.',
                data: { strike_id: strike.id, creator_id: strike.creator_id },
              },
            },
          });

          // Log the push notification
          await supabase.from('push_notifications_log').insert({
            user_id: strike.user_id,
            type: 'BAN_EXPIRED',
            title: 'Your stream ban has ended',
            body: 'You can now join this creator\'s streams again. Please follow the community rules.',
            payload_json: { strike_id: strike.id, creator_id: strike.creator_id },
            delivery_status: 'sent',
          });

          notificationsSent++;
        }

        // Create in-app notification
        await supabase.from('notifications').insert({
          type: 'ban_lifted',
          receiver_id: strike.user_id,
          message: 'Your stream ban has ended\n\nYou can now join this creator\'s streams again. Please follow the community rules.',
          category: 'safety',
          read: false,
        });

        console.log(`✅ Notified user ${strike.user_id} about expired strike`);
      }
    }

    // Clean up expired timeouts (no notifications needed)
    const { data: expiredTimeouts } = await supabase
      .from('timed_out_users_v2')
      .select('id')
      .lte('end_time', now);

    if (expiredTimeouts && expiredTimeouts.length > 0) {
      await supabase
        .from('timed_out_users_v2')
        .delete()
        .lte('end_time', now);

      console.log(`✅ Cleaned up ${expiredTimeouts.length} expired timeouts`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        expiredPenalties: expiredPenalties?.length || 0,
        expiredStrikes: expiredStrikes?.length || 0,
        expiredTimeouts: expiredTimeouts?.length || 0,
        notificationsSent,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-ban-expirations function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});