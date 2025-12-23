
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

// New interface for createLiveStream response
interface CreateLiveStreamResponse {
  success: boolean;
  data?: {
    uid: string;
    playback?: {
      hls?: string;
    };
    rtmps?: {
      url?: string;
      streamKey?: string;
    };
  };
  error?: string;
}

/* =========================
   CloudflareService
========================= */

class CloudflareService {
  private maxRetries = 3;
  private retryDelay = 2000;
  private initialized = false;

  constructor() {
    console.log('🔧 [CloudflareService] Constructor called');
    this.initialized = true;
    
    // Verify all methods are bound correctly
    if (typeof this.createLiveStream !== 'function') {
      console.error('❌ [CloudflareService] CRITICAL: createLiveStream is not a function in constructor!');
    } else {
      console.log('✅ [CloudflareService] createLiveStream method verified in constructor');
    }
  }

  /* =========================
     CREATE LIVE STREAM (NEW METHOD)
     
     This method is called by LiveStreamStateMachine.
     It creates a Cloudflare Stream Live Input.
  ========================= */

  async createLiveStream(): Promise<CreateLiveStreamResponse> {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📡 [CloudflareService] CREATE LIVE STREAM');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!this.initialized) {
      console.error('❌ [CloudflareService] Service not initialized!');
      return {
        success: false,
        error: 'Service not initialized',
      };
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('❌ [CloudflareService] No authenticated user');
        return {
          success: false,
          error: 'User not authenticated',
        };
      }

      // Call the start-live Edge Function to create Cloudflare Live Input
      const { data, error } = await supabase.functions.invoke('start-live', {
        body: {
          title: 'Live Stream',
          user_id: user.id,
        },
      });

      console.log('📡 [CloudflareService] Edge Function Response:', { data, error });

      if (error) {
        console.error('❌ [CloudflareService] Edge Function error:', error);
        return {
          success: false,
          error: error.message || 'Failed to create live stream',
        };
      }

      if (!data || !data.success) {
        console.error('❌ [CloudflareService] Edge Function returned failure');
        return {
          success: false,
          error: data?.error || 'Failed to create live stream',
        };
      }

      // Transform the response to match expected format
      const transformedData: CreateLiveStreamResponse = {
        success: true,
        data: {
          uid: data.stream?.live_input_id || '',
          playback: {
            hls: data.stream?.playback_url || '',
          },
          rtmps: {
            url: data.ingest?.rtmps_url || '',
            streamKey: data.ingest?.stream_key || '',
          },
        },
      };

      console.log('✅ [CloudflareService] Live stream created successfully');
      console.log('Stream UID:', transformedData.data?.uid);
      
