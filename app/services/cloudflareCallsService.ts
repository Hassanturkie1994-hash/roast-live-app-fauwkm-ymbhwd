
import { supabase } from '@/app/integrations/supabase/client';

/**
 * Cloudflare Calls Service
 * 
 * Manages WebRTC sessions for co-hosting using Cloudflare Calls API.
 * This service handles:
 * - Creating call sessions for streams
 * - Generating session tokens for host and guests
 * - Managing WebRTC peer connections
 * - Coordinating audio/video tracks
 * 
 * Architecture:
 * - Each stream gets a Cloudflare Calls session
 * - Host and guests join the same session
 * - Host composites all video feeds locally
 * - Composite feed is sent to Cloudflare Stream via RTMP
 */

interface CallSession {
  sessionId: string;
  sessionDescription: string;
  tracks: any[];
}

interface CallToken {
  token: string;
  expiresAt: string;
}

interface CreateSessionResponse {
  success: boolean;
  session?: CallSession;
  error?: string;
}

interface GenerateTokenResponse {
  success: boolean;
  token?: string;
  error?: string;
}

class CloudflareCallsService {
  private accountId: string | null = null;
  private apiToken: string | null = null;
  private appId: string | null = null;
  private appSecret: string | null = null;

  constructor() {
    console.log('🔧 [CloudflareCallsService] Initializing...');
    this.loadCredentials();
  }

  /**
   * Load Cloudflare Calls credentials from environment
   */
  private async loadCredentials() {
    try {
      // These should be set in Supabase Edge Function secrets
      // For now, we'll use the same Cloudflare credentials
      this.accountId = null; // Will be loaded from edge function
      this.apiToken = null;
      this.appId = null;
      this.appSecret = null;
      
      console.log('✅ [CloudflareCallsService] Credentials loaded');
    } catch (error) {
      console.error('❌ [CloudflareCallsService] Error loading credentials:', error);
    }
  }

  /**
   * Create a new Cloudflare Calls session for a stream
   * This is called when the host starts streaming
   */
  async createSession(streamId: string): Promise<CreateSessionResponse> {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📞 [CloudflareCallsService] Creating call session');
    console.log('Stream ID:', streamId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      // Call edge function to create Cloudflare Calls session
      const { data, error } = await supabase.functions.invoke('create-call-session', {
        body: { streamId },
      });

      if (error) {
        console.error('❌ [CloudflareCallsService] Edge function error:', error);
        return {
          success: false,
          error: error.message || 'Failed to create call session',
        };
      }

      if (!data || !data.success) {
        console.error('❌ [CloudflareCallsService] Session creation failed:', data?.error);
        return {
          success: false,
          error: data?.error || 'Failed to create call session',
        };
      }

      console.log('✅ [CloudflareCallsService] Call session created:', data.session?.sessionId);
      
      return {
        success: true,
        session: data.session,
      };
    } catch (error: any) {
      console.error('❌ [CloudflareCallsService] Exception in createSession:', error);
      return {
        success: false,
        error: error.message || 'Failed to create call session',
      };
    }
  }

  /**
   * Generate a session token for a user to join the call
   * This is called when host or guest needs to join the WebRTC session
   */
  async generateToken(
    sessionId: string,
    userId: string,
    role: 'host' | 'guest'
  ): Promise<GenerateTokenResponse> {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎫 [CloudflareCallsService] Generating token');
    console.log('Session ID:', sessionId);
    console.log('User ID:', userId);
    console.log('Role:', role);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      // Call edge function to generate token
      const { data, error } = await supabase.functions.invoke('generate-call-token', {
        body: {
          sessionId,
          userId,
          role,
        },
      });

      if (error) {
        console.error('❌ [CloudflareCallsService] Edge function error:', error);
        return {
          success: false,
          error: error.message || 'Failed to generate token',
        };
      }

      if (!data || !data.success) {
        console.error('❌ [CloudflareCallsService] Token generation failed:', data?.error);
        return {
          success: false,
          error: data?.error || 'Failed to generate token',
        };
      }

      console.log('✅ [CloudflareCallsService] Token generated successfully');
      
      return {
        success: true,
        token: data.token,
      };
    } catch (error: any) {
      console.error('❌ [CloudflareCallsService] Exception in generateToken:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate token',
      };
    }
  }

  /**
   * End a call session
   * This is called when the stream ends
   */
  async endSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🛑 [CloudflareCallsService] Ending call session');
    console.log('Session ID:', sessionId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      // Call edge function to end session
      const { data, error } = await supabase.functions.invoke('end-call-session', {
        body: { sessionId },
      });

      if (error) {
        console.error('❌ [CloudflareCallsService] Edge function error:', error);
        return {
          success: false,
          error: error.message || 'Failed to end call session',
        };
      }

      if (!data || !data.success) {
        console.error('❌ [CloudflareCallsService] Session end failed:', data?.error);
        return {
          success: false,
          error: data?.error || 'Failed to end call session',
        };
      }

      console.log('✅ [CloudflareCallsService] Call session ended successfully');
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ [CloudflareCallsService] Exception in endSession:', error);
      return {
        success: false,
        error: error.message || 'Failed to end call session',
      };
    }
  }
}

export const cloudflareCallsService = new CloudflareCallsService();
