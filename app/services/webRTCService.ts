
import { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, mediaDevices, MediaStream } from 'react-native-webrtc';
import { supabase } from '@/app/integrations/supabase/client';

/**
 * WebRTC Service
 * 
 * Manages WebRTC peer connections for co-hosting.
 * This service handles:
 * - Creating peer connections for guests
 * - Managing local and remote media streams
 * - Handling ICE candidates and signaling
 * - Coordinating audio/video tracks
 * 
 * Architecture:
 * - Host creates a peer connection for each guest
 * - Guests create a peer connection to the host
 * - Signaling is done via Supabase Realtime
 * - Media streams are composited locally on host device
 */

interface PeerConnectionConfig {
  iceServers: Array<{
    urls: string | string[];
    username?: string;
    credential?: string;
  }>;
}

interface GuestConnection {
  peerId: string;
  userId: string;
  peerConnection: RTCPeerConnection;
  remoteStream: MediaStream | null;
  isConnected: boolean;
}

class WebRTCService {
  private peerConnections: Map<string, GuestConnection> = new Map();
  private localStream: MediaStream | null = null;
  private signalingChannel: any = null;
  private streamId: string | null = null;
  private userId: string | null = null;
  private isHost: boolean = false;

  // Default STUN servers (can be replaced with TURN servers for better connectivity)
  private readonly peerConnectionConfig: PeerConnectionConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  };

  constructor() {
    console.log('🔧 [WebRTCService] Initializing...');
  }

  /**
   * Initialize WebRTC service for a stream
   */
  async initialize(streamId: string, userId: string, isHost: boolean): Promise<boolean> {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 [WebRTCService] Initializing');
    console.log('Stream ID:', streamId);
    console.log('User ID:', userId);
    console.log('Is Host:', isHost);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    this.streamId = streamId;
    this.userId = userId;
    this.isHost = isHost;

    try {
      // Get local media stream
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: 'user',
        },
      });

      this.localStream = stream;
      console.log('✅ [WebRTCService] Local media stream acquired');

      // Setup signaling channel
      this.setupSignalingChannel();

      return true;
    } catch (error: any) {
      console.error('❌ [WebRTCService] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Setup Supabase Realtime channel for WebRTC signaling
   */
  private setupSignalingChannel() {
    if (!this.streamId) {
      console.error('❌ [WebRTCService] Cannot setup signaling: streamId is null');
      return;
    }

    console.log('📡 [WebRTCService] Setting up signaling channel');

    this.signalingChannel = supabase
      .channel(`stream:${this.streamId}:webrtc_signaling`)
      .on('broadcast', { event: 'offer' }, (payload) => {
        this.handleOffer(payload.payload);
      })
      .on('broadcast', { event: 'answer' }, (payload) => {
        this.handleAnswer(payload.payload);
      })
      .on('broadcast', { event: 'ice_candidate' }, (payload) => {
        this.handleIceCandidate(payload.payload);
      })
      .on('broadcast', { event: 'guest_disconnected' }, (payload) => {
        this.handleGuestDisconnected(payload.payload);
      })
      .subscribe((status) => {
        console.log('📡 [WebRTCService] Signaling channel status:', status);
      });
  }

  /**
   * Create a peer connection for a guest (called by host)
   */
  async createPeerConnectionForGuest(guestUserId: string): Promise<boolean> {
    if (!this.isHost) {
      console.error('❌ [WebRTCService] Only host can create peer connections for guests');
      return false;
    }

    if (!this.localStream) {
      console.error('❌ [WebRTCService] Local stream not available');
      return false;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔗 [WebRTCService] Creating peer connection for guest');
    console.log('Guest User ID:', guestUserId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const peerConnection = new RTCPeerConnection(this.peerConnectionConfig);
      const peerId = `${this.streamId}-${guestUserId}`;

      // Add local stream tracks to peer connection
      this.localStream.getTracks().forEach((track) => {
        if (this.localStream) {
          peerConnection.addTrack(track, this.localStream);
        }
      });

      // Handle remote stream
      const remoteStream = new MediaStream();
      
      peerConnection.ontrack = (event) => {
        console.log('📹 [WebRTCService] Received remote track from guest:', guestUserId);
        event.streams[0].getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });

        // Update guest connection with remote stream
        const connection = this.peerConnections.get(peerId);
        if (connection) {
          connection.remoteStream = remoteStream;
          connection.isConnected = true;
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.signalingChannel) {
          console.log('🧊 [WebRTCService] Sending ICE candidate to guest:', guestUserId);
          this.signalingChannel.send({
            type: 'broadcast',
            event: 'ice_candidate',
            payload: {
              candidate: event.candidate,
              targetUserId: guestUserId,
              fromUserId: this.userId,
            },
          });
        }
      };

      // Handle connection state changes
      peerConnection.onconnectionstatechange = () => {
        console.log('🔗 [WebRTCService] Connection state:', peerConnection.connectionState);
        
        const connection = this.peerConnections.get(peerId);
        if (connection) {
          connection.isConnected = peerConnection.connectionState === 'connected';
        }
      };

      // Store peer connection
      this.peerConnections.set(peerId, {
        peerId,
        userId: guestUserId,
        peerConnection,
        remoteStream: null,
        isConnected: false,
      });

      // Create and send offer
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await peerConnection.setLocalDescription(offer);

      if (this.signalingChannel) {
        console.log('📤 [WebRTCService] Sending offer to guest:', guestUserId);
        await this.signalingChannel.send({
          type: 'broadcast',
          event: 'offer',
          payload: {
            offer: offer,
            targetUserId: guestUserId,
            fromUserId: this.userId,
          },
        });
      }

      console.log('✅ [WebRTCService] Peer connection created for guest:', guestUserId);
      return true;
    } catch (error: any) {
      console.error('❌ [WebRTCService] Error creating peer connection:', error);
      return false;
    }
  }

  /**
   * Join as a guest (called by guest)
   */
  async joinAsGuest(hostUserId: string): Promise<boolean> {
    if (this.isHost) {
      console.error('❌ [WebRTCService] Host cannot join as guest');
      return false;
    }

    if (!this.localStream) {
      console.error('❌ [WebRTCService] Local stream not available');
      return false;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎤 [WebRTCService] Joining as guest');
    console.log('Host User ID:', hostUserId);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
      const peerConnection = new RTCPeerConnection(this.peerConnectionConfig);
      const peerId = `${this.streamId}-${hostUserId}`;

      // Add local stream tracks to peer connection
      this.localStream.getTracks().forEach((track) => {
        if (this.localStream) {
          peerConnection.addTrack(track, this.localStream);
        }
      });

      // Handle remote stream (host's stream)
      const remoteStream = new MediaStream();
      
      peerConnection.ontrack = (event) => {
        console.log('📹 [WebRTCService] Received remote track from host');
        event.streams[0].getTracks().forEach((track) => {
          remoteStream.addTrack(track);
        });

        const connection = this.peerConnections.get(peerId);
        if (connection) {
          connection.remoteStream = remoteStream;
          connection.isConnected = true;
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.signalingChannel) {
          console.log('🧊 [WebRTCService] Sending ICE candidate to host');
          this.signalingChannel.send({
            type: 'broadcast',
            event: 'ice_candidate',
            payload: {
              candidate: event.candidate,
              targetUserId: hostUserId,
              fromUserId: this.userId,
            },
          });
        }
      };

      // Store peer connection
      this.peerConnections.set(peerId, {
        peerId,
        userId: hostUserId,
        peerConnection,
        remoteStream: null,
        isConnected: false,
      });

      console.log('✅ [WebRTCService] Guest peer connection created, waiting for offer...');
      return true;
    } catch (error: any) {
      console.error('❌ [WebRTCService] Error joining as guest:', error);
      return false;
    }
  }

  /**
   * Handle incoming WebRTC offer (called by guest)
   */
  private async handleOffer(payload: any) {
    if (this.isHost) return; // Guests handle offers, not hosts

    const { offer, fromUserId } = payload;
    
    if (!this.userId || payload.targetUserId !== this.userId) {
      return; // Not for us
    }

    console.log('📥 [WebRTCService] Received offer from host:', fromUserId);

    try {
      const peerId = `${this.streamId}-${fromUserId}`;
      const connection = this.peerConnections.get(peerId);

      if (!connection) {
        console.error('❌ [WebRTCService] No peer connection found for host');
        return;
      }

      await connection.peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      // Create answer
      const answer = await connection.peerConnection.createAnswer();
      await connection.peerConnection.setLocalDescription(answer);

      // Send answer back to host
      if (this.signalingChannel) {
        console.log('📤 [WebRTCService] Sending answer to host');
        await this.signalingChannel.send({
          type: 'broadcast',
          event: 'answer',
          payload: {
            answer: answer,
            targetUserId: fromUserId,
            fromUserId: this.userId,
          },
        });
      }

      console.log('✅ [WebRTCService] Answer sent to host');
    } catch (error: any) {
      console.error('❌ [WebRTCService] Error handling offer:', error);
    }
  }

  /**
   * Handle incoming WebRTC answer (called by host)
   */
  private async handleAnswer(payload: any) {
    if (!this.isHost) return; // Only hosts handle answers

    const { answer, fromUserId } = payload;
    
    if (!this.userId || payload.targetUserId !== this.userId) {
      return; // Not for us
    }

    console.log('📥 [WebRTCService] Received answer from guest:', fromUserId);

    try {
      const peerId = `${this.streamId}-${fromUserId}`;
      const connection = this.peerConnections.get(peerId);

      if (!connection) {
        console.error('❌ [WebRTCService] No peer connection found for guest');
        return;
      }

      await connection.peerConnection.setRemoteDescription(
        new RTCSessionDescription(answer)
      );

      console.log('✅ [WebRTCService] Answer processed from guest:', fromUserId);
    } catch (error: any) {
      console.error('❌ [WebRTCService] Error handling answer:', error);
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  private async handleIceCandidate(payload: any) {
    const { candidate, fromUserId } = payload;
    
    if (!this.userId || payload.targetUserId !== this.userId) {
      return; // Not for us
    }

    console.log('🧊 [WebRTCService] Received ICE candidate from:', fromUserId);

    try {
      const peerId = `${this.streamId}-${fromUserId}`;
      const connection = this.peerConnections.get(peerId);

      if (!connection) {
        console.error('❌ [WebRTCService] No peer connection found');
        return;
      }

      await connection.peerConnection.addIceCandidate(
        new RTCIceCandidate(candidate)
      );

      console.log('✅ [WebRTCService] ICE candidate added');
    } catch (error: any) {
      console.error('❌ [WebRTCService] Error handling ICE candidate:', error);
    }
  }

  /**
   * Handle guest disconnection
   */
  private handleGuestDisconnected(payload: any) {
    const { userId } = payload;
    
    console.log('🔌 [WebRTCService] Guest disconnected:', userId);

    const peerId = `${this.streamId}-${userId}`;
    const connection = this.peerConnections.get(peerId);

    if (connection) {
      connection.peerConnection.close();
      this.peerConnections.delete(peerId);
      console.log('✅ [WebRTCService] Peer connection closed for guest:', userId);
    }
  }

  /**
   * Get local media stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get all remote streams (for host to composite)
   */
  getRemoteStreams(): MediaStream[] {
    const streams: MediaStream[] = [];
    
    this.peerConnections.forEach((connection) => {
      if (connection.remoteStream && connection.isConnected) {
        streams.push(connection.remoteStream);
      }
    });

    return streams;
  }

  /**
   * Get remote stream for a specific guest
   */
  getRemoteStreamForGuest(guestUserId: string): MediaStream | null {
    const peerId = `${this.streamId}-${guestUserId}`;
    const connection = this.peerConnections.get(peerId);
    
    return connection?.remoteStream || null;
  }

  /**
   * Toggle local audio
   */
  toggleAudio(enabled: boolean) {
    if (!this.localStream) return;

    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
    });

    console.log(`🎤 [WebRTCService] Audio ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Toggle local video
   */
  toggleVideo(enabled: boolean) {
    if (!this.localStream) return;

    this.localStream.getVideoTracks().forEach((track) => {
      track.enabled = enabled;
    });

    console.log(`📹 [WebRTCService] Video ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Disconnect a specific guest (called by host)
   */
  disconnectGuest(guestUserId: string) {
    if (!this.isHost) {
      console.error('❌ [WebRTCService] Only host can disconnect guests');
      return;
    }

    const peerId = `${this.streamId}-${guestUserId}`;
    const connection = this.peerConnections.get(peerId);

    if (connection) {
      connection.peerConnection.close();
      this.peerConnections.delete(peerId);
      
      // Notify guest via signaling
      if (this.signalingChannel) {
        this.signalingChannel.send({
          type: 'broadcast',
          event: 'guest_disconnected',
          payload: {
            userId: guestUserId,
          },
        });
      }

      console.log('✅ [WebRTCService] Guest disconnected:', guestUserId);
    }
  }

  /**
   * Cleanup and close all connections
   */
  destroy() {
    console.log('🧹 [WebRTCService] Destroying service...');

    // Close all peer connections
    this.peerConnections.forEach((connection) => {
      connection.peerConnection.close();
    });
    this.peerConnections.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.localStream = null;
    }

    // Unsubscribe from signaling channel
    if (this.signalingChannel) {
      supabase.removeChannel(this.signalingChannel);
      this.signalingChannel = null;
    }

    console.log('✅ [WebRTCService] Service destroyed');
  }

  /**
   * Get connection status for all guests
   */
  getConnectionStatus(): Array<{ userId: string; isConnected: boolean }> {
    const status: Array<{ userId: string; isConnected: boolean }> = [];
    
    this.peerConnections.forEach((connection) => {
      status.push({
        userId: connection.userId,
        isConnected: connection.isConnected,
      });
    });

    return status;
  }
}

export const webRTCService = new WebRTCService();
