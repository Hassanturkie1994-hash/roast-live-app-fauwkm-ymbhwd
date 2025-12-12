
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/app/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { deviceBanService } from '@/app/services/deviceBanService';
import { useRouter } from 'expo-router';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileFetched, setProfileFetched] = useState(false);

  // Register push notifications when user logs in
  usePushNotifications(user?.id || null);

  const ensureWalletExists = async (userId: string) => {
    try {
      const { data: existingWallet } = await supabase
        .from('wallet')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!existingWallet) {
        console.log('Creating wallet for user:', userId);
        const { error } = await supabase.from('wallet').insert({
          user_id: userId,
          balance: 0.00,
          last_updated: new Date().toISOString(),
        });

        if (error) {
          console.error('Error creating wallet:', error);
        } else {
          console.log('Wallet created successfully');
        }
      }
    } catch (error) {
      console.error('Error in ensureWalletExists:', error);
    }
  };

  const checkDeviceBan = async (): Promise<boolean> => {
    const { banned } = await deviceBanService.isDeviceBanned();
    return banned;
  };

  const fetchProfile = useCallback(async (userId: string, userEmail?: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfileFetched(true);
        return null;
      }

      if (!data) {
        console.log('Profile not found, creating new profile for user:', userId);
        
        const username = userEmail ? userEmail.split('@')[0] : `user_${userId.substring(0, 8)}`;
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username: username,
            display_name: username,
            avatar_url: null,
            unique_profile_link: `roastlive.com/@${username}`,
            followers_count: 0,
            following_count: 0,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          setProfileFetched(true);
          return null;
        }

        console.log('Profile created successfully:', newProfile);
        
        await ensureWalletExists(userId);
        await deviceBanService.storeDeviceFingerprint(userId);
        setProfileFetched(true);
        
        return newProfile;
      }

      console.log('Profile fetched successfully:', data);
      
      await ensureWalletExists(userId);
      await deviceBanService.storeDeviceFingerprint(userId);
      setProfileFetched(true);
      
      return data;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setProfileFetched(true);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profileData = await fetchProfile(user.id, user.email);
      setProfile(profileData);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Check device ban first
        const isBanned = await checkDeviceBan();
        if (isBanned) {
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user && !profileFetched) {
          const profileData = await fetchProfile(session.user.id, session.user.email);
          if (mounted) {
            setProfile(profileData);
          }
        }
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      // Check device ban on auth state change
      const isBanned = await checkDeviceBan();
      if (isBanned) {
        setSession(null);
        setUser(null);
        setProfile(null);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setProfileFetched(false);
        const profileData = await fetchProfile(session.user.id, session.user.email);
        if (mounted) {
          setProfile(profileData);
        }
      } else {
        setProfile(null);
        setProfileFetched(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, profileFetched]);

  const signIn = async (email: string, password: string) => {
    // Check device ban before sign in
    const isBanned = await checkDeviceBan();
    if (isBanned) {
      return { error: { message: 'This device is banned from accessing Roast Live' } };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    // Check device ban before sign up
    const isBanned = await checkDeviceBan();
    if (isBanned) {
      return { error: { message: 'This device is banned from accessing Roast Live' } };
    }

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
      return { error };
    }

    if (data.user) {
      const username = displayName.toLowerCase().replace(/[^a-z0-9_]/g, '') || email.split('@')[0];
      
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        username: username,
        display_name: displayName,
        avatar_url: null,
        unique_profile_link: `roastlive.com/@${username}`,
        followers_count: 0,
        following_count: 0,
      });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        return { error: profileError };
      }

      // Store device fingerprint
      await deviceBanService.storeDeviceFingerprint(data.user.id);
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

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