
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

    const now = new Date().toISOString();

    // Find all expired stories
    const { data: expiredStories, error: fetchError } = await supabaseClient
      .from('stories')
      .select('id, media_url')
      .lt('expires_at', now);

    if (fetchError) {
      console.error('Error fetching expired stories:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch expired stories' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!expiredStories || expiredStories.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No expired stories found', count: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete media files from storage
    for (const story of expiredStories) {
      if (story.media_url) {
        try {
          const urlParts = story.media_url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const bucket = 'stories';
          
          await supabaseClient.storage
            .from(bucket)
            .remove([fileName]);
        } catch (storageError) {
          console.error(`Error deleting media for story ${story.id}:`, storageError);
        }
      }
    }

    // Delete expired stories from database
    const { error: deleteError } = await supabaseClient
      .from('stories')
      .delete()
      .in('id', expiredStories.map(story => story.id));

    if (deleteError) {
      console.error('Error deleting expired stories:', deleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete expired stories' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Cleaned up ${expiredStories.length} expired stories`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Cleaned up ${expiredStories.length} expired stories`,
        count: expiredStories.length 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in cleanup-expired-stories function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
