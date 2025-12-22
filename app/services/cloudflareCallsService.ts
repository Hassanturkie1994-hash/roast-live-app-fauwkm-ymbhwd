
/**
 * Cloudflare Calls Service - DEPRECATED
 * 
 * ⚠️ THIS SERVICE HAS BEEN REPLACED BY AGORA RTC ⚠️
 * 
 * The old Cloudflare Calls implementation has been completely removed.
 * All streaming functionality now uses Agora RTC SDK.
 * 
 * For streaming features, use:
 * - agoraService.ts for Agora RTC operations
 * - useAgoraEngine hook for React components
 * - streamGuestService.ts for multi-guest streaming
 * 
 * This file is kept as a stub to prevent import errors during migration.
 * It will be completely removed in a future update.
 */

console.warn('⚠️ [CloudflareCallsService] This service is deprecated. Use agoraService instead.');

interface CreateSessionResponse {
  success: boolean;
  session?: any;
  error?: string;
}

interface GenerateTokenResponse {
  success: boolean;
  token?: string;
  error?: string;
}

// Stub service to prevent import errors
class CloudflareCallsServiceStub {
  constructor() {
    console.warn('⚠️ [CloudflareCallsService] Deprecated service instantiated. Migrate to Agora.');
  }

  async createSession(): Promise<CreateSessionResponse> {
    console.error('❌ [CloudflareCallsService] This service is deprecated. Use agoraService.startLive() instead.');
    return {
      success: false,
      error: 'CloudflareCallsService is deprecated. Use Agora RTC instead.',
    };
  }

  async generateToken(): Promise<GenerateTokenResponse> {
    console.error('❌ [CloudflareCallsService] This service is deprecated. Use agoraService.generateToken() instead.');
    return {
      success: false,
      error: 'CloudflareCallsService is deprecated. Use Agora RTC instead.',
    };
  }

  async endSession(): Promise<{ success: boolean; error?: string }> {
    console.error('❌ [CloudflareCallsService] This service is deprecated. Use agoraService.stopLive() instead.');
    return {
      success: false,
      error: 'CloudflareCallsService is deprecated. Use Agora RTC instead.',
    };
  }
}

export const cloudflareCallsService = new CloudflareCallsServiceStub();
