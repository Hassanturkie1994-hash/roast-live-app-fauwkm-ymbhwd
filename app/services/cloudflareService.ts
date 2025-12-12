
import { supabase } from '@/app/integrations/supabase/client';

interface StartLiveParams {
  title: string;
  userId: string;
}

interface StopLiveParams {
  liveInputId: string;
  streamId: string;
}

interface StartLiveResponse {
  success: boolean;
  stream: {
    id: string;
    live_input_id: string;
    title: string;
    status: string;
    playback_url: string;
  };
  ingest: {
    webRTC_url: string | null;
    rtmps_url: string | null;
    stream_key: string | null;
  };
  error?: string;
}

interface StopLiveResponse {
  success: boolean;
  error?: string;
}

class CloudflareService {
  private maxRetries = 3;
  private retryDelay = 2000; // 2 seconds

  /**
   * Start live stream with retry logic
   */
  async startLive({ title, userId }: StartLiveParams): Promise<StartLiveResponse> {
    console.log('📡 Calling start-live edge function with:', { title, userId });

    let lastError: any = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const { data, error } = await supabase.functions.invoke<StartLiveResponse>('start-live', {
          body: { title, user_id: userId },
        });

        console.log(`📡 start-live response (attempt ${attempt}):`, { data, error });

        if (error) {
          console.error(`❌ Edge function error (attempt ${attempt}):`, error);
          lastError = error;
          
          // Retry on temporary failures
          if (attempt < this.maxRetries) {
            const waitTime = this.retryDelay * attempt;
            console.log(`⏳ Retrying in ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          throw new Error(`Failed to start live stream: ${error.message || 'Unknown error'}`);
        }

        if (!data) {
          console.error('❌ No data returned from edge function');
          lastError = new Error('No response from server');
          
          if (attempt < this.maxRetries) {
            const waitTime = this.retryDelay * attempt;
            console.log(`⏳ Retrying in ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          throw new Error('No response from server');
        }

        if (!data.success) {
          console.error('❌ Server returned success=false:', data.error);
          throw new Error(data.error || 'Failed to start live stream');
        }

        // Validate response structure
        if (!data.stream || !data.stream.id || !data.stream.live_input_id) {
          console.error('❌ Invalid response structure:', data);
          throw new Error('Invalid response from server: missing stream data');
        }

        if (!data.ingest) {
          console.error('❌ Invalid response structure: missing ingest data:', data);
          throw new Error('Invalid response from server: missing ingest data');
        }

        console.log('✅ Successfully started live stream:', {
          id: data.stream.id,
          live_input_id: data.stream.live_input_id,
          playback_url: data.stream.playback_url,
        });

        return data;
      } catch (error) {
        console.error(`❌ Error in startLive (attempt ${attempt}):`, error);
        lastError = error;
        
        // Retry on temporary failures
        if (attempt < this.maxRetries) {
          const waitTime = this.retryDelay * attempt;
          console.log(`⏳ Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // All retries failed
    const errorMessage = lastError?.message || 'Failed to start live stream after multiple attempts';
    console.error('❌ All start-live attempts failed:', errorMessage);
    throw new Error(errorMessage);
  }

  /**
   * Stop live stream with validation and retry logic
   */
  async stopLive({ liveInputId, streamId }: StopLiveParams): Promise<StopLiveResponse> {
    console.log('📡 Calling stop-live edge function with:', { liveInputId, streamId });

    // Defensive check: ensure we have a valid ID
    const idToUse = liveInputId || streamId;

    if (!idToUse) {
      console.error('❌ Missing both live_input_id and stream_id');
      throw new Error('Cannot stop stream: missing stream identifier');
    }

    console.log('📡 Using ID for stop-live:', idToUse);

    let lastError: any = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const { data, error } = await supabase.functions.invoke<StopLiveResponse>('stop-live', {
          body: { live_input_id: idToUse },
        });

        console.log(`📡 stop-live response (attempt ${attempt}):`, { data, error });

        if (error) {
          console.error(`❌ Edge function error (attempt ${attempt}):`, error);
          lastError = error;
          
          // Retry on temporary failures
          if (attempt < this.maxRetries) {
            const waitTime = this.retryDelay * attempt;
            console.log(`⏳ Retrying in ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          throw new Error(`Failed to stop live stream: ${error.message || 'Unknown error'}`);
        }

        if (!data) {
          console.error('❌ No data returned from edge function');
          lastError = new Error('No response from server');
          
          if (attempt < this.maxRetries) {
            const waitTime = this.retryDelay * attempt;
            console.log(`⏳ Retrying in ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
          
          throw new Error('No response from server');
        }

        if (!data.success) {
          console.error('❌ Server returned success=false:', data.error);
          throw new Error(data.error || 'Failed to stop live stream');
        }

        console.log('✅ Successfully stopped live stream');

        return data;
      } catch (error) {
        console.error(`❌ Error in stopLive (attempt ${attempt}):`, error);
        lastError = error;
        
        // Retry on temporary failures
        if (attempt < this.maxRetries) {
          const waitTime = this.retryDelay * attempt;
          console.log(`⏳ Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // All retries failed
    const errorMessage = lastError?.message || 'Failed to stop live stream after multiple attempts';
    console.error('❌ All stop-live attempts failed:', errorMessage);
    throw new Error(errorMessage);
  }
}

export const cloudflareService = new CloudflareService();
