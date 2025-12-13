
import { supabase } from '@/app/integrations/supabase/client';

/* =========================
   Types
========================= */

interface StartLiveParams {
  title: string;
  userId: string;
}

interface StopLiveParams {
  liveInputId?: string;
  streamId?: string;
}

interface StartLiveResponse {
  success: boolean;
  stream?: {
    id: string;
    live_input_id: string;
    title: string;
    status: string;
    playback_url: string;
  };
  ingest?: {
    rtmps_url: string | null;
    stream_key: string | null;
    webRTC_url: string | null;
  };
  error?: string;
}

interface StopLiveResponse {
  success: boolean;
  warning?: string;
  error?: string;
}

/* =========================
   CloudflareService
========================= */

class CloudflareService {
  private maxRetries = 3;
  private retryDelay = 2000;

  /* =========================
     START LIVE
  ========================= */

  async startLive({ title, userId }: StartLiveParams): Promise<StartLiveResponse> {
    console.log('📡 startLive → invoking edge function', { title, userId });

    let lastError: any = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const { data, error } = await supabase.functions.invoke<StartLiveResponse>('start-live', {
          body: {
            title,
            user_id: userId,
          },
        });

        console.log(`📡 start-live response (attempt ${attempt})`, { data, error });

        if (error) {
          console.warn(`⚠️ Edge Function error (attempt ${attempt}):`, error);
          lastError = error;

          if (attempt < this.maxRetries) {
            await this.wait(attempt);
            continue;
          }

          // Return safe fallback instead of throwing
          return {
            success: false,
            error: error.message || 'start-live failed',
          };
        }

        if (!data) {
          console.warn(`⚠️ No response from start-live (attempt ${attempt})`);
          lastError = new Error('No response from start-live');

          if (attempt < this.maxRetries) {
            await this.wait(attempt);
            continue;
          }

          return {
            success: false,
            error: 'No response from start-live',
          };
        }

        if (!data.success) {
          console.warn('⚠️ start-live returned success=false:', data.error);
          return {
            success: false,
            error: data.error || 'start-live returned success=false',
          };
        }

        // Defensive: backend might still be under development
        if (!data.stream || !data.stream.live_input_id) {
          console.warn('⚠️ start-live returned success but missing stream data');
        }

        console.log('✅ Live stream started');
        return data;
      } catch (err) {
        console.error(`❌ startLive error (attempt ${attempt})`, err);
        lastError = err;

        if (attempt < this.maxRetries) {
          await this.wait(attempt);
        }
      }
    }

    // Return safe fallback instead of throwing
    return {
      success: false,
      error: lastError?.message || 'Failed to start live stream after retries',
    };
  }

  /* =========================
     STOP LIVE
  ========================= */

  async stopLive({ liveInputId, streamId }: StopLiveParams): Promise<StopLiveResponse> {
    const idToUse = liveInputId || streamId;

    console.log('📡 stopLive → invoking edge function', { idToUse });

    if (!idToUse) {
      return {
        success: false,
        error: 'Missing liveInputId / streamId',
      };
    }

    let lastError: any = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const { data, error } = await supabase.functions.invoke<StopLiveResponse>('stop-live', {
          body: {
            live_input_id: idToUse,
          },
        });

        console.log(`📡 stop-live response (attempt ${attempt})`, { data, error });

        if (error) {
          console.warn(`⚠️ Edge Function error (attempt ${attempt}):`, error);
          lastError = error;

          if (attempt < this.maxRetries) {
            await this.wait(attempt);
            continue;
          }

          return {
            success: false,
            error: error.message || 'stop-live failed',
          };
        }

        if (!data) {
          console.warn(`⚠️ No response from stop-live (attempt ${attempt})`);
          lastError = new Error('No response from stop-live');

          if (attempt < this.maxRetries) {
            await this.wait(attempt);
            continue;
          }

          return {
            success: false,
            error: 'No response from stop-live',
          };
        }

        if (data.warning) {
          console.warn('⚠️ stop-live warning:', data.warning);
        }

        if (!data.success) {
          return data;
        }

        console.log('✅ Live stream stopped');
        return data;
      } catch (err) {
        console.error(`❌ stopLive error (attempt ${attempt})`, err);
        lastError = err;

        if (attempt < this.maxRetries) {
          await this.wait(attempt);
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Failed to stop live stream',
    };
  }

  /* =========================
     Utils
  ========================= */

  private async wait(attempt: number) {
    const delay = this.retryDelay * attempt;
    console.log(`⏳ retrying in ${delay}ms`);
    await new Promise((res) => setTimeout(res, delay));
  }
}

/* =========================
   Export singleton
========================= */

export const cloudflareService = new CloudflareService();
