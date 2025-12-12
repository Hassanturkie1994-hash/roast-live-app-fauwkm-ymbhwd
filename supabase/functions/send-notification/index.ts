
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const { user_id, type, title, body, data } = await req.json();

    // Validate required fields
    if (!user_id || !type || !title || !body) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: user_id, type, title, and body are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check notification preferences
    const { data: preferences, error: prefError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (prefError && prefError.code !== 'PGRST116') {
      console.error('Error fetching preferences:', prefError);
    }

    // If preferences exist and this type is disabled, skip
    if (preferences && !preferences[type]) {
      console.log(`Notification type ${type} is disabled for user ${user_id}`);
      return new Response(
        JSON.stringify({ success: true, message: 'Notification disabled by user' }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get user's push tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('push_notification_tokens')
      .select('*')
      .eq('user_id', user_id);

    if (tokensError || !tokens || tokens.length === 0) {
      console.log(`No push tokens found for user ${user_id}`);
      return new Response(
        JSON.stringify({ success: true, message: 'No push tokens registered' }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // In a real implementation, you would send push notifications here
    // via FCM (Firebase Cloud Messaging) for Android/Web
    // and APNS (Apple Push Notification Service) for iOS
    
    // For now, we'll just log and create a notification record
    console.log(`📲 Would send notification to ${tokens.length} devices:`, {
      type,
      title,
      body,
      data,
    });

    // Create notification record in database
    const { error: notifError } = await supabase.from('notifications').insert({
      type,
      sender_id: data?.sender_id || null,
      receiver_id: user_id,
      message: body,
      ref_stream_id: data?.stream_id || null,
      ref_post_id: data?.post_id || null,
      ref_story_id: data?.story_id || null,
    });

    if (notifError) {
      console.error('Error creating notification record:', notifError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notification sent to ${tokens.length} devices`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error('Error in send-notification function:', e);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: e instanceof Error ? e.message : "Unknown error occurred" 
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});