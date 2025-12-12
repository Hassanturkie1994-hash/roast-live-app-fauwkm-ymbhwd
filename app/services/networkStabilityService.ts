
import { supabase } from '@/app/integrations/supabase/client';
import * as Network from 'expo-network';

export interface NetworkQuality {
  status: 'excellent' | 'good' | 'poor' | 'disconnected';
  bitrate: number;
  packetLoss: number;
  latency: number;
  timestamp: Date;
}

export interface ConnectionEvent {
  type: 'connected' | 'disconnected' | 'reconnecting' | 'reconnected' | 'quality_degraded';
  timestamp: Date;
  details?: any;
}

class NetworkStabilityService {
  private qualityCheckInterval: NodeJS.Timeout | null = null;
  private connectionEvents: ConnectionEvent[] = [];
  private lastDisconnectTime: Date | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 6;
  private reconnectInterval: number = 2500; // 2.5 seconds

  /**
   * Start monitoring network quality for livestream
   */
  startMonitoring(streamId: string, onQualityChange: (quality: NetworkQuality) => void) {
    console.log('🌐 Starting network monitoring for stream:', streamId);

    // Check network quality every 5 seconds
    this.qualityCheckInterval = setInterval(async () => {
      const quality = await this.checkNetworkQuality();
      onQualityChange(quality);

      // Log poor connection
      if (quality.status === 'poor' || quality.status === 'disconnected') {
        this.logConnectionEvent({
          type: 'quality_degraded',
          timestamp: new Date(),
          details: { quality },
        });
      }
    }, 5000);
  }

