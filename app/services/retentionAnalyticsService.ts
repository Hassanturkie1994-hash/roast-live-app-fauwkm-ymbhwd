
import { supabase } from '@/app/integrations/supabase/client';

export interface StreamMinuteBreakdown {
  id: string;
  stream_id: string;
  minute_index: number;
  viewers_count: number;
  messages_count: number;
  gift_value: number;
  created_at: string;
}

export interface RetentionCurveData {
  minute: number;
  viewers: number;
  joining: number;
  leaving: number;
  messages: number;
  gifts: number;
  isDropMoment: boolean;
}

export interface RetentionMetrics {
  averageRetentionTime: number; // in seconds
  retentionCurve: RetentionCurveData[];
  dropMoments: {
    minute: number;
    viewersLost: number;
    percentageDrop: number;
  }[];
  peakMinute: number;
  totalMinutes: number;
}

class RetentionAnalyticsService {
  /**
   * Track minute-by-minute breakdown during a stream
   */
  async trackMinuteBreakdown(
    streamId: string,
    minuteIndex: number,
    viewersCount: number,
    messagesCount: number,
    giftValue: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('track_stream_minute_breakdown', {
        p_stream_id: streamId,
        p_minute_index: minuteIndex,
        p_viewers_count: viewersCount,
        p_messages_count: messagesCount,
        p_gift_value: giftValue,
      });

      if (error) {
        console.error('Error tracking minute breakdown:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in trackMinuteBreakdown:', error);
      return { success: false, error: 'Failed to track minute breakdown' };
    }
  }

  /**
   * Calculate average retention time for a stream
   */
  async calculateAverageRetentionTime(streamId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('calculate_average_retention_time', {
        p_stream_id: streamId,
      });

      if (error) {
        console.error('Error calculating average retention time:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error in calculateAverageRetentionTime:', error);
      return 0;
    }
  }

  /**
   * Get retention curve data for a stream
   */
  async getRetentionCurve(streamId: string): Promise<RetentionMetrics | null> {
    try {
      // Get minute breakdown data
      const { data: breakdownData, error: breakdownError } = await supabase
        .from('stream_minute_breakdown')
        .select('*')
        .eq('stream_id', streamId)
        .order('minute_index', { ascending: true });

      if (breakdownError || !breakdownData || breakdownData.length === 0) {
        console.error('Error fetching retention curve:', breakdownError);
        return null;
      }

      // Calculate joining and leaving per minute
      const retentionCurve: RetentionCurveData[] = [];
      let previousViewers = 0;

      for (let i = 0; i < breakdownData.length; i++) {
        const current = breakdownData[i];
        const joining = Math.max(0, current.viewers_count - previousViewers);
        const leaving = Math.max(0, previousViewers - current.viewers_count);

        retentionCurve.push({
          minute: current.minute_index,
          viewers: current.viewers_count,
          joining,
          leaving,
          messages: current.messages_count,
          gifts: current.gift_value,
          isDropMoment: false, // Will be calculated below
        });

        previousViewers = current.viewers_count;
      }

      // Identify drop moments (significant viewer loss)
      const dropMoments: {
        minute: number;
        viewersLost: number;
        percentageDrop: number;
      }[] = [];

      for (let i = 1; i < retentionCurve.length; i++) {
        const current = retentionCurve[i];
        const previous = retentionCurve[i - 1];

        if (previous.viewers > 0) {
          const viewersLost = previous.viewers - current.viewers;
          const percentageDrop = (viewersLost / previous.viewers) * 100;

          // Mark as drop moment if lost more than 20% of viewers
          if (percentageDrop > 20 && viewersLost > 5) {
            current.isDropMoment = true;
            dropMoments.push({
              minute: current.minute,
              viewersLost,
              percentageDrop: Math.round(percentageDrop),
            });
          }
        }
      }

      // Find peak minute
      const peakMinute =
        retentionCurve.reduce((max, curr) =>
          curr.viewers > max.viewers ? curr : max
        ).minute;

      // Calculate average retention time
      const avgRetentionTime = await this.calculateAverageRetentionTime(streamId);

      return {
        averageRetentionTime: avgRetentionTime,
        retentionCurve,
        dropMoments,
        peakMinute,
        totalMinutes: retentionCurve.length,
      };
    } catch (error) {
      console.error('Error in getRetentionCurve:', error);
      return null;
    }
  }

