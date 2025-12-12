
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
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current week start (Sunday)
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day;
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const weekStartDate = weekStart;
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 7);

    console.log('📊 Calculating leaderboards for week:', weekStartStr);

    // Calculate Top Creators
    await calculateTopCreators(supabaseClient, weekStartStr, weekStartDate, weekEndDate);

    // Calculate Top Fans
    await calculateTopFans(supabaseClient, weekStartStr, weekStartDate, weekEndDate);

    // Calculate Trending Creators
    await calculateTrendingCreators(supabaseClient, weekStartStr, weekStartDate, weekEndDate);

    return new Response(
      JSON.stringify({ success: true, message: 'Leaderboards calculated successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error calculating leaderboards:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function calculateTopCreators(
  supabase: any,
  weekStart: string,
  weekStartDate: Date,
  weekEndDate: Date
) {
  console.log('Calculating top creators...');

  // Get streams this week
  const { data: streams, error: streamsError } = await supabase
    .from('live_streams')
    .select('creator_id, stream_duration_s, viewer_peak')
    .gte('started_at', weekStartDate.toISOString())
    .lt('started_at', weekEndDate.toISOString())
    .not('ended_at', 'is', null);

  if (streamsError) throw streamsError;

  // Get gifts this week
  const { data: gifts, error: giftsError } = await supabase
    .from('gift_transactions')
    .select('receiver_id, amount')
    .gte('created_at', weekStartDate.toISOString())
    .lt('created_at', weekEndDate.toISOString());

  if (giftsError) throw giftsError;

  // Get followers this week
  const { data: followers, error: followersError } = await supabase
    .from('followers')
    .select('following_id')
    .gte('created_at', weekStartDate.toISOString())
    .lt('created_at', weekEndDate.toISOString());

  if (followersError) throw followersError;

  // Aggregate data
  const creatorData = new Map();

  streams?.forEach((stream: any) => {
    const existing = creatorData.get(stream.creator_id) || {
      total_watch_hours: 0,
      total_gifts_received_sek: 0,
      followers_gained: 0,
      total_streams: 0,
    };
    existing.total_watch_hours += stream.stream_duration_s / 3600;
    existing.total_streams += 1;
    creatorData.set(stream.creator_id, existing);
  });

  gifts?.forEach((gift: any) => {
    const existing = creatorData.get(gift.receiver_id) || {
      total_watch_hours: 0,
      total_gifts_received_sek: 0,
      followers_gained: 0,
      total_streams: 0,
    };
    existing.total_gifts_received_sek += gift.amount;
    creatorData.set(gift.receiver_id, existing);
  });

  followers?.forEach((follower: any) => {
    const existing = creatorData.get(follower.following_id) || {
      total_watch_hours: 0,
      total_gifts_received_sek: 0,
      followers_gained: 0,
      total_streams: 0,
    };
    existing.followers_gained += 1;
    creatorData.set(follower.following_id, existing);
  });

  // Calculate scores and rank
  const entries = Array.from(creatorData.entries()).map(([creatorId, data]) => {
    const compositeScore =
      data.total_watch_hours * 10 +
      data.total_gifts_received_sek * 0.5 +
      data.followers_gained * 5 +
      data.total_streams * 20;

    return {
      creator_id: creatorId,
      week_start_date: weekStart,
      ...data,
      composite_score: compositeScore,
    };
  });

  entries.sort((a, b) => b.composite_score - a.composite_score);
  entries.forEach((entry, index) => {
    (entry as any).rank = index + 1;
  });

  // Save to history
  for (const entry of entries) {
    await supabase.from('leaderboard_history').insert({
      user_id: entry.creator_id,
      leaderboard_type: 'top_creators',
      week_start_date: weekStart,
      rank: (entry as any).rank,
      composite_score: entry.composite_score,
      metadata: {
        total_watch_hours: entry.total_watch_hours,
        total_gifts_received_sek: entry.total_gifts_received_sek,
        followers_gained: entry.followers_gained,
        total_streams: entry.total_streams,
      },
    });
  }

  // Upsert to leaderboard
  if (entries.length > 0) {
    await supabase.from('global_leaderboard_creators').upsert(entries, {
      onConflict: 'creator_id,week_start_date',
    });
  }

  console.log(`✅ Top creators calculated: ${entries.length} entries`);
}

async function calculateTopFans(
  supabase: any,
  weekStart: string,
  weekStartDate: Date,
  weekEndDate: Date
) {
  console.log('Calculating top fans...');

  // Get gifts this week
  const { data: gifts, error: giftsError } = await supabase
    .from('gift_transactions')
    .select('sender_id, amount')
    .gte('created_at', weekStartDate.toISOString())
    .lt('created_at', weekEndDate.toISOString());

  if (giftsError) throw giftsError;

  // Get watch time this week
  const { data: views, error: viewsError } = await supabase
    .from('stream_viewers')
    .select('user_id, joined_at, left_at')
    .gte('joined_at', weekStartDate.toISOString())
    .lt('joined_at', weekEndDate.toISOString())
    .not('left_at', 'is', null);

  if (viewsError) throw viewsError;

  // Get comments this week
  const { data: comments, error: commentsError } = await supabase
    .from('live_comments')
    .select('user_id')
    .gte('created_at', weekStartDate.toISOString())
    .lt('created_at', weekEndDate.toISOString());

  if (commentsError) throw commentsError;

  // Get VIP members
  const { data: vips, error: vipsError } = await supabase
    .from('creator_club_memberships')
    .select('member_id')
    .eq('is_active', true);

  if (vipsError) throw vipsError;

  const vipSet = new Set(vips?.map((v: any) => v.member_id) || []);

  // Aggregate data
  const fanData = new Map();

  gifts?.forEach((gift: any) => {
    const existing = fanData.get(gift.sender_id) || {
      total_gift_spending_sek: 0,
      total_watch_time_seconds: 0,
      comment_activity_count: 0,
      is_vip_member: false,
    };
    existing.total_gift_spending_sek += gift.amount;
    fanData.set(gift.sender_id, existing);
  });

  views?.forEach((view: any) => {
    const watchTime =
      (new Date(view.left_at).getTime() - new Date(view.joined_at).getTime()) / 1000;
    const existing = fanData.get(view.user_id) || {
      total_gift_spending_sek: 0,
      total_watch_time_seconds: 0,
      comment_activity_count: 0,
      is_vip_member: false,
    };
    existing.total_watch_time_seconds += watchTime;
    fanData.set(view.user_id, existing);
  });

  comments?.forEach((comment: any) => {
    const existing = fanData.get(comment.user_id) || {
      total_gift_spending_sek: 0,
      total_watch_time_seconds: 0,
      comment_activity_count: 0,
      is_vip_member: false,
    };
    existing.comment_activity_count += 1;
    fanData.set(comment.user_id, existing);
  });

  // Calculate scores and rank
  const entries = Array.from(fanData.entries()).map(([fanId, data]) => {
    const isVip = vipSet.has(fanId);
    const compositeScore =
      data.total_gift_spending_sek * 1.0 +
      (data.total_watch_time_seconds / 3600) * 5 +
      data.comment_activity_count * 2 +
      (isVip ? 100 : 0);

    return {
      fan_id: fanId,
      week_start_date: weekStart,
      ...data,
      is_vip_member: isVip,
      composite_score: compositeScore,
    };
  });

  entries.sort((a, b) => b.composite_score - a.composite_score);
  entries.forEach((entry, index) => {
    (entry as any).rank = index + 1;
  });

  // Save to history
  for (const entry of entries) {
    await supabase.from('leaderboard_history').insert({
      user_id: entry.fan_id,
      leaderboard_type: 'top_fans',
      week_start_date: weekStart,
      rank: (entry as any).rank,
      composite_score: entry.composite_score,
      metadata: {
        total_gift_spending_sek: entry.total_gift_spending_sek,
        total_watch_time_seconds: entry.total_watch_time_seconds,
        comment_activity_count: entry.comment_activity_count,
        is_vip_member: entry.is_vip_member,
      },
    });
  }

  // Upsert to leaderboard
  if (entries.length > 0) {
    await supabase.from('global_leaderboard_fans').upsert(entries, {
      onConflict: 'fan_id,week_start_date',
    });
  }

  console.log(`✅ Top fans calculated: ${entries.length} entries`);
}

async function calculateTrendingCreators(
  supabase: any,
  weekStart: string,
  weekStartDate: Date,
  weekEndDate: Date
) {
  console.log('Calculating trending creators...');

  // Get previous week dates
  const prevWeekStart = new Date(weekStartDate);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekEnd = new Date(weekStartDate);

  // Get current week followers
  const { data: currentFollowers, error: currentError } = await supabase
    .from('followers')
    .select('following_id')
    .gte('created_at', weekStartDate.toISOString())
    .lt('created_at', weekEndDate.toISOString());

  if (currentError) throw currentError;

  // Get previous week followers
  const { data: prevFollowers, error: prevError } = await supabase
    .from('followers')
    .select('following_id')
    .gte('created_at', prevWeekStart.toISOString())
    .lt('created_at', prevWeekEnd.toISOString());

  if (prevError) throw prevError;

  // Calculate growth
  const currentCounts = new Map();
  const prevCounts = new Map();

  currentFollowers?.forEach((f: any) => {
    currentCounts.set(f.following_id, (currentCounts.get(f.following_id) || 0) + 1);
  });

  prevFollowers?.forEach((f: any) => {
    prevCounts.set(f.following_id, (prevCounts.get(f.following_id) || 0) + 1);
  });

  const entries: any[] = [];

  currentCounts.forEach((currentCount: number, creatorId: string) => {
    const prevCount = prevCounts.get(creatorId) || 0;
    const growthPercentage =
      prevCount > 0 ? ((currentCount - prevCount) / prevCount) * 100 : currentCount * 100;

    const compositeScore = growthPercentage;

    entries.push({
      creator_id: creatorId,
      week_start_date: weekStart,
      follower_growth_percentage: growthPercentage,
      viewer_peak_delta: 0,
      retention_growth_percentage: 0,
      composite_score: compositeScore,
    });
  });

  entries.sort((a, b) => b.composite_score - a.composite_score);
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  // Save to history
  for (const entry of entries) {
    await supabase.from('leaderboard_history').insert({
      user_id: entry.creator_id,
      leaderboard_type: 'trending_creators',
      week_start_date: weekStart,
      rank: entry.rank,
      composite_score: entry.composite_score,
      metadata: {
        follower_growth_percentage: entry.follower_growth_percentage,
        viewer_peak_delta: entry.viewer_peak_delta,
        retention_growth_percentage: entry.retention_growth_percentage,
      },
    });
  }

  // Upsert to leaderboard
  if (entries.length > 0) {
    await supabase.from('trending_creators').upsert(entries, {
      onConflict: 'creator_id,week_start_date',
    });
  }

  console.log(`✅ Trending creators calculated: ${entries.length} entries`);
}