  /**
   * Stop monitoring network quality
   */
  stopMonitoring() {
    console.log('🌐 Stopping network monitoring');
    if (this.qualityCheckInterval) {
      clearInterval(this.qualityCheckInterval);
      this.qualityCheckInterval = null;
    }
    this.connectionEvents = [];
    this.lastDisconnectTime = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Check current network quality
   */
  async checkNetworkQuality(): Promise<NetworkQuality> {
    try {
      const networkState = await Network.getNetworkStateAsync();

      if (!networkState.isConnected || !networkState.isInternetReachable) {
        return {
          status: 'disconnected',
          bitrate: 0,
          packetLoss: 100,
          latency: 0,
          timestamp: new Date(),
        };
      }

      // Simulate quality metrics (in production, get from WebRTC stats)
      const quality = this.simulateNetworkQuality(networkState);
      return quality;
    } catch (error) {
      console.error('Error checking network quality:', error);
      return {
        status: 'disconnected',
        bitrate: 0,
        packetLoss: 100,
        latency: 0,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Simulate network quality based on connection type
   * In production, this would use WebRTC getStats() API
   */
  private simulateNetworkQuality(networkState: any): NetworkQuality {
    // Simulate based on connection type
    let bitrate = 5000; // kbps
    let packetLoss = 0;
    let latency = 50; // ms

    if (networkState.type === Network.NetworkStateType.WIFI) {
      bitrate = 8000 + Math.random() * 2000;
      packetLoss = Math.random() * 2;
      latency = 30 + Math.random() * 20;
    } else if (networkState.type === Network.NetworkStateType.CELLULAR) {
      bitrate = 3000 + Math.random() * 2000;
      packetLoss = Math.random() * 5;
      latency = 50 + Math.random() * 50;
    } else {
      bitrate = 1000 + Math.random() * 1000;
      packetLoss = Math.random() * 10;
      latency = 100 + Math.random() * 100;
    }

    // Determine status
    let status: 'excellent' | 'good' | 'poor' | 'disconnected' = 'excellent';
    if (bitrate < 2000 || packetLoss > 5 || latency > 150) {
      status = 'poor';
    } else if (bitrate < 4000 || packetLoss > 2 || latency > 100) {
      status = 'good';
    }

    return {
      status,
      bitrate,
      packetLoss,
      latency,
      timestamp: new Date(),
    };
  }

  /**
   * Get WebRTC stats from peer connection
   * This is the real implementation for production
   */
  async getWebRTCStats(peerConnection: any): Promise<NetworkQuality> {
    try {
      const stats = await peerConnection.getStats();
      let bitrate = 0;
      let packetLoss = 0;
      let latency = 0;

      stats.forEach((report: any) => {
        if (report.type === 'outbound-rtp' && report.mediaType === 'video') {
          // Calculate bitrate
          if (report.bytesSent && report.timestamp) {
            bitrate = (report.bytesSent * 8) / 1000; // Convert to kbps
          }

          // Get packet loss
          if (report.packetsLost && report.packetsSent) {
            packetLoss = (report.packetsLost / report.packetsSent) * 100;
          }
        }

        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          latency = report.currentRoundTripTime * 1000; // Convert to ms
        }
      });

      // Determine status
      let status: 'excellent' | 'good' | 'poor' | 'disconnected' = 'excellent';
      if (bitrate < 2000 || packetLoss > 5 || latency > 150) {
        status = 'poor';
      } else if (bitrate < 4000 || packetLoss > 2 || latency > 100) {
        status = 'good';
      }

      return {
        status,
        bitrate,
        packetLoss,
        latency,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error getting WebRTC stats:', error);
      return {
        status: 'disconnected',
        bitrate: 0,
        packetLoss: 100,
        latency: 0,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Handle connection loss
   */
  handleConnectionLoss() {
    this.lastDisconnectTime = new Date();
    this.reconnectAttempts = 0;
    this.logConnectionEvent({
      type: 'disconnected',
      timestamp: new Date(),
    });
  }

  /**
   * Attempt to reconnect to stream
   */
  async attemptReconnect(
    onReconnectSuccess: () => void,
    onReconnectFailed: () => void
  ): Promise<boolean> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Max reconnect attempts reached');
      onReconnectFailed();
      return false;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    this.logConnectionEvent({
      type: 'reconnecting',
      timestamp: new Date(),
      details: { attempt: this.reconnectAttempts },
    });

    // Check if network is available
    const quality = await this.checkNetworkQuality();
    if (quality.status !== 'disconnected') {
      // Connection restored
      this.logConnectionEvent({
        type: 'reconnected',
        timestamp: new Date(),
        details: { attempts: this.reconnectAttempts },
      });

      this.reconnectAttempts = 0;
      this.lastDisconnectTime = null;
      onReconnectSuccess();
      return true;
    }

    return false;
  }

  /**
   * Check if auto-resume is possible (< 15 seconds since disconnect)
   */
  canAutoResume(): boolean {
    if (!this.lastDisconnectTime) return false;

    const now = new Date();
    const disconnectDuration = (now.getTime() - this.lastDisconnectTime.getTime()) / 1000;
    return disconnectDuration < 15;
  }

  /**
   * Get disconnect duration in seconds
   */
  getDisconnectDuration(): number {
    if (!this.lastDisconnectTime) return 0;

    const now = new Date();
    return (now.getTime() - this.lastDisconnectTime.getTime()) / 1000;
  }

  /**
   * Log connection event
   */
  private logConnectionEvent(event: ConnectionEvent) {
    this.connectionEvents.push(event);
    console.log(`📊 Connection event: ${event.type}`, event.details);

    // Keep only last 50 events
    if (this.connectionEvents.length > 50) {
      this.connectionEvents.shift();
    }
  }

  /**
   * Get connection events history
   */
  getConnectionEvents(): ConnectionEvent[] {
    return [...this.connectionEvents];
  }

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    const events = this.connectionEvents;
    const disconnects = events.filter(e => e.type === 'disconnected').length;
    const reconnects = events.filter(e => e.type === 'reconnected').length;
    const qualityDegradations = events.filter(e => e.type === 'quality_degraded').length;

    return {
      totalDisconnects: disconnects,
      totalReconnects: reconnects,
      totalQualityDegradations: qualityDegradations,
      currentReconnectAttempts: this.reconnectAttempts,
      lastDisconnectTime: this.lastDisconnectTime,
    };
  }

  /**
   * Reset connection state
   */
  reset() {
    this.connectionEvents = [];
    this.lastDisconnectTime = null;
    this.reconnectAttempts = 0;
  }
}

export const networkStabilityService = new NetworkStabilityService();