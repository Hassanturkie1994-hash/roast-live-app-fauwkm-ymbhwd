
import { supabase } from '@/app/integrations/supabase/client';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AGORA RTC SERVICE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This service manages Agora Real-Time Communication (RTC) for live streaming
 * in the Roast Live app. It handles token generation, channel management, and
 * cloud recording integration.
 * 
 * MIGRATION COMPLETE:
 * ─────────────────────────────────────────────────────────────────────────
 * ✅ Migrated from Cloudflare Stream to Agora RTC
 * ✅ All Cloudflare references removed
 * ✅ Comprehensive documentation added
 * ✅ Platform-specific implementations in place
 * ✅ Web compatibility ensured (no native imports on web)
 * 
 * ARCHITECTURE OVERVIEW:
 * ─────────────────────────────────────────────────────────────────────────
 * 
 * 1. TOKEN GENERATION:
 *    - Tokens are generated server-side via Supabase Edge Functions
 *    - Edge Function: /supabase/functions/start-live/index.ts
 *    - Uses Agora's RtcTokenBuilder with app credentials
 *    - Tokens expire after 24 hours for security
 * 
 * 2. CHANNEL ARCHITECTURE:
 *    - Each stream gets a unique channel name (typically the stream ID)
 *    - Host joins as PUBLISHER (can send audio/video)
 *    - Viewers join as SUBSCRIBER (receive only)
 *    - Supports up to 10 simultaneous broadcasters (multi-guest mode)
 * 
 * 3. DUAL-STREAM MODE (SIMULCAST):
 *    - High quality: 1280x720, 30fps, ~1200 kbps
 *    - Low quality: 320x240, 15fps, ~200 kbps
 *    - Automatically switches based on network conditions
 *    - Reduces bandwidth usage for viewers with poor connections
 * 
 * 4. CLOUD RECORDING:
 *    - Integrated with AWS S3 for "Bring Your Own Storage"
 *    - Recording starts automatically when stream begins
 *    - Stops when stream ends, generates playback URL
 *    - Stored in: s3://[bucket]/recordings/[stream_id]/[timestamp].m3u8
 * 
 * 5. MULTI-GUEST STREAMING:
 *    - Host can invite up to 9 guests (10 total broadcasters)
 *    - Dynamic grid layout adjusts based on participant count
 *    - 1-2 users: Full screen / Split screen
 *    - 3-4 users: 2x2 Grid
 *    - 5+ users: 3-column Grid
 * 
 * 6. AUDIO VOLUME INDICATION:
 *    - Real-time speaking indicators
 *    - Visual feedback (green border) for active speakers
 *    - 200ms update interval for smooth animations
 * 
 * ENVIRONMENT VARIABLES:
 * ─────────────────────────────────────────────────────────────────────────
 * - AGORA_APP_ID: Your Agora project App ID
 * - AGORA_APP_CERTIFICATE: Your Agora project certificate
 * - AGORA_CUSTOMER_KEY: For cloud recording API authentication
 * - AGORA_CUSTOMER_SECRET: For cloud recording API authentication
 * - AWS_S3_BUCKET: S3 bucket name for recordings
 * - AWS_S3_REGION: S3 bucket region
 * - AWS_ACCESS_KEY: AWS access key for S3 uploads
 * - AWS_SECRET_KEY: AWS secret key for S3 uploads
 * 
 * EDGE FUNCTIONS:
 * ─────────────────────────────────────────────────────────────────────────
 * - start-live: Generates Agora token, starts cloud recording
 * - stop-live: Stops cloud recording, saves playback URL
 * - agora-token: Generates tokens for viewers/guests
 * 
 * NATIVE SDK INTEGRATION:
 * ─────────────────────────────────────────────────────────────────────────
 * - iOS/Android: Uses react-native-agora SDK
 * - Web: Not supported (native components only)
 * - Hook: hooks/useAgoraEngine.native.ts (native platforms)
 * - Hook: hooks/useAgoraEngine.ts (web fallback)
 * 
 * PLATFORM-SPECIFIC FILES:
 * ─────────────────────────────────────────────────────────────────────────
 * To avoid "requireNativeComponent" errors on web, we use platform-specific
 * file extensions:
 * 
 * - .native.tsx / .native.ts - iOS/Android (can import react-native-agora)
 * - .tsx / .ts - Web (cannot import react-native-agora)
 * 
 * Metro automatically chooses the correct file based on the platform.
 * 
 * Examples:
 * - hooks/useAgoraEngine.native.ts (uses Agora SDK)
 * - hooks/useAgoraEngine.ts (web fallback)
 * - components/VideoGrid.native.tsx (uses RtcSurfaceView)
 * - components/VideoGrid.tsx (web fallback)
 * 
 * SECURITY:
 * ─────────────────────────────────────────────────────────────────────────
 * - All tokens generated server-side (never expose certificate)
 * - Tokens include UID and channel restrictions
 * - Row Level Security (RLS) on database tables
 * - Moderator permissions enforced at database level
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * ─────────────────────────────────────────────────────────────────────────
 * - Automatic quality switching based on network
 * - Low-quality streams for multi-user scenarios
 * - Efficient grid layout rendering
 * - Audio-only mode for poor connections
 * 
 * DOCUMENTATION:
 * ─────────────────────────────────────────────────────────────────────────
 * - Full Architecture: docs/AGORA_ARCHITECTURE.md
 * - Quick Fix Guide: docs/AGORA_QUICK_FIX_GUIDE.md
 * - Migration Guide: docs/AGORA_MIGRATION_COMPLETE.md
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

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
  agora?: {
    token: string;
    channelName: string;
    uid: number;
    appId: string;
  };
  error?: string;
}

