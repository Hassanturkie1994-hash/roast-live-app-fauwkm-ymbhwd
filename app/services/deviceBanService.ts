
import { supabase } from '@/integrations/supabase/client';
import * as Device from 'expo-device';
import * as Crypto from 'expo-crypto';

interface DeviceFingerprint {
  id: string;
  user_id: string;
  device_hash: string;
  created_at: string;
  last_seen: string;
}

interface DeviceBan {
  id: string;
  device_hash: string;
  banned_by: string;
  reason: string;
  expires_at: string | null;
  created_at: string;
}

class DeviceBanService {
  private deviceHash: string | null = null;

  /**
   * Generate a secure device fingerprint
   * Combines device model, OS version, timezone, and a random salt
   */
  async generateDeviceFingerprint(): Promise<string> {
    try {
      const deviceModel = Device.modelName || 'unknown';
      const osVersion = Device.osVersion || 'unknown';
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';
      const deviceType = Device.deviceType?.toString() || 'unknown';
      
      // Create a unique string from device properties
      const deviceString = `${deviceModel}-${osVersion}-${timezone}-${deviceType}`;
      
      // Hash the device string using SHA256
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        deviceString
      );
      
      this.deviceHash = hash;
      return hash;
    } catch (error) {
      console.error('Error generating device fingerprint:', error);
      // Fallback to a random hash if device info is unavailable
      const fallbackString = `fallback-${Date.now()}-${Math.random()}`;
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        fallbackString
      );
      this.deviceHash = hash;
      return hash;
    }
  }

  /**
   * Get the current device hash (generate if not exists)
   */
  async getDeviceHash(): Promise<string> {
    if (this.deviceHash) {
      return this.deviceHash;
    }
    return await this.generateDeviceFingerprint();
  }

  /**
   * Store device fingerprint in database
   */
  async storeDeviceFingerprint(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const deviceHash = await this.getDeviceHash();

      // Check if fingerprint already exists
      const { data: existing } = await supabase
        .from('device_fingerprints')
        .select('id')
        .eq('user_id', userId)
        .eq('device_hash', deviceHash)
        .maybeSingle();

      if (existing) {
        // Update last_seen
        const { error } = await supabase
          .from('device_fingerprints')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new fingerprint
        const { error } = await supabase
          .from('device_fingerprints')
          .insert({
            user_id: userId,
            device_hash: deviceHash,
          });

        if (error) throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error storing device fingerprint:', error);
      return { success: false, error: 'Failed to store device fingerprint' };
    }
  }

  /**
   * Check if current device is banned
   */
  async isDeviceBanned(): Promise<{ banned: boolean; reason?: string; expiresAt?: string }> {
    try {
      const deviceHash = await this.getDeviceHash();

      const { data, error } = await supabase
        .from('device_bans')
        .select('*')
        .eq('device_hash', deviceHash)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .maybeSingle();

      if (error) {
        console.error('Error checking device ban:', error);
        return { banned: false };
      }

      if (data) {
        return {
          banned: true,
          reason: data.reason,
          expiresAt: data.expires_at || undefined,
        };
      }

      return { banned: false };
    } catch (error) {
      console.error('Error in isDeviceBanned:', error);
      return { banned: false };
    }
  }

  /**
   * Ban a device by user ID (admin function)
   */
  async banDeviceByUserId(
    userId: string,
    adminId: string,
    reason: string,
    expiresAt?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get all device hashes for this user
      const { data: fingerprints, error: fetchError } = await supabase
        .from('device_fingerprints')
        .select('device_hash')
        .eq('user_id', userId);

      if (fetchError) throw fetchError;

      if (!fingerprints || fingerprints.length === 0) {
        return { success: false, error: 'No devices found for this user' };
      }

      // Ban all devices
      const banPromises = fingerprints.map((fp) =>
        supabase.from('device_bans').insert({
          device_hash: fp.device_hash,
          banned_by: adminId,
          reason,
          expires_at: expiresAt || null,
        })
      );

      await Promise.all(banPromises);

      return { success: true };
    } catch (error) {
      console.error('Error banning device:', error);
      return { success: false, error: 'Failed to ban device' };
    }
  }

  /**
   * Ban a specific device hash (admin function)
   */
  async banDeviceHash(
    deviceHash: string,
    adminId: string,
    reason: string,
    expiresAt?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('device_bans').insert({
        device_hash: deviceHash,
        banned_by: adminId,
        reason,
        expires_at: expiresAt || null,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error banning device hash:', error);
      return { success: false, error: 'Failed to ban device hash' };
    }
  }

  /**
   * Remove device ban (admin function)
   */
  async removeDeviceBan(banId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('device_bans')
        .delete()
        .eq('id', banId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error removing device ban:', error);
      return { success: false, error: 'Failed to remove device ban' };
    }
  }

  /**
   * Get all device bans (admin function)
   */
  async getAllDeviceBans(): Promise<{ success: boolean; bans?: DeviceBan[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('device_bans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, bans: data as DeviceBan[] };
    } catch (error) {
      console.error('Error fetching device bans:', error);
      return { success: false, error: 'Failed to fetch device bans' };
    }
  }

  /**
   * Get device fingerprints for a user (admin function)
   */
  async getUserDevices(userId: string): Promise<{
    success: boolean;
    devices?: DeviceFingerprint[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('device_fingerprints')
        .select('*')
        .eq('user_id', userId)
        .order('last_seen', { ascending: false });

      if (error) throw error;

      return { success: true, devices: data as DeviceFingerprint[] };
    } catch (error) {
      console.error('Error fetching user devices:', error);
      return { success: false, error: 'Failed to fetch user devices' };
    }
  }

  /**
   * Validate device before action
   * Returns true if device is allowed, false if banned
   */
  async validateDevice(): Promise<boolean> {
    const { banned } = await this.isDeviceBanned();
    return !banned;
  }
}

export const deviceBanService = new DeviceBanService();
