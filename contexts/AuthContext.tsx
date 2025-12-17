
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/app/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { deviceBanService } from '@/app/services/deviceBanService';

interface Profile {
  id: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url: string | null;
  banner_url?: string | null;
  unique_profile_link?: string;
  followers_count?: number;
  following_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  checkDeviceBan: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  usePushNotifications(user?.id || null);

  const checkDeviceBan = useCallback(async (): Promise<boolean> => {
    const { banned } = await deviceBanService.isDeviceBanned();
    return banned;
  }, []);

  const fetchProfile = useCallback(async (userId: string, retryCount = 0): Promise<Profile | null> => {
    try {
      console.log('Fetching profile for user:', userId, 'Retry:', retryCount);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      if (!data && retryCount < 3) {
        // Profile might still be creating via trigger, wait and retry
        console.log('Profile not found, waiting for trigger to complete...');
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return fetchProfile(userId, retryCount + 1);
      }

      if (!data) {
        console.error('Profile not found after retries');
        return null;
      }

      console.log('Profile fetched successfully:', data);
      await deviceBanService.storeDeviceFingerprint(userId);
      return data;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log('🔐 Initializing auth...');
        
        // Check device ban first
        const isBanned = await checkDeviceBan();
        if (isBanned) {
          console.log('🚫 Device is banned');
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        // Get current session
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
        }
        
        if (!mounted) return;
        
        console.log('📱 Session status:', currentSession ? 'Active' : 'None');
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Fetch profile if user exists
        if (currentSession?.user) {
          const profileData = await fetchProfile(currentSession.user.id);
          if (mounted) {
            setProfile(profileData);
          }
        }
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      
      console.log('🔄 Auth state changed:', event);
      
      if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setSession(null);
        setUser(null);
        setProfile(null);
        return;
      }
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('✅ Token refreshed successfully');
      }
      
      // Check device ban
      const isBanned = await checkDeviceBan();
      if (isBanned) {
        console.log('🚫 Device is banned');
        setSession(null);
        setUser(null);
        setProfile(null);
        return;
      }

      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      // Fetch profile for new user
      if (newSession?.user) {
        const profileData = await fetchProfile(newSession.user.id);
        if (mounted) {
          setProfile(profileData);
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, checkDeviceBan]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting sign in...');
      
      // Check device ban
      const isBanned = await checkDeviceBan();
      if (isBanned) {
        return { error: { message: 'This device is banned from accessing Roast Live' } };
      }

      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Sign in error:', error);
        return { error };
      }

      console.log('✅ Sign in successful');
      
      // Auth state change listener will handle the rest
      return { error: null };
    } catch (error) {
      console.error('❌ Sign in exception:', error);
      return { error };
    }
  }, [checkDeviceBan]);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      console.log('📝 Attempting sign up...');
      
      // Check device ban
      const isBanned = await checkDeviceBan();
      if (isBanned) {
        return { error: { message: 'This device is banned from accessing Roast Live' } };
      }

      // Sign up with Supabase Auth (single source of truth)
      // Database trigger will automatically create:
      // - profiles row (1:1 with auth.users)
      // - wallets row (balance = 0)
      // - user_settings row (default preferences)
      // - notification_preferences row (default settings)
      // All inserts are idempotent using ON CONFLICT
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://natively.dev/email-confirmed',
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) {
        console.error('❌ Sign up error:', error);
        return { error };
      }

      if (data.user) {
        // Store device fingerprint for ban tracking
        await deviceBanService.storeDeviceFingerprint(data.user.id);
        console.log('✅ Sign up successful - user data created automatically by database trigger');
      }

      return { error: null };
    } catch (error) {
      console.error('❌ Sign up exception:', error);
      return { error };
    }
  }, [checkDeviceBan]);

  const signOut = useCallback(async () => {
    try {
      console.log('👋 Signing out...');
      await supabase.auth.signOut();
      console.log('✅ Sign out successful');
    } catch (error) {
      console.error('❌ Sign out error:', error);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      console.log('🔑 Requesting password reset for:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://natively.dev/reset-password',
      });

      if (error) {
        console.error('❌ Password reset error:', error);
        return { error };
      }

      console.log('✅ Password reset email sent');
      return { error: null };
    } catch (error) {
      console.error('❌ Password reset exception:', error);
      return { error };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      console.log('🔑 Updating password...');
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('❌ Password update error:', error);
        return { error };
      }

      console.log('✅ Password updated successfully');
      return { error: null };
    } catch (error) {
      console.error('❌ Password update exception:', error);
      return { error };
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        checkDeviceBan,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