      return transformedData;
    } catch (error: any) {
      console.error('❌ [CloudflareService] Exception in createLiveStream:', error);
      return {
        success: false,
        error: error.message || 'Failed to create live stream',
      };
    }
  }

  /* =========================
     START LIVE
  ========================= */

  async startLive({ title, userId }: StartLiveParams): Promise<StartLiveResponse> {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📡 [CloudflareService] START LIVE REQUEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Title:', title);
    console.log('User ID:', userId);

    // FIX ISSUE 3: Validate payload before sending
    if (!title || !title.trim()) {
      const error = 'Stream title is required and cannot be empty';
      console.error('❌ [CloudflareService] Validation failed:', error);
      return {
        success: false,
        error,
      };
    }

    if (!userId || !userId.trim()) {
      const error = 'User ID is required and cannot be empty';
      console.error('❌ [CloudflareService] Validation failed:', error);
      return {
        success: false,
        error,
      };
    }

    let lastError: any = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`📡 [CloudflareService] Attempt ${attempt}/${this.maxRetries}`);

        // FIX ISSUE 3: Get current session to ensure Authorization header is included
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.error('❌ [CloudflareService] No active session found');
          return {
            success: false,
            error: 'Authentication required. Please log in again.',
          };
        }

        console.log('✅ [CloudflareService] Session validated, invoking Edge Function...');

        const { data, error } =
          await supabase.functions.invoke<StartLiveResponse>('start-live', {
            body: {
              title,
              user_id: userId,
            },
          });

        // FIX ISSUE 3: Log exact HTTP response for debugging
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📡 [CloudflareService] Edge Function Response (attempt ${attempt})`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Data:', JSON.stringify(data, null, 2));
        console.log('Error:', JSON.stringify(error, null, 2));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if (error) {
          lastError = error;
          
          // FIX ISSUE 3: Surface exact error details
          console.error('❌ [CloudflareService] Edge Function error:', {
            message: error.message,
            status: error.status,
            statusText: error.statusText,
            context: error.context,
          });

          if (attempt < this.maxRetries) {
            console.log(`⏳ [CloudflareService] Retrying in ${this.retryDelay * attempt}ms...`);
            await this.wait(attempt);
            continue;
          }

          // FIX ISSUE 3: Return user-friendly error message
          return {
            success: false,
            error: `Failed to start stream: ${error.message || 'Edge Function returned an error'}`,
          };
        }

        if (!data) {
          lastError = new Error('No response from start-live Edge Function');
          console.error('❌ [CloudflareService] No data received from Edge Function');

          if (attempt < this.maxRetries) {
            console.log(`⏳ [CloudflareService] Retrying in ${this.retryDelay * attempt}ms...`);
            await this.wait(attempt);
            continue;
          }

          return {
            success: false,
            error: 'No response from server. Please try again.',
          };
        }

        if (!data.success) {
          console.error('❌ [CloudflareService] Edge Function returned success=false:', data.error);
          return {
            success: false,
            error: data.error || 'Failed to create stream. Please try again.',
          };
        }

        // FIX ISSUE 3: Validate response structure
        if (!data.stream || !data.stream.live_input_id) {
          console.warn('⚠️ [CloudflareService] Edge Function returned success but missing stream data');
          console.warn('Response data:', JSON.stringify(data, null, 2));
        }

        console.log('✅ [CloudflareService] Live stream started successfully');
        console.log('Stream ID:', data.stream?.id);
        console.log('Live Input ID:', data.stream?.live_input_id);
        
        return data;
      } catch (err) {
        console.error(`❌ [CloudflareService] Exception on attempt ${attempt}:`, err);
        lastError = err;

        if (attempt < this.maxRetries) {
          console.log(`⏳ [CloudflareService] Retrying in ${this.retryDelay * attempt}ms...`);
          await this.wait(attempt);
        }
      }
    }

    // FIX ISSUE 3: Return graceful error after all retries exhausted
    const errorMessage = lastError?.message || 'Failed to start live stream after multiple attempts';
    console.error('❌ [CloudflareService] All retry attempts exhausted:', errorMessage);
    
    return {
      success: false,
      error: errorMessage,
    };
  }

  /* =========================
     STOP LIVE
  ========================= */

  async stopLive({ liveInputId, streamId }: StopLiveParams): Promise<StopLiveResponse> {
    const idToUse = liveInputId || streamId;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📡 [CloudflareService] STOP LIVE REQUEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Live Input ID:', idToUse);

    if (!idToUse) {
      console.error('❌ [CloudflareService] Missing liveInputId / streamId');
      return {
        success: false,
        error: 'Missing stream identifier',
      };
    }

    let lastError: any = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`📡 [CloudflareService] Attempt ${attempt}/${this.maxRetries}`);

        const { data, error } =
          await supabase.functions.invoke<StopLiveResponse>('stop-live', {
            body: {
              live_input_id: idToUse,
            },
          });

        console.log(`📡 [CloudflareService] stop-live response (attempt ${attempt})`, { data, error });

        if (error) {
          lastError = error;
          console.error('❌ [CloudflareService] Edge Function error:', error);

          if (attempt < this.maxRetries) {
            await this.wait(attempt);
            continue;
          }

          return {
            success: false,
            error: error.message || 'Failed to stop stream',
          };
        }

        if (!data) {
          lastError = new Error('No response from stop-live');
          console.error('❌ [CloudflareService] No data received');

          if (attempt < this.maxRetries) {
            await this.wait(attempt);
            continue;
          }

          return {
            success: false,
            error: 'No response from server',
          };
        }

        if (data.warning) {
          console.warn('⚠️ [CloudflareService] stop-live warning:', data.warning);
        }

        if (!data.success) {
          console.error('❌ [CloudflareService] stop-live returned success=false');
          return data;
        }

        console.log('✅ [CloudflareService] Live stream stopped successfully');
        return data;
      } catch (err) {
        console.error(`❌ [CloudflareService] Exception on attempt ${attempt}:`, err);
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
    console.log(`⏳ [CloudflareService] Waiting ${delay}ms before retry...`);
    await new Promise((res) => setTimeout(res, delay));
  }

  /* =========================
     Verification Method
  ========================= */

  verifyService(): boolean {
    console.log('🔍 [CloudflareService] Running service verification...');
    
    const checks = {
      initialized: this.initialized,
      hasCreateLiveStream: typeof this.createLiveStream === 'function',
      hasStartLive: typeof this.startLive === 'function',
      hasStopLive: typeof this.stopLive === 'function',
    };

    console.log('Service checks:', checks);

    const allPassed = Object.values(checks).every(check => check === true);
    
    if (allPassed) {
      console.log('✅ [CloudflareService] All verification checks passed');
    } else {
      console.error('❌ [CloudflareService] Some verification checks failed');
    }

    return allPassed;
  }
}

/* =========================
   Export singleton
========================= */

// Create the singleton instance
const serviceInstance = new CloudflareService();

// Verify the instance immediately after creation
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔧 [CloudflareService] Module initialization');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (typeof serviceInstance === 'undefined') {
  console.error('❌ CRITICAL: serviceInstance is undefined!');
} else {
  console.log('✅ serviceInstance created');
  serviceInstance.verifyService();
}

// Export the singleton
export const cloudflareService = serviceInstance;

// Final verification after export
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔧 [CloudflareService] Export verification');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (typeof cloudflareService === 'undefined') {
  console.error('❌ CRITICAL: cloudflareService is undefined at export time!');
} else {
  console.log('✅ cloudflareService exported successfully');
  
  if (typeof cloudflareService.createLiveStream !== 'function') {
    console.error('❌ CRITICAL: cloudflareService.createLiveStream is not a function!');
    console.error('Available properties:', Object.keys(cloudflareService));
  } else {
    console.log('✅ cloudflareService.createLiveStream is a function');
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
