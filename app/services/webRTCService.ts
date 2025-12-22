
/**
 * WebRTC Service - DEPRECATED
 * 
 * ⚠️ THIS SERVICE HAS BEEN REPLACED BY AGORA RTC ⚠️
 * 
 * The old WebRTC implementation has been completely removed.
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

console.warn('⚠️ [WebRTCService] This service is deprecated. Use agoraService instead.');

// Stub service to prevent import errors
class WebRTCServiceStub {
  constructor() {
    console.warn('⚠️ [WebRTCService] Deprecated service instantiated. Migrate to Agora.');
  }

  async initialize(): Promise<boolean> {
    console.error('❌ [WebRTCService] This service is deprecated. Use agoraService.initialize() instead.');
    return false;
  }

  getLocalStream(): null {
    console.error('❌ [WebRTCService] This service is deprecated. Use Agora SDK instead.');
    return null;
  }

  getRemoteStreams(): [] {
    console.error('❌ [WebRTCService] This service is deprecated. Use Agora SDK instead.');
    return [];
  }

  toggleAudio(): void {
    console.error('❌ [WebRTCService] This service is deprecated. Use Agora SDK instead.');
  }

  toggleVideo(): void {
    console.error('❌ [WebRTCService] This service is deprecated. Use Agora SDK instead.');
  }

  destroy(): void {
    console.warn('⚠️ [WebRTCService] Deprecated service destroyed.');
  }
}

export const webRTCService = new WebRTCServiceStub();
