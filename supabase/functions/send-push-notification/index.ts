
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-user-id',
};

interface PushNotificationRequest {
  userId: string;
  tokens: { token: string; platform: 'ios' | 'android' | 'web' }[];
  notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, tokens, notification }: PushNotificationRequest = await req.json();

    if (!userId || !tokens || tokens.length === 0 || !notification) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, tokens, notification' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate notification structure
    if (!notification.title || !notification.body) {
      return new Response(
        JSON.stringify({ error: 'Notification must have title and body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get FCM server key from environment
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
    
    if (!fcmServerKey) {
      console.error('FCM_SERVER_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Push notification service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    // Send push notifications to each device
    for (const { token, platform } of tokens) {
      try {
        if (platform === 'ios' || platform === 'android') {
          // Send via FCM (works for both iOS and Android)
          const fcmPayload = {
            to: token,
            notification: {
              title: notification.title,
              body: notification.body,
              sound: 'default',
              badge: '1',
              priority: 'high',
            },
            data: notification.data || {},
            priority: 'high',
            content_available: true,
          };

          const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `key=${fcmServerKey}`,
            },
            body: JSON.stringify(fcmPayload),
          });

          const fcmResult = await fcmResponse.json();
          
          if (fcmResponse.ok && fcmResult.success === 1) {
            results.push({ token, platform, status: 'sent' });
            console.log(`✅ Push notification sent to ${platform} device`);
          } else {
            results.push({ token, platform, status: 'failed', error: fcmResult });
            console.error(`❌ Failed to send push notification to ${platform} device:`, fcmResult);
            
            // If token is invalid, deactivate it
            const errorCode = fcmResult.results?.[0]?.error;
            if (errorCode === 'InvalidRegistration' || 
                errorCode === 'NotRegistered' ||
                errorCode === 'MismatchSenderId') {
              await supabase
                .from('push_device_tokens')
                .update({ is_active: false })
                .eq('device_token', token);
              console.log(`🗑️ Deactivated invalid token for ${platform} device (error: ${errorCode})`);
            }
          }
        } else if (platform === 'web') {
          // For web push notifications, you would use Web Push API
          // This is a placeholder - implement based on your web push setup
          console.log('Web push notifications not yet implemented');
          results.push({ token, platform, status: 'skipped', reason: 'Web push not implemented' });
        }
      } catch (error) {
        console.error(`Error sending push notification to ${platform} device:`, error);
        results.push({ token, platform, status: 'failed', error: error.message });
      }
    }

    const successCount = results.filter(r => r.status === 'sent').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    console.log(`📊 Push notification summary: ${successCount} sent, ${failedCount} failed out of ${tokens.length} total`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failedCount,
        total: tokens.length,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-push-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});