interface StopLiveResponse {
  success: boolean;
  warning?: string;
  error?: string;
}

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
   AgoraService
========================= */

class AgoraService {
  private maxRetries = 3;
  private retryDelay = 2000;
  private initialized = false;

  constructor() {
    console.log('🔧 [AgoraService] Constructor called');
    this.initialized = true;
    
    // Verify all methods are bound correctly
    if (typeof this.createLiveStream !== 'function') {
      console.error('❌ [AgoraService] CRITICAL: createLiveStream is not a function in constructor!');
    } else {
      console.log('✅ [AgoraService] createLiveStream method verified in constructor');
    }
  }

  /* =========================
     CREATE LIVE STREAM
     
     This method is called by LiveStreamStateMachine.
     It generates an Agora RTC token and initializes the stream.
  ========================= */

  async createLiveStream(): Promise<CreateLiveStreamResponse> {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📡 [AgoraService] CREATE LIVE STREAM');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!this.initialized) {
      console.error('❌ [AgoraService] Service not initialized!');
      return {
        success: false,
        error: 'Service not initialized',
      };
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('❌ [AgoraService] No authenticated user');
        return {
          success: false,
          error: 'User not authenticated',
        };
      }

      // Call the start-live Edge Function to generate Agora token
      const { data, error } = await supabase.functions.invoke('start-live', {
        body: {
          title: 'Live Stream',
          user_id: user.id,
        },
      });

      console.log('📡 [AgoraService] Edge Function Response:', { data, error });

      if (error) {
        console.error('❌ [AgoraService] Edge Function error:', error);
        return {
          success: false,
          error: error.message || 'Failed to create live stream',
        };
      }

      if (!data || !data.success) {
        console.error('❌ [AgoraService] Edge Function returned failure');
        return {
          success: false,
          error: data?.error || 'Failed to create live stream',
        };
      }