  /**
   * Get retention summary for creator dashboard
   */
  async getRetentionSummary(creatorId: string): Promise<{
    latestStreamRetention: RetentionMetrics | null;
    averageRetentionAcrossStreams: number;
    totalDropMoments: number;
  }> {
    try {
      // Get latest stream
      const { data: latestStream } = await supabase
        .from('streams')
        .select('id')
        .eq('broadcaster_id', creatorId)
        .eq('status', 'ended')
        .order('ended_at', { ascending: false })
        .limit(1)
        .single();

      let latestStreamRetention: RetentionMetrics | null = null;
      if (latestStream) {
        latestStreamRetention = await this.getRetentionCurve(latestStream.id);
      }

      // Get average retention across all streams
      const { data: allStreams } = await supabase
        .from('streams')
        .select('id')
        .eq('broadcaster_id', creatorId)
        .eq('status', 'ended');

      let totalRetentionTime = 0;
      let streamCount = 0;
      let totalDropMoments = 0;

      if (allStreams) {
        for (const stream of allStreams) {
          const avgTime = await this.calculateAverageRetentionTime(stream.id);
          if (avgTime > 0) {
            totalRetentionTime += avgTime;
            streamCount++;
          }

          const retention = await this.getRetentionCurve(stream.id);
          if (retention) {
            totalDropMoments += retention.dropMoments.length;
          }
        }
      }

      const averageRetentionAcrossStreams =
        streamCount > 0 ? totalRetentionTime / streamCount : 0;

      return {
        latestStreamRetention,
        averageRetentionAcrossStreams,
        totalDropMoments,
      };
    } catch (error) {
      console.error('Error in getRetentionSummary:', error);
      return {
        latestStreamRetention: null,
        averageRetentionAcrossStreams: 0,
        totalDropMoments: 0,
      };
    }
  }

  /**
   * Process stream end and calculate all retention metrics
   */
  async processStreamEnd(streamId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get all viewer events
      const { data: viewerEvents, error: eventsError } = await supabase
        .from('viewer_events')
        .select('*')
        .eq('stream_id', streamId)
        .order('joined_at', { ascending: true });

      if (eventsError || !viewerEvents) {
        return { success: false, error: 'Failed to fetch viewer events' };
      }

      // Get stream start time
      const { data: stream } = await supabase
        .from('streams')
        .select('started_at')
        .eq('id', streamId)
        .single();

      if (!stream) {
        return { success: false, error: 'Stream not found' };
      }

      const streamStart = new Date(stream.started_at).getTime();

      // Calculate minute-by-minute breakdown
      const minuteData = new Map<number, {
        viewers: Set<string>;
        messages: number;
        gifts: number;
      }>();

      // Process each viewer event
      for (const event of viewerEvents) {
        const joinedAt = new Date(event.joined_at).getTime();
        const leftAt = event.left_at ? new Date(event.left_at).getTime() : Date.now();

        const startMinute = Math.floor((joinedAt - streamStart) / 60000);
        const endMinute = Math.floor((leftAt - streamStart) / 60000);

        // Mark viewer as present for each minute they were watching
        for (let minute = startMinute; minute <= endMinute; minute++) {
          if (!minuteData.has(minute)) {
            minuteData.set(minute, {
              viewers: new Set(),
              messages: 0,
              gifts: 0,
            });
          }

          const data = minuteData.get(minute)!;
          data.viewers.add(event.viewer_id);
          data.messages += event.messages_sent || 0;
          data.gifts += event.gifted_amount || 0;
        }
      }

      // Store minute breakdown
      for (const [minute, data] of minuteData.entries()) {
        await this.trackMinuteBreakdown(
          streamId,
          minute,
          data.viewers.size,
          data.messages,
          data.gifts
        );
      }

      console.log(`✅ Processed retention data for ${minuteData.size} minutes`);
      return { success: true };
    } catch (error) {
      console.error('Error in processStreamEnd:', error);
      return { success: false, error: 'Failed to process stream end' };
    }
  }
}

export const retentionAnalyticsService = new RetentionAnalyticsService();