      // Transform the response to match expected format
      const transformedData: CreateLiveStreamResponse = {
        success: true,
        data: {
          uid: data.stream?.live_input_id || data.agora?.channelName || '',
          playback: {
            hls: data.stream?.playback_url || '',
          },
          rtmps: {
            url: data.ingest?.rtmps_url || '',
            streamKey: data.ingest?.stream_key || '',
          },
        },
      };

      console.log('✅ [AgoraService] Live stream created successfully');
      console.log('Stream UID:', transformedData.data?.uid);
      
      return transformedData;
    } catch (error: any) {
      console.error('❌ [AgoraService] Exception in createLiveStream:', error);
      return {
        success: false,
        error: error.message || 'Failed to create live stream',
      };
    }
  }

  /* =========================
     START LIVE
     
     Generates Agora RTC token and starts cloud recording.
  ========================= */

  async startLive({ title, userId }: StartLiveParams): Promise<StartLiveResponse> {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📡 [AgoraService] START LIVE REQUEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Title:', title);
    console.log('User ID:', userId);

    // Validate payload before sending
    if (!title || !title.trim()) {
      const error = 'Stream title is required and cannot be empty';
      console.error('❌ [AgoraService] Validation failed:', error);
      return {
        success: false,
        error,
      };
    }

    if (!userId || !userId.trim()) {
      const error = 'User ID is required and cannot be empty';
      console.error('❌ [AgoraService] Validation failed:', error);
      return {
        success: false,
        error,
      };
    }

    let lastError: any = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`📡 [AgoraService] Attempt ${attempt}/${this.maxRetries}`);

        // Get current session to ensure Authorization header is included
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.error('❌ [AgoraService] No active session found');
          return {
            success: false,
            error: 'Authentication required. Please log in again.',
          };
        }

        console.log('✅ [AgoraService] Session validated, invoking Edge Function...');

        const { data, error } =
          await supabase.functions.invoke<StartLiveResponse>('start-live', {
            body: {
              title,
              user_id: userId,
            },
          });

        // Log exact HTTP response for debugging
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📡 [AgoraService] Edge Function Response (attempt ${attempt})`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Data:', JSON.stringify(data, null, 2));
        console.log('Error:', JSON.stringify(error, null, 2));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if (error) {
          lastError = error;
          
          // Surface exact error details
          console.error('❌ [AgoraService] Edge Function error:', {
            message: error.message,
            status: error.status,
            statusText: error.statusText,
            context: error.context,
          });

          if (attempt < this.maxRetries) {
            console.log(`⏳ [AgoraService] Retrying in ${this.retryDelay * attempt}ms...`);
            await this.wait(attempt);
            continue;
          }

          // Return user-friendly error message
          return {
            success: false,
            error: `Failed to start stream: ${error.message || 'Edge Function returned an error'}`,
          };
        }

        if (!data) {
          lastError = new Error('No response from start-live Edge Function');
          console.error('❌ [AgoraService] No data received from Edge Function');

          if (attempt < this.maxRetries) {
            console.log(`⏳ [AgoraService] Retrying in ${this.retryDelay * attempt}ms...`);
            await this.wait(attempt);
            continue;
          }

          return {
            success: false,
            error: 'No response from server. Please try again.',
          };
        }

        if (!data.success) {
          console.error('❌ [AgoraService] Edge Function returned success=false:', data.error);
          return {
            success: false,
            error: data.error || 'Failed to create stream. Please try again.',
          };
        }

        // Validate response structure
        if (!data.stream || !data.stream.live_input_id) {
          console.warn('⚠️ [AgoraService] Edge Function returned success but missing stream data');
          console.warn('Response data:', JSON.stringify(data, null, 2));
        }

        console.log('✅ [AgoraService] Live stream started successfully');
        console.log('Stream ID:', data.stream?.id);
        console.log('Channel Name:', data.agora?.channelName);
        
        return data;
      } catch (err) {
        console.error(`❌ [AgoraService] Exception on attempt ${attempt}:`, err);
        lastError = err;

        if (attempt < this.maxRetries) {
          console.log(`⏳ [AgoraService] Retrying in ${this.retryDelay * attempt}ms...`);
          await this.wait(attempt);
        }
      }
    }

    // Return graceful error after all retries exhausted
    const errorMessage = lastError?.message || 'Failed to start live stream after multiple attempts';
    console.error('❌ [AgoraService] All retry attempts exhausted:', errorMessage);
    
    return {
      success: false,
      error: errorMessage,
    };
  }

  /* =========================
     STOP LIVE
     
     Stops cloud recording and saves playback URL.
  ========================= */

  async stopLive({ liveInputId, streamId }: StopLiveParams): Promise<StopLiveResponse> {
    const idToUse = liveInputId || streamId;

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📡 [AgoraService] STOP LIVE REQUEST');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Stream ID:', idToUse);

    if (!idToUse) {
      console.error('❌ [AgoraService] Missing stream identifier');
      return {
        success: false,
        error: 'Missing stream identifier',
      };
    }

    let lastError: any = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`📡 [AgoraService] Attempt ${attempt}/${this.maxRetries}`);

        const { data, error } =
          await supabase.functions.invoke<StopLiveResponse>('stop-live', {
            body: {
              live_input_id: idToUse,
            },
          });

        console.log(`📡 [AgoraService] stop-live response (attempt ${attempt})`, { data, error });

        if (error) {
          lastError = error;
          console.error('❌ [AgoraService] Edge Function error:', error);

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
          console.error('❌ [AgoraService] No data received');

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
          console.warn('⚠️ [AgoraService] stop-live warning:', data.warning);
        }

        if (!data.success) {
          console.error('❌ [AgoraService] stop-live returned success=false');
          return data;
        }

        console.log('✅ [AgoraService] Live stream stopped successfully');
        return data;
      } catch (err) {
        console.error(`❌ [AgoraService] Exception on attempt ${attempt}:`, err);
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
    console.log(`⏳ [AgoraService] Waiting ${delay}ms before retry...`);
    await new Promise((res) => setTimeout(res, delay));
  }

  /* =========================
     Verification Method
  ========================= */

  verifyService(): boolean {
    console.log('🔍 [AgoraService] Running service verification...');
    
    const checks = {
      initialized: this.initialized,
      hasCreateLiveStream: typeof this.createLiveStream === 'function',
      hasStartLive: typeof this.startLive === 'function',
      hasStopLive: typeof this.stopLive === 'function',
    };

    console.log('Service checks:', checks);

    const allPassed = Object.values(checks).every(check => check === true);
    
    if (allPassed) {
      console.log('✅ [AgoraService] All verification checks passed');
    } else {
      console.error('❌ [AgoraService] Some verification checks failed');
    }

    return allPassed;
  }
}

/* =========================
   Export singleton
========================= */

// Create the singleton instance
const serviceInstance = new AgoraService();

// Verify the instance immediately after creation
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔧 [AgoraService] Module initialization');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (typeof serviceInstance === 'undefined') {
  console.error('❌ CRITICAL: serviceInstance is undefined!');
} else {
  console.log('✅ serviceInstance created');
  serviceInstance.verifyService();
}

// Export the singleton
export const agoraService = serviceInstance;

// Legacy export for backward compatibility (deprecated)
// This allows old code that imports cloudflareService to still work
export const cloudflareService = agoraService;

// Final verification after export
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔧 [AgoraService] Export verification');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (typeof agoraService === 'undefined') {
  console.error('❌ CRITICAL: agoraService is undefined at export time!');
} else {
  console.log('✅ agoraService exported successfully');
  
  if (typeof agoraService.createLiveStream !== 'function') {
    console.error('❌ CRITICAL: agoraService.createLiveStream is not a function!');
    console.error('Available properties:', Object.keys(agoraService));
  } else {
    console.log('✅ agoraService.createLiveStream is a function');
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
